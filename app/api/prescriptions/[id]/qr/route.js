import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { canAccessPrescription } from "@/lib/auth-guards";
import { buildVerifyUrl } from "@/lib/verify";
import QRCode from "qrcode";

export async function GET(request, { params }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const rx = await prisma.prescription.findUnique({
    where: { id },
    include: { patient: true, doctor: true },
  });
  if (!rx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Drafts never get a verification QR: it would "verify" a prescription that can still change.
  if (rx.status !== "finalized") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccessPrescription(session, rx)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const verifyUrl = buildVerifyUrl(request.url, rx.prescriptionCode);
  const buffer = await QRCode.toBuffer(verifyUrl, { width: 200, margin: 1 });

  return new NextResponse(buffer, { headers: { "Content-Type": "image/png", "Cache-Control": "private, no-store" } });
}
