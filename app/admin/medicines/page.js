import { PageHeader, PageShell } from "@/components/ui/page-header";
import { MedicinesTable } from "@/components/admin/medicines-table";
import { medicineRows } from "@/lib/lists";
import { listStateFrom } from "@/lib/list-state";

export default async function MedicinesPage({ searchParams }) {
  const initial = listStateFrom(await searchParams, ["dosageForm"]);
  const { rows, server } = await medicineRows({ q: initial.q, page: initial.page });

  return (
    <PageShell>
      <PageHeader title="Medicines" description="The clinic formulary doctors prescribe from." />
      <MedicinesTable medicines={rows} server={server} initial={initial} />
    </PageShell>
  );
}
