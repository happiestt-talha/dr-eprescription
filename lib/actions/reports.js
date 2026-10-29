"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-guards";
import { ActionError, safely } from "@/lib/action-errors";
import { REPORT_TYPES } from "@/lib/reports";
import { calendarDate, oneOf, str } from "@/lib/validate";
import { revalidatePath } from "next/cache";

export async function generateReport(formData) {
  return safely(async () => {
    const session = await requireRole("admin");

    const reportType = oneOf(formData, "reportType", REPORT_TYPES, { label: "Report type" });
    const format = oneOf(formData, "format", ["pdf", "csv"], { label: "Format" });
    const fromDate = calendarDate(formData, "from", { label: "From date" });
    const toDate = calendarDate(formData, "to", { label: "To date" });
    const doctorId = str(formData, "doctorId", { label: "Doctor", max: 36 });
    if (fromDate && toDate && fromDate > toDate) throw new ActionError("The From date must be before the To date");
    if (doctorId && !(await prisma.doctor.findUnique({ where: { id: doctorId }, select: { id: true } }))) {
      throw new ActionError("Doctor not found");
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
