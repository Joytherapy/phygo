import IntroLoader from "@/components/IntroLoader";
import AmbientMesh from "@/components/AmbientMesh";
import ScrollProgress from "@/components/ScrollProgress";
import CursorSpotlight from "@/components/CursorSpotlight";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import PhygoWorld from "@/components/PhygoWorld";
import TryItLive from "@/components/TryItLive";
import BeforeAfter from "@/components/BeforeAfter";
import TrustPillars from "@/components/TrustPillars";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import SignatureIllustration from "@/components/SignatureIllustration";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <IntroLoader />
      <ScrollProgress />
      <main id="main-content" className="relative min-h-screen bg-white dark:bg-ink overflow-x-hidden">
        <AmbientMesh />
        <CursorSpotlight />
        <Navbar />
        <Hero />
        <HowItWorks />
        <Features />
        <PhygoWorld />
        <TryItLive />
        <BeforeAfter />
        <TrustPillars />
        <Pricing />
        <FAQ />
        <div className="mx-auto max-w-3xl px-6 opacity-70">
          <SignatureIllustration className="w-full h-20" />
        </div>
        <FinalCTA />
        <Footer />
      </main>
    </>
  );
}
