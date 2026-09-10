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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Patients</h1>
        <Link href="/doctor/patients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Register New Patient
          </Button>
        </Link>
      </div>

      <PatientSearchBar defaultValue={q || ""} />

      {q && (
        <Table>
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
                  <Link href={`/doctor/patients/${patient.id}`} className="block">
                    {patient.patientCode}
                  </Link>
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/doctor/patients/${patient.id}`} className="block">
                    {patient.fullName}
                  </Link>
                </TableCell>
                <TableCell>{patient.phone}</TableCell>
                <TableCell className="capitalize">{patient.gender}</TableCell>
                <TableCell>{patient.age ?? "—"}</TableCell>
              </TableRow>
            ))}
            {patients.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No patients found for &quote;{q}&quote;. Try a different search, or register them as new.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}