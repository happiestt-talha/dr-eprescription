import { Panel, PanelEmpty } from "@/components/ui/panel";
import Link from "next/link";
import { getCurrentDoctor } from "@/lib/auth-guards";
import { PageHeader, PageShell } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { doctorDashboard } from "@/lib/dashboard";



// Appointments still to be seen get the prescription action; the rest link to the patient.
const OPEN = new Set(["pending", "confirmed"]);

export default async function DoctorDashboard() {
  const doctor = await getCurrentDoctor();
  if (!doctor) return null; // layout shows the "profile not set up" message
  const { appointments, drafts, draftCount, recent, counts } = await doctorDashboard(doctor.id);

  const toSee = appointments.filter((a) => OPEN.has(a.status)).length;
  const summary = [
    `${appointments.length} ${appointments.length === 1 ? "appointment" : "appointments"} today`,
    `${toSee} still to see`,
    `${counts.prescriptionsToday} finalised today`,
    `${draftCount} ${draftCount === 1 ? "draft" : "drafts"}`,
    `${counts.patientsSeen} patients seen in total`,
  ].join(" · ");

  return (
    <PageShell>
      <PageHeader
        title="Dashboard"
        description={`Dr. ${doctor.fullName} · ${doctor.specialization}`}
        actions={
          <Button size="touch" nativeButton={false} render={<Link href="/doctor/patients" />}>
            New prescription
          </Button>
        }
      />

      <p className="text-sm text-muted-foreground tabular-nums">{summary}</p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
        <Panel title="Today's appointments">
          {appointments.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-medium">No appointments today</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Walk-in? Find the patient in{" "}
                <Link href="/doctor/patients" className="font-medium text-primary underline-offset-2 hover:underline">
                  Patients
                </Link>
                .
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {appointments.map((a) => (
                <li key={a.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <span className="w-16 shrink-0 text-sm font-medium tabular-nums">{a.time}</span>
                    <Link href={`/doctor/patients/${a.patientId}`} className="min-w-0 flex-1 underline-offset-2 hover:underline">
                      <span className="block truncate text-sm font-medium">{a.patientName}</span>
                      <span className="block truncate font-mono text-xs text-muted-foreground">{a.patientCode}</span>
                    </Link>
                    <StatusBadge status={a.status} />
                  </div>
                  {OPEN.has(a.status) ? (
                    <Button
                      size="touch"
                      variant="outline"
                      className="w-full sm:w-auto"
                      nativeButton={false}
                      render={<Link href={`/doctor/prescriptions/new?patientId=${a.patientId}`} />}>
                      Start prescription
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="min-w-0 space-y-6">
          <Panel title="Drafts" href={draftCount > 0 ? "/doctor/drafts" : undefined}>
            {drafts.length === 0 ? (
              <PanelEmpty>No drafts waiting.</PanelEmpty>
            ) : (
              <ul className="divide-y">
                {drafts.map((rx) => (
                  <li key={rx.id}>
                    <Link href={`/doctor/prescriptions/${rx.id}/edit`} className="block px-4 py-3 transition-colors hover:bg-muted/40">
                      <span className="block truncate text-sm font-medium">{rx.patientName}</span>
                      <span className="block truncate text-xs text-muted-foreground tabular-nums">Started {rx.started}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Recent prescriptions">
            {recent.length === 0 ? (
              <PanelEmpty>No finalised prescriptions yet.</PanelEmpty>
            ) : (
              <ul className="divide-y">
                {recent.map((rx) => (
                  <li key={rx.id}>
                    <Link href={`/doctor/prescriptions/${rx.id}`} className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{rx.patientName}</span>
                        <span className="block truncate font-mono text-xs text-muted-foreground">{rx.code}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{rx.date}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
