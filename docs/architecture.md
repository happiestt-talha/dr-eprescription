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
  layout.js, globals.css Root layout (wraps everything in <Providers> = SessionProvider)
components/
  ui/                    shadcn primitives (base-ui based) + custom top-bar.js, breadcrumbs.js
  admin/ doctor/ receptionist/ patient/   Role-specific components (sidebars, tables, forms)
  patients/              Shared by doctor + receptionist: patient-form, search bar, top bar
  prescriptions/         prescription-form (create/edit), print-button
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
  return safely(async () => {                    // lib/action-errors.js: anything thrown becomes { error }
  const session = await requireRole("admin");    // lib/auth-guards.js
  const x = str(formData, "x", { required: true, max: 120 }); // lib/validate.js → ActionError on bad input
  await prisma.thing.update(...);                // multi-row writes use prisma.$transaction
  await prisma.auditLog.create({ data: {         // EVERY mutation is audit-logged
    userId: session.user.id, action: "updated_thing", entityType: "thing", entityId: id,
  }});
  revalidatePath("/admin/things");
  return { success: true };
  });
}
```

`requireRole` also checks `users.isActive` in the database, so deactivated users are locked out of mutations immediately. See [auth-and-roles.md](auth-and-roles.md).

Doctor pages get the current doctor with `getCurrentDoctor()` (wrapped in React `cache()`, so it's shared with the layout in the same request) and must scope prescription queries by `doctorId`.

**Client side.** Forms do not use `useActionState`. The pattern is:

```js
async function onSubmit(e) {
  e.preventDefault();
  setLoading(true);
  const res = await someAction(new FormData(e.target));
  if (res.error) setError(res.error); else router.push(...);
}
```

Tables and toggles wrap calls in `useTransition`. Errors render as a `text-destructive` paragraph; there are no toasts.

**Prescription form specifics** (`components/prescriptions/prescription-form.js`):
- The two submit buttons set `intent=draft|finalized`, captured with `new FormData(form, e.nativeEvent.submitter)`.
- Medicine and lab-test rows are JSON-encoded into `medicinesData` (`[{medicineId, dosage, frequency, duration, instructions}]`) and `labTestsData` (`[{labTestId, instructions}]`).
- Vitals are plain named inputs.

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

- **react-pdf gotcha:** `opacity` on `<Svg>` is ignored, so the PDF components set `fillOpacity`/`strokeOpacity` on each element.

## Search

**Rule:** data a page has already loaded is searched **in the browser**, with no server request. Only patient lookup goes to the database, because that table grows without bound.

| Piece | Use |
|---|---|
| `lib/search.js` | `matches(query, ...fields)`: case- and accent-insensitive, every query word must appear in some field ("amox 500" finds "Amoxil 500mg") |
| `components/ui/search-input.jsx` | `SearchInput` (the standard `Input` with a search icon, clear button and Escape-to-clear), `SearchCount` ("12 of 20"), `NoMatches` (empty state) |
| `components/ui/combobox.jsx` | Searchable replacement for `Select`, styled like it. `items: [{ value, label, detail?, keywords? }]`; `name` adds a hidden input for native forms. Used for the medicine, lab-test and doctor pickers |
| `components/searchable-section.js` | Instant search for **server-rendered** lists without moving their markup. The page passes `index=[{ key, text }]` and tags each row (card and table row) with `data-search-key`. Non-matches are hidden with a scoped CSS rule. Used by admin doctors and reports, receptionist appointments, doctor drafts and patient history, and patient prescriptions |
| `components/patients/patient-search.js` | Patient lookup: searches as you type (300 ms debounce). Narrowing a query whose results were complete (fewer than 25) filters locally; anything else makes one `?q=` server request |

Client-side table filters (`useMemo` + `matches`) are in `medicines-table.js`, `lab-tests-table.js` and `audit-log-table.js`. The audit log filters only the loaded page; its dropdowns and pagination still query the server.

**Index privacy:** an index is sent to the browser, so only include fields the page already shows. The doctor's patient history leaves other doctors' diagnoses out.

## UI conventions

- `components/ui/*` are shadcn components in the **base-nova** style, built on `@base-ui/react`. Base UI composes with the `render` prop; **there is no `asChild`**.
- `cn`: `@/lib/utils` re-exports the npm `cn` package (shadcn's clsx+tailwind-merge replacement), which generated `ui/*.jsx` files import directly. Either import works; app code uses `@/lib/utils`.
- To style a base-ui trigger as a button, use `className={cn(buttonVariants({ variant, size }), ...)}` (see `components/admin/medicines-table.js`).
- Printing: app chrome (sidebars, top bars, breadcrumbs, print button) has `print:hidden`. The layout wrappers use `contents print:hidden` so they don't affect sticky or flex layout on screen.
- Icons come from `lucide-react`.
- File extensions are mixed: shadcn files and three pages use `.jsx`, everything else uses `.js`. Prefer `.js` for app code.

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
