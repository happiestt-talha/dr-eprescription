"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut, ChevronDown } from "lucide-react";
import { Menu } from "@base-ui/react/menu";

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
  const router = useRouter();
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
      <div className="flex items-center gap-3">
        {/* Greeting — hidden on small screens */}
        <span className="hidden md:block text-sm text-muted-foreground truncate max-w-[240px]">
          {greeting}
        </span>

        {/* Base UI Menu: keyboard navigation, Escape to close and focus return. */}
        <Menu.Root>
          <Menu.Trigger
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent data-[popup-open]:bg-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-label={`Account menu for ${userName || "user"}`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0">
              {initials}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" aria-hidden="true" />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner align="end" sideOffset={6} className="z-50">
              <Menu.Popup className="w-56 rounded-lg border bg-popover p-1.5 shadow-lg outline-none origin-[var(--transform-origin)] transition-[opacity,transform] data-[starting-style]:opacity-0 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:scale-95">
                <div className="px-3 py-2.5 border-b mb-1.5">
                  <p className="text-sm font-medium text-foreground truncate">{userName || "User"}</p>
                  <span className="inline-flex items-center mt-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-medium">
                    {roleLabels[userRole] || userRole}
                  </span>
                </div>
                <Menu.Item
                  onClick={() => router.push("/account/password")}
                  className="flex w-full cursor-default items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground outline-none data-[highlighted]:text-foreground data-[highlighted]:bg-accent"
                >
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  <span>Change password</span>
                </Menu.Item>
                <Menu.Item
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full cursor-default items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground outline-none data-[highlighted]:text-destructive data-[highlighted]:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>Sign out</span>
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </div>
    </header>
  );
}
