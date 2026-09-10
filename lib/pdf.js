import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, AlignmentType,
} from "docx";
import QRCode from "qrcode";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function buildPrescriptionDocxBuffer(rx, verifyUrl) {
  const qrBuffer = await QRCode.toBuffer(verifyUrl, { width: 150, margin: 1 });

  const children = [];

  children.push(new Paragraph({ text: rx.doctor.clinicName || "Clinic", heading: HeadingLevel.HEADING_1 }));
  children.push(new Paragraph({ text: `Dr. ${rx.doctor.fullName}, ${rx.doctor.qualification}` }));
  children.push(new Paragraph({ text: rx.doctor.specialization }));
  children.push(new Paragraph({ text: `Reg. No: ${rx.doctor.registrationNo}` }));
  children.push(new Paragraph({ text: "" }));

  children.push(new Paragraph({
    children: [new TextRun({ text: `Patient: ${rx.patient.fullName} (${rx.patient.patientCode})`, bold: true })],
  }));
  children.push(new Paragraph({ text: `Date: ${rx.visitDate.toLocaleDateString()}` }));
  children.push(new Paragraph({ text: `Prescription Code: ${rx.prescriptionCode}` }));
  children.push(new Paragraph({ text: "" }));

  if (rx.vitals) {
    const v = rx.vitals;
    const parts = [
      v.bloodPressure && `BP: ${v.bloodPressure}`,
      v.temperatureF && `Temp: ${v.temperatureF}°F`,
      v.pulseRate && `Pulse: ${v.pulseRate}`,
      v.spo2 && `SpO2: ${v.spo2}%`,
      v.heightCm && `Height: ${v.heightCm}cm`,
      v.weightKg && `Weight: ${v.weightKg}kg`,
    ].filter(Boolean);
    if (parts.length) children.push(new Paragraph({ text: parts.join("   |   ") }));
  }

  if (rx.symptoms) {
    children.push(new Paragraph({
      children: [new TextRun({ text: "Symptoms: ", bold: true }), new TextRun(rx.symptoms)],
    }));
  }
  if (rx.diagnosis) {
    children.push(new Paragraph({
      children: [new TextRun({ text: "Diagnosis: ", bold: true }), new TextRun(rx.diagnosis)],
    }));
  }

  if (rx.medicines.length) {
    children.push(new Paragraph({ text: "" }));
    children.push(new Paragraph({ text: "Medicines", heading: HeadingLevel.HEADING_2 }));
    rx.medicines.forEach((pm, i) => {
      const note = pm.instructions ? ` (${pm.instructions})` : "";
      children.push(new Paragraph({
        text: `${i + 1}. ${pm.medicine.name} — ${pm.dosage}, ${pm.frequency}, ${pm.duration}${note}`,
      }));
    });
  }

  if (rx.labTests.length) {
    children.push(new Paragraph({ text: "" }));
    children.push(new Paragraph({ text: "Laboratory Tests", heading: HeadingLevel.HEADING_2 }));
    rx.labTests.forEach((plt, i) => {
      const note = plt.instructions ? ` (${plt.instructions})` : "";
      children.push(new Paragraph({ text: `${i + 1}. ${plt.labTest.name}${note}` }));
    });
  }

  if (rx.advice) {
    children.push(new Paragraph({ text: "" }));
    children.push(new Paragraph({ text: "Advice", heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: rx.advice }));
  }

  children.push(new Paragraph({ text: "" }));
  children.push(new Paragraph({
    alignment: AlignmentType.LEFT,
    children: [new ImageRun({ data: qrBuffer, transformation: { width: 100, height: 100 } })],
  }));
  children.push(new Paragraph({ text: "Scan to verify this prescription" }));

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

export async function convertDocxBufferToPdf(docxBuffer) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "rx-"));
  const docxPath = path.join(tmpDir, "prescription.docx");
  await fs.writeFile(docxPath, docxBuffer);

  const soffice = process.env.LIBREOFFICE_PATH || "soffice";
  await execAsync(`"${soffice}" --headless --convert-to pdf --outdir "${tmpDir}" "${docxPath}"`);

  const pdfPath = path.join(tmpDir, "prescription.pdf");
  const pdfBuffer = await fs.readFile(pdfPath);

  await fs.rm(tmpDir, { recursive: true, force: true });
  return pdfBuffer;
}