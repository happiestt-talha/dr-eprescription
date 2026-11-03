import { Panel, PanelEmpty } from "@/components/ui/panel";
import Link from "next/link";
import { PageHeader, PageShell } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { adminDashboard } from "@/lib/dashboard";



export default async function AdminDashboard() {
  const { figures, upcoming, activity, doctors, totals } = await adminDashboard();

  const cells = [
    { label: "New patients today", value: figures.newPatientsToday },
    { label: "Prescriptions today", value: figures.prescriptionsToday },
    { label: "Appointments today", value: figures.appointmentsToday },
    { label: "Pending appointments", value: figures.pendingAppointments },
  ];

  const totalsLine = [
    `${totals.totalPatients} patients`,
    `${totals.totalPrescriptions} finalised prescriptions`,
    `${totals.totalDoctors} doctors`,
    `${totals.totalMedicines} medicines`,
    `${totals.totalLabTests} lab tests`,
  ].join(" · ");

  return (
    <PageShell>
      <PageHeader title="Dashboard" description="Today at the clinic" />

      <dl className="grid grid-cols-2 overflow-hidden rounded-lg border bg-card lg:grid-cols-4 lg:divide-x">
        {cells.map((cell, i) => (
          <div
            key={cell.label}
            className={[
              "space-y-1 px-4 py-3",
              // Phone grid lines: a rule between the two columns and between the two rows.
              i % 2 === 0 ? "border-r lg:border-r-0" : "",
              i < 2 ? "border-b lg:border-b-0" : "",
            ].join(" ")}>
            <dt className="text-xs text-muted-foreground">{cell.label}</dt>
            <dd className="text-2xl font-semibold tabular-nums">{cell.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Admins can't open the receptionist portal (proxy.js), so no "View all" here. */}
        <Panel title="Upcoming appointments">
          {upcoming.length === 0 ? (
            <PanelEmpty>Nothing pending.</PanelEmpty>
          ) : (
            <ul className="divide-y">
              {upcoming.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.patientName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Dr. {a.doctorName} · <span className="tabular-nums">{a.when}</span>
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent activity" href="/admin/audit-logs">
          {activity.length === 0 ? (
            <PanelEmpty>No activity recorded yet.</PanelEmpty>
          ) : (
            <ul className="divide-y">
              {activity.map((log) => (
                <li key={log.id}>
                  <Link href="/admin/audit-logs" className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{log.who}</p>
                      <p className="truncate text-xs text-muted-foreground tabular-nums">{log.when}</p>
                    </div>
                    <StatusBadge tone={log.tone} className="max-w-[55%] truncate">{log.label}</StatusBadge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Doctors" href="/admin/doctors">
          {doctors.length === 0 ? (
            <PanelEmpty>No doctors added yet.</PanelEmpty>
          ) : (
            <ul className="divide-y">
              {doctors.map((d) => (
                <li key={d.id}>
                  <Link href={`/admin/doctors/${d.id}`} className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">Dr. {d.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {d.specialization} · added <span className="tabular-nums">{d.added}</span>
                      </p>
                    </div>
                    <StatusBadge status={d.active ? "active" : "inactive"} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <p className="text-xs text-muted-foreground tabular-nums">{totalsLine}</p>
    </PageShell>
  );
}
