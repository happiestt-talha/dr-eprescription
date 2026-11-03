import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiRoute, jsonError } from "@/lib/api";
import { canAccessPrescription } from "@/lib/auth-guards";
import { buildVerifyUrl } from "@/lib/verify";
import { renderPrescriptionPdf } from "@/lib/pdf";

export const GET = apiRoute({}, async (request, { id, session }) => {
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
  if (!rx) return jsonError("Not found", 404);

  if (!canAccessPrescription(session, rx)) {
    return jsonError("Not authorized", 403);
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
});
