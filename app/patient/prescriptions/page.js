import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PageHeader, PageShell } from "@/components/ui/page-header";
import { HistoryList } from "@/components/lists/prescription-lists";
import { historyRows } from "@/lib/lists";
import { listStateFrom } from "@/lib/list-state";

export default async function PatientPrescriptionsPage({ searchParams }) {
  const [session, query] = await Promise.all([auth(), searchParams]);
  const patient = await prisma.patient.findUnique({ where: { userId: session.user.id }, select: { id: true, fullName: true, patientCode: true } });
  if (!patient) notFound();
  const initial = listStateFrom(query);
  const { rows, server } = await historyRows(patient.id, { viewer: "patient", q: initial.q, page: initial.page });

  return (
    <PageShell className="mx-auto max-w-5xl">
      <PageHeader
        title="My prescriptions"
        description={
          <>
            {patient.fullName} · Patient code <span className="font-mono">{patient.patientCode}</span>
          </>
        }
      />
      <HistoryList rows={rows} server={server} viewer="patient" initial={initial} />
    </PageShell>
  );
}
