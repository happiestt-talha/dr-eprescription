# Architecture

## Directory layout

```
app/
  (auth)/login/          Login page (client component) + split-screen auth layout
  admin/ doctor/ receptionist/ patient/
                         One folder per role portal; each has a layout.js that enforces the role
  api/
    auth/[...nextauth]/  NextAuth handlers
    prescriptions/[id]/pdf   GET → prescription PDF (auth + ownership checked)
    prescriptions/[id]/qr    GET → QR PNG (no auth)
    reports/[id]/download    GET → CSV or PDF report (admin only)
  verify/[code]/         Public prescription verification page
  page.js                "/" → redirects to the signed-in role's home, or to /login
  layout.js, globals.css Root layout (fonts from lib/fonts.js; <Providers> = ThemeProvider + SessionProvider)
components/
  ui/                    shadcn primitives (base-ui based) + page-header, panel, breadcrumbs, status-badge
  portal/                portal-sidebar (staff nav) and account-menu (password, theme, sign out)
  admin/ doctor/ receptionist/ patient/   Role-specific components (sidebars, tables, forms)
  patients/              Shared by doctor + receptionist: patient-form; patient portal top bar
  prescriptions/         prescription-form (create/edit), prescription-view (the web document), print-button
lib/
  actions/*.js           "use server" mutations, one file per domain
  auth-guards.js         requireRole(), getCurrentDoctor(), canAccessPrescription()
  codes.js               PT-/RX- code generation + withUniqueRetry
  verify.js              HMAC-signed /verify links
  db.js                  Prisma client singleton (`import { prisma } from "@/lib/db"`)
  pdf/                   index.js: renderPrescriptionPdf / renderReportPdf (@react-pdf/renderer)
                         prescription-document.js, report-document.js: the PDF layouts
  reports.js             Report queries, CSV builder, report DOCX builder
  utils.js               cn() (re-exported from the `cn` package) and serialize()
auth.js                  NextAuth config (exports auth, signIn, signOut, handlers)
proxy.js                 Next 16 "proxy" (formerly middleware): role-based redirects
prisma/                  schema.prisma, migrations/, seed.js (guarded), backfill-patient-logins.js
scripts/                 secure-demo-accounts.js (one-off maintenance)
```

Path alias: `@/*` maps to the repo root (`jsconfig.json`).

## Request flow

1. **`proxy.js`** runs on every non-static request:
   - `/api/*` passes straight through, because API routes check auth themselves.
   - `/`, `/verify/*` and `/login` are public. A signed-in user visiting `/login` is redirected to their role home.
   - With no session, the user is redirected to `/login`.
   - With a session, the path must start with the role's prefix (`/admin`, `/doctor`, `/receptionist`, `/patient`). Otherwise the user is redirected to the role home.
2. **Role layout** (`app/<role>/layout.js`) calls `await auth()` again and redirects if there is no session or the role is wrong. It also renders the sidebar and top bar.
3. **Pages are async server components that query Prisma directly.** There is no API layer for reads.
4. **Mutations** go through server actions in `lib/actions/*`, called from client components.

## Shared server helpers

| File | Purpose |
|---|---|
| `lib/action-errors.js` | `safely(fn)` wraps every action body; `ActionError` for expected failures; `toActionError` maps Prisma, auth and connection errors to user messages. **Actions never throw to the client.** |
| `lib/validate.js` | `str`, `num`, `oneOf`, `calendarDate`, `clinicDateTime`, `jsonRows`, `id`. They coerce FormData, or throw an `ActionError` |
| `lib/datetime.js` | Clinic-timezone formatting and parsing (`formatDate`, `formatDateTime`, `formatCalendarDate`, `startOfClinicDay`, `parseClinicDateTime`, `toClinicInputValue`). Never call `toLocaleString()` or `new Date("YYYY-MM-DDTHH:mm")` directly |
| `lib/normalize.js` | `normalizeEmail`, `normalizePhone`, `normalizeLoginId`, used on every write and at login |
| `lib/rate-limit.js` | In-memory failed-login limiter (single process) |
| `components/error-state.js` | Shared UI for `error.js` boundaries |
| `components/portal/portal-sidebar.js` | Accessible sidebar/Sheet used by every portal |

