import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiRoute, jsonError } from "@/lib/api";
import { fetchReportData, buildReportCsv } from "@/lib/reports";
import { renderReportPdf } from "@/lib/pdf";

export const GET = apiRoute({ roles: ["admin"] }, async (request, { id }) => {
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) return jsonError("Not found", 404);

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
});
