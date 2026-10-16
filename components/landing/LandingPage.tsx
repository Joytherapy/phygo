import type { AppLang } from "@/lib/i18n/uiStrings";
import { LANDING_STRINGS, fill, formatNumber, myPhygoLoginHref, signupHref } from "@/lib/i18n/landingStrings";
import { buildConditionIndexPath } from "@/lib/publicLibrary";
import { getLandingData, roundDown } from "@/lib/landing/landingData";
import { landingShots } from "@/lib/landing/screenshots";
import MotionProvider from "./MotionProvider";
import HtmlLang from "./HtmlLang";
import LandingHeader from "./LandingHeader";
import Hero from "./Hero";
import AudiencePath from "./AudiencePath";
import TrustSection from "./TrustSection";
import PricingSection from "./PricingSection";
import FaqSection from "./FaqSection";
import FinalCta from "./FinalCta";
import LandingFooter from "./LandingFooter";
import { TextLink } from "./ui";

// One landing page, rendered for "/" (English), "/it", "/es" and "/fr". All
// copy comes from lib/i18n/landingStrings.ts; library figures from
// lib/landing/landingData.ts (live, anon-key reads, revalidated hourly); the
// product images are real screens listed in lib/landing/screenshots.ts.
//
// Two primary audiences of equal weight, one brand:
//   hero (both audiences + path chooser) -> #students -> #physiotherapists
//   -> privacy & AI -> pricing -> FAQ -> final call to action.
// #students and #physiotherapists are stable anchors for campaigns; both
// sections are the same AudiencePath component. Both CTAs lead to the same
// sign-up; the role (Student / Physiotherapist) is chosen during onboarding.
export default async function LandingPage({ lang }: { lang: AppLang }) {
  const t = LANDING_STRINGS[lang];
  const data = await getLandingData(lang);
  const libraryHref = buildConditionIndexPath(lang);
  const signup = signupHref(lang);
  const shots = landingShots(lang);
  // Video calls (Daily.co) exist in the code but only work when the
  // DAILY_API_KEY is configured; the page mentions them only in that case.
  // Only the presence of the variable is read, never its value.
  const videoCalls = Boolean(process.env.DAILY_API_KEY);

  // Live figures, rounded down; number-free wording when unavailable.
  const f = t.figures;
  const figure = (n: number | null, phrase: string, fallback: string) => (n ? fill(phrase, { n: formatNumber(lang, n) }) : fallback);
  const figureItems = [
    figure(roundDown(data.total), f.conditions, f.conditionsFallback),
    figure(roundDown(data.phasedProtocols, 10), f.protocols, f.protocolsFallback),
    figure(roundDown(data.exercises), f.exercises, f.exercisesFallback),
  ];
  const physio = t.physiotherapists;
  const physioExtras = videoCalls ? [...physio.extras, physio.videoItem] : physio.extras;

  return (
    <MotionProvider>
      <HtmlLang lang={lang} skipLabel={t.nav.skip} />
      <div className="relative min-h-screen overflow-x-clip bg-[#f7f8fa] text-ink dark:bg-[#0a0e17] dark:text-white" lang={lang}>
        <LandingHeader lang={lang} nav={t.nav} libraryHref={libraryHref} />
        <main id="main-content">
          <Hero hero={t.hero} signup={signup} draft={shots.draft} bodymap={shots.bodymap} />
          <AudiencePath
            id="students"
            path={t.students}
            shots={shots.students}
            extras={[...figureItems, ...t.students.extras]}
            ctaHref={signup}
            footer={
              <div className="mt-5">
                <p className="text-[13px] leading-relaxed text-ink/60 dark:text-white/60">{f.translationNote}</p>
                <TextLink href={libraryHref} className="mt-3">
                  {f.libraryCta}
                </TextLink>
              </div>
            }
          />
          <AudiencePath
            id="physiotherapists"
            path={physio}
            shots={shots.physiotherapists}
            extras={physioExtras}
            ctaHref={signup}
            footer={
              <p className="mt-6 border-t border-black/[0.08] pt-5 text-[14px] leading-relaxed text-ink/70 dark:border-white/[0.08] dark:text-white/70">
                <span className="font-semibold text-ink dark:text-white">{physio.patients.title}</span> {physio.patients.text}{" "}
                <a
                  href={myPhygoLoginHref(lang)}
                  className="rounded font-semibold text-electric-dark underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric dark:text-electric-light"
                >
                  {physio.patients.cta}
                </a>
              </p>
            }
          />
          <TrustSection lang={lang} trust={t.trust} />
          <PricingSection lang={lang} pricing={t.pricing} />
          <FaqSection faq={t.faq} />
          <FinalCta final={t.final} signup={signup} />
        </main>
        <LandingFooter lang={lang} footer={t.footer} libraryHref={libraryHref} />
      </div>
    </MotionProvider>
  );
}
