"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    throw new Error("Not authorized");
  }
  return session;
}

export async function generateReport(formData) {
  const session = await requireAdmin();

  const reportType = formData.get("reportType");
  const format = formData.get("format");
  const from = formData.get("from");
  const to = formData.get("to");
  const doctorId = formData.get("doctorId");

  if (!reportType || !format) {
    return { error: "Report type and format are required" };
  }

  const filters = {
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    ...(doctorId ? { doctorId } : {}),
  };

  const report = await prisma.report.create({
    data: {
      reportType,
      format,
      filters: Object.keys(filters).length ? filters : null,
      fileUrl: "", // set right after, once we have the id to build the URL from
      generatedBy: session.user.id,
    },
  });

  const fileUrl = `/api/reports/${report.id}/download`;

  await prisma.report.update({ where: { id: report.id }, data: { fileUrl } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "generated_report",
      entityType: "report",
      entityId: report.id,
      details: { reportType, format, filters },
    },
  });

  revalidatePath("/admin/reports");
  return { success: true, reportId: report.id, fileUrl };
}