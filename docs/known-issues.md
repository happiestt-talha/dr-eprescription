# Known issues

The audit ran on 2026-10-26, and fixes were applied the same day. ✅ means fixed; everything else is still open. Open items are mostly ones that need a schema migration, which was deliberately left out of the fix round.

## Critical: security & privacy

| # | Issue | Status |
|---|---|---|
| C1 | The admin edit-doctor page sent `user.passwordHash` to the browser. | ✅ The page selects explicit profile fields only (`app/admin/doctors/[id]/page.js`) |
| C2 | Any doctor could open any prescription by ID. | ✅ The view and edit pages query `{ id, doctorId: me }` and return 404 otherwise. The QR route now has the same access check as the PDF route |
| C3 | Doctors saw every patient's full history across doctors. | ✅ (light scoping) Other doctors' prescriptions appear in a patient's history as date, doctor and status only, with no diagnosis or link. Their drafts are hidden. Doctors can still search all patients (single-clinic model) |
| C3b | No clinic/tenant concept, so receptionists see every patient and appointment. | Open, by design for now. It would need a `Clinic` model and a migration |
| C4 | `/verify/[code]` exposed patient names on sequential codes, and falsely claimed "cryptographically signed". | ✅ QR links carry an HMAC signature (`?t=`, see `lib/verify.js`). Only signed links show the patient, as initials. Unsigned links show the doctor and date only. The wording is fixed |
| C5 | Demo credentials were hard-coded on the login page; seeded accounts with public passwords are in the live database. | ✅ The demo buttons are removed. `scripts/secure-demo-accounts.js` rotates or deactivates the seeded accounts. **Run it with `--apply`** (see README) |
| C6 | `prisma/seed.js` wipes every table, and `.env` points at the live database. | ✅ The seed prints the target host and refuses unless `ALLOW_SEED_WIPE=true` (always refuses when `NODE_ENV=production`). `.env` still points at the live database, so be careful |

## High: broken behaviour

| # | Issue | Status |
|---|---|---|
| H1 | Patients couldn't log in (the field was `type="email"`). | ✅ The field is "Email or phone", `type="text"`, and the input is trimmed in `auth.js` |
| H2 | `count()+1` code generation raced and collided after deletes. | ✅ `lib/codes.js` takes the max of the existing numeric suffix inside the transaction, and `withUniqueRetry` retries on unique-constraint clashes |
| H3 | `licenseNumber` was used instead of `registrationNo`. | ✅ |
| H4 | Breadcrumbs linked to a nonexistent `/doctor/prescriptions`. | ✅ The trail is now Patients → patient → prescription |
| H5 | Doctor pages crashed when the user had no `Doctor` row. | ✅ The layout shows a "profile not set up" message (`getCurrentDoctor()` in `lib/auth-guards.js`) |
| H6 | `DialogTrigger asChild` misuse created a button nested in a button. | ✅ The trigger is styled via `buttonVariants` |
| H7 | "Today's appointments" counted all future appointments. | ✅ |
| H8 | Appointment status changes ignored errors. | ✅ The status rolls back and an error shows; the action validates the status value |
| H9 | PDF generation depended on LibreOffice, and `LIBREOFFICE_PATH` in `.env` was a Windows path, so PDFs returned 500 on Linux. | ✅ Replaced LibreOffice and `docx` with `@react-pdf/renderer` (pure JS, in-process). `LIBREOFFICE_PATH` is no longer used |

## Second audit (2026-10-26): security, reliability, UX

A second, independent audit (security, correctness/reliability, frontend/UX, plus `npm audit`) was run and its findings verified in code. Two claims were disproved: RLS *is* enabled on every table, and `.env` was never committed.