## Server action conventions

Every action in `lib/actions/` follows the same shape. New ones should too:

```js
"use server";
export async function doThing(id, formData) {
  return safely(async () => {                     // lib/action-errors.js: anything thrown becomes { error }
    const session = await requireRole("admin");   // lib/auth-guards.js
    const r = createReader(formData);             // lib/validate.js: collects EVERY field's error
    const name = r.text("name", { label: "Name", required: true, max: LIMITS.shortText });
    const height = r.measure("heightCm", { measure: "heightCm" });
    if (a > b) r.fail("to", "End must be after start");   // cross-field checks
    r.done();                                     // throws FieldErrors → { error, fieldErrors }
    // uniqueness etc. after the DB lookup: throw new FieldErrors({ phone: "Already registered" })
    await prisma.thing.update(...);               // multi-row writes use prisma.$transaction
    await prisma.auditLog.create({ data: {        // EVERY mutation is audit-logged
      userId: session.user.id, action: "updated_thing", entityType: "thing", entityId: id,
    }});
    revalidatePath("/admin/things");
    return { success: true };
  });
}
```

`requireRole` also checks `users.isActive` in the database, so deactivated users are locked out of mutations immediately. See [auth-and-roles.md](auth-and-roles.md). Route handlers (`app/api/**`) use `apiRoute()` from `lib/api.js`: the same role check, a UUID check on `[id]` (404 otherwise), and a JSON 500 instead of an unhandled crash.

Doctor pages get the current doctor with `getCurrentDoctor()` (wrapped in React `cache()`, so it's shared with the layout in the same request) and must scope prescription queries by `doctorId`.

## Validation: one set of rules, inline errors everywhere

```
lib/rules.js  ──►  lib/validate.js createReader (server: every field's error → fieldErrors)
     │
     └──────►  components/ui/form.jsx <Form> + useFormField (browser: inline, live)
```

- **Rules** (`lib/rules.js`) are pure `(raw, options) => { value, error }` functions that never throw: `text`, `personName`, `email`, `phonePK`, `cnic`, `code`, `title`, `strength`, `oneOf` (+ `gender`, `bloodGroup`, `dosageForm`, `appointmentStatus`), `measure`, `bloodPressure`, `calendarDate`, `clinicDateTime`, `password`, `uuid`, `prescriptionCode`. Length limits are in `LIMITS`. The browser and the server import the same functions, so they can't disagree. **Never write a validity check anywhere else.** Keystroke filters/formatters stay in `lib/sanitize.js`.
- **Server:** `createReader(formData)` exposes one method per rule (`r.phonePK("phone", {...})`), records the first error per field and returns `null` for invalid values; `r.done()` throws `FieldErrors`. `safely()` turns it into `{ error: "Please fix the N highlighted fields", fieldErrors: { field: message } }`. Unique-constraint races (P2002) on phone/CNIC/registration number are also reported on the field. Prescription rows are keyed `medicines.<index>.<field>` / `labTests.<index>.<field>`.
- **Browser:** wrap every form in `<Form onSubmit={(formData, ctx) => action(formData)}>` (it sets `noValidate`; no native bubbles). Each control registers with `useFormField(name, { validate, getValue })`; all inputs in `components/ui/form-inputs.jsx` (`NameInput`, `PhoneInput`, `MeasureInput`, `TextInput`, `TextArea`, `PasswordInput`, `ChoiceGroup`, …), `DatePicker`/`DateTimePicker`, `Combobox` and `SuggestInput` already do. Put each control in `<Field label htmlFor name>`; the error renders under it with `aria-invalid`/`aria-describedby` wired.
- **When errors appear** ("reward early, punish late"): refused keystrokes explain themselves immediately; a field's error first shows when you leave it, then updates on every keystroke (so it disappears as soon as it's fixed); submit checks everything, focuses the first invalid field and `<FormStatus>` shows "N fields need attention" (live). Server `fieldErrors` land on the same fields; the server's message shows in `<FormStatus>` until the next edit.
- **Context rules:** `form.validate(ctx)` / `form.submit(ctx)` pass `ctx` to every `validate(value, ctx)`. The prescription form uses `{ intent: "finalized" }` to require the diagnosis and complete medicine rows before the confirmation opens.
- `onSubmit` returns the action result. On `{ error }` the form leaves the pending state; on success it stays pending while the caller navigates (no double submit), unless `keepPendingOnSuccess={false}` (dialogs, report generator). `<SubmitButton pendingText>` reads that state.
- Inline controls that save immediately (appointment status select, doctor active switch) stay optimistic: `useTransition`, roll back and show a `role="alert"` message on failure.

