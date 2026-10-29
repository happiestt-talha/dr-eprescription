import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { fetchReportData, buildReportCsv } from "@/lib/reports";
import { renderReportPdf } from "@/lib/pdf";

export async function GET(request, { params }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title, headers, rows } = await fetchReportData(report.reportType, report.filters || {});

  if (report.format === "csv") {
    const csv = buildReportCsv(headers, rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${report.reportType}-report.csv"`,
      },
    });
  }

  const pdfBuffer = await renderReportPdf(title, headers, rows);

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "private, no-store",
      "Content-Disposition": `inline; filename="${report.reportType}-report.pdf"`,
    },
  });
}