import type { AppLang } from "@/lib/i18n/uiStrings";
import { LANDING_STRINGS, fill, formatNumber } from "@/lib/i18n/landingStrings";
import { buildConditionIndexPath } from "@/lib/publicLibrary";
import { getLandingData, roundDown } from "@/lib/landing/landingData";
import { landingSerif } from "./fonts";
import MotionProvider from "./MotionProvider";
import HtmlLang from "./HtmlLang";
import LandingHeader from "./LandingHeader";
import Hero from "./Hero";
import ProofStrip from "./ProofStrip";
import StoryTour from "./StoryTour";
import LibraryShowcase from "./LibraryShowcase";
import AnatomySection from "./AnatomySection";
import WorldSection from "./WorldSection";
import ToolsShelf from "./ToolsShelf";
import AudiencesSection from "./AudiencesSection";
import TrustSection from "./TrustSection";
import PricingSection from "./PricingSection";
import FaqSection from "./FaqSection";
import FinalCta from "./FinalCta";
import LandingFooter from "./LandingFooter";

// One landing page, rendered for "/" (English), "/it", "/es" and "/fr". All
// copy comes from lib/i18n/landingStrings.ts; all figures and library content
// from lib/landing/landingData.ts (live, anon-key reads, revalidated hourly).
export default async function LandingPage({ lang }: { lang: AppLang }) {
  const t = LANDING_STRINGS[lang];
  const data = await getLandingData(lang);
  const libraryHref = buildConditionIndexPath(lang);
  // Video calls (Daily.co) exist in the code but only work when the
  // DAILY_API_KEY is configured; the page mentions them only in that case.
  // Only the presence of the variable is read, never its value.
  const videoCalls = Boolean(process.env.DAILY_API_KEY);

  const conditions = roundDown(data.total);
  const exercises = roundDown(data.exercises);
  const conditionsText = conditions
    ? fill(t.hero.conditionsPhrase, { n: formatNumber(lang, conditions) })
    : t.hero.conditionsFallback;
  const exercisesText = exercises
    ? fill(t.hero.exercisesPhrase, { n: formatNumber(lang, exercises) })
    : t.hero.exercisesFallback;

  return (
    <MotionProvider>
      <HtmlLang lang={lang} skipLabel={t.nav.skip} />
      <div className={`${landingSerif.variable} relative min-h-screen overflow-x-clip bg-[#f6f7f9] dark:bg-ink`} lang={lang}>
        <LandingHeader lang={lang} nav={t.nav} libraryHref={libraryHref} />
        <main id="main-content">
          <Hero
            hero={t.hero}
            story={t.story}
            conditionsText={conditionsText}
            exercisesText={exercisesText}
            condition={data.story}
            libraryExercise={data.libraryExercise}
          />
          <ProofStrip
            lang={lang}
            proof={t.proof}
            total={data.total}
            exercises={data.exercises}
            phasedProtocols={data.phasedProtocols}
          />
          <AudiencesSection lang={lang} audiences={t.audiences} videoCalls={videoCalls} />
          <StoryTour
            story={t.story}
            evidenceLabel={t.library.evidence}
            highLabel={t.library.levels.high}
            condition={data.story}
            libraryExercise={data.libraryExercise}
            videoCalls={videoCalls}
          />
          {/* "Platform" in the shared app navbar points at /#features */}
          <div id="features" className="scroll-mt-16">
            <LibraryShowcase
              lang={lang}
              library={t.library}
              total={data.total}
              rounded={conditions}
              coverage={data.coverage}
              phasedProtocols={data.phasedProtocols}
              featured={data.featured}
              sampleNames={data.sampleNames}
              libraryHref={libraryHref}
            />
            <AnatomySection anatomy={t.anatomy} />
            <WorldSection lang={lang} world={t.world} />
            <ToolsShelf tools={t.tools} />
          </div>
          <TrustSection lang={lang} trust={t.trust} />
          <PricingSection lang={lang} pricing={t.pricing} />
          <FaqSection faq={t.faq} />
          <FinalCta final={t.final} libraryHref={libraryHref} />
        </main>
        <LandingFooter lang={lang} footer={t.footer} libraryHref={libraryHref} />
      </div>
    </MotionProvider>
  );
}
