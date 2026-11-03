"use client";

import "./globals.css";
import { ErrorState } from "@/components/error-state";
import { fontVariables } from "@/lib/fonts";

// Replaces the root layout when that layout itself fails, so it brings its own
// <html>/<body>, styles and fonts. There is no SessionProvider here; ErrorState
// copes and links to home instead of the dashboard.
export default function GlobalError({ error, retry, reset }) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full">
        <title>Something went wrong · MedScript</title>
        <ErrorState variant="page" error={error} onRetry={retry ?? reset} />
      </body>
    </html>
  );
}