| # | Issue | Status |
|---|---|---|
| A1 | Next.js 16.3.4 had critical RCE advisories, including one in `next/og` `ImageResponse` (used by `app/apple-icon.js`), plus 15 vulnerable transitive packages | ✅ Upgraded to `next@16.4.3`, then `npm audit fix`. 3 high remain, all in the Prisma CLI (`deepmerge-ts`, used at build/migrate time only). They need Prisma 7 |
| A2 | `/admin/audit-logs` sent every staff `passwordHash` to the browser | ✅ The page selects `user.email` only |
| A3 | `toggleDoctorActive` trusted a client-supplied `userId`, so an admin could deactivate any account | ✅ It takes only `doctorId` and looks up the doctor's user on the server, in one transaction |
| A4 | Deactivated users kept read access for up to 30 days | ✅ Sessions last 12 h, and the `jwt` callback re-checks `isActive` every 5 min. On a DB error it keeps the session rather than signing everyone out |
| A5 | Login weaknesses | ✅ All fixed: |
| | • no rate limit | 5 failures per 15 min per identifier and per IP (`lib/rate-limit.js`, in-memory, one process) |
| | • account enumeration by timing | constant-time compare against a dummy hash |
| | • logins not normalised | emails trimmed and lowercased, phones stripped of separators |
| | • logins not audited | `login_success` audited |
| | • weak doctor passwords | minimum 10 characters |
| A6 | No error pages | ✅ `app/error.js`, `global-error.js`, `not-found.js` and per-portal `error.js` (`components/error-state.js`) |
| A7 | Forms froze on "Saving…" when an action threw | ✅ Every action returns `{ error }` via `safely()` / `toActionError()` (`lib/action-errors.js`), and every form handler has try/catch |
| A8 | Interactive transactions used Prisma's 2 s/5 s defaults on a ~3 s-per-connect DB | ✅ All interactive transactions pass `{ maxWait: 10000, timeout: 20000–30000 }` |
| A9 | Times parsed and shown in the server's timezone (a +5 h shift on UTC hosts) and a hydration mismatch in the audit log | ✅ `lib/datetime.js` (clinic timezone, default `Asia/Karachi`) is used for parsing, display, "today" and report ranges. Verified with the server running in UTC |
| A10 | No input validation in server actions | ✅ `lib/validate.js` on every action covers lengths, numeric ranges, enums, dates, row shapes and limits, existence of referenced ids, and appointment status transitions |
| A11 | Every Select showed the raw value (UUIDs) | ✅ `items` label maps are passed to each `<Select>` |
| A12 | Double-submit could create duplicate prescriptions or appointments | ✅ Forms stay disabled while navigating |
| A13 | A failed medicine/lab-test delete was silent; the report pop-up was blocked by the browser | ✅ Errors are shown, and a "Download report" link replaces the pop-up |
| A14 | Draft prescriptions downloadable with a verify QR | ✅ Drafts are visible only to their own doctor, render with a DRAFT box and no QR, and the QR route returns 404 |
| A15 | No security headers; PDFs and reports cacheable; CSV formula injection; no UTF-8 BOM | ✅ All fixed (`next.config.mjs`, `Cache-Control: private, no-store`, CSV escaping and BOM) |
| A16 | Inactive doctors bookable; past dates accepted; any status transition allowed | ✅ Validated in the actions; pickers list active doctors only |
| A17 | Smaller items | ✅ All fixed: |
| | • `updatePrescription` race | draft check moved inside the transaction |
| | • finalize didn't set `visitDate` | finalize now sets it |
| | • no confirmation before the irreversible finalize | confirmation dialog added |
| | • a pulse of 0 rendered as "0" | fixed |
| | • green "deactivated" badge | fixed |
| | • patient phone not editable | phone can be changed, and the login changes with it |
| | • repeated query params caused a 500 | handled |
| A18 | Accessibility | ✅ All fixed: |
| | • Link-wrapped Buttons | now `render={<Link/>}` |
| | • icon buttons with no name | labelled |
| | • prescription-form labels not linked | linked |
| | • errors not announced | `role="alert"` |
| | • mobile sidebars not accessible | now an accessible Sheet (`components/portal/portal-sidebar.js`) |
| | • account menu not keyboard-operable | now a base-ui `Menu` |

