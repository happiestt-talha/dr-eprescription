import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { PatientSearchBar } from "@/components/patients/patient-search-bar";
import { Plus } from "lucide-react";

export default async function DoctorPatientsPage({ searchParams }) {
  const { q } = await searchParams;

  const patients = q
    ? await prisma.patient.findMany({
        where: {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { cnic: { contains: q } },
            { patientCode: { contains: q, mode: "insensitive" } },
          ],
        },
        orderBy: { fullName: "asc" },
        take: 25,
      })
    : [];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold">Patients</h1>
        <Link href="/doctor/patients/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto min-h-[44px]">
            <Plus className="mr-2 h-4 w-4" />
            Register New Patient
          </Button>
        </Link>
      </div>

      <PatientSearchBar defaultValue={q || ""} basePath="/doctor/patients" />

      {q && (
        <div className="rounded-md border overflow-x-auto w-full">
          <Table className="min-w-[600px] w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Patient ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Age</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => (
                <TableRow key={patient.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/doctor/patients/${patient.id}`} className="hover:underline font-mono text-xs sm:text-sm block">
                      {patient.patientCode}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/doctor/patients/${patient.id}`} className="hover:underline block">
                      {patient.fullName}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{patient.phone}</TableCell>
                  <TableCell className="capitalize">{patient.gender}</TableCell>
                  <TableCell>{patient.age ?? "—"}</TableCell>
                </TableRow>
              ))}
              {patients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No patients found for &quot;{q}&quot;. Try a different search, or register them as new.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}