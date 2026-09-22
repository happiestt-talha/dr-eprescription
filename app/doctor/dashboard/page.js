import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  CalendarDays,
  FileText,
  FilePlus2,
  FilePen,
  UserPlus,
  Plus,
} from "lucide-react";

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
    {
      label: "Patients Seen",
      value: totalPatients,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10 dark:bg-blue-500/20",
      border: "border-blue-500/20",
    },
    {
      label: "Today's Appointments",
      value: todaysAppointments,
      icon: CalendarDays,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-500/10 dark:bg-violet-500/20",
      border: "border-violet-500/20",
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
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-500/10 dark:bg-teal-500/20",
      border: "border-teal-500/20",
    },
    {
      label: "Draft Prescriptions",
      value: pendingDrafts,
      icon: FilePen,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10 dark:bg-amber-500/20",
      border: "border-amber-500/20",
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Clinical Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Welcome back, Dr. {doctor.fullName} · {doctor.specialization}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/doctor/patients/new">
            <Button variant="outline" className="min-h-[40px] text-xs sm:text-sm">
              <UserPlus className="mr-2 h-4 w-4" strokeWidth={1.75} />
              Register Patient
            </Button>
          </Link>
          <Link href="/doctor/patients">
            <Button className="min-h-[40px] text-xs sm:text-sm shadow-xs">
              <Plus className="mr-2 h-4 w-4" strokeWidth={1.75} />
              New Prescription
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className={`border ${stat.border} shadow-xs hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5`}
            >
              <CardHeader className="flex flex-row items-center justify-between p-4 pb-2 sm:p-5 sm:pb-2 space-y-0">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} transition-colors`}>
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
                <p className="text-2xl sm:text-3xl font-bold tracking-tight">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}