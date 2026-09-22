"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateReport } from "@/lib/actions/reports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FileBarChart, Sparkles } from "lucide-react";

const reportTypes = [
  { value: "patients", label: "Patients Report" },
  { value: "prescriptions", label: "Prescriptions Report" },
  { value: "appointments", label: "Appointments Report" },
  { value: "doctors", label: "Doctors Directory" },
  { value: "medicines", label: "Medicines Formulary" },
];

export function ReportGeneratorForm({ doctors }) {
  const router = useRouter();
  const [reportType, setReportType] = useState("patients");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const showDoctorFilter = reportType === "prescriptions" || reportType === "appointments";
  const showDateFilter = reportType !== "doctors" && reportType !== "medicines";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.target);
    const res = await generateReport(formData);

    setLoading(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    window.open(res.fileUrl, "_blank");
    router.refresh();
  }

  return (
    <Card className="border-border/60 shadow-xs">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <FileBarChart className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Generate New Report</h2>
            <p className="text-xs text-muted-foreground">Select report scope, format, and optional date range.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Report Dataset</Label>
            <Select name="reportType" value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-full min-h-[44px] md:min-h-[38px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {reportTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Export Format</Label>
            <Select name="format" defaultValue="pdf">
              <SelectTrigger className="w-full min-h-[44px] md:min-h-[38px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="csv">CSV Spreadsheet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showDateFilter && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="from" className="text-xs font-semibold">From Date</Label>
                <Input id="from" name="from" type="date" className="min-h-[44px] md:min-h-[38px] w-full" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="to" className="text-xs font-semibold">To Date</Label>
                <Input id="to" name="to" type="date" className="min-h-[44px] md:min-h-[38px] w-full" />
              </div>
            </>
          )}

          {showDoctorFilter && (
            <div className="space-y-1.5 col-span-1 sm:col-span-2">
              <Label className="text-xs font-semibold">Filter by Doctor (optional)</Label>
              <Select name="doctorId">
                <SelectTrigger className="w-full min-h-[44px] md:min-h-[38px]"><SelectValue placeholder="All doctors" /></SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>Dr. {d.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <Button type="submit" disabled={loading} className="w-full min-h-[44px] md:min-h-[38px] shadow-xs">
              {loading ? "Generating..." : "Generate Report"}
            </Button>
          </div>
        </form>

        {error && <p className="text-sm font-medium text-destructive mt-3">{error}</p>}
      </CardContent>
    </Card>
  );
}