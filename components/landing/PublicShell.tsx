import type { ReactNode } from "react";
import type { AppLang } from "@/lib/i18n/uiStrings";
import { LANDING_STRINGS } from "@/lib/i18n/landingStrings";
import { buildConditionIndexPath } from "@/lib/publicLibrary";
import { landingSerif } from "./fonts";
import MotionProvider from "./MotionProvider";
import HtmlLang from "./HtmlLang";
import LandingHeader from "./LandingHeader";
import LandingFooter from "./LandingFooter";

// Frame for the localized public pages around the landing (privacy, terms,
// contact): same header and footer, and every language switch leads to the
// same page in the other language (langHrefs).
export default function PublicShell({
  lang,
  langHrefs,
  children,
}: {
  lang: AppLang;
  langHrefs: Record<AppLang, string>;
  children: ReactNode;
}) {
  const t = LANDING_STRINGS[lang];
  const libraryHref = buildConditionIndexPath(lang);
  return (
    <MotionProvider>
      <HtmlLang lang={lang} skipLabel={t.nav.skip} />
      <div className={`${landingSerif.variable} relative min-h-screen overflow-x-clip bg-[#f6f7f9] dark:bg-ink`} lang={lang}>
        <LandingHeader lang={lang} nav={t.nav} libraryHref={libraryHref} langHrefs={langHrefs} />
        <main id="main-content">{children}</main>
        <LandingFooter lang={lang} footer={t.footer} libraryHref={libraryHref} langHrefs={langHrefs} />
      </div>
    </MotionProvider>
  );
}
