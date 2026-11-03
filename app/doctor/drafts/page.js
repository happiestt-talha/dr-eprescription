import { getCurrentDoctor } from "@/lib/auth-guards";
import { PageHeader, PageShell } from "@/components/ui/page-header";
import { DraftsList } from "@/components/lists/prescription-lists";
import { draftRows } from "@/lib/lists";
import { listStateFrom } from "@/lib/list-state";

export default async function DraftsPage({ searchParams }) {
  const [doctor, params] = await Promise.all([getCurrentDoctor(), searchParams]);
  if (!doctor) return null; // layout shows the "profile not set up" message
  const initial = listStateFrom(params);
  const { rows, server } = await draftRows(doctor.id, { q: initial.q, page: initial.page });

  return (
    <PageShell>
      <PageHeader title="Drafts" description="Prescriptions you started but haven't finalised." />
      <DraftsList rows={rows} server={server} initial={initial} />
    </PageShell>
  );
}
