import { APP_LANG_LABELS, type AppLang } from "@/lib/i18n/uiStrings";
import { LANDING_LANGS, LANDING_PATH, publicPath, type LandingDict } from "@/lib/i18n/landingStrings";

// Shared by the landing pages and the localized legal pages. Every link
// leads to the page in the visitor's language; the language list leads to
// the current page in the other languages (langHrefs).
export default function LandingFooter({
  lang,
  footer,
  libraryHref,
  langHrefs = LANDING_PATH,
}: {
  lang: AppLang;
  footer: LandingDict["footer"];
  libraryHref: string;
  langHrefs?: Record<AppLang, string>;
}) {
  const home = LANDING_PATH[lang];
  const links = [
    { label: footer.product, href: `${home}#students` },
    { label: footer.library, href: libraryHref },
    { label: footer.pricing, href: `${home}#pricing` },
    { label: footer.privacy, href: publicPath(lang, "privacy") },
    { label: footer.terms, href: publicPath(lang, "terms") },
    { label: footer.contact, href: publicPath(lang, "contact") },
  ];

  return (
    <footer className="border-t border-black/[0.07] dark:border-white/[0.08]">
      <div className="mx-auto grid grid-cols-1 max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <a href={home} className="inline-flex items-center gap-2.5 font-display text-[17px] font-bold tracking-tight text-ink dark:text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="" width={28} height={28} className="h-7 w-7 rounded-md object-cover" />
            PHYGO
          </a>
          <p className="mt-3 max-w-xs text-[13.5px] leading-relaxed text-ink/60 dark:text-white/55">{footer.tagline}</p>
        </div>

        <nav aria-label={footer.navLabel}>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13.5px]">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="text-ink/60 transition-colors hover:text-ink dark:text-white/55 dark:hover:text-white">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="eyebrow text-ink/60 dark:text-white/55">{footer.languageLabel}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {LANDING_LANGS.map((l) => (
              <li key={l}>
                <a
                  href={langHrefs[l]}
                  hrefLang={l}
                  lang={l}
                  aria-current={l === lang ? "page" : undefined}
                  className={`inline-flex rounded-full border px-3 py-1.5 text-[12.5px] transition-colors ${
                    l === lang
                      ? "border-ink/20 font-semibold text-ink dark:border-white/25 dark:text-white"
                      : "border-black/[0.07] text-ink/60 hover:text-ink dark:border-white/[0.08] dark:text-white/55 dark:hover:text-white"
                  }`}
                >
                  {APP_LANG_LABELS[l]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-black/[0.06] dark:border-white/[0.06]">
        <p className="mx-auto max-w-7xl px-4 py-6 font-mono text-[11px] text-ink/60 dark:text-white/55 sm:px-6">
          © {new Date().getFullYear()} PHYGO. {footer.rights}
        </p>
      </div>
    </footer>
  );
}
