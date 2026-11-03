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
| `/admin/dashboard` | Today's figures, upcoming appointments, recent audit activity, recently added doctors, lifetime totals in one line | `lib/dashboard.js` |
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
| `/doctor/dashboard` | Today's appointment queue (start a prescription from a row), open drafts, recent prescriptions, one line of counts | `lib/dashboard.js` |
| `/doctor/patients?q=` | Search patients by name, phone, CNIC or code (max 25) | `PatientSearchBar` |
| `/doctor/patients/new` | Register a patient; shows temporary credentials | `PatientForm` → `createPatient` |
| `/doctor/patients/[id]` | Profile details (allergies highlighted) and prescription history on one page (other doctors' prescriptions are summary-only) | |
| `/doctor/patients/[id]/edit` | Edit a patient | `PatientForm` → `updatePatient` |
| `/doctor/prescriptions/new?patientId=` | Write a prescription (vitals, symptoms, diagnosis, medicine rows, lab-test rows, advice) | `PrescriptionForm` → `createPrescription` |
| `/doctor/prescriptions/[id]` | View your own prescription as one document (drafts show a Draft band and an Edit button, no QR); print, PDF, QR; others' 404 | `PrescriptionView`, `PrintButton` |
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
   - **Duplicates are caught while typing.** The form starts with phone and CNIC; once either is complete, `checkPatientUnique` (`lib/actions/lookup.js`) looks it up. If the patient exists, the form shows who it is and the next step instead of letting staff fill in the rest: a receptionist gets **Book appointment**, a doctor **Start prescription**, and both **Open profile**. Submit is disabled. On the edit form, a number belonging to another patient shows "belongs to …" with a link. A number used by a non-patient login shows a generic warning.
   - **Doctors** (admin): email and PMDC no. are checked the same way (`checkDoctorUnique`). An existing doctor links to their page, and a deactivated one says to reactivate it instead of creating a second account.
2. **Appointment**: a receptionist opens a patient, books with a doctor and date/time (status `pending`), then moves it to `confirmed`, `completed` or `cancelled`, or reschedules (changing the doctor or time). Appointments are not linked to prescriptions. The booking page lists the patient's upcoming pending/confirmed appointments first, so a duplicate booking is a conscious choice.
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
