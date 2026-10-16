import { Fragment, type ReactNode } from "react";
import { Mail } from "lucide-react";
import type { Metadata } from "next";
import type { AppLang } from "@/lib/i18n/uiStrings";
import { LANDING_LANGS, LANDING_STRINGS, publicPathsFor, type PublicPage } from "@/lib/i18n/landingStrings";
import { LEGAL_STRINGS, type LegalBlock } from "@/lib/i18n/legal";
import PublicShell from "./PublicShell";

const EMAIL = "hello@phygo.app";

/** "**bold**" and the contact address inside legal copy. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|hello@phygo\.app)/g);
  return (
    <>
      {parts.map((p, i): ReactNode => {
        if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} className="font-semibold text-ink dark:text-white">{p.slice(2, -2)}</strong>;
        if (p === EMAIL)
          return (
            <a key={i} href={`mailto:${EMAIL}`} className="font-medium text-electric-dark underline-offset-2 hover:underline dark:text-electric-light">
              {EMAIL}
            </a>
          );
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === "string") return <p><Inline text={block} /></p>;
  return (
    <ul className="list-disc space-y-1.5 pl-5 marker:text-ink/40 dark:marker:text-white/40">
      {block.list.map((item) => (
        <li key={item}><Inline text={item} /></li>
      ))}
    </ul>
  );
}

export function legalMetadata(lang: AppLang, page: PublicPage): Metadata {
  const doc = page === "contact" ? LEGAL_STRINGS[lang].contact : LEGAL_STRINGS[lang][page];
  const paths = publicPathsFor(page);
  return {
    title: doc.metaTitle,
    description: doc.metaDescription,
    alternates: {
      canonical: paths[lang],
      languages: { ...Object.fromEntries(LANDING_LANGS.map((l) => [l, paths[l]])), "x-default": paths.en },
    },
    openGraph: { title: doc.metaTitle, description: doc.metaDescription, url: paths[lang], type: "website", locale: LANDING_STRINGS[lang].meta.ogLocale, siteName: "PHYGO" },
  };
}

export function LegalDocumentPage({ lang, page }: { lang: AppLang; page: "privacy" | "terms" }) {
  const t = LEGAL_STRINGS[lang];
  const doc = t[page];
  return (
    <PublicShell lang={lang} langHrefs={publicPathsFor(page)}>
      <article className="mx-auto grid grid-cols-1 max-w-6xl gap-12 px-4 pb-24 pt-32 sm:px-6 sm:pt-40 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <nav aria-label={t.contents} className="sticky top-28">
            <p className="eyebrow text-ink/60 dark:text-white/55">{t.contents}</p>
            <ol className="mt-4 space-y-2 border-l border-black/[0.08] dark:border-white/[0.09]">
              {doc.sections.map((s, i) => (
                <li key={s.title}>
                  <a href={`#s${i + 1}`} className="-ml-px block border-l border-transparent pl-4 text-[12.5px] leading-snug text-ink/60 transition-colors hover:border-electric hover:text-ink dark:text-white/55 dark:hover:text-white">
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
        <div className="max-w-2xl">
          <p className="eyebrow text-electric-dark dark:text-electric-light">{doc.eyebrow}</p>
          <h1 className="mt-4 font-display text-[2.4rem] font-semibold leading-[1.05] tracking-[-0.035em] text-ink dark:text-white sm:text-5xl text-balance">
            {doc.title}
          </h1>
          <p className="mt-6 rounded-xl border border-amber-500/30 bg-amber-400/10 px-4 py-3 text-[13px] leading-relaxed text-amber-900 dark:text-amber-200">
            {doc.updated}
          </p>
          <div className="mt-10 space-y-10">
            {doc.sections.map((s, i) => (
              <section key={s.title} id={`s${i + 1}`} aria-labelledby={`s${i + 1}-title`} className="scroll-mt-28">
                <h2 id={`s${i + 1}-title`} className="font-display text-lg font-semibold tracking-tight text-ink dark:text-white">
                  {s.title}
                </h2>
                <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink/70 dark:text-white/65">
                  {s.blocks.map((b, j) => (
                    <Block key={j} block={b} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </article>
    </PublicShell>
  );
}

export function ContactPageContent({ lang }: { lang: AppLang }) {
  const c = LEGAL_STRINGS[lang].contact;
  return (
    <PublicShell lang={lang} langHrefs={publicPathsFor("contact")}>
      <section className="mx-auto max-w-2xl px-4 pb-28 pt-36 text-center sm:px-6 sm:pt-44">
        <p className="eyebrow text-electric-dark dark:text-electric-light">{c.eyebrow}</p>
        <h1 className="mt-4 font-display text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.04em] text-ink dark:text-white sm:text-6xl">
          {c.title}
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-ink/65 dark:text-white/60 sm:text-lg">{c.text}</p>
        <a
          href={`mailto:${EMAIL}`}
          className="mt-10 inline-flex items-center gap-2.5 rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-white shadow-lift transition-colors hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric focus-visible:ring-offset-2 dark:bg-white dark:text-ink dark:hover:bg-white/90"
        >
          <Mail size={16} aria-hidden />
          <span>{c.emailLabel}</span>
          <span aria-hidden className="text-white/50 dark:text-ink/50">·</span>
          <span className="font-mono text-[13px]">{EMAIL}</span>
        </a>
      </section>
    </PublicShell>
  );
}
