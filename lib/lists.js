import { prisma } from "@/lib/db";
import { formatAge, formatCalendarDate, formatDate, formatDateTime, toClinicInputValue, startOfClinicDay } from "@/lib/datetime";
import { formatPhoneDisplay } from "@/lib/sanitize";

// Loaders for every list in the app. Each returns plain display rows (strings
// only, formatted here on the server) plus a `searchText` per row, for
// components/ui/data-list.jsx to search, filter and paginate in the browser.
//
// Rules:
// - `select` only what is displayed; never `include: true` (privacy and size).
// - Small lists (up to LIST_CAP rows) are sent whole, so search, filters and
//   paging are instant in the browser. Bigger ones are served one page at a
//   time (`server` describes the page) and searched on the database instead.
//   Either way nothing is silently truncated.
// - Only fields the page shows may go into `searchText` (or the DB search).

/** Most rows a list sends to the browser at once (about 100 KB of lean rows). */
export const LIST_CAP = 500;
export const SERVER_PAGE_SIZE = 25;

const join = (...parts) => parts.filter(Boolean).join(" ");
const contains = (value) => ({ contains: value, mode: "insensitive" });

/**
 * Whole list when it's small, one server page otherwise.
 * `search(q)` returns the Prisma `OR` conditions for a server-side search.
 * Returns { rows, total, server } where `server` is null in the normal case.
 */
async function loadList(model, { where = {}, select, orderBy, search, q = "", page = 1 }) {
  const total = await model.count({ where });
  if (total <= LIST_CAP) {
    const rows = await model.findMany({ where, select, orderBy });
    return { rows, total, server: null };
  }
  const query = String(q || "").trim().slice(0, 100);
  const searchWhere = query && search ? { AND: [where, { OR: search(query) }] } : where;
  const matching = query ? await model.count({ where: searchWhere }) : total;
  const lastPage = Math.max(1, Math.ceil(matching / SERVER_PAGE_SIZE));
  const current = Math.min(Math.max(1, Math.floor(Number(page)) || 1), lastPage);
  const rows = await model.findMany({ where: searchWhere, select, orderBy, take: SERVER_PAGE_SIZE, skip: (current - 1) * SERVER_PAGE_SIZE });
  return { rows, total, server: { total: matching, page: current, pageSize: SERVER_PAGE_SIZE, query } };
}

// ---------- Patients ----------

const PATIENT_SELECT = { id: true, fullName: true, patientCode: true, phone: true, cnic: true, gender: true, age: true, dateOfBirth: true, dobEstimated: true };

function patientRow(p) {
  const phone = formatPhoneDisplay(p.phone);
  return {
    id: p.id,
    fullName: p.fullName,
    patientCode: p.patientCode,
    phone,
    cnic: p.cnic || "",
    gender: p.gender,
    ageLabel: formatAge(p, { short: true }),
    searchText: join(p.fullName, p.patientCode, phone, p.phone, p.cnic),
  };
}

/** The patient directory, A–Z (server search: name, phone, CNIC, code). */
export async function patientRows({ q = "", page = 1 } = {}) {
  const { rows, total, server } = await loadList(prisma.patient, {
    select: PATIENT_SELECT,
    orderBy: [{ fullName: "asc" }, { patientCode: "asc" }],
    q,
    page,
    search: (query) => {
      const digits = query.replace(/\D/g, "").replace(/^(0092|92|0)(?=3)/, "");
      return [
        { fullName: contains(query) },
        { patientCode: contains(query) },
        { cnic: { contains: query } },
        ...(digits.length >= 4 ? [{ phone: { contains: digits } }] : []),
      ];
    },
  });
  return { rows: rows.map(patientRow), total, server };
}

// ---------- Doctors ----------

export async function doctorRows({ q, page } = {}) {
  const { rows, total, server } = await loadList(prisma.doctor, {
    q,
    page,
    search: (query) => [{ fullName: contains(query) }, { specialization: contains(query) }, { registrationNo: contains(query) }, { clinicName: contains(query) }, { user: { email: contains(query) } }],
    select: {
      id: true,
      fullName: true,
      specialization: true,
      registrationNo: true,
      phone: true,
      clinicName: true,
      user: { select: { email: true, isActive: true } },
    },
    orderBy: { fullName: "asc" },
  });
  return {
    total,
    server,
    rows: rows.map((d) => ({
      id: d.id,
      fullName: d.fullName,
      specialization: d.specialization || "",
      registrationNo: d.registrationNo,
      phone: d.phone ? formatPhoneDisplay(d.phone) : "",
      clinicName: d.clinicName || "",
      email: d.user.email,
      isActive: d.user.isActive,
      status: d.user.isActive ? "active" : "inactive",
      searchText: join(d.fullName, d.specialization, d.registrationNo, d.clinicName, d.user.email, d.phone),
    })),
  };
}

