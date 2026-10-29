"use client";

import Link from "next/link";
import { Instrument_Serif } from "next/font/google";
import { useContext, useEffect, useState, useTransition } from "react";
import { SessionContext } from "next-auth/react";
import { Check, Copy, Hourglass, LifeBuoy, Loader2, RotateCw, Wifi, WifiOff } from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatDateTime } from "@/lib/datetime";
import { ROLE_HOME } from "@/lib/roles";
import { cn } from "@/lib/utils";

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

// Tone-on-tone background mark, barely darker than the paper background.
const TONE = { ink: "#e6eee9", mint: "#e9f2ed" };

const CARD = "rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(16,24,20,0.04)]";

function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

/**
 * Role-aware home link. Reads the session context directly (not useSession)
 * because global-error renders outside the SessionProvider.
 */
function useHome() {
  const session = useContext(SessionContext);
  const role = session?.data?.user?.role;
  if (role && ROLE_HOME[role]) return { href: ROLE_HOME[role], label: "Back to dashboard" };
  if (session) return { href: "/login", label: "Go to sign in" };
  return { href: "/", label: "Go to home" };
}

function OnlineBadge({ online }) {
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
        online ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", online ? "bg-primary" : "bg-destructive")} aria-hidden="true" />
      {online ? "You're online" : "You're offline"}
    </span>
  );
}

function CopyReference({ digest, occurredAt }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(`MedScript error ${digest} at ${occurredAt}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (e.g. insecure context); the code is still visible to copy by hand.
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Reference</p>
        <p className="mt-0.5 truncate font-mono text-sm">{digest}</p>
        <p className="text-xs text-muted-foreground">{occurredAt}</p>
      </div>
      <Button variant="outline" size="sm" onClick={copy} className="h-9 rounded-lg px-3" aria-live="polite">
        {copied ? <Check className="h-4 w-4 mr-1.5" aria-hidden="true" /> : <Copy className="h-4 w-4 mr-1.5" aria-hidden="true" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

function Checklist({ online, compact = false }) {
  const rows = [
    { icon: Hourglass, title: "Wait a moment and try again", text: "Most of these clear up within a few seconds." },
    {
      icon: online ? Wifi : WifiOff,
      title: "Check your internet connection",
      text: "MedScript needs a connection to load records.",
      extra: <OnlineBadge online={online} />,
    },
    { icon: LifeBuoy, title: "Still stuck?", text: "Send the reference below to your clinic administrator." },
  ];
  return (
    <ul className={cn("space-y-1", compact && "space-y-0")}>
      {rows.map(({ icon: Icon, title, text, extra }) => (
        <li key={title} className={cn("flex items-start gap-3 rounded-xl px-3", compact ? "py-2" : "py-3")}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
              {title}
              {extra}
            </span>
            <span className="block text-xs text-muted-foreground">{text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Actions({ onRetry, home }) {
  const [retrying, startRetry] = useTransition();
  return (
    <div className="flex flex-wrap gap-3">
      {onRetry && (
        <Button className="h-11 rounded-lg px-5" disabled={retrying} onClick={() => startRetry(() => onRetry())}>
          {retrying ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" aria-hidden="true" />
          ) : (
            <RotateCw className="h-4 w-4 mr-1.5" aria-hidden="true" />
          )}
          {retrying ? "Trying again" : "Try again"}
        </Button>
      )}
      <Link href={home.href} className={cn(buttonVariants({ variant: "outline" }), "h-11 rounded-lg px-4")}>
        {home.label}
      </Link>
    </div>
  );
}

/**
 * Shared fallback for error boundaries.
 * - variant "page": full screen (root error.js and global-error.js).
 * - variant "inline": inside a portal layout, so the sidebar stays usable.
 * Server errors arrive without details in production (only a digest that
 * matches the server logs), so the copy covers the usual cause here: a slow or
 * briefly unreachable database.
 */
export function ErrorState({ error, onRetry, variant = "inline" }) {
  const online = useOnline();
  const home = useHome();
  const [occurredAt] = useState(() => formatDateTime(new Date()));

  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest = error?.digest;
  const cause = online
    ? "We couldn't load this page, most often because the clinic's database was slow to respond. It's usually temporary."
    : "Your device seems to be offline, so this page couldn't load. Reconnect and try again.";

  if (variant === "inline") {
    return (
      <div className="flex justify-center p-4 sm:p-8">
        <div className={cn(CARD, "w-full max-w-xl p-6 sm:p-8 animate-in fade-in-0 slide-in-from-bottom-1 duration-500")}>
          <p className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-destructive" aria-hidden="true" />
            Something went wrong
          </p>
          <h1 className={cn(serif.className, "mt-4 text-[2.5rem] leading-[1.05] tracking-[-0.01em]")}>
            We hit a <span className="italic text-primary">small snag.</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{cause}</p>
          <div className="mt-6">
            <Actions onRetry={onRetry} home={home} />
          </div>
          <div className="mt-6 border-t border-border pt-4">
            <Checklist online={online} compact />
          </div>
          {digest && (
            <div className="mt-2 rounded-xl bg-muted/60 px-4 py-3">
              <CopyReference digest={digest} occurredAt={occurredAt} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground flex flex-col">
      <LogoMark
        palette={TONE}
        title=""
        className="pointer-events-none select-none absolute h-auto w-[90vw] max-w-[620px] -right-[18%] -bottom-[22%] md:right-auto md:-left-[6%] md:-bottom-[34%]"
      />

      <header className="relative px-6 pt-6 md:px-12 md:pt-10">
        <Link href={home.href} className="inline-flex rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
          <Logo markClassName="h-8" />
        </Link>
      </header>

      <main className="relative flex-1 flex items-center px-6 py-12 md:px-12">
        <div className="mx-auto w-full max-w-5xl grid gap-12 md:grid-cols-[1.15fr_1fr] md:items-center">
          <section className="animate-in fade-in-0 slide-in-from-bottom-1 duration-500">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive" aria-hidden="true" />
              Something went wrong
            </p>
            <h1 className={cn(serif.className, "mt-6 text-[3.25rem] leading-[1] tracking-[-0.015em] md:text-[4.5rem]")}>
              We hit a
              <br />
              <span className="italic text-primary">small snag.</span>
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">{cause}</p>
            <div className="mt-8">
              <Actions onRetry={onRetry} home={home} />
            </div>
          </section>

          <section className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-700" aria-label="What you can try">
            <div className={cn(CARD, "p-2")}>
              <p className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                What you can try
              </p>
              <Checklist online={online} />
            </div>
            {digest && (
              <div className={cn(CARD, "p-5")}>
                <CopyReference digest={digest} occurredAt={occurredAt} />
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="relative flex flex-col gap-1 px-6 pb-6 text-xs text-muted-foreground sm:flex-row sm:justify-between md:px-12">
        <span>&copy; {new Date().getFullYear()} MedScript</span>
        <span>Need help? Contact your clinic administrator.</span>
      </footer>
    </div>
  );
}
