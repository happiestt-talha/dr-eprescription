"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintButton({ className }) {
  return (
    <Button
      variant="outline"
      onClick={() => window.print()}
      className={className || "w-full sm:w-auto min-h-[44px]"}
    >
      <Printer className="mr-2 h-4 w-4" />
      Print
    </Button>
  );
}