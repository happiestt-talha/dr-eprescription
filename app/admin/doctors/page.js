import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Plus, Pencil, Stethoscope, Phone, Building2 } from "lucide-react";
import { DoctorStatusToggle } from "@/components/admin/doctor-status-toggle";

export default async function DoctorsPage() {
  const doctors = await prisma.doctor.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Doctors Directory</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage medical staff, licenses, clinic assignments, and access.
          </p>
        </div>
        <Link href="/admin/doctors/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto min-h-[44px] shadow-xs">
            <Plus className="mr-2 h-4 w-4" strokeWidth={1.75} />
            Add Doctor
          </Button>
        </Link>
      </div>

      {/* Mobile Card View (below md: 768px) */}
      <div className="md:hidden space-y-3">
        {doctors.map((doctor) => (
          <div key={doctor.id} className="border border-border/60 rounded-xl p-4 bg-card space-y-3 shadow-xs">
            {/* Primary identifying info prominently at top */}
            <div className="border-b pb-2.5 flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-base text-foreground flex items-center gap-1.5">
                  <Stethoscope className="h-4 w-4 text-primary shrink-0" strokeWidth={1.75} />
                  {doctor.fullName}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">{doctor.specialization}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                doctor.user.isActive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              }`}>
                {doctor.user.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            {/* Stacked Label: Value lines */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Registration No:</span>
                <span className="font-medium text-foreground">{doctor.registrationNo}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Clinic:
                </span>
                <span className="font-medium text-foreground">{doctor.clinicName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  Phone:
                </span>
                <span className="font-medium text-foreground">{doctor.phone}</span>
              </div>
            </div>

            {/* Row-level actions at bottom with min 44x44px touch targets */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t">
              <div className="flex items-center gap-2">
                <DoctorStatusToggle
                  doctorId={doctor.id}
                  userId={doctor.userId}
                  isActive={doctor.user.isActive}
                />
                <span className="text-xs text-muted-foreground font-medium">
                  Status
                </span>
              </div>

              <Link href={`/admin/doctors/${doctor.id}`} className="shrink-0">
                <Button variant="outline" size="sm" className="min-h-[44px] px-3 flex items-center gap-1.5 text-xs">
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span>Edit</span>
                </Button>
              </Link>
            </div>
          </div>
        ))}
        {doctors.length === 0 && (
          <div className="text-center text-muted-foreground py-12 border border-dashed rounded-xl bg-card">
            <Stethoscope className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" strokeWidth={1.5} />
            <p className="font-medium text-foreground">No doctors registered yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add your first doctor to begin issuing prescriptions.</p>
          </div>
        )}
      </div>

      {/* Desktop & Tablet Table View (md: 768px+) */}
      <div className="hidden md:block border border-border/60 rounded-xl overflow-hidden bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Doctor</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>Registration No.</TableHead>
              <TableHead>Clinic</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctors.map((doctor) => (
              <TableRow key={doctor.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-semibold text-foreground">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                      {doctor.fullName.charAt(0)}
                    </div>
                    {doctor.fullName}
                  </div>
                </TableCell>
                <TableCell>{doctor.specialization}</TableCell>
                <TableCell className="font-mono text-xs">{doctor.registrationNo}</TableCell>
                <TableCell>{doctor.clinicName}</TableCell>
                <TableCell>{doctor.phone}</TableCell>
                <TableCell>
                  <DoctorStatusToggle
                    doctorId={doctor.id}
                    userId={doctor.userId}
                    isActive={doctor.user.isActive}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/doctors/${doctor.id}`}>
                    <Button variant="ghost" size="icon" className="min-h-[36px] min-w-[36px] hover:bg-muted text-muted-foreground hover:text-foreground">
                      <Pencil className="h-4 w-4" strokeWidth={1.75} />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {doctors.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-16">
                  <Stethoscope className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" strokeWidth={1.5} />
                  <p className="font-medium text-foreground">No doctors registered yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Add your first doctor to begin issuing prescriptions.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}