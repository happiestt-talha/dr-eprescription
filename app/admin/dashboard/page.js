import { prisma } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function AdminDashboard() {
  const today = startOfToday();

  const [
    totalDoctors,
    totalPatients,
    todaysPatients,
    totalPrescriptions,
    todaysPrescriptions,
    totalAppointments,
    pendingAppointments,
    totalMedicines,
  ] = await Promise.all([
    prisma.doctor.count(),
    prisma.patient.count(),
    prisma.patient.count({ where: { createdAt: { gte: today } } }),
    prisma.prescription.count(),
    prisma.prescription.count({ where: { createdAt: { gte: today } } }),
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: "pending" } }),
    prisma.medicine.count(),
  ]);

  const stats = [
    { label: "Total Doctors", value: totalDoctors },
    { label: "Total Patients", value: totalPatients },
    { label: "Today's Patients", value: todaysPatients },
    { label: "Total Prescriptions", value: totalPrescriptions },
    { label: "Today's Prescriptions", value: todaysPrescriptions },
    { label: "Total Appointments", value: totalAppointments },
    { label: "Pending Appointments", value: pendingAppointments },
    { label: "Total Medicines", value: totalMedicines },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl font-semibold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}