import "./globals.css";
import { Providers } from "@/components/providers";
import { fontVariables } from "@/lib/fonts";

export const metadata = {
  title: { default: "MedScript · E-prescription", template: "%s · MedScript" },
  description: "Clinic management and digital prescriptions for doctors, reception staff and patients.",
};

export default function RootLayout({ children }) {
  return (
    // next-themes sets the theme class on <html> before hydration.
    <html lang="en" className={`${fontVariables} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