**Prescription form specifics** (`components/prescriptions/prescription-form.js`): rows are JSON-encoded into `medicinesData` (`[{medicineId, dosage, frequency, duration, instructions}]`) and `labTestsData` (`[{labTestId, instructions}]`); `intent` comes from `ctx` (Enter saves a draft).

## Passing data to client components

Prisma `Decimal` values (patient `heightCm`/`weightKg`, all vitals) can't cross the server→client boundary. Wrap them with `serialize()` from `lib/utils.js`, which does a JSON round-trip. `Date` values are fine. **Never pass a `User` row (it contains `passwordHash`) to a client component.** See known-issues C1.

## Next.js 16 specifics

- `params` and `searchParams` are Promises: `const { id } = await params;`.
- Request interception lives in `proxy.js`, not `middleware.js`.
- Before using any Next API, read the relevant guide in `node_modules/next/dist/docs/` (per AGENTS.md).

## Brand

- **Name:** MedScript. The wordmark is lowercase "medscript", with "med" in deep sage and "script" in sage.
- **Mark:** an S drawn as a stethoscope. The earpiece and upper tube (deep sage) are the doctor; the lower tube and chestpiece (mint) are the patient. The colour changes on a clean vertical cut at the joint.
  - Construction: 24-unit grid, one 3-unit stroke (2 px at 16 px), half-circles and straight lines.
  - The top bowl (r 3.4) is optically smaller than the bottom bowl (r 3.9).
  - Below 32 px the chestpiece's diaphragm ring simplifies to a dot.
- **Wordmark:** drawn as paths, no font files, in the same monoline construction (x-height 10, 2-unit stroke).
- **Palette:**

| Token | Hex | Use |
|---|---|---|
| ink | `#2f5d50` | mark (doctor side), "med", headings |
| sage | `#4e8c76` | "script", secondary text accents |
| mint | `#7dbb9f` | mark (patient side), accents |
| mist | `#e3efe8` | icon tiles, tints |
| paper | `#f4f8f5` | page background |

  The app's `--primary` is a sage close to ink (`oklch(0.50 0.065 170)`), and mint in dark mode.
- **Where it's defined:** `components/brand/logo-geometry.js` is the single source of truth. It holds `BRAND_NAME`, `BRAND`, the `MARK_ELEMENTS` and `WORDMARK_ELEMENTS` data, `markElementsFor(px)` and `markSvg()`.
- **Where it's used:**

| Context | Use |
|---|---|
| Web UI | `<LogoMark px bg>`, `<Wordmark>` and `<Logo subtitle>` from `components/brand/logo.js`. Pass `px` below 32 px and `bg` on non-white surfaces, because the diaphragm is a cut-out |
| PDFs | `PdfLogoMark({ size, opacity, bg })` and `PdfWordmark({ height })` from `lib/pdf/logo.js`: header mark, 6 % watermark on every page, and the footer lockup |
| App icons | `app/icon.svg` (static; regenerate it with `markSvg({ tile: true, px: 16 })`) and `app/apple-icon.js` (`ImageResponse`). `proxy.js` excludes both from auth |

