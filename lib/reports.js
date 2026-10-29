import { prisma } from "@/lib/db";
import { formatDate, formatDateTime, parseClinicDateTime, startOfClinicDay } from "@/lib/datetime";

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

export async function fetchReportData(reportType, filters = {}) {
  const { from, to, doctorId } = filters;

  switch (reportType) {
    case "patients": {
      const createdAt = buildDateFilter(from, to);
      const patients = await prisma.patient.findMany({
        where: createdAt ? { createdAt } : {},
        orderBy: { createdAt: "desc" },
        take: MAX_ROWS,
      });
      return {
        title: "Patients Report",
        headers: ["Patient Code", "Full Name", "Phone", "Gender", "Age", "Registered On"],
        rows: patients.map((p) => [
          p.patientCode, p.fullName, p.phone, p.gender, p.age ?? "", formatDate(p.createdAt),
        ]),
      };
    }

    case "prescriptions": {
      const visitDate = buildDateFilter(from, to);
      const where = { ...(visitDate ? { visitDate } : {}), ...(doctorId ? { doctorId } : {}) };
      const rxs = await prisma.prescription.findMany({
        where,
        include: { patient: true, doctor: true },
        orderBy: { visitDate: "desc" },
        take: MAX_ROWS,
      });
      return {
        title: "Prescriptions Report",
        headers: ["Code", "Patient", "Doctor", "Diagnosis", "Status", "Visit Date"],
        rows: rxs.map((r) => [
          r.prescriptionCode, r.patient.fullName, `Dr. ${r.doctor.fullName}`,
          r.diagnosis || "", r.status, formatDate(r.visitDate),
        ]),
      };
    }

    case "appointments": {
      const scheduledAt = buildDateFilter(from, to);
      const where = { ...(scheduledAt ? { scheduledAt } : {}), ...(doctorId ? { doctorId } : {}) };
      const appts = await prisma.appointment.findMany({
        where,
        include: { patient: true, doctor: true },
        orderBy: { scheduledAt: "desc" },
        take: MAX_ROWS,
      });
      return {
        title: "Appointments Report",
        headers: ["Patient", "Doctor", "Scheduled At", "Status"],
        rows: appts.map((a) => [
          a.patient.fullName, `Dr. ${a.doctor.fullName}`, formatDateTime(a.scheduledAt), a.status,
        ]),
      };
    }

    case "doctors": {
      const doctors = await prisma.doctor.findMany({
        include: { user: true },
        orderBy: { fullName: "asc" },
      });
      return {
        title: "Doctors Report",
        headers: ["Name", "Specialization", "Registration No", "Clinic", "Active"],
        rows: doctors.map((d) => [
          d.fullName, d.specialization, d.registrationNo, d.clinicName, d.user.isActive ? "Yes" : "No",
        ]),
      };
    }

    case "medicines": {
      const meds = await prisma.medicine.findMany({ orderBy: { name: "asc" } });
      return {
        title: "Medicines Report",
        headers: ["Name", "Generic Name", "Form", "Strength", "Manufacturer"],
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
