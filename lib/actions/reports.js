"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-guards";
import { FieldErrors, safely } from "@/lib/action-errors";
import { REPORT_TYPES } from "@/lib/reports";
import { createReader } from "@/lib/validate";
import { revalidatePath } from "next/cache";

export async function generateReport(formData) {
  return safely(async () => {
    const session = await requireRole("admin");

    const r = createReader(formData);
    const reportType = r.oneOf("reportType", { allowed: REPORT_TYPES, label: "Report type", required: true });
    const format = r.oneOf("format", { allowed: ["pdf", "csv"], label: "Format", required: true });
    const fromDate = r.calendarDate("from", { label: "From date", notFuture: true });
    const toDate = r.calendarDate("to", { label: "To date", notFuture: true });
    const doctorId = r.uuid("doctorId", { label: "Doctor", required: false });
    if (fromDate && toDate && fromDate > toDate) r.fail("to", "The To date must be on or after the From date");
    r.done();
    if (doctorId && !(await prisma.doctor.findUnique({ where: { id: doctorId }, select: { id: true } }))) {
      throw new FieldErrors({ doctorId: "This doctor no longer exists" });
    }

    const filters = {
      ...(fromDate ? { from: fromDate.toISOString().slice(0, 10) } : {}),
      ...(toDate ? { to: toDate.toISOString().slice(0, 10) } : {}),
      ...(doctorId ? { doctorId } : {}),
    };

    const report = await prisma.$transaction(async (tx) => {
      const created = await tx.report.create({
        data: {
          reportType,
          format,
          filters: Object.keys(filters).length ? filters : null,
          fileUrl: "", // set right after, once we have the id to build the URL from
          generatedBy: session.user.id,
        },
      });
      const report = await tx.report.update({
        where: { id: created.id },
        data: { fileUrl: `/api/reports/${created.id}/download` },
      });
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "generated_report",
          entityType: "report",
          entityId: report.id,
          details: { reportType, format, filters },
        },
      });
      return report;
    }, { maxWait: 10000, timeout: 20000 });

    revalidatePath("/admin/reports");
    return { success: true, reportId: report.id, fileUrl: report.fileUrl };
  });
}
