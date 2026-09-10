import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import QRCode from "qrcode";

export async function GET(request, { params }) {
  const { id } = await params;
  const rx = await prisma.prescription.findUnique({ where: { id } });
  if (!rx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const baseUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin;
  const verifyUrl = `${baseUrl}/verify/${rx.prescriptionCode}`;

  const buffer = await QRCode.toBuffer(verifyUrl, { width: 200, margin: 1 });

  return new NextResponse(buffer, { headers: { "Content-Type": "image/png" } });
}