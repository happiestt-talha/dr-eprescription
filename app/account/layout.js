import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function AccountLayout({ children }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="px-6 pt-6 md:px-12 md:pt-10">
        <Link href="/" className="inline-flex rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
          <Logo markClassName="h-8" />
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-12">{children}</main>
      <footer className="px-6 pb-6 text-xs text-muted-foreground md:px-12">&copy; {new Date().getFullYear()} MedScript</footer>
    </div>
  );
}
