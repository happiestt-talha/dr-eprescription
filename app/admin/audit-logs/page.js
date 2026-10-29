import { prisma } from "@/lib/db";
import { AuditLogTable } from "@/components/admin/audit-log-table";
import { formatDateTime } from "@/lib/datetime";
import { firstParam } from "@/lib/utils";

const PAGE_SIZE = 30;

export default async function AuditLogsPage({ searchParams }) {
  const params = await searchParams;
  const page = firstParam(params.page) ?? "1";
  const entityType = firstParam(params.entityType);
  const action = firstParam(params.action);
  const currentPage = Math.max(parseInt(page, 10) || 1, 1);

  const where = {
    ...(entityType ? { entityType } : {}),
    ...(action ? { action } : {}),
  };

  const [logs, total, entityTypes, actions] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      // Only the email is shown; never send the user row (passwordHash) to the client.
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ distinct: ["entityType"], select: { entityType: true } }),
    prisma.auditLog.findMany({ distinct: ["action"], select: { action: true } }),
  ]);

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full min-w-0">
      <h1 className="text-xl sm:text-2xl font-semibold">Audit Logs</h1>
      <AuditLogTable
        // Dates are formatted here (clinic timezone) so server and browser render the same text.
        logs={logs.map((log) => ({ ...log, createdAtLabel: formatDateTime(log.createdAt) }))}
        currentPage={currentPage}
        totalPages={totalPages}
        entityTypes={entityTypes.map((e) => e.entityType)}
        actions={actions.map((a) => a.action)}
        activeEntityType={entityType || ""}
        activeAction={action || ""}
      />
    </div>
  );
}