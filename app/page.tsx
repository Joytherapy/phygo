import type { Metadata } from "next";
import LandingPage from "@/components/landing/LandingPage";
import { buildLandingMetadata } from "@/lib/landing/landingMetadata";

// English landing page (international default, x-default). The same page is
// served in Italian, Spanish and French at /it, /es and /fr. Library figures
// are read live and refreshed hourly.
export const revalidate = 3600;

export function generateMetadata(): Promise<Metadata> {
  return buildLandingMetadata("en");
}

export default function Home() {
  return <LandingPage lang="en" />;
}
