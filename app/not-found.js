import Link from "next/link";
import { Instrument_Serif } from "next/font/google";
import {
  ArrowUpRight,
  CalendarClock,
  FileEdit,
  FileText,
  LayoutDashboard,
  LogIn,
  ScrollText,
  ShieldCheck,
  Stethoscope,
  Users,
  FileBarChart,
} from "lucide-react";
import { auth } from "@/auth";
import { Logo, LogoMark } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { GoBackButton, VerifyCodeForm } from "@/components/not-found-actions";
import { ROLE_HOME } from "@/lib/roles";
import { cn } from "@/lib/utils";

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

export const metadata = { title: "Page not found" };

// Tone-on-tone background mark: barely darker than the paper background.
const TONE = { ink: "#e6eee9", mint: "#e9f2ed" };

// Useful places to go next, per role.
const QUICK_LINKS = {
  doctor: [
    { href: "/doctor/patients", icon: Users, title: "Patients", text: "Search patients and start a prescription" },
    { href: "/doctor/drafts", icon: FileEdit, title: "Drafts", text: "Finish prescriptions you started" },
    { href: "/doctor/dashboard", icon: LayoutDashboard, title: "Dashboard", text: "Today's appointments and activity" },
  ],
  receptionist: [
    { href: "/receptionist/appointments", icon: CalendarClock, title: "Appointments", text: "Today's and upcoming bookings" },
    { href: "/receptionist/patients", icon: Users, title: "Patients", text: "Register or find a patient" },
  ],
  admin: [
    { href: "/admin/doctors", icon: Stethoscope, title: "Doctors", text: "Manage doctor accounts" },
    { href: "/admin/reports", icon: FileBarChart, title: "Reports", text: "Generate PDF and CSV reports" },
    { href: "/admin/audit-logs", icon: ScrollText, title: "Audit logs", text: "Review recent activity" },
  ],
  patient: [{ href: "/patient/prescriptions", icon: FileText, title: "My prescriptions", text: "View and download your prescriptions" }],
  guest: [{ href: "/login", icon: LogIn, title: "Sign in", text: "Doctors, reception and patients" }],
};

export default async function NotFound() {
  const session = await auth().catch(() => null);
  const role = session?.user?.role;
  const home = role ? ROLE_HOME[role] : "/login";
  const links = QUICK_LINKS[role] ?? QUICK_LINKS.guest;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground flex flex-col">
      <LogoMark
        palette={TONE}
        title=""
        className="pointer-events-none select-none absolute h-auto w-[90vw] max-w-[620px] -right-[18%] -bottom-[22%] md:right-auto md:-left-[6%] md:-bottom-[34%]"
      />

      <header className="relative px-6 pt-6 md:px-12 md:pt-10">
        <Link href={home} className="inline-flex rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
          <Logo markClassName="h-8" />
        </Link>
      </header>

      <main className="relative flex-1 flex items-center px-6 py-12 md:px-12">
        <div className="mx-auto w-full max-w-5xl grid gap-12 md:grid-cols-[1.15fr_1fr] md:items-center">
          <section className="animate-in fade-in-0 slide-in-from-bottom-1 duration-500">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
              Error 404
            </p>
            <h1 className={cn(serif.className, "mt-6 text-[3.25rem] leading-[1] tracking-[-0.015em] md:text-[4.5rem]")}>
              This page has
              <br />
              <span className="italic" style={{ color: "var(--color-primary)" }}>
                gone missing.
              </span>
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              The link may be old or mistyped, the record may have been removed, or you may not have access to it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={home} className={cn(buttonVariants(), "h-11 rounded-lg px-5")}>
                {role ? "Back to dashboard" : "Sign in"}
              </Link>
              <GoBackButton />
            </div>
          </section>

          <section className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-700" aria-label="Where to go next">
            <div className="rounded-2xl border border-border bg-card p-2 shadow-[0_1px_2px_rgba(16,24,20,0.04)]">
              <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {role ? "Where you might want to go" : "Get started"}
              </p>
              <ul>
                {links.map(({ href, icon: Icon, title, text }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted focus-visible:bg-muted outline-none"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{title}</span>
                        <span className="block truncate text-xs text-muted-foreground">{text}</span>
                      </span>
                      <ArrowUpRight
                        className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,24,20,0.04)]">
              <div className="mb-3 flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-sm font-medium">Checking a prescription?</h2>
                  <p className="text-xs text-muted-foreground">
                    Enter the code printed on it, or scan its QR code for full verification.
                  </p>
                </div>
              </div>
              <VerifyCodeForm />
            </div>
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
