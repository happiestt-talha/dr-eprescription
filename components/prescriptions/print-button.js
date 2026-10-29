"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { cn } from "@/lib/utils";

export function PrintButton({ className }) {
  return (
    <Button
      variant="outline"
      onClick={() => window.print()}
      className={cn(className || "w-full sm:w-auto min-h-[44px]", "print:hidden")}
    >
      <Printer className="mr-2 h-4 w-4" />
      Print
    </Button>
  );
}