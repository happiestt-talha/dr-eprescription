import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { firstParam } from "@/lib/utils";
import { PageHeader, PageShell } from "@/components/ui/page-header";
import { AppointmentsList } from "@/components/lists/appointments-list";
import { appointmentRows, doctorPickerItems } from "@/lib/lists";
import { listStateFrom } from "@/lib/list-state";

export default async function AppointmentsPage({ searchParams }) {
  const params = await searchParams;
  const showPast = firstParam(params.view) === "past";

  // Every appointment in the tab (no silent cap), lean rows; filters and
  // search run in the browser. Doctor items are built once and shared.
  const [list, doctorItems] = await Promise.all([appointmentRows({ past: showPast, q: listStateFrom(params).q, page: listStateFrom(params).page }), doctorPickerItems()]);

  // Segmented switch (links, so the view is in the URL), styled like the sign-in Staff/Patient switch.
  const tabs = (
    <nav aria-label="Appointment view" className="inline-flex rounded-md bg-muted p-0.5">
      {[
        { label: "Upcoming", href: "/receptionist/appointments", active: !showPast },
        { label: "Past", href: "/receptionist/appointments?view=past", active: showPast },
      ].map((tab) => (
        <Link
          key={tab.label}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={cn(
            "flex min-h-9 items-center rounded-[calc(var(--radius)-2px)] px-3 text-sm font-medium transition-colors",
            tab.active ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <PageShell>
      <PageHeader
        title="Appointments"
        description="Upcoming and past bookings. Filter by doctor or status."
        actions={
          // Booking starts from a patient, so this opens the patient list.
          <Button size="touch" nativeButton={false} render={<Link href="/receptionist/patients" />}>
            <Plus strokeWidth={1.75} />
            Book appointment
          </Button>
        }
      />

      <AppointmentsList key={showPast ? "past" : "upcoming"} rows={list.rows} server={list.server} doctorItems={doctorItems} past={showPast} toolbar={tabs} initial={listStateFrom(params, ["doctor", "status"])} />
    </PageShell>
  );
}
