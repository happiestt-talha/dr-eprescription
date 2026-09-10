import { prisma } from "@/lib/db";
import { ReportGeneratorForm } from "@/components/admin/report-generator-form";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function ReportsPage() {
  const [pastReports, doctors] = await Promise.all([
    prisma.report.findMany({ orderBy: { generatedAt: "desc" }, take: 30 }),
    prisma.doctor.findMany({ orderBy: { fullName: "asc" } }),
  ]);

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 w-full min-w-0">
      <h1 className="text-xl sm:text-2xl font-semibold">Reports</h1>

      <ReportGeneratorForm doctors={doctors} />

      <div>
        <h2 className="text-base sm:text-lg font-medium mb-3">Recent Reports</h2>

        {/* Mobile Card View (< md: 768px) */}
        <div className="md:hidden space-y-3">
          {pastReports.map((r) => (
            <div key={r.id} className="border rounded-lg p-4 bg-card space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <span className="font-semibold capitalize text-sm">{r.reportType} Report</span>
                  <span className="ml-2 text-xs uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    {r.format}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Generated: {r.generatedAt.toLocaleString()}
              </p>
              <div className="pt-2 border-t">
                <a
                  href={r.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "w-full min-h-[44px] flex items-center justify-center gap-2"
                  )}
                >
                  <Download className="h-4 w-4" />
                  <span>Download {r.format.toUpperCase()}</span>
                </a>
              </div>
            </div>
          ))}
          {pastReports.length === 0 && (
            <div className="text-center text-muted-foreground py-8 border rounded-lg bg-card text-sm">
              No reports generated yet.
            </div>
          )}
        </div>

        {/* Desktop & Tablet Table (>= md: 768px) */}
        <div className="hidden md:block rounded-md border overflow-x-auto w-full">
          <Table className="min-w-[500px] w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead className="text-right">Download</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pastReports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="capitalize font-medium">{r.reportType}</TableCell>
                  <TableCell className="uppercase">{r.format}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.generatedAt.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <a
                      href={r.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-muted transition-colors"
                      aria-label={`Download ${r.reportType} report`}
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
              {pastReports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No reports generated yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}