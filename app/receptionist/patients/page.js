import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader, PageShell } from "@/components/ui/page-header";
import { PatientsList } from "@/components/lists/patients-list";
import { Plus } from "lucide-react";
import { listStateFrom } from "@/lib/list-state";
import { patientRows } from "@/lib/lists";

export default async function ReceptionistPatientsPage({ searchParams }) {
  const params = await searchParams;
  // Every patient A–Z, searched and paged in the browser (server paging only
  // for very large clinics, see lib/lists.js).
  const initial = listStateFrom(params, ["gender"]);
  const list = await patientRows({ q: initial.q, page: initial.page });

  return (
    <PageShell>
      <PageHeader
        title="Patients"
        description="Find a patient to see their visit history or book an appointment."
        actions={
          <Button size="touch" nativeButton={false} render={<Link href="/receptionist/patients/new" />}>
            <Plus strokeWidth={1.75} />
            Register patient
          </Button>
        }
      />

      <PatientsList rows={list.rows} server={list.server} portal="receptionist" basePath="/receptionist/patients" initial={initial} />
    </PageShell>
  );
}