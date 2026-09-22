import { prisma } from "@/lib/db";
import { ReportGeneratorForm } from "@/components/admin/report-generator-form";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Download, FileBarChart, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function ReportsPage() {
  const [pastReports, doctors] = await Promise.all([
    prisma.report.findMany({ orderBy: { generatedAt: "desc" }, take: 30 }),
    prisma.doctor.findMany({ orderBy: { fullName: "asc" } }),
  ]);

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 w-full min-w-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Analytics & Reports</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Generate, export, and download clinic activity summaries.
        </p>
      </div>

      <ReportGeneratorForm doctors={doctors} />

      <div>
        <h2 className="text-base sm:text-lg font-semibold mb-3">Generated Reports History</h2>

        {/* Mobile Card View (< md: 768px) */}
        <div className="md:hidden space-y-3">
          {pastReports.map((r) => (
            <div key={r.id} className="border border-border/60 rounded-xl p-4 bg-card space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <FileBarChart className="h-4 w-4 text-primary" strokeWidth={1.75} />
                  <span className="font-semibold capitalize text-sm">{r.reportType} Report</span>
                </div>
                <span className="text-xs uppercase px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono font-medium">
                  {r.format}
                </span>
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
                    "w-full min-h-[44px] flex items-center justify-center gap-2 text-xs"
                  )}
                >
                  <Download className="h-4 w-4" strokeWidth={1.75} />
                  <span>Download {r.format.toUpperCase()}</span>
                </a>
              </div>
            </div>
          ))}
          {pastReports.length === 0 && (
            <div className="text-center text-muted-foreground py-12 border border-dashed rounded-xl bg-card">
              <FileBarChart className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" strokeWidth={1.5} />
              <p className="font-medium text-foreground">No reports generated yet</p>
              <p className="text-xs text-muted-foreground mt-1">Use the generator above to create your first report.</p>
            </div>
          )}
        </div>

        {/* Desktop & Tablet Table (>= md: 768px) */}
        <div className="hidden md:block rounded-xl border border-border/60 overflow-hidden bg-card shadow-xs">
          <Table className="min-w-[500px] w-full">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Report Type</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Generated At</TableHead>
                <TableHead className="text-right">Download</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pastReports.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="capitalize font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <FileBarChart className="h-4 w-4 text-primary shrink-0" strokeWidth={1.75} />
                      {r.reportType}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs uppercase px-2 py-0.5 rounded-md bg-muted font-mono font-medium text-muted-foreground">
                      {r.format}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {r.generatedAt.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <a
                      href={r.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                      aria-label={`Download ${r.reportType} report`}
                    >
                      <Download className="h-4 w-4" strokeWidth={1.75} />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
              {pastReports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-16">
                    <FileBarChart className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" strokeWidth={1.5} />
                    <p className="font-medium text-foreground">No reports generated yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Use the generator above to create your first report.</p>
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