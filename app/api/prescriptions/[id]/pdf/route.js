import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { buildPrescriptionDocxBuffer, convertDocxBufferToPdf } from "@/lib/pdf";

export async function GET(request, { params }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const rx = await prisma.prescription.findUnique({
    where: { id },
    include: {
      patient: true,
      doctor: true,
      vitals: true,
      medicines: { include: { medicine: true } },
      labTests: { include: { labTest: true } },
    },
  });
  if (!rx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed =
    session.user.role === "admin" ||
    (session.user.role === "doctor" && rx.doctor.userId === session.user.id) ||
    (session.user.role === "patient" && rx.patient.userId === session.user.id);

  if (!allowed) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const baseUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin;
  const verifyUrl = `${baseUrl}/verify/${rx.prescriptionCode}`;

  const docxBuffer = await buildPrescriptionDocxBuffer(rx, verifyUrl);
  const pdfBuffer = await convertDocxBufferToPdf(docxBuffer);

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${rx.prescriptionCode}.pdf"`,
    },
  });
}