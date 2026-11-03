"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { AccountMenu } from "@/components/portal/account-menu";

/** The patient portal's header: logo and the account menu (password, theme, sign out). */
export function PatientTopBar({ name }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b bg-background px-4 sm:px-6">
      <Link href="/patient" className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
        <Logo markClassName="h-7" wordClassName="h-[18px]" px={28} subtitle="Patient" />
      </Link>
      <AccountMenu name={name} role="patient" compact side="bottom" align="end" />
    </header>
  );
}
