import type { AppLang } from "@/lib/i18n/uiStrings";
import { LANDING_STRINGS } from "@/lib/i18n/landingStrings";
import { buildConditionIndexPath } from "@/lib/publicLibrary";
import HtmlLang from "./HtmlLang";
import LandingHeader from "./LandingHeader";

/** Localized site header for public pages outside the landing (e.g. the clinical library). */
export default function PublicHeader({ lang, langHrefs }: { lang: AppLang; langHrefs: Record<AppLang, string> }) {
  const t = LANDING_STRINGS[lang];
  return (
    <>
      <HtmlLang lang={lang} skipLabel={t.nav.skip} />
      <LandingHeader lang={lang} nav={t.nav} libraryHref={buildConditionIndexPath(lang)} langHrefs={langHrefs} />
    </>
  );
}
