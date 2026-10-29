import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { canAccessPrescription } from "@/lib/auth-guards";
import { buildVerifyUrl } from "@/lib/verify";
import { renderPrescriptionPdf } from "@/lib/pdf";

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

  if (!canAccessPrescription(session, rx)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const verifyUrl = buildVerifyUrl(request.url, rx.prescriptionCode);

  const pdfBuffer = await renderPrescriptionPdf(rx, verifyUrl);

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "private, no-store",
      "Content-Disposition": `inline; filename="${rx.prescriptionCode}.pdf"`,
    },
  });
}