/** Doctors for pickers (booking, reschedule, report filter): id + label only. */
export async function doctorPickerItems({ activeOnly = true } = {}) {
  const doctors = await prisma.doctor.findMany({
    where: activeOnly ? { user: { isActive: true } } : {},
    select: { id: true, fullName: true, specialization: true },
    orderBy: { fullName: "asc" },
  });
  return doctors.map((d) => ({ value: d.id, label: `Dr. ${d.fullName}`, detail: d.specialization || "" }));
}

// ---------- Catalogs ----------

export async function medicineRows({ q, page } = {}) {
  const { rows, total, server } = await loadList(prisma.medicine, {
    q,
    page,
    search: (query) => [{ name: contains(query) }, { genericName: contains(query) }, { strength: contains(query) }, { manufacturer: contains(query) }, { dosageForm: contains(query) }],
    select: { id: true, name: true, genericName: true, dosageForm: true, strength: true, manufacturer: true },
    orderBy: { name: "asc" },
  });
  return { total, server, rows: rows.map((m) => ({ ...m, searchText: join(m.name, m.genericName, m.dosageForm, m.strength, m.manufacturer) })) };
}

export async function labTestRows({ q, page } = {}) {
  const { rows, total, server } = await loadList(prisma.labTest, {
    q,
    page,
    search: (query) => [{ name: contains(query) }, { category: contains(query) }, { normalRange: contains(query) }],
    select: { id: true, name: true, category: true, normalRange: true },
    orderBy: { name: "asc" },
  });
  return { total, server, rows: rows.map((t) => ({ ...t, searchText: join(t.name, t.category, t.normalRange) })) };
}

// ---------- Prescriptions ----------

const RX_LIST_SELECT = {
  id: true,
  prescriptionCode: true,
  status: true,
  visitDate: true,
  createdAt: true,
  diagnosis: true,
  doctorId: true,
  doctor: { select: { fullName: true } },
  patient: { select: { fullName: true, patientCode: true } },
};

/** The signed-in doctor's drafts, newest first. */
export async function draftRows(doctorId, { q, page } = {}) {
  const { rows, total, server } = await loadList(prisma.prescription, {
    q,
    page,
    search: (query) => [{ prescriptionCode: contains(query) }, { diagnosis: contains(query) }, { patient: { fullName: contains(query) } }, { patient: { patientCode: contains(query) } }],
    where: { doctorId, status: "draft" },
    select: RX_LIST_SELECT,
    orderBy: { createdAt: "desc" },
  });
  return {
    total,
    server,
    rows: rows.map((rx) => ({
      id: rx.id,
      patientName: rx.patient.fullName,
      patientCode: rx.patient.patientCode,
      prescriptionCode: rx.prescriptionCode || "",
      started: formatDate(rx.createdAt),
      diagnosis: rx.diagnosis || "",
      searchText: join(rx.patient.fullName, rx.patient.patientCode, rx.prescriptionCode, rx.diagnosis, formatDate(rx.createdAt)),
    })),
  };
}

/**
 * A patient's prescription history.
 * - viewer "doctor": own prescriptions (any status) and other doctors'
 *   finalized ones; other doctors' diagnoses are never sent.
 * - viewer "receptionist": finalized prescriptions only, no diagnoses.
 * - viewer "patient": finalized only, with diagnoses (their own record).
 */
