import Image from "next/image";
import { Activity, ShieldCheck, Clock, Users, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Sign In — DocRx E-Prescription Portal",
  description: "Secure healthcare electronic prescription and clinical management system",
};

export default function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen w-full flex flex-col md:flex-row bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* 
        LEFT HALF: Branded Visual Panel (Desktop / Tablet md+)
        Features custom 3D healthcare hero image, primary/accent gradient,
        brand identity, tagline, and key feature highlights.
      */}
      <aside className="hidden md:flex md:w-[46%] lg:w-[48%] xl:w-[46%] shrink-0 relative flex-col justify-between p-8 lg:p-10 xl:p-12 border-r border-border/60 bg-gradient-to-br from-primary/15 via-primary/5 to-accent/25 dark:from-primary/20 dark:via-background dark:to-primary/10 overflow-y-auto">
        {/* Abstract healthcare SVG line art & background geometry */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-40 dark:opacity-20" />

          {/* Ambient glowing radial orbs */}
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-accent/40 dark:bg-primary/15 blur-3xl" />

          {/* Subtle ECG pulse line illustration */}
          <svg
            className="absolute bottom-20 -left-10 w-[130%] h-44 opacity-20 dark:opacity-15 text-primary"
            viewBox="0 0 800 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 100 L180 100 L200 70 L220 130 L240 40 L265 160 L290 85 L310 105 L330 100 L480 100 L500 60 L525 150 L550 30 L575 170 L600 95 L620 100 L800 100"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Scattered subtle medical cross icons */}
          <span className="absolute top-20 right-14 text-primary/25 font-mono text-2xl font-light">+</span>
          <span className="absolute top-1/2 left-8 text-primary/20 font-mono text-3xl font-light">+</span>
          <span className="absolute bottom-36 right-10 text-primary/25 font-mono text-xl font-light">+</span>
        </div>

        {/* Brand identity at the top of left panel */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/25">
            <Activity className="h-5 w-5" strokeWidth={2.4} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-foreground">DocRx</span>
              <span className="rounded-full bg-primary/15 text-primary text-[10px] font-semibold px-2 py-0.5 uppercase tracking-wider">
                Clinical Suite
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Digital Prescription &amp; Clinic System</p>
          </div>
        </div>

        {/* Center Section: Headline, Hero Image & Feature Highlights */}
        <div className="relative z-10 my-auto py-6 space-y-5">
          <div className="space-y-2">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground leading-[1.25]">
              Digital Prescriptions &amp; Intelligent Clinic Care
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md">
              Manage your clinic, prescriptions, and patients in one streamlined, secure platform.
            </p>
          </div>

          {/* Dedicated Healthcare Hero Illustration */}
          <div className="relative rounded-2xl overflow-hidden border border-border/80 shadow-md shadow-primary/10 group bg-card/60 backdrop-blur-xs">
            <Image
              src="/auth-hero.jpg"
              alt="Clinical E-Prescription Tablet with Stethoscope and Security Shield"
              width={640}
              height={480}
              priority
              className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-foreground font-medium px-2 py-1 rounded-lg bg-card/80 backdrop-blur-md border border-border/60">
              <span className="flex items-center gap-1.5 text-primary">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                Live PMDC Verification
              </span>
              <span className="text-muted-foreground">QR E-Prescription</span>
            </div>
          </div>

          {/* 3 Feature Highlights with Lucide Icons */}
          <div className="grid grid-cols-1 gap-2.5 pt-1">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-card/70 backdrop-blur-xs border border-border/80 shadow-xs transition-colors hover:border-primary/40">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Secure Patient Records</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                  PMDC-compliant electronic health records with tamper-evident digital signatures.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-card/70 backdrop-blur-xs border border-border/80 shadow-xs transition-colors hover:border-primary/40">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Faster Prescriptions</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                  Formulate accurate digital prescriptions with dosage presets in under 30 seconds.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-card/70 backdrop-blur-xs border border-border/80 shadow-xs transition-colors hover:border-primary/40">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Multi-Role Access</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                  Unified operational dashboards for Doctors, Receptionists, and Clinic Administrators.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Left Panel Footer reassurance */}
        <div className="relative z-10 pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>PMDC Compliant • 256-Bit SSL Encrypted</span>
          </div>
          <span className="font-mono text-[11px] opacity-75">v2.4.0</span>
        </div>
      </aside>

      {/* 
        RIGHT HALF: The Form Container
        Full screen on mobile/tablet (< md), 52-55% on desktop, vertically centered 
      */}
      <main className="flex-1 flex flex-col justify-between min-h-screen md:h-screen overflow-y-auto">
        {/* Mobile-only compact header band */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-xs">
              <Activity className="h-4 w-4" strokeWidth={2.4} />
            </div>
            <span className="font-bold text-base tracking-tight text-foreground">DocRx</span>
          </div>
          <span className="rounded-full bg-primary/15 text-primary text-[10px] font-semibold px-2 py-0.5">
            Clinical Portal
          </span>
        </header>

        {/* Vertically centered form content */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
          {children}
        </div>

        {/* Discreet bottom copyright footer */}
        <footer className="py-4 px-6 text-center text-xs text-muted-foreground/60 border-t border-border/40 md:border-t-0">
          &copy; {new Date().getFullYear()} DocRx Electronic Prescription System. All rights reserved.
        </footer>
      </main>
    </div>
  );
}
