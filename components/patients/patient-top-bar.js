"use client";

import { signOut } from "next-auth/react";
import { FileText, LogOut } from "lucide-react";

export function PatientTopBar() {
  return (
    <header className="flex h-14 items-center justify-between border-b px-4 sm:px-6 bg-background shrink-0">
      <div className="flex items-center gap-2 font-semibold text-base sm:text-lg">
        <FileText className="h-5 w-5 text-primary" />
        <span>My Prescriptions</span>
      </div>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex min-h-[44px] items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
      >
        <LogOut className="h-4 w-4" />
        <span>Sign out</span>
      </button>
    </header>
  );
}