- **Theme-aware logo:** the web `LogoMark`/`Wordmark` default to the `--logo-ink`/`--logo-script`/`--logo-mint` CSS variables (brand hex in light mode, inverted in dark mode) and default `bg` to `var(--background)`. Colours go through `style`, not SVG attributes, so variables resolve. The brand hex values are also Tailwind colours: `bg-brand-ink`, `text-brand-mint`, etc.
- **react-pdf gotcha:** `opacity` on `<Svg>` is ignored, so the PDF components set `fillOpacity`/`strokeOpacity` on each element.

## Lists: everything shown, searched and paged in the browser

Every list in the app (patients, doctors, medicines, lab tests, drafts, prescription histories, appointments, report history, the patient portal) works the same way:

| Piece | Use |
|---|---|
| `lib/lists.js` | One loader per list (`patientRows`, `doctorRows`, `medicineRows`, `labTestRows`, `draftRows`, `historyRows`, `appointmentRows`, `reportRows`, plus `doctorPickerItems` and `prescriptionCatalogs`). Each `select`s only displayed fields, formats them on the server (dates, phones, ages), adds a `searchText`, and sends the **whole** list when it has at most `LIST_CAP` = 500 rows (about 100 KB); bigger lists are served one page at a time (see below). |
| `components/ui/data-list.jsx` | `DataList`: search box, filter selects, table (md+) or cards (phones) from one `columns` definition, and pagination. Search, filters and paging run **in the browser** over the loaded rows: instant, with no requests. State (`q`, `page`, `size`, filters) is mirrored into the URL with `history.replaceState`, so refresh, back and shared links restore the view. |
| `lib/list-state.js` | The pure logic: `rowMatches` (every word, accent-insensitive; 4+ digits also match phones however written), `filterRows`, `paginate` (clamps), `pageWindow`, `listStateFrom(searchParams, filterKeys)`. |
| `components/ui/pagination.jsx` | Shared pagination: "Showing 26–50 of 312 (filtered from 1,204)", numbered pages with gaps, Previous/Next, rows per page (10/25/50/100). Buttons for in-browser lists, links (`hrefFor`) for server-paged ones. Hidden when there's one page. |
| `components/lists/*` | Small client wrappers that define each list's columns, filters and row actions (functions can't cross the server/client boundary). Server pages only load rows and render the wrapper. |
| `EmptyState`, `StatusBadge` | The one empty block and the one status label palette. `StatusBadge` maps values to tones on the status tokens and to display labels (`statusLabel("finalized")` → "Finalised"). |
| `DataListRows` | The cards + table renderer inside `DataList`, exported so server-paged lists (the audit log) look identical. |

**Large lists:** every loader goes through `loadList()`. Above `LIST_CAP` it returns one page of 25 plus `server: { total, page, pageSize, query }`, and searches on the database with the loader's `search(q)` conditions (the same fields as `searchText`; diagnoses only where they're shown). `DataList` then switches to debounced `?q=` searches and link pagination that keep the page's other URL params (e.g. `?view=past`). Filter selects are hidden in this mode. Nothing is ever truncated silently.

**The audit log** is the exception by design: it grows without bound, so search (every page, not just the loaded one), entity/action filters and a date range are applied by the server (`app/admin/audit-logs/page.js`), with the shared `Pagination` in link mode. Out-of-range pages clamp to the last page.

**Privacy:** rows reach the browser, so only fields the page shows may go into a row or its `searchText`. The doctor's view of a patient's history never includes other doctors' diagnoses; the receptionist sees finalised prescriptions only, without diagnoses.

The only other database lookups while typing are the uniqueness checks on registration forms (`lib/actions/lookup.js` + `useUniqueCheck`/`DuplicateNotice` in `components/ui/unique-check.jsx`): read-only, no audit log, and only once a value is complete.

## Look and feel

The goal is a quiet clinical tool, not a template. Rules that keep it that way:

