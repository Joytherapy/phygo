import { Instrument_Serif } from "next/font/google";

// Editorial serif used only for the italic accents in landing headlines
// ("*text*" in lib/i18n/landingStrings.ts). Loaded here rather than in the
// root layout so the dashboard never downloads it.
export const landingSerif = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});