export async function historyRows(patientId, { viewer, doctorId, q, page } = {}) {
  const where =
    viewer === "doctor"
      ? { patientId, OR: [{ doctorId }, { status: "finalized" }] }
      : { patientId, status: "finalized" };
  const { rows, total, server } = await loadList(prisma.prescription, {
    q,
    page,
    // Diagnoses are searchable only where they're shown (own / patient's own).
    search: (query) => [
      { prescriptionCode: contains(query) },
      { doctor: { fullName: contains(query) } },
      ...(viewer === "patient" ? [{ diagnosis: contains(query) }] : viewer === "doctor" ? [{ doctorId, diagnosis: contains(query) }] : []),
    ],
    where,
    select: RX_LIST_SELECT,
    orderBy: { visitDate: "desc" },
  });
  return {
    total,
    server,
    rows: rows.map((rx) => {
      const mine = viewer === "doctor" && rx.doctorId === doctorId;
      const showDiagnosis = mine || viewer === "patient";
      return {
        id: rx.id,
        prescriptionCode: rx.prescriptionCode || "",
        status: rx.status,
        date: formatDate(rx.visitDate),
        doctorName: `Dr. ${rx.doctor.fullName}`,
        diagnosis: showDiagnosis ? rx.diagnosis || "" : "",
        mine,
        owner: mine ? "mine" : "others",
        searchText: join(rx.prescriptionCode, rx.doctor.fullName, rx.status, formatDate(rx.visitDate), showDiagnosis ? rx.diagnosis : ""),
      };
    }),
  };
}

// ---------- Appointments ----------

/** Upcoming (today onwards, soonest first) or past (most recent first). */
export async function appointmentRows({ past = false, q, page } = {}) {
  const today = startOfClinicDay();
  const { rows, total, server } = await loadList(prisma.appointment, {
    q,
    page,
    search: (query) => [{ patient: { fullName: contains(query) } }, { patient: { patientCode: contains(query) } }, { doctor: { fullName: contains(query) } }],
    where: { scheduledAt: past ? { lt: today } : { gte: today } },
    select: {
      id: true,
      status: true,
      scheduledAt: true,
      patientId: true,
      doctorId: true,
      patient: { select: { fullName: true, patientCode: true } },
      doctor: { select: { fullName: true } },
    },
    orderBy: { scheduledAt: past ? "desc" : "asc" },
  });
  return {
    total,
    server,
    rows: rows.map((a) => {
      const when = formatDateTime(a.scheduledAt);
      return {
        id: a.id,
        status: a.status,
        when,
        // Exactly what AppointmentActions needs, nothing more.
        action: { id: a.id, status: a.status, doctorId: a.doctorId, scheduledAtInput: toClinicInputValue(a.scheduledAt) },
        patientId: a.patientId,
        patientName: a.patient.fullName,
        patientCode: a.patient.patientCode,
        doctorId: a.doctorId,
        doctorName: `Dr. ${a.doctor.fullName}`,
        searchText: join(a.patient.fullName, a.patient.patientCode, a.doctor.fullName, a.status, when),
      };
    }),
  };
}

// ---------- Reports ----------

export async function reportRows({ q, page } = {}) {
  const { rows, total, server } = await loadList(prisma.report, {
    q,
    page,
    search: (query) => [{ reportType: contains(query) }, { format: contains(query) }],
    select: { id: true, reportType: true, format: true, generatedAt: true, fileUrl: true, filters: true },
    orderBy: { generatedAt: "desc" },
  });
  return {
    total,
    server,
    rows: rows.map((r) => {
      const f = r.filters || {};
      const range = f.from || f.to ? `${f.from ? formatCalendarDate(`${f.from}T00:00:00Z`) : "start"} – ${f.to ? formatCalendarDate(`${f.to}T00:00:00Z`) : "today"}` : "All dates";
      return {
        id: r.id,
        reportType: r.reportType,
        format: r.format,
        generated: formatDateTime(r.generatedAt),
        range,
        fileUrl: r.fileUrl,
        searchText: join(r.reportType, r.format, formatDateTime(r.generatedAt), range),
      };
    }),
  };
}

// ---------- Prescription form ----------

/** The medicine and lab-test pickers: only what the form shows and searches. */
export async function prescriptionCatalogs() {
  const [medicines, labTests] = await Promise.all([
    prisma.medicine.findMany({
      select: { id: true, name: true, genericName: true, dosageForm: true, strength: true, manufacturer: true },
      orderBy: { name: "asc" },
    }),
    prisma.labTest.findMany({ select: { id: true, name: true, category: true }, orderBy: { name: "asc" } }),
  ]);
  return { medicines, labTests };
}

export const PATIENT_HEADER_SELECT = { id: true, fullName: true, patientCode: true, gender: true, dateOfBirth: true, dobEstimated: true, age: true };