- **Type:** IBM Plex Sans for UI, Plex Mono for codes, Instrument Serif (`font-display`) only for the sign-in panel, 404 and full-page errors. All three load once in `lib/fonts.js`. Use Tailwind's scale (`text-xs`…`text-2xl`); titles are `font-semibold`, not bold. Use `tabular-nums` for figures.
- **Colour:** tokens only (`primary`, `muted`, `border`, and the status tokens `success`/`warning`/`info`/`destructive`, each with a `-strong` shade for text on a tint). Never raw Tailwind palette colours (`emerald-500`, `blue-600`…), gradients or glow shadows.
- **Dark mode:** `next-themes` toggles the `.dark` class (Light/Dark/System in the account menu). Everything must work in both; the QR code keeps a white background so it scans.
- **Page titles:** every page uses `PageHeader` (+ `PageShell` for padding) or `FormPage`, which wraps it. One `<h1>` per page; the shell has no top bar. Staff pages put the account menu in the sidebar footer.
- **No decorative icons:** icons go in navigation and buttons, not on section headings or stat figures. `FormSection` has no icon.
- **Dashboards show work, not totals:** today's figures in one neutral strip, then `Panel` lists of what needs action (`components/ui/panel.jsx`).
- **Documents look like the PDF:** the prescription web view (`components/prescriptions/prescription-view.js`) mirrors `lib/pdf/prescription-document.js`.
- **Copy:** sentence case everywhere; British spelling (finalise, specialisation; the DB value stays `finalized`); say what a thing is, not how great it is (no "seamless", "real-time", "official", "Manage X, Y and Z"). Canonical terms: Medicines, Lab tests, Doctor's advice, Patient code, Prescription code, PMDC registration number (PDF: "PMDC Reg. No.").

## UI conventions

