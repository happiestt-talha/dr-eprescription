import { LogoMark, Wordmark } from "@/components/brand/logo";
import { BRAND } from "@/components/brand/logo-geometry";

export const metadata = {
  title: "Sign in",
  description: "Sign in to MedScript, the clinic's electronic prescription system.",
};

// Tone-on-tone panel colours: the large background mark sits just above the
// deep-sage panel, so it reads as texture rather than an illustration. The
// panel is brand ink in both themes.
const PANEL = BRAND.ink;
const TONE = { ink: `color-mix(in oklch, ${BRAND.ink}, white 4%)`, mint: `color-mix(in oklch, ${BRAND.ink}, white 6%)` };

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-background text-foreground">
      <aside
        className="relative overflow-hidden shrink-0 md:w-[44%] md:min-h-screen flex flex-col justify-between px-6 py-6 md:px-12 md:py-12 bg-brand-ink text-brand-paper"
      >
        <LogoMark
          palette={TONE}
          bg={PANEL}
          title=""
          className="pointer-events-none select-none absolute h-auto w-[70%] -right-[14%] -top-[20%] md:w-[82%] md:-right-[26%] md:top-[12%]"
        />

        <div className="relative flex items-center gap-3">
          <LogoMark className="h-9" bg={PANEL} inverted />
          <Wordmark inverted className="h-[22px]" />
        </div>

        <div className="relative hidden md:block max-w-sm">
          <p className="font-display text-5xl leading-[1.05] tracking-[-0.01em]">
            Prescriptions,
            <br />
            <span className="italic text-brand-mint">written clearly.</span>
          </p>
          <p className="mt-5 text-sm leading-relaxed text-brand-paper/70">
            Patient records, prescriptions and appointments for your clinic.
          </p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-10">{children}</div>
        <footer className="px-6 pb-6 text-center md:text-left md:px-10 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} MedScript
        </footer>
      </main>
    </div>
  );
}
