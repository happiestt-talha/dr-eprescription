import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { PatientSearch } from "@/components/patients/patient-search";
import { Plus } from "lucide-react";
import { firstParam } from "@/lib/utils";

const SEARCH_LIMIT = 25;

export default async function DoctorPatientsPage({ searchParams }) {
  const q = firstParam((await searchParams).q)?.slice(0, 100);

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
        select: { id: true, fullName: true, patientCode: true, phone: true, cnic: true, gender: true, age: true },
        orderBy: { fullName: "asc" },
        take: SEARCH_LIMIT,
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
        <Button className="w-full sm:w-auto min-h-[44px] shadow-xs" nativeButton={false} render={<Link href="/doctor/patients/new" className="w-full sm:w-auto" />}>
            <Plus className="mr-2 h-4 w-4" strokeWidth={1.75} />
            Register Patient
          </Button>
      </div>

      <PatientSearch
        basePath="/doctor/patients"
        portal="doctor"
        initialQuery={q || ""}
        initialResults={patients}
        limit={SEARCH_LIMIT}
      />
    </div>
  );
}