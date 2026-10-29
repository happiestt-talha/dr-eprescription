@AGENTS.md

# Project: MedScript

A multi-role clinic e-prescription app (admin, doctor, receptionist, patient). Built on Next.js 16 App Router (plain JS), NextAuth v5 (credentials, JWT), Prisma 6 on Supabase Postgres, Tailwind 4 and shadcn base-nova (@base-ui/react). PDFs (prescriptions, reports) are rendered in-process with `@react-pdf/renderer`; layouts live in `lib/pdf/`.

Docs (read the relevant one before working in an area):
- `docs/architecture.md`: layout, request flow, server-action pattern, PDF/report pipelines
- `docs/database.md`: schema, domain rules, migrations, Supabase notes
- `docs/auth-and-roles.md`: auth, route protection, permission matrix
- `docs/features.md`: route map and workflows
- `docs/known-issues.md`: audit findings. Update it when you fix or find something

## Commands

- `npm run dev`, `npm run lint`, `npm run build`
- `npx prisma generate` (also runs on postinstall)
- `npx prisma db seed`: **wipes every table**. It refuses unless `ALLOW_SEED_WIPE=true`. Never set that against the live database (`.env` currently points at the live one)
- `node --env-file=.env scripts/secure-demo-accounts.js [--apply]`: rotates or deactivates seeded accounts with public passwords
- No test suite exists.

## Conventions

- Reads: query Prisma directly in async server pages. Writes: `"use server"` actions in `lib/actions/<domain>.js`. Each action starts with `requireRole(...)` from `lib/auth-guards.js` (never hand-roll a guard), then validation returning `{ error }`, then the write (a `$transaction` when touching multiple rows), then **an `auditLog.create`**, then `revalidatePath`, and returns `{ success, ... }`.
- Doctor pages get the doctor via `getCurrentDoctor()` and must scope prescription queries with `doctorId: doctor.id`.
- Verification links come from `verifyPath` / `buildVerifyUrl` in `lib/verify.js` (HMAC-signed). Never build `/verify/...` URLs by hand. Patient/prescription codes come from `lib/codes.js`.
- Server actions wrap their body in `safely()` and validate input with `lib/validate.js`; they return `{ error }` and never throw. Client handlers still use try/catch and keep `loading` on while navigating (no double-submit).
- Dates: always use `lib/datetime.js` (clinic timezone). Never `toLocaleString()` or `new Date("YYYY-MM-DDTHH:mm")` directly. Format on the server and pass strings to client components.
- Selects: pass an `items` value-to-label map to every base-ui `<Select>`, or it displays the raw value. For long lists (medicines, tests, doctors) use the searchable `Combobox` (`components/ui/combobox.jsx`).
- Search: filter data the page already loaded in the browser (`SearchInput` + `lib/search.js`, or `SearchableSection` for server-rendered lists); don't add server round trips for it. Only patient lookup hits the database (see `docs/architecture.md#search`).
- Never pass Prisma rows that include `user` to client components; `select` only the fields you need.
- `params` and `searchParams` are Promises; always `await` them, and use `firstParam()` (from `@/lib/utils`) for search params, since they can be arrays. Interception lives in `proxy.js`, not `middleware.js`.
- Wrap Prisma `Decimal` data (patient height/weight, vitals) in `serialize()` from `@/lib/utils` before passing it to client components. Never pass `User` rows (they include `passwordHash`) to client components.
- base-ui components use the `render` prop; there is **no `asChild`**. To style a trigger as a button, pass `className={cn(buttonVariants(...))}`. Use `cn` from `@/lib/utils`. Icons come from `lucide-react`.
- Page-level ownership checks are your responsibility. The layout only checks the role.
- Patients log in with their phone number, stored in `users.email`.
- Finalized prescriptions are immutable; only drafts can be edited.
- Schema changes: migrations are baselined (see `docs/database.md`). Review with `prisma migrate diff` first, deploy with `prisma migrate deploy`, and never run `migrate dev`, `db push` or `migrate reset` against production.
- Inputs: every new field uses the sanitising inputs in `components/ui/form-inputs.jsx` (name, email, Pakistani phone, CNIC, code, BP) in the browser, and the matching `lib/validate.js` helper on the server (rules live in `lib/sanitize.js`). Phones are stored as `+923XXXXXXXXX`.
- Never commit `.env` or print its values.
- Brand: MedScript. The logo (stethoscope-S mark + path-drawn wordmark, sage palette) is defined once in `components/brand/logo-geometry.js`. Use `<Logo>`/`<LogoMark>`/`<Wordmark>` from `components/brand/logo.js` in the UI and `PdfLogoMark`/`PdfWordmark` (`lib/pdf/logo.js`) in PDFs; never use a generic icon as the brand mark. `app/icon.svg` is generated from the geometry, so regenerate it if the geometry changes (see `docs/architecture.md#brand`).
