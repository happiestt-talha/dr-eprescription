"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ErrorState } from "@/components/error-state";

// Replaces the root layout when that layout itself fails, so it brings its own
// <html>/<body>, styles and fonts. There is no SessionProvider here; ErrorState
// copes and links to home instead of the dashboard.
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function GlobalError({ error, retry, reset }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <title>Something went wrong · MedScript</title>
        <ErrorState variant="page" error={error} onRetry={retry ?? reset} />
      </body>
    </html>
  );
}