**Still open from this audit (each needs a schema change or new feature):**
- **Snapshot finalized prescriptions.** Renaming a medicine or editing a doctor changes old PDFs.
- ✅ **Patient password flow.** Patients and doctors must replace their temporary password on first sign-in, and everyone can change their password from the account menu. Staff can reset a patient's or doctor's password from their profile. Still open: no self-service reset by email or SMS, and no reset UI for receptionist or admin accounts.
- **Receptionists can edit clinical fields** (allergies, diseases).
- **Login rate limiting is per process.** Use Redis for multiple instances. The IP key relies on `x-forwarded-for`, which is spoofable unless a trusted proxy sets it.
- **Not audited:** failed logins (server log only), record views and PDF downloads.
- **Verify signatures reuse `AUTH_SECRET`.** Rotating it downgrades printed QR codes to "on record".
- **Accessibility leftovers:** some remaining mobile label/value rows can overflow with very long text, and there are two headers on mobile.

## Medium

- ✅ Print: the sidebar, top bar, breadcrumbs and print button are hidden when printing (`print:hidden`).
- ✅ The Geist font is applied (`--font-sans: var(--font-geist-sans)`).
- ✅ Receptionist appointments have Upcoming (soonest first) and Past (`?view=past`, newest first) tabs.
- ✅ "Dr. Dr." names: the `Dr.` title is stripped on doctor save and in the seed. `scripts/secure-demo-accounts.js` fixes existing rows.
- ✅ The prescription submit buttons show the right loading text.
- ✅ Deactivated users: server actions re-check `isActive` (`requireRole`). **Pages** still trust the JWT until it expires.
- ✅ No more shelling out: PDFs render in-process (`lib/pdf/`).
- ✅ The QR and PDF base URL honours `AUTH_URL` / `NEXTAUTH_URL`, falling back to the request origin.
- **Slow database round trips:** Supabase is in `ap-southeast-2` (Sydney), so each new connection takes about 3 s from Pakistan and pages with several queries feel slow. `DATABASE_URL` now carries `connect_timeout=30&pool_timeout=30` to stop the intermittent `P1001` errors. The real fix is moving the project to a closer region, e.g. `ap-south-1` (Mumbai).
- **Deploy note:** with `next start` on your own host, set `AUTH_TRUST_HOST=true` (or `AUTH_URL`), or every auth request fails with `UntrustedHost`. Found while testing a production build.
- ✅ The Prisma migration baseline is done (2026-10-29); see [database.md](database.md#migrations-read-before-changing-the-schema).
- Missing indexes on FK columns; redundant `patients_phone_idx` and `patients_cnic_idx`. These need a migration.
- PDFs are re-rendered on every request (cheap now; caching is optional).
- Server actions `throw` on authorization failure, and the client forms don't catch it, so the form stays in its loading state.
- The receptionist patient page lists draft prescriptions and omits blood group and allergies, unlike the doctor view.
- Seeded report rows point to `/reports/*.pdf` files that don't exist.
- The seed's "inhaler" dosage form isn't in the admin dropdown.

## Low: cleanup & tech debt

- ✅ Removed the unused Supabase helpers and deps, `doctor-nav`, `patient-sidebar`, `ui/badge` and the default `public/*.svg` files.
- ✅ A single `cn`: `@/lib/utils` re-exports the `cn` package (shadcn's clsx+tailwind-merge replacement). `clsx` and `tailwind-merge` were removed.
- ✅ Role guards are centralised in `lib/auth-guards.js`.
- ✅ Root metadata is set.
- `.js` and `.jsx` are mixed; `components/patient/` vs `components/patients/` naming.
- Duplicated doctor and receptionist patient pages, duplicated prescription views, and three sidebar implementations.
- `package.json#prisma` seed config is deprecated in Prisma 7.
- 2 ESLint `<img>` warnings; no tests, no CI.
