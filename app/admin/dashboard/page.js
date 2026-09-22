import { prisma } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Stethoscope,
  Users,
  UserPlus,
  FileText,
  FilePlus2,
  CalendarDays,
  Clock,
  Pill,
} from "lucide-react";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function AdminDashboard() {
  const today = startOfToday();

  const [totalDoctors, totalPatients, todaysPatients, totalPrescriptions] = await Promise.all([
    prisma.doctor.count(),
    prisma.patient.count(),
    prisma.patient.count({ where: { createdAt: { gte: today } } }),
    prisma.prescription.count(),
  ]);

  const [todaysPrescriptions, totalAppointments, pendingAppointments, totalMedicines] = await Promise.all([
    prisma.prescription.count({ where: { createdAt: { gte: today } } }),
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: "pending" } }),
    prisma.medicine.count(),
  ]);

  const stats = [
    {
      label: "Total Doctors",
      value: totalDoctors,
      icon: Stethoscope,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-500/10 dark:bg-teal-500/20",
      border: "border-teal-500/20",
    },
    {
      label: "Total Patients",
      value: totalPatients,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10 dark:bg-blue-500/20",
      border: "border-blue-500/20",
    },
    {
      label: "Today's Patients",
      value: todaysPatients,
      icon: UserPlus,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-500/10 dark:bg-indigo-500/20",
      border: "border-indigo-500/20",
    },
    {
      label: "Total Prescriptions",
      value: totalPrescriptions,
      icon: FileText,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      border: "border-emerald-500/20",
    },
    {
      label: "Today's Prescriptions",
      value: todaysPrescriptions,
      icon: FilePlus2,
      color: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-500/10 dark:bg-cyan-500/20",
      border: "border-cyan-500/20",
    },
    {
      label: "Total Appointments",
      value: totalAppointments,
      icon: CalendarDays,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-500/10 dark:bg-violet-500/20",
      border: "border-violet-500/20",
    },
    {
      label: "Pending Appointments",
      value: pendingAppointments,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10 dark:bg-amber-500/20",
      border: "border-amber-500/20",
    },
    {
      label: "Total Medicines",
      value: totalMedicines,
      icon: Pill,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500/10 dark:bg-rose-500/20",
      border: "border-rose-500/20",
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Overview Dashboard</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Real-time summary of clinic activities, staff, and patient records.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className={`border ${stat.border} shadow-xs hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} transition-colors`}>
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl sm:text-3xl font-bold tracking-tight">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}