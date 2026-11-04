"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateReport } from "@/lib/actions/reports";
import { Form, FormStatus, SubmitButton } from "@/components/ui/form";
import { Field } from "@/components/ui/form-layout";
import { DatePicker } from "@/components/ui/date-picker";
import { clinicDateKey } from "@/lib/datetime";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";

const reportTypes = [
  { value: "patients", label: "Patients report" },
  { value: "prescriptions", label: "Prescriptions report" },
  { value: "appointments", label: "Appointments report" },
  { value: "doctors", label: "Doctors report" },
  { value: "medicines", label: "Medicines report" },
];

export function ReportGeneratorForm({ doctorItems }) {
  const router = useRouter();
  const [reportType, setReportType] = useState("patients");
  const [readyUrl, setReadyUrl] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const showDoctorFilter = reportType === "prescriptions" || reportType === "appointments";
  const showDateFilter = reportType !== "doctors" && reportType !== "medicines";

  async function handleSubmit(formData) {
    setReadyUrl("");
    const res = await generateReport(formData);
    if (!res?.error) {
      // A link instead of window.open: browsers block pop-ups opened after an await.
      setReadyUrl(res.fileUrl);
      router.refresh();
    }
    return res;
  }

  const reportTypeLabels = Object.fromEntries(reportTypes.map((t) => [t.value, t.label]));

  return (
    <section className="rounded-lg border bg-card p-4 sm:p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-foreground">Generate report</h2>
          <p className="text-sm text-muted-foreground">The date range is optional.</p>
        </div>

        <Form onSubmit={handleSubmit} keepPendingOnSuccess={false} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          <div className="space-y-1.5">
            <Label htmlFor="reportType" className="text-sm font-medium">Report type</Label>
            <Select name="reportType" value={reportType} onValueChange={setReportType} items={reportTypeLabels}>
              <SelectTrigger id="reportType" className="w-full h-11 md:h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {reportTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="format" className="text-sm font-medium">Format</Label>
            <Select name="format" defaultValue="pdf" items={{ pdf: "PDF", csv: "CSV (spreadsheet)" }}>
              <SelectTrigger id="format" className="w-full h-11 md:h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="csv">CSV (spreadsheet)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showDateFilter && (
            <>
              <Field label="From date" htmlFor="from">
                <DatePicker id="from" name="from" label="From date" value={from} onValueChange={setFrom} max={to || clinicDateKey()} placeholder="Any start" />
              </Field>
              <Field label="To date" htmlFor="to">
                <DatePicker id="to" name="to" label="To date" value={to} onValueChange={setTo} min={from || undefined} max={clinicDateKey()} placeholder="Up to today" />
              </Field>
            </>
          )}

          {showDoctorFilter && (
            <div className="space-y-1.5 col-span-1 sm:col-span-2">
              <Label htmlFor="doctorId" className="text-sm font-medium">Doctor (optional)</Label>
              <Combobox
                id="doctorId"
                name="doctorId"
                items={doctorItems}
                placeholder="All doctors"
                emptyText="No doctors match"
              />
            </div>
          )}

          <div className="col-span-1 sm:col-span-2 lg:col-span-1 lg:pt-7">
            <SubmitButton pendingText="Generating…" className="w-full h-11 md:h-10">
              Generate report
            </SubmitButton>
          </div>
          <div className="col-span-full">
            <FormStatus variant="dialog" />
          </div>
        </Form>
        {readyUrl && (
          <p role="status" className="text-sm mt-3">
            Report ready.{" "}
            <a href={readyUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-2">
              Download report
            </a>
          </p>
        )}
    </section>
  );
}