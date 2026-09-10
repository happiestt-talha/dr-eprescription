"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function requireReceptionOrAdmin() {
  const session = await auth();
  if (!session || !["receptionist", "admin"].includes(session.user.role)) {
    throw new Error("Not authorized");
  }
  return session;
}

export async function createAppointment(formData) {
  const session = await requireReceptionOrAdmin();

  const patientId = formData.get("patientId");
  const doctorId = formData.get("doctorId");
  const scheduledAt = formData.get("scheduledAt");

  if (!patientId || !doctorId || !scheduledAt) {
    return { error: "Patient, doctor, and date/time are all required" };
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId,
      doctorId,
      scheduledAt: new Date(scheduledAt),
      status: "pending",
      bookedBy: session.user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "booked_appointment",
      entityType: "appointment",
      entityId: appointment.id,
      details: { patientId, doctorId },
    },
  });

  revalidatePath("/receptionist/appointments");
  revalidatePath("/admin/dashboard");
  return { success: true, appointmentId: appointment.id };
}

export async function updateAppointmentStatus(appointmentId, status) {
  const session = await requireReceptionOrAdmin();

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "updated_appointment_status",
      entityType: "appointment",
      entityId: appointmentId,
      details: { status },
    },
  });

  revalidatePath("/receptionist/appointments");
  revalidatePath("/admin/dashboard");
  return { success: true };
}

export async function rescheduleAppointment(appointmentId, formData) {
  const session = await requireReceptionOrAdmin();

  const doctorId = formData.get("doctorId");
  const scheduledAt = formData.get("scheduledAt");

  if (!doctorId || !scheduledAt) {
    return { error: "Doctor and date/time are required" };
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { doctorId, scheduledAt: new Date(scheduledAt) },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "rescheduled_appointment",
      entityType: "appointment",
      entityId: appointmentId,
    },
  });

  revalidatePath("/receptionist/appointments");
  return { success: true };
}