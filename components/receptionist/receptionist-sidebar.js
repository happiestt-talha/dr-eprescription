"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { CalendarClock, Users, LogOut, Menu, X, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/receptionist/appointments", label: "Appointments", icon: CalendarClock },
  { href: "/receptionist/patients", label: "Patients", icon: Users },
];

export function ReceptionistSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) setOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <div className="flex h-14 w-full items-center justify-between border-b px-4 md:hidden bg-background shrink-0">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary shrink-0" strokeWidth={1.75} />
          <span className="font-semibold text-base sm:text-lg">Reception</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-accent text-foreground transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r bg-sidebar flex flex-col transition-transform duration-200 ease-in-out shrink-0",
          "md:static md:w-60 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between px-4 border-b">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary shrink-0" strokeWidth={1.75} />
            <span className="font-semibold text-base sm:text-lg">Reception</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg hover:bg-accent text-foreground transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="px-3 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Navigation
          </p>
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-primary/10 text-primary border-l-[3px] border-primary pl-[9px]"
                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex min-h-[44px] w-full items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}