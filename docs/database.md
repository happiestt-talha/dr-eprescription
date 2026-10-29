# Database

PostgreSQL 17 hosted on Supabase. The app talks to it **only through Prisma** (`lib/db.js`). Supabase Auth, Storage and the Data API are not used. The source of truth for the schema is `prisma/schema.prisma`, and table names are snake_case via `@@map`.

## Entity overview

```
users ─┬─1:1─ doctors ──┬── prescriptions ─┬─1:1─ vitals
       ├─1:1─ receptionists                ├─1:n─ prescription_medicines ──n:1── medicines
       ├─1:1─ patients ─┴── appointments   └─1:n─ prescription_lab_tests ──n:1── lab_tests
       ├─1:n─ audit_logs     (patients also 1:n prescriptions; doctors 1:n appointments)
       ├─1:n─ reports
       └─1:n─ appointments (bookedBy)
```

| Model (table) | Key fields | Notes |
|---|---|---|
| `User` (`users`) | `email` **unique**, `passwordHash`, `role` (enum), `isActive` | Login identity for all roles. For patients, **`email` holds their phone number** |
| `Doctor` (`doctors`) | `userId` unique, `fullName`, `qualification`, `specialization`, `registrationNo` **unique**, `phone`, `clinicName`, `clinicAddress`, `profilePictureUrl?`, `signatureUrl?` | Picture and signature are never set by the UI |
| `Receptionist` (`receptionists`) | `userId` unique, `fullName`, `phone`, `clinicName` | No admin UI to create receptionists; they are created via seed or SQL only |
| `Patient` (`patients`) | `userId?` unique, `patientCode` **unique** (`PT-NNNN`), `fullName`, `gender`, `phone` **unique**, `cnic?` **unique**, `dateOfBirth?`, `age?`, `heightCm?`/`weightKg?` (Decimal), medical-history text fields | `userId` is nullable, which is legacy. New patients always get a login |
| `Prescription` (`prescriptions`) | `prescriptionCode` **unique**, `patientId`, `doctorId`, `visitDate`, `symptoms?`, `diagnosis?`, `advice?`, `status` (`draft`/`finalized`), `qrCodeUrl?`, `pdfUrl?` | URLs are set only when finalized |
| `Vitals` (`vitals`) | `prescriptionId` unique, height, weight, BP (string), tempF, pulse, SpO2 | Created only if at least one vital was entered |
| `PrescriptionMedicine` | `prescriptionId`, `medicineId`, `dosage`, `frequency`, `duration`, `instructions?` | |
| `PrescriptionLabTest` | `prescriptionId`, `labTestId`, `instructions?` | |
| `Medicine` (`medicines`) | `name`, `genericName?`, `dosageForm?`, `strength?`, `manufacturer?` | Admin-managed catalog |
| `LabTest` (`lab_tests`) | `name`, `category?`, `normalRange?` | Admin-managed catalog |
| `Appointment` (`appointments`) | `patientId`, `doctorId`, `scheduledAt`, `status` (`pending`/`confirmed`/`completed`/`cancelled`), `bookedBy?` → users | |
| `AuditLog` (`audit_logs`) | `userId`, `action`, `entityType`, `entityId`, `details` (JSON) | Append-only |
| `Report` (`reports`) | `reportType`, `format` (`pdf`/`csv`), `filters` (JSON), `fileUrl`, `generatedBy` | Metadata only. The file is regenerated on download |

Enums: `Role {admin, doctor, patient, receptionist}`, `Gender {male, female, other}`, `PrescriptionStatus {draft, finalized}`, `AppointmentStatus {pending, confirmed, completed, cancelled}`, `ReportFormat {pdf, csv}`.

All IDs are UUID strings (`@default(uuid())`).

### Foreign-key behaviour

Every FK is `ON DELETE RESTRICT` **except** `patients.userId` and `appointments.bookedBy`, which are `SET NULL`. There are no cascades, so deleting a patient, doctor, user or prescription that has children fails. The app never deletes these; only medicines and lab tests can be deleted, and only while unused.

## Domain rules (enforced in code, not in the DB)

- **Phones** are stored as `+923XXXXXXXXX` (Pakistani mobile). This covers `patients.phone` and the patient's login in `users.email`, `patients.emergencyContact` and `doctors.phone`. Existing data was converted on 2026-10-29 by `scripts/normalize-phones.js`. Login also accepts the legacy `03…` form.
- **Emails** are stored lowercased and must pass the strict check in `lib/sanitize.js`. **CNIC** is stored as `12345-1234567-1`. **Blood group** is one of A±, B±, AB±, O±.
- **`users.mustChangePassword`:** set for every new patient and doctor (their password was handed over by someone else) and for accounts whose password was exposed. While it is set, the user can only use `/account/password`.

