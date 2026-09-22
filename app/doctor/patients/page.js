import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { PatientSearchBar } from "@/components/patients/patient-search-bar";
import { Plus, Users, Search, UserCheck, ChevronRight, FileEdit } from "lucide-react";

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
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Patient Directory</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Search patient records, medical history, or start a new prescription.
          </p>
        </div>
        <Link href="/doctor/patients/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto min-h-[44px] shadow-xs">
            <Plus className="mr-2 h-4 w-4" strokeWidth={1.75} />
            Register Patient
          </Button>
        </Link>
      </div>

      <PatientSearchBar defaultValue={q || ""} basePath="/doctor/patients" />

      {q ? (
        <>
          {/* Mobile Card View (below md: 768px) */}
          <div className="md:hidden space-y-3">
            {patients.map((patient) => (
              <div key={patient.id} className="border border-border/60 rounded-xl p-4 bg-card space-y-3 shadow-xs">
                <div className="flex items-start justify-between border-b pb-2.5">
                  <div>
                    <h2 className="font-semibold text-base text-foreground">{patient.fullName}</h2>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{patient.patientCode}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full capitalize font-medium bg-muted text-muted-foreground">
                    {patient.gender} · {patient.age ? `${patient.age}y` : "—"}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium text-foreground">{patient.phone}</span>
                  </div>
                  {patient.cnic && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">CNIC:</span>
                      <span className="font-mono text-foreground">{patient.cnic}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t">
                  <Link href={`/doctor/patients/${patient.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full min-h-[40px] text-xs">
                      View Profile
                    </Button>
                  </Link>
                  <Link href={`/doctor/prescriptions/new?patientId=${patient.id}`} className="flex-1">
                    <Button size="sm" className="w-full min-h-[40px] text-xs">
                      Prescribe
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
            {patients.length === 0 && (
              <div className="text-center text-muted-foreground py-12 border border-dashed rounded-xl bg-card">
                <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" strokeWidth={1.5} />
                <p className="font-medium text-foreground">No patients found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  No records matching &quot;{q}&quot;. Register them as a new patient above.
                </p>
              </div>
            )}
          </div>

          {/* Desktop & Tablet Table (>= md: 768px) */}
          <div className="hidden md:block rounded-xl border border-border/60 overflow-hidden bg-card shadow-xs">
            <Table className="min-w-[600px] w-full">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Patient Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Gender / Age</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <Link href={`/doctor/patients/${patient.id}`} className="font-mono text-xs text-primary hover:underline font-medium">
                        {patient.patientCode}
                      </Link>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      <Link href={`/doctor/patients/${patient.id}`} className="hover:underline">
                        {patient.fullName}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{patient.phone}</TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {patient.gender} · {patient.age ? `${patient.age} yrs` : "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/doctor/patients/${patient.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 text-xs font-medium">
                          Profile
                        </Button>
                      </Link>
                      <Link href={`/doctor/prescriptions/new?patientId=${patient.id}`}>
                        <Button size="sm" className="h-8 text-xs font-medium shadow-xs">
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          Prescribe
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {patients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-16">
                      <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" strokeWidth={1.5} />
                      <p className="font-medium text-foreground">No patients found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        No records matching &quot;{q}&quot;. Register them as a new patient above.
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <div className="text-center text-muted-foreground py-16 border border-dashed rounded-xl bg-card/50">
          <Search className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" strokeWidth={1.5} />
          <h3 className="font-semibold text-foreground">Search Patient Database</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Type a patient name, phone number, CNIC, or patient ID code in the search bar above to look up their records.
          </p>
        </div>
      )}
    </div>
  );
}