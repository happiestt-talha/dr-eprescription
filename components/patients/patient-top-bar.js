"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { KeyRound, LogOut } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export function PatientTopBar() {
  return (
    <header className="flex h-14 items-center justify-between border-b px-4 sm:px-6 bg-background/95 backdrop-blur-sm shrink-0">
      <Logo markClassName="h-7" wordClassName="h-[18px]" px={28} subtitle="My Prescriptions" />
      <div className="flex items-center gap-1">
      <Link
        href="/account/password"
        className="flex min-h-[44px] items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
      >
        <KeyRound className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
        <span className="hidden sm:inline">Change password</span>
        <span className="sr-only sm:hidden">Change password</span>
      </Link>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex min-h-[44px] items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
      >
        <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
        <span>Sign out</span>
      </button>
      </div>
    </header>
  );
}