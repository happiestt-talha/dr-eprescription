"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, Pill, Activity, Stethoscope } from "lucide-react";

export function PrescriptionViewTabs({
  overviewContent,
  medicinesContent,
  vitalsContent,
  testsContent,
}) {
  return (
    <Tabs defaultValue="all" className="w-full space-y-4">
      <TabsList className="inline-flex h-10 items-center justify-start rounded-lg bg-muted/60 p-1 text-muted-foreground w-full sm:w-auto overflow-x-auto">
        <TabsTrigger value="all" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3">
          <FileText className="h-4 w-4" strokeWidth={1.75} />
          <span>Full Prescription</span>
        </TabsTrigger>
        {medicinesContent && (
          <TabsTrigger value="medicines" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3">
            <Pill className="h-4 w-4" strokeWidth={1.75} />
            <span>Medicines</span>
          </TabsTrigger>
        )}
        {vitalsContent && (
          <TabsTrigger value="vitals" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3">
            <Activity className="h-4 w-4" strokeWidth={1.75} />
            <span>Vitals & Notes</span>
          </TabsTrigger>
        )}
        {testsContent && (
          <TabsTrigger value="tests" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3">
            <Stethoscope className="h-4 w-4" strokeWidth={1.75} />
            <span>Lab Tests</span>
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="all" className="mt-0 space-y-4 focus-visible:outline-none">
        {overviewContent}
      </TabsContent>

      {medicinesContent && (
        <TabsContent value="medicines" className="mt-0 space-y-4 focus-visible:outline-none">
          {medicinesContent}
        </TabsContent>
      )}

      {vitalsContent && (
        <TabsContent value="vitals" className="mt-0 space-y-4 focus-visible:outline-none">
          {vitalsContent}
        </TabsContent>
      )}

      {testsContent && (
        <TabsContent value="tests" className="mt-0 space-y-4 focus-visible:outline-none">
          {testsContent}
        </TabsContent>
      )}
    </Tabs>
  );
}
