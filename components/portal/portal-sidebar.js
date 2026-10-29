"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// Tailwind needs literal class names, so each breakpoint has its own set.
const BREAKPOINTS = {
  md: { mobileOnly: "md:hidden", desktopOnly: "hidden md:flex md:w-60 md:flex-col md:border-r", minWidth: 768 },
  lg: { mobileOnly: "lg:hidden", desktopOnly: "hidden lg:flex lg:w-60 lg:flex-col lg:border-r", minWidth: 1024 },
};

function NavContent({ links, pathname, onLinkClick }) {
  return (
    <div className="flex h-full flex-col justify-between">
      <nav aria-label="Main" className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="px-3 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Navigation
        </p>
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onLinkClick}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-primary/10 text-primary border-l-[3px] border-primary pl-[9px]"
                  : "hover:bg-accent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden="true" />
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
          <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Portal navigation: a persistent sidebar on desktop and an accessible Sheet
 * (focus trap, Escape to close, content hidden from tab order when closed) on
 * smaller screens. Used by every role's layout.
 */
export function PortalSidebar({ links, subtitle, breakpoint = "md" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const bp = BREAKPOINTS[breakpoint];

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= bp.minWidth) setOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [bp.minWidth]);

  const logo = <Logo markClassName="h-7" wordClassName="h-[18px]" px={28} subtitle={subtitle} />;

  return (
    <>
      <div className={cn("flex h-14 w-full items-center justify-between border-b px-4 bg-background shrink-0", bp.mobileOnly)}>
        {logo}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-accent text-foreground transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 max-w-[85vw] flex flex-col">
            <SheetHeader className="h-14 border-b px-4 flex items-center gap-2">
              <SheetTitle className="text-left">{logo}</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-hidden">
              <NavContent links={links} pathname={pathname} onLinkClick={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <aside className={cn("bg-sidebar shrink-0", bp.desktopOnly)}>
        <div className="flex h-14 items-center gap-2.5 px-4 border-b">{logo}</div>
        <div className="flex-1 overflow-y-auto">
          <NavContent links={links} pathname={pathname} />
        </div>
      </aside>
    </>
  );
}
