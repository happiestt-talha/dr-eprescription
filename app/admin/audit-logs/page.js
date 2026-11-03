import { prisma } from "@/lib/db";
import { PageHeader, PageShell } from "@/components/ui/page-header";
import { AuditLogTable } from "@/components/admin/audit-log-table";
import { formatDateTime, parseClinicDateTime, startOfClinicDay } from "@/lib/datetime";
import { firstParam } from "@/lib/utils";
import { calendarDate } from "@/lib/rules";

const PAGE_SIZE = 30;

// The audit log grows without bound, so unlike other lists it is filtered,
// searched and paged on the server (every page, not just the loaded one).
export default async function AuditLogsPage({ searchParams }) {
  const params = await searchParams;
  const q = (firstParam(params.q) ?? "").trim().slice(0, 100);
  const entityType = firstParam(params.entityType) ?? "";
  const action = firstParam(params.action) ?? "";
  const from = calendarDate(firstParam(params.from)).value ?? "";
  const to = calendarDate(firstParam(params.to)).value ?? "";
  const requestedPage = Math.max(parseInt(firstParam(params.page) ?? "1", 10) || 1, 1);

  const createdAt = {
    ...(from ? { gte: parseClinicDateTime(from) } : {}),
    ...(to ? { lt: startOfClinicDay(parseClinicDateTime(to), 1) } : {}),
  };
  const where = {
    ...(entityType ? { entityType } : {}),
    ...(action ? { action } : {}),
    ...(from || to ? { createdAt } : {}),
    ...(q
      ? {
          OR: [
            { action: { contains: q.replace(/\s+/g, "_"), mode: "insensitive" } },
            { entityType: { contains: q, mode: "insensitive" } },
            { entityId: { startsWith: q.toLowerCase() } },
            { user: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const select = {
    id: true,
    action: true,
    entityType: true,
    entityId: true,
    details: true,
    createdAt: true,
    // Only the email is shown; never send the user row (passwordHash) to the client.
    user: { select: { email: true } },
  };
  const fetchPage = (page) => prisma.auditLog.findMany({ where, select, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE });

  // Filter options: distinct values (cheap with the entityType/action index).
  let [logs, total, entityTypes, actions] = await Promise.all([
    fetchPage(requestedPage),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ distinct: ["entityType"], select: { entityType: true }, orderBy: { entityType: "asc" } }),
    prisma.auditLog.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } }),
  ]);
  const lastPage = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  // An old link past the end shows the last page rather than "page 9 of 3".
  const page = Math.min(requestedPage, lastPage);
  if (page !== requestedPage) logs = await fetchPage(page);

  return (
    <PageShell>
      <PageHeader title="Audit logs" description="Every change made in the system, newest first." />
      <AuditLogTable
        // Formatted here (clinic timezone) so server and browser render the same text.
        logs={logs.map((log) => ({
          id: log.id,
          action: log.action,
          entityType: log.entityType,
          entityShort: log.entityId.slice(0, 8),
          email: log.user?.email ?? "—",
          when: formatDateTime(log.createdAt),
          details: log.details ? JSON.stringify(log.details).slice(0, 500) : "",
        }))}
        page={page}
        lastPage={lastPage}
        total={total}
        pageSize={PAGE_SIZE}
        entityTypes={entityTypes.map((e) => e.entityType)}
        actions={actions.map((a) => a.action)}
        current={{ q, entityType, action, from, to }}
      />
    </PageShell>
  );
}
