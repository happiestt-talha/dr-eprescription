"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Stethoscope, Pill, FlaskConical, LogOut, Menu, FileBarChart, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/admin/medicines", label: "Medicines", icon: Pill },
  { href: "/admin/lab-tests", label: "Lab Tests", icon: FlaskConical },
  { href: "/admin/reports", label: "Reports", icon: FileBarChart },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
];  

function NavContent({ pathname, onLinkClick }) {
  return (
    <div className="flex h-full flex-col justify-between">
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onLinkClick}
              className={cn(
                "flex min-h-[44px] items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex min-h-[44px] w-full items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close sheet when resizing to desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) setOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Mobile/Tablet top bar (< lg) with Sheet drawer */}
      <div className="flex h-14 w-full items-center justify-between border-b px-4 lg:hidden bg-background">
        <span className="font-semibold text-base sm:text-lg">Admin Panel</span>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-muted text-foreground transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 max-w-[85vw] flex flex-col">
            <SheetHeader className="h-14 border-b px-4 flex justify-center">
              <SheetTitle className="text-base sm:text-lg font-semibold text-left">Admin Panel</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-hidden">
              <NavContent pathname={pathname} onLinkClick={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Persistent Desktop Sidebar (lg: 1024px+) */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:border-r bg-background shrink-0">
        <div className="flex h-14 items-center px-4 border-b">
          <span className="font-semibold text-base sm:text-lg">Admin Panel</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavContent pathname={pathname} onLinkClick={() => {}} />
        </div>
      </aside>
    </>
  );
}