- `components/ui/*` are shadcn components in the **base-nova** style, built on `@base-ui/react`. Base UI composes with the `render` prop; **there is no `asChild`**.
- `cn`: `@/lib/utils` re-exports the npm `cn` package (shadcn's clsx+tailwind-merge replacement), which generated `ui/*.jsx` files import directly. Either import works; app code uses `@/lib/utils`.
- To style a base-ui trigger as a button, use `className={cn(buttonVariants({ variant, size }), ...)}` (see `components/admin/medicines-table.js`).
- Printing: app chrome (sidebars, the patient top bar, breadcrumbs, print button) has `print:hidden`. The layout wrappers use `contents print:hidden` so they don't affect sticky or flex layout on screen.
- Icons come from `lucide-react`.
- File extensions are mixed: shadcn files and three pages use `.jsx`, everything else uses `.js`. Prefer `.js` for app code.

## Forms & date pickers

- Layout: every form page is wrapped in `FormPage` (full width), and fields are grouped in flat `FormSection`s (a `<fieldset>` on the page background, no card: the icon, title and description sit in a left column on `lg+`, the fields in a responsive grid to the right, and sections are separated by dividers. Grid presets: `columns` 1, 2 (3-up at `xl`), 3, 6 or `"pair"` (2-up from `lg`), so wide screens get more columns rather than stretched inputs). Each control sits in a `Field` (label, required marker, hint `id = <htmlFor>-hint`). Submit buttons go in `FormActions` (sticky on phones) and server errors in `FormError` (focuses itself). All of these are in `components/ui/form-layout.jsx` and `form-error.jsx`. `ChoiceGroup` (pill radios) and `WithUnit` (trailing "cm"/"kg") live there too.
- Dates: never use `type="date"` or `datetime-local`. Use `DatePicker` (submits `YYYY-MM-DD`, for `calendarDate()`) or `DateTimePicker` (submits clinic-time `YYYY-MM-DDTHH:mm` in 15-minute slots within `CLINIC_OPEN`–`CLINIC_CLOSE`, for `clinicDateTime()`) from `components/ui/date-picker.jsx`. Both are built on the custom `Calendar` (`components/ui/calendar.jsx`: day/month/year views, WAI-ARIA grid keyboard support) inside a base-ui `Popover`. They work on `YYYY-MM-DD` keys (helpers in `lib/datetime.js`), so nothing shifts with the browser timezone. Clinic hours can be overridden with `NEXT_PUBLIC_CLINIC_OPEN` / `NEXT_PUBLIC_CLINIC_CLOSE`.

### Input limits and typing assistance

- `MEASURES` (`lib/sanitize.js`) defines each numeric field: label, unit, hard range, decimal places and a "double-check" band. `MeasureInput` refuses keystrokes that can only exceed the maximum (height can't become `468`), shows the range error on blur and an amber note for unusual values. It also offers fixes: height in feet (`5.8`, `5'8"`) to cm, and temperature in °C to °F. The weight field warns on an implausible BMI. On the server, `measure()` in `lib/validate.js` applies the same spec.
- `MaskedInput` filters get `(next, prev)`, so formatters can tell typing from deleting. `BloodPressureInput` inserts the "/" itself (`120` → `120/`, `12080` → `120/80`). `PhoneInput` adds the leading 0 and rejects numbers that don't start `03`. `CnicInput` rejects a first digit outside 1–7. `NameInput` fixes all-lower/all-upper case on blur.
- `SuggestInput` (`components/ui/suggest-input.jsx`, base-ui Autocomplete) suggests from `lib/clinical-vocab.js`, matching by word prefix and abbreviation (`bd`, `tds`, `sos`). Dosage follows the medicine's dosage form (`2` → "2 tablets", "5" with a syrup → "5 ml"), and duration expands numbers (`5d` → "5 days"). Suggestions never restrict input. `QuickChips` append common phrases to allergies, conditions and advice.

## PDF pipeline (`lib/pdf/`)

PDFs are rendered in-process by **`@react-pdf/renderer`**. There is no external binary, temp file or env var, and it works on serverless hosts. Next.js externalizes the package automatically (it's on the built-in `serverExternalPackages` list), so no config is needed.

`GET /api/prescriptions/[id]/pdf`:
1. Loads the prescription with its patient, doctor, vitals, medicines and lab tests, then checks access with `canAccessPrescription`.
2. `renderPrescriptionPdf(rx, verifyUrl)` (`lib/pdf/index.js`) makes a QR data URL for the signed verify URL from `buildVerifyUrl()`. The URL's base is `AUTH_URL || NEXTAUTH_URL || request origin`. It then calls `renderToBuffer(<PrescriptionDocument/>)`.
3. The PDF is streamed inline. **Nothing is stored**: every download re-renders it. `Prescription.pdfUrl` and `qrCodeUrl` just hold the route paths.

Editing layouts:
- `lib/pdf/prescription-document.js` and `lib/pdf/report-document.js` use react-pdf primitives (`Document`, `Page`, `View`, `Text`, `Image`) with flexbox `StyleSheet` styles, not HTML or Tailwind.
- The built-in Helvetica fonts only cover Latin text. Non-Latin scripts (e.g. Urdu) need a font registered with `Font.register()`.
- To preview a layout, download the PDF from the running app, or render page 1 with `pdftoppm -png`.

## Reports (`lib/reports.js`, `lib/actions/reports.js`)

- `generateReport` stores only a `Report` row (type, format, filters) and returns `fileUrl = /api/reports/<id>/download`.
- The download route calls `fetchReportData(type, filters)` **live**, so a report always reflects current data, not the data at the time it was generated. Supported types: `patients`, `prescriptions`, `appointments`, `doctors`, `medicines`; filters are `from`, `to` and `doctorId`.
- CSV output comes from `buildReportCsv`. PDF output comes from `renderReportPdf(title, headers, rows)`: a striped table, landscape when there are more than 5 columns, with a header row repeated on each page and page numbers.

## Tooling

- ESLint: `eslint-config-next` core-web-vitals. Lint currently has 0 errors and 2 `<img>` warnings.
- There are no tests, no CI and no TypeScript.
