import IntroLoader from "@/components/IntroLoader";
import AmbientMesh from "@/components/AmbientMesh";
import ScrollProgress from "@/components/ScrollProgress";
import CursorSpotlight from "@/components/CursorSpotlight";
import CustomCursor from "@/components/CustomCursor";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import LogosMarquee from "@/components/LogosMarquee";
import StatsBar from "@/components/StatsBar";
import BeforeAfter from "@/components/BeforeAfter";
import Features from "@/components/Features";
import TryItLive from "@/components/TryItLive";
import TrustPillars from "@/components/TrustPillars";
import Testimonials from "@/components/Testimonials";
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
      <CustomCursor />
      <main id="main-content" className="relative min-h-screen bg-white dark:bg-ink overflow-x-hidden">
        <AmbientMesh />
        <CursorSpotlight />
        <Navbar />
        <Hero />
        <LogosMarquee />
        <StatsBar />
        <BeforeAfter />
        <Features />
        <TryItLive />
        <TrustPillars />
        <Testimonials />
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
