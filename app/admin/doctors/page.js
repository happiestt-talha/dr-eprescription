import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Plus, Pencil } from "lucide-react";
import { DoctorStatusToggle } from "@/components/admin/doctor-status-toggle";

export default async function DoctorsPage() {
  const doctors = await prisma.doctor.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold">Doctors</h1>
        <Link href="/admin/doctors/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto min-h-[44px]">
            <Plus className="mr-2 h-4 w-4" />
            Add Doctor
          </Button>
        </Link>
      </div>

      {/* Mobile Card View (below md: 768px) */}
      <div className="md:hidden space-y-3">
        {doctors.map((doctor) => (
          <div key={doctor.id} className="border rounded-lg p-4 bg-card space-y-3 shadow-xs">
            {/* Primary identifying info prominently at top */}
            <div className="border-b pb-2.5">
              <h2 className="font-semibold text-base text-foreground">{doctor.fullName}</h2>
              <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
            </div>

            {/* Stacked Label: Value lines */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Registration No:</span>
                <span className="font-medium text-foreground">{doctor.registrationNo}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Clinic:</span>
                <span className="font-medium text-foreground">{doctor.clinicName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Phone:</span>
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
                <span className="text-xs text-muted-foreground">
                  {doctor.user.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <Link href={`/admin/doctors/${doctor.id}`} className="shrink-0">
                <Button variant="outline" size="sm" className="min-h-[44px] px-3 flex items-center gap-1.5">
                  <Pencil className="h-4 w-4" />
                  <span className="text-xs">Edit Doctor</span>
                </Button>
              </Link>
            </div>
          </div>
        ))}
        {doctors.length === 0 && (
          <div className="text-center text-muted-foreground py-8 border rounded-lg bg-card">
            No doctors yet. Add the first one to get started.
          </div>
        )}
      </div>

      {/* Desktop & Tablet Table View (md: 768px+) */}
      <div className="hidden md:block border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>Registration No.</TableHead>
              <TableHead>Clinic</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Edit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctors.map((doctor) => (
              <TableRow key={doctor.id}>
                <TableCell className="font-medium">{doctor.fullName}</TableCell>
                <TableCell>{doctor.specialization}</TableCell>
                <TableCell>{doctor.registrationNo}</TableCell>
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
                    <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {doctors.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No doctors yet. Add the first one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}