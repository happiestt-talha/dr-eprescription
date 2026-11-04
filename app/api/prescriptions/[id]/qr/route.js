import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiRoute, jsonError } from "@/lib/api";
import { canAccessPrescription } from "@/lib/auth-guards";
import { buildVerifyUrl } from "@/lib/verify";
import QRCode from "qrcode";

export const GET = apiRoute({}, async (request, { id, session }) => {
  const rx = await prisma.prescription.findUnique({
    where: { id },
    include: { patient: true, doctor: true },
  });
  if (!rx) return jsonError("Not found", 404);

  // Drafts never get a verification QR: it would "verify" a prescription that can still change.
  if (rx.status !== "finalized") return jsonError("Not found", 404);
  if (!canAccessPrescription(session, rx)) {
    return jsonError("Not authorized", 403);
  }

  const verifyUrl = buildVerifyUrl(request.url, rx.prescriptionCode);
  const buffer = await QRCode.toBuffer(verifyUrl, { width: 200, margin: 1 });

  return new NextResponse(buffer, { headers: { "Content-Type": "image/png", "Cache-Control": "private, no-store" } });
});
