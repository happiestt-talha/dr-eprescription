import { PageHeader, PageShell } from "@/components/ui/page-header";
import { LabTestsTable } from "@/components/admin/lab-tests-table";
import { labTestRows } from "@/lib/lists";
import { listStateFrom } from "@/lib/list-state";

export default async function LabTestsPage({ searchParams }) {
  const initial = listStateFrom(await searchParams, ["category"]);
  const { rows, server } = await labTestRows({ q: initial.q, page: initial.page });

  return (
    <PageShell>
      <PageHeader title="Lab tests" description="Investigations doctors can order on a prescription." />
      <LabTestsTable labTests={rows} server={server} initial={initial} />
    </PageShell>
  );
}
