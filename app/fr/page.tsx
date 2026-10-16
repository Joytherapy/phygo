import type { Metadata } from "next";
import LandingPage from "@/components/landing/LandingPage";
import { buildLandingMetadata } from "@/lib/landing/landingMetadata";

export const revalidate = 3600;

export function generateMetadata(): Promise<Metadata> {
  return buildLandingMetadata("fr");
}

export default function Page() {
  return <LandingPage lang="fr" />;
}
