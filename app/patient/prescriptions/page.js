import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default async function PatientPrescriptionsPage() {
  const session = await auth();

  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
    include: {
      prescriptions: {
        where: { status: "finalized" },
        include: { doctor: true },
        orderBy: { visitDate: "desc" },
      },
    },
  });

  if (!patient) notFound();

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full min-w-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold">{patient.fullName}</h1>
        <p className="text-sm text-muted-foreground font-mono">{patient.patientCode}</p>
      </div>

      <div className="rounded-md border overflow-x-auto w-full">
        <Table className="min-w-[450px] w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Diagnosis</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patient.prescriptions.map((rx) => (
              <TableRow key={rx.id}>
                <TableCell className="whitespace-nowrap">
                  <Link href={`/patient/prescriptions/${rx.id}`} className="hover:underline font-medium">
                    {rx.visitDate.toLocaleDateString()}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap">Dr. {rx.doctor.fullName}</TableCell>
                <TableCell>{rx.diagnosis || "—"}</TableCell>
              </TableRow>
            ))}
            {patient.prescriptions.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No prescriptions yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}