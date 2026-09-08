"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Stethoscope, Pill, FlaskConical, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/admin/medicines", label: "Medicines", icon: Pill },
  { href: "/admin/lab-tests", label: "Lab Tests", icon: FlaskConical },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Prevent background scroll while the drawer is open on mobile
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close the drawer automatically if the viewport grows into desktop size
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) setOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b p-4 md:hidden">
        <span className="font-semibold text-lg">Admin Panel</span>
        <button onClick={() => setOpen(true)} className="p-2" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Overlay, mobile only, closes drawer on click */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar / drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r bg-background flex flex-col transition-transform duration-200 ease-in-out",
          "md:static md:w-60 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-semibold text-lg">Admin Panel</span>
          <button onClick={() => setOpen(false)} className="md:hidden p-1" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-3 m-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </aside>
    </>
  );
}