import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default async function DraftsPage() {
  const session = await auth();
  const doctor = await prisma.doctor.findUnique({ where: { userId: session.user.id } });

  const drafts = await prisma.prescription.findMany({
    where: { doctorId: doctor.id, status: "draft" },
    include: { patient: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full min-w-0">
      <h1 className="text-xl sm:text-2xl font-semibold">Draft Prescriptions</h1>
      <div className="rounded-md border overflow-x-auto w-full">
        <Table className="min-w-[500px] w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Diagnosis</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drafts.map((rx) => (
              <TableRow key={rx.id}>
                <TableCell>
                  <Link href={`/doctor/prescriptions/${rx.id}/edit`} className="hover:underline font-medium">
                    {rx.patient.fullName}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap">{rx.createdAt.toLocaleDateString()}</TableCell>
                <TableCell>{rx.diagnosis || "—"}</TableCell>
              </TableRow>
            ))}
            {drafts.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No drafts in progress.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}