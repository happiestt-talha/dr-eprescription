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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Doctors</h1>
        <Link href="/admin/doctors/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Doctor
          </Button>
        </Link>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Specialization</TableHead>
            <TableHead>Registration No.</TableHead>
            <TableHead>Clinic</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Edit</TableHead>
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
              <TableCell>
                <Link href={`/admin/doctors/${doctor.id}`}>
                  <Button variant="ghost" size="icon">
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
  );
}