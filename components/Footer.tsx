import type { AppLang } from "@/lib/i18n/uiStrings";
import { LANDING_STRINGS } from "@/lib/i18n/landingStrings";
import { buildConditionIndexPath } from "@/lib/publicLibrary";
import LandingFooter from "@/components/landing/LandingFooter";

// Footer of the public clinical library pages. It reuses the localized
// landing footer so labels and destinations (privacy, terms, contact) follow
// the page language. Language links default to the library index in each
// language; detail pages pass the same condition in each language.
export default function Footer({
  lang = "it",
  langHrefs,
}: {
  lang?: AppLang;
  langHrefs?: Record<AppLang, string>;
}) {
  const hrefs = langHrefs ?? {
    it: buildConditionIndexPath("it"),
    en: buildConditionIndexPath("en"),
    es: buildConditionIndexPath("es"),
    fr: buildConditionIndexPath("fr"),
  };
  return <LandingFooter lang={lang} footer={LANDING_STRINGS[lang].footer} libraryHref={buildConditionIndexPath(lang)} langHrefs={hrefs} />;
}
