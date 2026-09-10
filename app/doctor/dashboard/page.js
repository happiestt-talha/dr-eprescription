import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function DoctorDashboard() {
  const session = await auth();
  const doctor = await prisma.doctor.findUnique({ where: { userId: session.user.id } });
  const today = startOfToday();

  const [
    totalPatients,
    todaysAppointments,
    totalPrescriptions,
    todaysPrescriptions,
    pendingDrafts,
  ] = await Promise.all([
    prisma.prescription.groupBy({ by: ["patientId"], where: { doctorId: doctor.id } }).then((r) => r.length),
    prisma.appointment.count({
      where: { doctorId: doctor.id, scheduledAt: { gte: today } },
    }),
    prisma.prescription.count({ where: { doctorId: doctor.id } }),
    prisma.prescription.count({ where: { doctorId: doctor.id, createdAt: { gte: today } } }),
    prisma.prescription.count({ where: { doctorId: doctor.id, status: "draft" } }),
  ]);

  const stats = [
    { label: "Patients Seen", value: totalPatients },
    { label: "Today's Appointments", value: todaysAppointments },
    { label: "Total Prescriptions", value: totalPrescriptions },
    { label: "Today's Prescriptions", value: todaysPrescriptions },
    { label: "Draft Prescriptions", value: pendingDrafts },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full min-w-0">
      <h1 className="text-xl sm:text-2xl font-semibold">Welcome, Dr. {doctor.fullName}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <p className="text-2xl sm:text-3xl font-semibold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}