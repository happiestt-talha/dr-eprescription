import { IBM_Plex_Mono, IBM_Plex_Sans, Instrument_Serif } from "next/font/google";

// The app's three typefaces, loaded once. IBM Plex Sans for UI text (clear
// figures for doses and vitals), Plex Mono for codes, and Instrument Serif
// for the few display headlines (sign-in panel, 404, full-page errors).
export const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const fontVariables = `${plexSans.variable} ${plexMono.variable} ${instrumentSerif.variable}`;
