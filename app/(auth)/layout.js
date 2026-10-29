import { Instrument_Serif } from "next/font/google";
import { LogoMark, Wordmark } from "@/components/brand/logo";
import { BRAND } from "@/components/brand/logo-geometry";
import { cn } from "@/lib/utils";

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

export const metadata = {
  title: "Sign in",
  description: "Sign in to MedScript, the clinic's electronic prescription system.",
};

// Tone-on-tone panel colours: the large background mark sits just above the
// panel colour, so it reads as texture rather than an illustration.
const PANEL = BRAND.ink;
const TONE = { ink: "#346456", mint: "#386b5c" };

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-background text-foreground">
      <aside
        className="relative overflow-hidden shrink-0 md:w-[44%] md:min-h-screen flex flex-col justify-between px-6 py-6 md:px-12 md:py-12 text-[#f4f8f5]"
        style={{ backgroundColor: PANEL }}
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
          <p className={cn(serif.className, "text-[2.75rem] leading-[1.05] tracking-[-0.01em]")}>
            Prescriptions,
            <br />
            <span className="italic" style={{ color: BRAND.mint }}>
              written clearly.
            </span>
          </p>
          <p className="mt-5 text-sm leading-relaxed text-[#f4f8f5]/70">
            Patient records, prescriptions and appointments for your clinic, in one quiet place.
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
