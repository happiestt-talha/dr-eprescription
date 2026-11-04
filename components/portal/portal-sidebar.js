"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { AccountMenu } from "@/components/portal/account-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const DESKTOP_MIN_WIDTH = 768;

function NavContent({ links, pathname, user, onLinkClick }) {
  return (
    <div className="flex h-full flex-col justify-between">
      <nav aria-label="Main" className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onLinkClick}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors md:min-h-9",
                active
                  ? "bg-sidebar-accent font-medium text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
              )}
            >
              <Icon className={cn("size-4 shrink-0", active && "text-primary")} strokeWidth={1.75} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-2">
        <AccountMenu name={user?.name} role={user?.role} />
      </div>
    </div>
  );
}

/**
 * Portal navigation: a persistent sidebar on desktop and an accessible Sheet
 * (focus trap, Escape to close, content hidden from tab order when closed) on
 * smaller screens. The account menu (password, theme, sign out) sits in the
 * footer. Used by every staff role's layout.
 */
export function PortalSidebar({ links, subtitle, user }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= DESKTOP_MIN_WIDTH) setOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const logo = <Logo markClassName="h-7" wordClassName="h-[18px]" px={28} subtitle={subtitle} />;
  const sidebarLogo = <Logo markClassName="h-7" wordClassName="h-[18px]" px={28} subtitle={subtitle} bg="var(--sidebar)" />;

  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 w-full shrink-0 items-center justify-between border-b bg-background px-4 md:hidden">
        {logo}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="flex size-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </SheetTrigger>
          <SheetContent side="left" className="flex w-64 max-w-[85vw] flex-col p-0">
            <SheetHeader className="flex h-14 items-center gap-2 border-b px-4">
              <SheetTitle className="text-left">{logo}</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-hidden">
              <NavContent links={links} pathname={pathname} user={user} onLinkClick={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Fixed to the viewport; the layout pads the content column by the same w-60. */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-14 items-center px-4">{sidebarLogo}</div>
        <div className="flex-1 overflow-hidden">
          <NavContent links={links} pathname={pathname} user={user} />
        </div>
      </aside>
    </>
  );
}
