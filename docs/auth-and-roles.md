# Authentication & roles

## Login (`auth.js`)

- **The login page has two tabs** (`app/(auth)/login/page.js`):
  - **Staff:** an email field that only accepts email characters, is lowercased, and allows one `@`. Digits-only or malformed emails are refused before submitting.
  - **Patient:** a mobile field that only accepts digits (formatted as `0300-1234567`).
  - The last-used tab is remembered per device.
- **Both tabs submit the canonical identifier** (a lowercased email, or `+923…`). `auth.js` normalises again with `normalizeLoginId` (`lib/normalize.js`), and also tries the legacy `03…` form of a phone.
- **`authorize()`** looks up the user, compares against a dummy hash when the user is missing (constant time), rejects inactive accounts, and is rate-limited: 5 failures per 15 min per identifier and per IP.
- **The session is a JWT** (12 h) carrying `id`, `role` and `mustChangePassword`. It re-checks `isActive`, the role and `mustChangePassword` from the DB every 5 minutes, and immediately on `update()`.
- **Forced password change.** When `mustChangePassword` is set:
  - `proxy.js` redirects every page to `/account/password`;
  - API routes return 403;
  - `requireRole` refuses every server action except `changePassword` (`lib/actions/account.js`).
- **Changing a password** requires the current password (rate-limited). The new one must be at least 10 characters, different from the current one, and not contain the email or phone. Changing it clears the flag and is audited as `changed_password`. Anyone can change their password from the account menu.
- **Resets by staff** (`lib/actions/account.js`, `components/account/reset-password-button.js`). There's no self-service reset, because there's no email or SMS provider to send links:
  - **Patients:** reception, doctors or admins click "Reset password" on the patient profile.
  - **Doctors:** an admin clicks "Reset password" on the edit-doctor page.
  - **What a reset does:**
    - generates a 10-character temporary password (`lib/passwords.js`), shown **once** with copy buttons;
    - sets `mustChangePassword`, so existing sessions are pushed to the change page within 5 minutes and the old password stops working immediately;
    - audits `reset_password`.
  - **Limits:** staff can't reset their own password (they use Change password instead), and receptionist and admin accounts have no reset UI.

On the server, read the session with `const session = await auth()` (from `@/auth`); in client components, use `useSession()`, available via `components/providers.js`.

## Route protection

| Layer | What it does |
|---|---|
| `proxy.js` | Public: `/`, `/login`, `/verify/*`. Otherwise it requires a session. While `mustChangePassword` is set, every page redirects to `/account/password` and `/api/*` (except `/api/auth`) returns 403. `/account/*` is open to every role; any other path must start with the role prefix, or it redirects to the role home |
| `app/<role>/layout.js` | `await auth()`; redirects to `/login` when the session is missing or the role is wrong |
| Pages | Trust the layout for the role. Doctor pages scope by ownership via `getCurrentDoctor()` (`lib/auth-guards.js`); the patient prescription page checks `rx.patient.userId` |
| Server actions | Each starts with `requireRole(...)` from `lib/auth-guards.js`, which re-checks `users.isActive` and `mustChangePassword` in the database |
| API routes | Check `auth()` themselves, plus `canAccessPrescription()` for the prescription PDF and QR routes |

Role homes: admin → `/admin/dashboard`, doctor → `/doctor/dashboard`, receptionist → `/receptionist/appointments`, patient → `/patient/prescriptions`.

## Permission matrix (server actions)

| Action (file) | Guard | Extra checks |
|---|---|---|
| `createDoctor`, `updateDoctor`, `toggleDoctorActive` (`doctors.js`) | `requireRole("admin")` | email and registration no. unique; "Dr." title stripped from the name |
| `create/update/deleteMedicine`, `…LabTest` | `requireRole("admin")` | delete blocked if in use |
| `generateReport` (`reports.js`) | `requireRole("admin")` | |
| `createPatient`, `updatePatient` (`patients.js`) | `requireRole("doctor", "receptionist", "admin")` | phone and CNIC unique |
| `createAppointment`, `updateAppointmentStatus`, `rescheduleAppointment` | `requireRole("receptionist", "admin")` | status must be a valid enum value |
| `createPrescription`, `updatePrescription` | `requireRole("doctor")` + a Doctor row | update: must own the prescription, which must still be a draft |
| `changePassword` (`account.js`) | any signed-in role (allowed while a change is pending) | current password required, rate-limited |
| `resetPatientPassword` (`account.js`) | `requireRole("receptionist", "doctor", "admin")` | patient must have a login; not your own account |
| `resetDoctorPassword` (`account.js`) | `requireRole("admin")` | target must be a doctor |

| Route | Access |
|---|---|
| `GET /api/prescriptions/[id]/pdf` and `/qr` | admin, the owning doctor, or the owning patient (`canAccessPrescription`) |
| `GET /api/reports/[id]/download` | admin |
| `/verify/[code]?t=<sig>` page | **anyone**. With a valid signature (from the QR code), it shows patient initials, doctor, date. Without one, it shows only that a finalized prescription exists, with doctor and date |

### Data visibility for doctors

- A doctor can search and open **any** patient (single-clinic model), so they can start a visit.
- In a patient's history, **other doctors'** prescriptions show only the date, doctor and status (no diagnosis, no link), and other doctors' drafts are hidden.
- `/doctor/prescriptions/[id]` and `/edit` return 404 for prescriptions the doctor doesn't own.

### Verification signatures (`lib/verify.js`)

The `t` parameter is the first 16 characters of `base64url(HMAC-SHA256(AUTH_SECRET, prescriptionCode))`, compared in constant time. **Rotating `AUTH_SECRET` invalidates every printed QR signature**: those prescriptions still verify, but in the reduced, unsigned view. Prescriptions printed before signing existed (10 in the live database) also show the unsigned view.

Admins can't reach the doctor, receptionist or patient portals, because `proxy.js` redirects them by prefix, even though several actions allow admin.

## Account lifecycle

- **Doctors**: an admin creates the user and doctor profile together with a chosen password. Deactivating sets `users.isActive = false`, which blocks new logins and every server action immediately (via `requireRole`). Open sessions end within 5 minutes, when the JWT re-checks the account.
- **Patients**: staff register them. `createPatient` returns `{ credentials: { username: phone, tempPassword } }`, the form shows it **once**, and staff hand it to the patient. It is not stored in plaintext anywhere, and the patient must replace it at first sign-in.
- **Receptionists and admins**: no UI. Create them via seed or SQL (bcrypt hash, cost 10).