- **Codes** (`lib/codes.js`): `PT-` plus 4 digits and `RX-` plus 5 digits. The next number is `MAX(existing numeric suffix) + 1`, read inside the create transaction; `withUniqueRetry` retries if a concurrent create took the same code. Seeded prescriptions use a different format, `RX-2026-NNNNN`, which the regex ignores, so the live database has both.
- `qrCodeUrl` stores the **signed** verify path (`/verify/<code>?t=<sig>`) for prescriptions finalized after 2026-10-26. Older rows store the unsigned path.
- **Finalized prescriptions are immutable.** `updatePrescription` refuses to change them. Finalizing requires a diagnosis, and every medicine row needs a medicine, dosage and frequency. Drafts have no requirements.
- **Editing a draft** deletes and recreates its vitals, medicine rows and lab-test rows inside one transaction.
- **Patient registration** creates a `User` (role `patient`, `email = phone`, a random 8-hex-char temporary password) and a `Patient` in one transaction. Duplicate phone or CNIC is rejected.
- Medicines and lab tests can't be deleted once any prescription references them.
- **Audit actions written**:
  - `created_doctor`, `updated_doctor`, `activated_doctor`, `deactivated_doctor`
  - `registered_patient`, `updated_patient`
  - `saved_draft_prescription`, `updated_draft_prescription`, `finalized_prescription`
  - `booked_appointment`, `updated_appointment_status`, `rescheduled_appointment`
  - `created_/updated_/deleted_medicine`, `created_/updated_/deleted_lab_test`
  - `generated_report`

## Connection

- `DATABASE_URL`: pooled connection (pgbouncer), used at runtime.
- `DIRECT_URL`: direct connection, used by `prisma migrate`.
- `lib/db.js` caches the client on `globalThis` outside production to survive hot reloads.

## Migrations: read before changing the schema

- **Baselined on 2026-10-29.** The init migration was applied long ago through Supabase's own tracking, so it was marked as applied with `prisma migrate resolve --applied 20260908023517_init`. Prisma now tracks migrations normally in `_prisma_migrations`.
- Migrations so far:
  - `20260908023517_init`: the original schema (baselined);
  - `20261028120000_add_must_change_password`: adds `users.mustChangePassword` (boolean, default false).

Workflow for a schema change:

```bash
npx prisma migrate diff --from-url "$DIRECT_URL" --to-schema-datamodel prisma/schema.prisma --script  # review first
npx prisma migrate dev --name <change>      # against a dev DB, never prod
npx prisma migrate deploy                    # against prod, then: npx prisma generate
```

Don't run `prisma migrate dev`, `db push` or `migrate reset` against the live database.

## Supabase specifics

- **RLS is enabled on all 13 public tables with zero policies.** The Supabase Data API (anon or publishable key) can read nothing, which is good. Prisma connects as the database owner and bypasses RLS. If you ever use `supabase-js` against these tables, you'll need policies first.
- `auth.users` is empty because Supabase Auth isn't used. There are no storage buckets.
- Other schemas (`auth`, `storage`, `realtime`, `vault`, …) are Supabase-managed. Don't touch them.

## Indexes

- Present: PKs, the unique constraints listed above, `patients(fullName)`, `patients(phone)` and `patients(cnic)`.
- `patients_phone_idx` and `patients_cnic_idx` are **redundant** with their unique indexes.
- **No indexes on FK columns**: `prescriptions.patientId`/`doctorId`, `appointments.patientId`/`doctorId`/`scheduledAt`, `prescription_medicines.prescriptionId`, `prescription_lab_tests.prescriptionId`, `audit_logs.userId`/`createdAt`. This doesn't matter at the current size but will as data grows.

## Live database snapshot (2026-10-26)

| Table | Rows | Notes |
|---|---|---|
| users | 28 | 2 admin, 6 doctor, 3 receptionist, 17 patient; all active |
| doctors | 6 | 5 seeded + 1 created via UI; none has a picture or signature |
| receptionists | 3 | |
| patients | 17 | PT-0001…PT-0017; **all have logins** (backfill has been run) |
| prescriptions | 13 | 10 finalized, 3 draft; codes RX-2026-00001…00011 (seed) + RX-00012, RX-00013 (app) |
| vitals / rx medicines / rx lab tests | 11 / 27 / 12 | |
| medicines / lab_tests | 20 / 15 | |
| appointments | 1 | |
| audit_logs / reports | 11 / 2 | |

The live data no longer matches a fresh seed (the seed makes 15 patients without logins, 15 prescriptions, 15 appointments), so it has been edited since seeding.

## Scripts

- `prisma/seed.js` (`ALLOW_SEED_WIPE=true npx prisma db seed`): refuses without that flag or when `NODE_ENV=production`. Otherwise it **wipes all tables**, then seeds 5 doctors, 2 admins, 3 receptionists, 15 patients (no logins), 20 medicines, 15 lab tests, 15 prescriptions, 15 appointments, audit logs and reports.
- `scripts/secure-demo-accounts.js` (`node --env-file=.env scripts/secure-demo-accounts.js [--apply]`): dry run by default. Rotates seed passwords, deactivates `admin@clinic.com`, strips "Dr." from doctor names, and audit-logs the changes (`reset_password`, `deactivated_user`).
- `prisma/backfill-patient-logins.js` (`node --env-file=.env prisma/backfill-patient-logins.js`): creates a `User` for every patient with `userId = null` and prints the temporary passwords **once**, so save them. It is idempotent and skips phones that already have a user.
