import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PageHeader, PageShell } from "@/components/ui/page-header";
import { DoctorsList } from "@/components/lists/doctors-list";
import { doctorRows } from "@/lib/lists";
import { listStateFrom } from "@/lib/list-state";

export default async function DoctorsPage({ searchParams }) {
  const params = await searchParams;
  const initial = listStateFrom(params, ["status"]);
  const { rows, server } = await doctorRows({ q: initial.q, page: initial.page });

  return (
    <PageShell>
      <PageHeader
        title="Doctors"
        description="Doctor accounts, PMDC numbers and clinic details."
        actions={
          <Button size="touch" nativeButton={false} render={<Link href="/admin/doctors/new" />}>
            <Plus strokeWidth={1.75} />
            Add doctor
          </Button>
        }
      />
      <DoctorsList rows={rows} server={server} initial={initial} />
    </PageShell>
  );
}
