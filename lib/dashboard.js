// Loaders for the admin and doctor dashboards. Each returns plain,
// server-formatted values (clinic timezone), so nothing here ever carries a
// User row or a Date into the page markup.
import { prisma } from "@/lib/db";
import { auditActionLabel, auditActionTone } from "@/lib/audit-labels";
import { clinicDateKey, formatDate, formatDateTime, formatTimeOfDay, startOfClinicDay, toClinicInputValue } from "@/lib/datetime";

/** "2:30 pm" in clinic time. */
export function formatClinicTime(date) {
  return formatTimeOfDay(toClinicInputValue(date).slice(11));
}

/** "Today, 2:30 pm" / "Tomorrow, 9:00 am" / "05/11/2026, 2:30 pm". */
export function formatWhen(date, now = new Date()) {
  const key = clinicDateKey(date);
  if (key === clinicDateKey(now)) return `Today, ${formatClinicTime(date)}`;
  if (key === clinicDateKey(startOfClinicDay(now, 1))) return `Tomorrow, ${formatClinicTime(date)}`;
  if (key === clinicDateKey(startOfClinicDay(now, -1))) return `Yesterday, ${formatClinicTime(date)}`;
  return formatDateTime(date);
}

const OPEN_APPOINTMENT = { in: ["pending", "confirmed"] };

/** Everything the admin dashboard shows, in one round trip. */
export async function adminDashboard({ upcomingLimit = 6, activityLimit = 8, doctorLimit = 5 } = {}) {
  const now = new Date();
  const today = startOfClinicDay(now);
  const tomorrow = startOfClinicDay(now, 1);

  const [
    newPatientsToday,
    prescriptionsToday,
    appointmentsToday,
    pendingAppointments,
    upcoming,
    activity,
    doctors,
    totalPatients,
    totalPrescriptions,
    totalDoctors,
    totalMedicines,
    totalLabTests,
  ] = await Promise.all([
    prisma.patient.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
    prisma.prescription.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
    prisma.appointment.count({ where: { scheduledAt: { gte: today, lt: tomorrow } } }),
    prisma.appointment.count({ where: { status: "pending" } }),
    prisma.appointment.findMany({
      where: { status: OPEN_APPOINTMENT, scheduledAt: { gte: now } },
      select: {
        id: true,
        scheduledAt: true,
        status: true,
        patient: { select: { fullName: true, patientCode: true } },
        doctor: { select: { fullName: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: upcomingLimit,
    }),
    prisma.auditLog.findMany({
      select: {
        id: true,
        action: true,
        entityType: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            role: true,
            doctor: { select: { fullName: true } },
            receptionist: { select: { fullName: true } },
            patient: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: activityLimit,
    }),
    prisma.doctor.findMany({
      select: { id: true, fullName: true, specialization: true, createdAt: true, user: { select: { isActive: true } } },
      orderBy: { createdAt: "desc" },
      take: doctorLimit,
    }),
    prisma.patient.count(),
    prisma.prescription.count({ where: { status: "finalized" } }),
    prisma.doctor.count(),
    prisma.medicine.count(),
    prisma.labTest.count(),
  ]);

  return {
    figures: { newPatientsToday, prescriptionsToday, appointmentsToday, pendingAppointments },
    upcoming: upcoming.map((a) => ({
      id: a.id,
      when: formatWhen(a.scheduledAt, now),
      status: a.status,
      patientName: a.patient.fullName,
      patientCode: a.patient.patientCode,
      doctorName: a.doctor.fullName,
    })),
    activity: activity.map((log) => {
      const u = log.user;
      const name = u?.doctor?.fullName ? `Dr. ${u.doctor.fullName}` : u?.receptionist?.fullName || u?.patient?.fullName || u?.email || "Unknown user";
      return {
        id: log.id,
        who: name,
        label: auditActionLabel(log.action),
        tone: auditActionTone(log.action),
        entityType: log.entityType,
        when: formatWhen(log.createdAt, now),
      };
    }),
    doctors: doctors.map((d) => ({
      id: d.id,
      fullName: d.fullName,
      specialization: d.specialization,
      active: Boolean(d.user?.isActive),
      added: formatDate(d.createdAt),
    })),
    totals: { totalPatients, totalPrescriptions, totalDoctors, totalMedicines, totalLabTests },
  };
}

/** Everything the doctor dashboard shows, scoped to this doctor. */
export async function doctorDashboard(doctorId, { draftLimit = 5, recentLimit = 5 } = {}) {
  const now = new Date();
  const today = startOfClinicDay(now);
  const tomorrow = startOfClinicDay(now, 1);
  const patientSelect = { select: { id: true, fullName: true, patientCode: true } };

  const [appointments, drafts, draftCount, recent, prescriptionsToday, patientsSeen] = await Promise.all([
    prisma.appointment.findMany({
      where: { doctorId, scheduledAt: { gte: today, lt: tomorrow } },
      select: { id: true, scheduledAt: true, status: true, patient: patientSelect },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.prescription.findMany({
      where: { doctorId, status: "draft" },
      select: { id: true, createdAt: true, patient: patientSelect },
      orderBy: { createdAt: "desc" },
      take: draftLimit,
    }),
    prisma.prescription.count({ where: { doctorId, status: "draft" } }),
    prisma.prescription.findMany({
      where: { doctorId, status: "finalized" },
      select: { id: true, prescriptionCode: true, visitDate: true, patient: patientSelect },
      orderBy: { visitDate: "desc" },
      take: recentLimit,
    }),
    prisma.prescription.count({ where: { doctorId, status: "finalized", createdAt: { gte: today, lt: tomorrow } } }),
    prisma.patient.count({ where: { prescriptions: { some: { doctorId } } } }),
  ]);

  return {
    appointments: appointments.map((a) => ({
      id: a.id,
      time: formatClinicTime(a.scheduledAt),
      status: a.status,
      patientId: a.patient.id,
      patientName: a.patient.fullName,
      patientCode: a.patient.patientCode,
    })),
    drafts: drafts.map((rx) => ({
      id: rx.id,
      patientName: rx.patient.fullName,
      patientCode: rx.patient.patientCode,
      // Prescriptions have no updatedAt column; this is when the draft was started.
      started: formatWhen(rx.createdAt, now),
    })),
    draftCount,
    recent: recent.map((rx) => ({
      id: rx.id,
      code: rx.prescriptionCode,
      patientName: rx.patient.fullName,
      patientCode: rx.patient.patientCode,
      date: formatDate(rx.visitDate),
    })),
    counts: { prescriptionsToday, patientsSeen },
  };
}
