import { prisma } from "@/lib/db";
import { statusLabel } from "@/components/ui/status-badge";
import { formatAge, formatDate, formatDateTime, parseClinicDateTime, startOfClinicDay } from "@/lib/datetime";

export const REPORT_TYPES = ["patients", "prescriptions", "appointments", "doctors", "medicines"];

// Safety cap so one report can't pull an unbounded table into memory.
const MAX_ROWS = 5000;

// "from"/"to" are clinic calendar days ("YYYY-MM-DD"); the range covers the
// whole "to" day in the clinic's timezone, whatever the server's timezone is.
function buildDateFilter(from, to) {
  const filter = {};
  const start = from && parseClinicDateTime(from);
  const end = to && parseClinicDateTime(to);
  if (start) filter.gte = start;
  if (end) filter.lt = startOfClinicDay(end, 1);
  return Object.keys(filter).length ? filter : undefined;
}

/** Report data; when the row cap is reached the title says so, instead of truncating silently. */
export async function fetchReportData(reportType, filters = {}) {
  const data = await fetchRawReportData(reportType, filters);
  if (data.rows.length >= MAX_ROWS) data.title = `${data.title} (first ${MAX_ROWS.toLocaleString("en-GB")} rows: narrow the date range for the rest)`;
  return data;
}

async function fetchRawReportData(reportType, filters = {}) {
  const { from, to, doctorId } = filters;

  switch (reportType) {
    case "patients": {
      const createdAt = buildDateFilter(from, to);
      const patients = await prisma.patient.findMany({
        where: createdAt ? { createdAt } : {},
        select: { patientCode: true, fullName: true, phone: true, gender: true, age: true, dateOfBirth: true, dobEstimated: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: MAX_ROWS,
      });
      return {
        title: "Patients report",
        headers: ["Patient code", "Full name", "Phone", "Gender", "Age", "Registered on"],
        rows: patients.map((p) => [
          p.patientCode, p.fullName, p.phone, p.gender, formatAge(p).replace("—", ""), formatDate(p.createdAt),
        ]),
      };
    }

    case "prescriptions": {
      const visitDate = buildDateFilter(from, to);
      const where = { ...(visitDate ? { visitDate } : {}), ...(doctorId ? { doctorId } : {}) };
      const rxs = await prisma.prescription.findMany({
        where,
        select: { prescriptionCode: true, diagnosis: true, status: true, visitDate: true, patient: { select: { fullName: true } }, doctor: { select: { fullName: true } } },
        orderBy: { visitDate: "desc" },
        take: MAX_ROWS,
      });
      return {
        title: "Prescriptions report",
        headers: ["Prescription code", "Patient", "Doctor", "Diagnosis", "Status", "Visit date"],
        rows: rxs.map((r) => [
          r.prescriptionCode, r.patient.fullName, `Dr. ${r.doctor.fullName}`,
          r.diagnosis || "", statusLabel(r.status), formatDate(r.visitDate),
        ]),
      };
    }

    case "appointments": {
      const scheduledAt = buildDateFilter(from, to);
      const where = { ...(scheduledAt ? { scheduledAt } : {}), ...(doctorId ? { doctorId } : {}) };
      const appts = await prisma.appointment.findMany({
        where,
        select: { scheduledAt: true, status: true, patient: { select: { fullName: true } }, doctor: { select: { fullName: true } } },
        orderBy: { scheduledAt: "desc" },
        take: MAX_ROWS,
      });
      return {
        title: "Appointments report",
        headers: ["Patient", "Doctor", "Scheduled for", "Status"],
        rows: appts.map((a) => [
          a.patient.fullName, `Dr. ${a.doctor.fullName}`, formatDateTime(a.scheduledAt), statusLabel(a.status),
        ]),
      };
    }

    case "doctors": {
      const doctors = await prisma.doctor.findMany({
        // Only what the report prints; never the user row (passwordHash).
        select: { fullName: true, specialization: true, registrationNo: true, clinicName: true, user: { select: { isActive: true } } },
        orderBy: { fullName: "asc" },
      });
      return {
        title: "Doctors report",
        headers: ["Name", "Specialisation", "PMDC registration number", "Clinic", "Active"],
        rows: doctors.map((d) => [
          d.fullName, d.specialization, d.registrationNo, d.clinicName, d.user.isActive ? "Yes" : "No",
        ]),
      };
    }

    case "medicines": {
      const meds = await prisma.medicine.findMany({ orderBy: { name: "asc" } });
      return {
        title: "Medicines report",
        headers: ["Name", "Generic name", "Form", "Strength", "Manufacturer"],
        rows: meds.map((m) => [
          m.name, m.genericName || "", m.dosageForm || "", m.strength || "", m.manufacturer || "",
        ]),
      };
    }

    default:
      throw new Error(`Unknown report type: ${reportType}`);
  }
}

export function buildReportCsv(headers, rows) {
  const escape = (val) => {
    let s = String(val ?? "");
    // Spreadsheet apps execute cells starting with these as formulas
    // (CSV injection), e.g. a patient named =HYPERLINK(...). Neutralise them.
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) lines.push(row.map(escape).join(","));
  // BOM so Excel opens the file as UTF-8 (Urdu names would otherwise garble).
  return "\uFEFF" + lines.join("\r\n");
}
