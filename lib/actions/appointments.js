"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-guards";
import { ActionError, safely } from "@/lib/action-errors";
import { clinicDateTime, id, str } from "@/lib/validate";
import { revalidatePath } from "next/cache";

// Which status changes make sense. Completed visits are final; a cancelled
// appointment can only be reopened (to pending).
const TRANSITIONS = {
  pending: ["confirmed", "completed", "cancelled"],
  confirmed: ["pending", "completed", "cancelled"],
  completed: [],
  cancelled: ["pending"],
};

// Allow a few minutes of slack so "now" bookings made on a slow form still pass.
const PAST_GRACE_MS = 10 * 60 * 1000;

async function activeDoctor(doctorId) {
  const doctor = await prisma.doctor.findUnique({
    where: { id: id(doctorId, "Doctor") },
    select: { id: true, user: { select: { isActive: true } } },
  });
  if (!doctor) throw new ActionError("Doctor not found");
  if (!doctor.user.isActive) throw new ActionError("This doctor is inactive and can't take appointments");
  return doctor;
}

function notInPast(date) {
  if (date.getTime() < Date.now() - PAST_GRACE_MS) throw new ActionError("Pick a date and time in the future");
  return date;
}

export async function createAppointment(formData) {
  return safely(async () => {
    const session = await requireRole("receptionist", "admin");

    const patientId = id(str(formData, "patientId", { label: "Patient", required: true }), "Patient");
    const doctor = await activeDoctor(str(formData, "doctorId", { label: "Doctor", required: true }));
    const scheduledAt = notInPast(clinicDateTime(formData, "scheduledAt", { label: "Date & time" }));

    const patient = await prisma.patient.findUnique({ where: { id: patientId }, select: { id: true } });
    if (!patient) throw new ActionError("Patient not found");

    const appointment = await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: { patientId, doctorId: doctor.id, scheduledAt, status: "pending", bookedBy: session.user.id },
      });
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "booked_appointment",
          entityType: "appointment",
          entityId: appointment.id,
          details: { patientId, doctorId: doctor.id, scheduledAt: scheduledAt.toISOString() },
        },
      });
      return appointment;
    }, { maxWait: 10000, timeout: 20000 });

    revalidatePath("/receptionist/appointments");
    revalidatePath("/admin/dashboard");
    return { success: true, appointmentId: appointment.id };
  });
}

export async function updateAppointmentStatus(appointmentId, status) {
  return safely(async () => {
    const session = await requireRole("receptionist", "admin");

    const appointment = await prisma.appointment.findUnique({ where: { id: id(appointmentId, "Appointment") } });
    if (!appointment) throw new ActionError("Appointment not found");
    if (status === appointment.status) return { success: true };
    if (!TRANSITIONS[appointment.status]?.includes(status)) {
      throw new ActionError(`A ${appointment.status} appointment can't be marked ${status}`);
    }

    await prisma.$transaction([
      prisma.appointment.update({ where: { id: appointment.id }, data: { status } }),
      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "updated_appointment_status",
          entityType: "appointment",
          entityId: appointment.id,
          details: { from: appointment.status, to: status },
        },
      }),
    ]);

    revalidatePath("/receptionist/appointments");
    revalidatePath("/admin/dashboard");
    return { success: true };
  });
}

export async function rescheduleAppointment(appointmentId, formData) {
  return safely(async () => {
    const session = await requireRole("receptionist", "admin");

    const appointment = await prisma.appointment.findUnique({ where: { id: id(appointmentId, "Appointment") } });
    if (!appointment) throw new ActionError("Appointment not found");
    if (appointment.status === "completed") throw new ActionError("A completed appointment can't be rescheduled");

    const doctor = await activeDoctor(str(formData, "doctorId", { label: "Doctor", required: true }));
    const scheduledAt = notInPast(clinicDateTime(formData, "scheduledAt", { label: "Date & time" }));

    await prisma.$transaction([
      prisma.appointment.update({
        where: { id: appointment.id },
        // Rescheduling a cancelled appointment brings it back.
        data: { doctorId: doctor.id, scheduledAt, ...(appointment.status === "cancelled" ? { status: "pending" } : {}) },
      }),
      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "rescheduled_appointment",
          entityType: "appointment",
          entityId: appointment.id,
          details: {
            from: { doctorId: appointment.doctorId, scheduledAt: appointment.scheduledAt.toISOString() },
            to: { doctorId: doctor.id, scheduledAt: scheduledAt.toISOString() },
          },
        },
      }),
    ]);

    revalidatePath("/receptionist/appointments");
    return { success: true };
  });
}
