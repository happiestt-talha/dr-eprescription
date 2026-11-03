import { PageHeader, PageShell } from "@/components/ui/page-header";
import { ReportGeneratorForm } from "@/components/admin/report-generator-form";
import { ReportsList } from "@/components/lists/reports-list";
import { doctorPickerItems, reportRows } from "@/lib/lists";
import { listStateFrom } from "@/lib/list-state";

export default async function ReportsPage({ searchParams }) {
  const params = await searchParams;
  const initial = listStateFrom(params, ["reportType", "format"]);
  const [list, doctorItems] = await Promise.all([reportRows({ q: initial.q, page: initial.page }), doctorPickerItems()]);

  return (
    <PageShell className="space-y-8">
      <PageHeader title="Reports" description="Generate PDF or CSV reports of clinic activity." />

      <ReportGeneratorForm doctorItems={doctorItems} />

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Past reports</h2>
        <ReportsList rows={list.rows} server={list.server} initial={initial} />
      </section>
    </PageShell>
  );
}
