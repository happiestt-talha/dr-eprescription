import { prisma } from "@/lib/db";
import {
  Document, Packer, Paragraph, HeadingLevel, Table, TableRow, TableCell, WidthType,
} from "docx";

function buildDateFilter(from, to) {
  const filter = {};
  if (from) filter.gte = new Date(from);
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    filter.lte = toDate;
  }
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
      });
      return {
        title: "Patients Report",
        headers: ["Patient Code", "Full Name", "Phone", "Gender", "Age", "Registered On"],
        rows: patients.map((p) => [
          p.patientCode, p.fullName, p.phone, p.gender, p.age ?? "", p.createdAt.toLocaleDateString(),
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
      });
      return {
        title: "Prescriptions Report",
        headers: ["Code", "Patient", "Doctor", "Diagnosis", "Status", "Visit Date"],
        rows: rxs.map((r) => [
          r.prescriptionCode, r.patient.fullName, `Dr. ${r.doctor.fullName}`,
          r.diagnosis || "", r.status, r.visitDate.toLocaleDateString(),
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
      });
      return {
        title: "Appointments Report",
        headers: ["Patient", "Doctor", "Scheduled At", "Status"],
        rows: appts.map((a) => [
          a.patient.fullName, `Dr. ${a.doctor.fullName}`, a.scheduledAt.toLocaleString(), a.status,
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
    const s = String(val ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) lines.push(row.map(escape).join(","));
  return lines.join("\n");
}

export async function buildReportDocxBuffer(title, headers, rows) {
  const headerRow = new TableRow({
    children: headers.map(
      (h) =>
        new TableCell({
          shading: { fill: "D9D9D9" },
          children: [new Paragraph({ text: h, bold: true })],
        })
    ),
  });

  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map((cell) => new TableCell({ children: [new Paragraph(String(cell ?? ""))] })),
      })
  );

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: `Generated ${new Date().toLocaleString()}` }),
          new Paragraph({ text: "" }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...dataRows] }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}