import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  FileEdit,
  FileText,
  LayoutDashboard,
  LogIn,
  ScrollText,
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

export const metadata = { title: "Page not found" };

// Tone-on-tone background mark: barely darker than the page, in either theme.
const TONE = {
  ink: "color-mix(in oklch, var(--foreground) 6%, var(--background))",
  mint: "color-mix(in oklch, var(--primary) 7%, var(--background))",
};

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
    { href: "/admin/doctors", icon: Stethoscope, title: "Doctors", text: "Doctor accounts and access" },
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
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Error 404</p>
            <h1 className="mt-4 font-display text-5xl leading-none tracking-[-0.015em] md:text-7xl">
              Page <span className="italic text-primary">not found.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
              The link may be old or mistyped, the record may have been removed, or you may not have access to it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={home} className={cn(buttonVariants({ size: "touch" }), "md:h-11 md:px-5")}>
                {role ? "Back to dashboard" : "Sign in"}
              </Link>
              <GoBackButton />
            </div>
          </section>

          <section className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-700" aria-label="Where to go next">
            <div className="rounded-lg border border-border bg-card p-2">
              <p className="px-3 pt-2 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Go to</p>
              <ul>
                {links.map(({ href, icon: Icon, title, text }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="group flex items-center gap-3 rounded-md px-3 py-3 transition-colors hover:bg-muted focus-visible:bg-muted outline-none"
                    >
                      <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
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

            <div className="rounded-lg border border-border bg-card p-5">
              <div className="mb-3">
                <h2 className="text-sm font-medium">Checking a prescription?</h2>
                <p className="text-xs text-muted-foreground">
                  Enter the code printed on it, or scan its QR code.
                </p>
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
