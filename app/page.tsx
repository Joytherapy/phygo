import AmbientMesh from "@/components/AmbientMesh";
import MotionProvider from "@/components/landing/MotionProvider";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import WorkflowSection from "@/components/landing/WorkflowSection";
import TryItLive from "@/components/TryItLive";
import LibrarySection from "@/components/landing/LibrarySection";
import AnatomySection from "@/components/landing/AnatomySection";
import ExerciseSection from "@/components/landing/ExerciseSection";
import ToolsSection from "@/components/landing/ToolsSection";
import WorkspaceSection from "@/components/landing/WorkspaceSection";
import TrustSection from "@/components/landing/TrustSection";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import type { Metadata } from "next";
import { COVERAGE_FIELDS, getLibraryStats, roundedCountLabel } from "@/lib/landing/libraryStats";

// Library numbers on this page are read live from the public condition
// library (see lib/landing/libraryStats.ts) and refreshed hourly.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const label = roundedCountLabel((await getLibraryStats()).total);
  const library = label ? `a library of ${label} clinical conditions` : "a clinical conditions library";
  const description = `AI-drafted SOAP notes you review and approve, ${library}, 3D anatomy, exercise prescription and evidence tools — in one workspace for physiotherapists.`;
  const title = "PHYGO — The Clinical Workspace for Physiotherapy";
  return {
    alternates: { canonical: "/" },
    description,
    openGraph: { title, description, url: "/", type: "website", locale: "en_US", siteName: "PHYGO" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function Home() {
  const stats = await getLibraryStats();
  const conditionsLabel = roundedCountLabel(stats.total);

  return (
    <MotionProvider>
    <main id="main-content" className="relative min-h-screen bg-[#f6f7f9] dark:bg-ink overflow-x-hidden">
      <AmbientMesh />
      <Navbar />
      <HeroSection conditionsLabel={conditionsLabel} />
      <WorkflowSection />
      <TryItLive />
      {/* "Platform" in the navbar points here */}
      <div id="features" className="scroll-mt-20">
        <LibrarySection
          total={stats.total}
          totalLabel={conditionsLabel}
          coverage={stats.coverage}
          coverageFields={COVERAGE_FIELDS}
          phasedProtocols={stats.phasedProtocols}
          featured={stats.featured}
        />
        <AnatomySection />
        <ExerciseSection phasedProtocols={stats.phasedProtocols} featured={stats.featured} />
        <ToolsSection />
        <WorkspaceSection />
      </div>
      <TrustSection />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
    </MotionProvider>
  );
}
