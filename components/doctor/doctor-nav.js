"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Users, UserPlus, LogOut, Menu, X, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/doctor/patients/new", label: "New Patient", icon: UserPlus },
];

export function DoctorNav({ user }) {
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
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-xs">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/doctor/patients/new" className="flex items-center gap-2 font-semibold text-base sm:text-lg">
            <Stethoscope className="h-5 w-5 text-primary shrink-0" />
            <span className="truncate">Doctor Portal</span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-4 text-sm">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 font-medium transition-colors min-h-[40px]",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}

          <div className="h-4 w-px bg-border" />

          {user?.email && (
            <span className="text-xs text-muted-foreground truncate max-w-[160px]">
              {user.email}
            </span>
          )}

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 rounded-md px-3 py-2 font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[40px]"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex md:hidden h-11 w-11 items-center justify-center rounded-md hover:bg-muted text-foreground transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-64 max-w-[85vw] border-l bg-background p-4 flex flex-col transition-transform duration-200 ease-in-out shadow-xl md:hidden",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-10 items-center justify-between border-b pb-3 mb-3">
          <span className="font-semibold text-base">Doctor Menu</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-muted text-foreground transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {user?.email && (
          <div className="px-2 py-2 mb-2 text-xs text-muted-foreground border-b pb-3">
            Signed in as: <span className="font-medium text-foreground truncate block">{user.email}</span>
          </div>
        )}

        <nav className="flex-1 space-y-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex min-h-[44px] items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-3 border-t">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex min-h-[44px] w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
