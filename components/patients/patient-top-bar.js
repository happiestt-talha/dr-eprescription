"use client";

import { signOut } from "next-auth/react";
import { FileText, LogOut } from "lucide-react";

export function PatientTopBar() {
  return (
    <header className="flex h-14 items-center justify-between border-b px-4 sm:px-6 bg-background/95 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-2.5 font-semibold text-base sm:text-lg">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-[18px] w-[18px] text-primary" strokeWidth={1.75} />
        </div>
        <span>My Prescriptions</span>
      </div>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex min-h-[44px] items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
      >
        <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
        <span>Sign out</span>
      </button>
    </header>
  );
}