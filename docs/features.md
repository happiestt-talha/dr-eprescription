# Features & routes

All pages are server components that query Prisma directly, unless marked *(client)*. Mutations are the server actions listed in [auth-and-roles.md](auth-and-roles.md).

## Public

| URL | Purpose |
|---|---|
| `/` | Redirects to the role home, or to `/login` |
| `/login` *(client)* | Credentials form (email for staff, phone for patients) |
| `/verify/[code]?t=` | Verifies a finalized prescription. A signed QR link shows patient initials, doctor and date; an unsigned one shows doctor and date only |

## Admin (`/admin`)

| URL | What it does | Components / actions |
|---|---|---|
| `/admin/dashboard` | 8 global count cards | |
| `/admin/doctors` | List of doctors with an active/inactive switch | `DoctorStatusToggle` → `toggleDoctorActive` |
| `/admin/doctors/new` | Create a doctor (user + profile) | `DoctorForm` → `createDoctor` |
| `/admin/doctors/[id]` | Edit a doctor profile (email is read-only) | `DoctorForm` → `updateDoctor` |
| `/admin/medicines` | Catalog CRUD in dialogs | `MedicinesTable` |
| `/admin/lab-tests` | Catalog CRUD in dialogs | `LabTestsTable` |
| `/admin/reports` | Generate a report, list the last 30 | `ReportGeneratorForm` → `generateReport` |
| `/admin/audit-logs` | Paginated (30 per page), filter by `?entityType=` and `?action=` | `AuditLogTable` |

## Doctor (`/doctor`)

| URL | What it does | Components / actions |
|---|---|---|
| `/doctor/dashboard` | Personal stats (patients seen, appointments, prescriptions, drafts) | |
| `/doctor/patients?q=` | Search patients by name, phone, CNIC or code (max 25) | `PatientSearchBar` |
| `/doctor/patients/new` | Register a patient; shows temporary credentials | `PatientForm` → `createPatient` |
| `/doctor/patients/[id]` | Profile and prescription history tabs (other doctors' prescriptions are summary-only) | `PatientProfileTabs` |
| `/doctor/patients/[id]/edit` | Edit a patient | `PatientForm` → `updatePatient` |
| `/doctor/prescriptions/new?patientId=` | Write a prescription (vitals, symptoms, diagnosis, medicine rows, lab-test rows, advice) | `PrescriptionForm` → `createPrescription` |
| `/doctor/prescriptions/[id]` | View your own finalized prescription: tabs, print, PDF, QR (drafts redirect to edit; others' 404) | `PrescriptionViewTabs`, `PrintButton` |
| `/doctor/prescriptions/[id]/edit` | Edit a draft (finalized ones redirect to the view) | `PrescriptionForm` → `updatePrescription` |
| `/doctor/drafts` | The doctor's own drafts | |

## Receptionist (`/receptionist`)

| URL | What it does | Components / actions |
|---|---|---|
| `/receptionist/appointments` | Upcoming tab (soonest first) and Past tab (`?view=past`, newest first), 100 each; change status or reschedule inline | `AppointmentActions` |
| `/receptionist/appointments/new?patientId=` | Book an appointment for a patient | `AppointmentForm` → `createAppointment` |
| `/receptionist/patients?q=` | Patient search | `PatientSearchBar` |
| `/receptionist/patients/new` | Register a patient | `PatientForm` → `createPatient` |
| `/receptionist/patients/[id]` | Profile and last 10 visits | |
| `/receptionist/patients/[id]/edit` | Edit a patient | `PatientForm` → `updatePatient` |

## Patient (`/patient`)

| URL | What it does |
|---|---|
| `/patient/prescriptions` | The patient's own **finalized** prescriptions |
| `/patient/prescriptions/[id]` | Prescription detail with PDF and QR (ownership checked) |

## Core workflows

1. **New patient**: a receptionist or doctor fills `PatientForm`. `createPatient` creates the user and patient, and the screen shows `username = phone` and the temporary password. Staff hand these over.
2. **Appointment**: a receptionist opens a patient, books with a doctor and date/time (status `pending`), then moves it to `confirmed`, `completed` or `cancelled`, or reschedules (changing the doctor or time). Appointments are not linked to prescriptions.
3. **Prescription**: the doctor opens a patient and starts a new prescription.
   - **Save draft**: no validation. The draft appears under `/doctor/drafts` and can be edited later.
   - **Finalize**: requires a diagnosis and complete medicine rows. Sets `qrCodeUrl` and `pdfUrl`, and from then on the prescription is **read-only**.
   - When finalized, the doctor and the patient can download the PDF (`/api/prescriptions/[id]/pdf`). Its QR code links to `/verify/<code>`, which anyone (e.g. a pharmacy) can open.
4. **Catalog**: an admin maintains medicines and lab tests, which the prescription form picks from. Items already used in a prescription can't be deleted.
5. **Reports**: an admin picks a type, a format (PDF/CSV), a date range and optionally a doctor. A `Report` row is saved, and the download link regenerates the file from current data each time.
6. **Audit**: every mutation is logged; an admin browses `/admin/audit-logs`.

## Not implemented

- Doctor profile picture and signature upload (the fields exist in the database).
- Receptionist and admin management UI.
- Password reset or change.
- Patient-facing appointments.
- Clinic or tenant scoping.
- Notifications (SMS/email).
- Tests.
