"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User, History } from "lucide-react";

export function PatientProfileTabs({ profileContent, historyContent, historyCount = 0 }) {
  return (
    <Tabs defaultValue="profile" className="w-full space-y-4">
      <TabsList className="grid w-full grid-cols-2 max-w-xs h-10 p-1 bg-muted/60">
        <TabsTrigger value="profile" className="flex items-center gap-2 text-xs sm:text-sm font-medium">
          <User className="h-4 w-4" strokeWidth={1.75} />
          <span>Profile</span>
        </TabsTrigger>
        <TabsTrigger value="history" className="flex items-center gap-2 text-xs sm:text-sm font-medium">
          <History className="h-4 w-4" strokeWidth={1.75} />
          <span>History ({historyCount})</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-0 focus-visible:outline-none">
        {profileContent}
      </TabsContent>

      <TabsContent value="history" className="mt-0 focus-visible:outline-none">
        {historyContent}
      </TabsContent>
    </Tabs>
  );
}
