"use client";

import { useSyncExternalStore } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu } from "@base-ui/react/menu";
import { ChevronsUpDown, KeyRound, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_LABELS = {
  admin: "Administrator",
  doctor: "Doctor",
  receptionist: "Receptionist",
  patient: "Patient",
};

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function initialsOf(name) {
  if (!name) return "?";
  return name
    .replace(/^Dr\.?\s+/i, "")
    .split(/[\s.@_-]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const noopSubscribe = () => () => {};

const itemClass =
  "flex w-full cursor-default items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-foreground outline-none data-[highlighted]:bg-accent";

/**
 * The signed-in user's menu: who they are, change password, theme, sign out.
 * `compact` renders only the avatar as the trigger (for the patient top bar);
 * otherwise the trigger is a full-width row for the sidebar footer.
 */
export function AccountMenu({ name, role, compact = false, side = "top", align = "start" }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  // The theme is only known in the browser: false during SSR and hydration,
  // true after, so the radio group doesn't cause a hydration mismatch.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const roleLabel = ROLE_LABELS[role] || role;

  return (
    <Menu.Root>
      <Menu.Trigger
        className={cn(
          "flex items-center gap-2.5 rounded-md text-left outline-none transition-colors hover:bg-accent data-[popup-open]:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50",
          compact ? "p-1" : "w-full min-h-11 px-2 py-1.5"
        )}
        aria-label={`Account menu for ${name || "user"}`}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">
          {initialsOf(name)}
        </span>
        {!compact && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">{name || "User"}</span>
              <span className="block truncate text-xs text-muted-foreground">{roleLabel}</span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </>
        )}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side={side} align={align} sideOffset={6} className="z-50">
          <Menu.Popup className="w-60 origin-[var(--transform-origin)] rounded-lg border bg-popover p-1 text-popover-foreground shadow-md outline-none transition-[opacity,transform] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            {compact && (
              <div className="mb-1 border-b px-2.5 py-2">
                <p className="truncate text-sm font-medium">{name || "User"}</p>
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
              </div>
            )}
            <Menu.Item onClick={() => router.push("/account/password")} className={itemClass}>
              <KeyRound className="size-4 text-muted-foreground" aria-hidden="true" />
              Change password
            </Menu.Item>

            <div className="my-1 border-t" role="separator" />
            <p className="px-2.5 pt-1.5 pb-1 text-xs text-muted-foreground">Theme</p>
            <Menu.RadioGroup value={mounted ? theme : undefined} onValueChange={setTheme}>
              {THEMES.map(({ value, label, icon: Icon }) => (
                <Menu.RadioItem key={value} value={value} closeOnClick={false} className={itemClass}>
                  <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                  <span className="flex-1">{label}</span>
                  <Menu.RadioItemIndicator className="size-1.5 rounded-full bg-primary" />
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>

            <div className="my-1 border-t" role="separator" />
            <Menu.Item
              onClick={() => signOut({ callbackUrl: "/login" })}
              className={cn(itemClass, "data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive")}
            >
              <LogOut className="size-4 text-muted-foreground" aria-hidden="true" />
              Sign out
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
