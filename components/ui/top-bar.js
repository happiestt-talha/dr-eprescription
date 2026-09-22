"use client";

import { signOut } from "next-auth/react";
import { LogOut, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const roleLabels = {
  admin: "Administrator",
  doctor: "Doctor",
  receptionist: "Receptionist",
  patient: "Patient",
};

export function TopBar({ title, userName, userRole }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const initials = getInitials(userName);
  const greeting = userRole === "doctor"
    ? `Welcome back, Dr. ${userName?.split(" ")[0] || ""}`
    : `Welcome back, ${userName?.split(" ")[0] || ""}`;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur-sm px-4 sm:px-6 shrink-0">
      {/* Left: Title */}
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-sm font-semibold text-foreground truncate">
          {title}
        </h1>
      </div>

      {/* Right: Greeting + Avatar + Menu */}
      <div className="flex items-center gap-3" ref={menuRef}>
        {/* Greeting — hidden on small screens */}
        <span className="hidden md:block text-sm text-muted-foreground truncate max-w-[240px]">
          {greeting}
        </span>

        {/* Avatar + dropdown trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors"
            aria-label="User menu"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0">
              {initials}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-56 rounded-lg border bg-popover p-1.5 shadow-lg z-50 animate-in fade-in-0 zoom-in-95">
              <div className="px-3 py-2.5 border-b mb-1.5">
                <p className="text-sm font-medium text-foreground truncate">
                  {userName || "User"}
                </p>
                <span className="inline-flex items-center mt-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-medium">
                  {roleLabels[userRole] || userRole}
                </span>
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
