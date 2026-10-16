"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Languages } from "lucide-react";
import type { AppLang } from "@/lib/i18n/uiStrings";
import { fill, formatNumber, type CoverageLabelKey, type LandingDict } from "@/lib/i18n/landingStrings";
import type { CoverageKey, FeaturedEntry } from "@/lib/landing/landingData";
import { COVERAGE_KEYS } from "@/lib/landing/coverageKeys";
import { EASE, MicroLabel, PrimaryButton, Reveal, SectionHeader, TextLink } from "./ui";

type Props = {
  lang: AppLang;
  library: LandingDict["library"];
  total: number | null;
  rounded: number | null;
  coverage: Partial<Record<CoverageKey, number>>;
  phasedProtocols: number | null;
  featured: FeaturedEntry | null;
  sampleNames: string[];
  libraryHref: string;
};

export default function LibraryShowcase({
  lang,
  library,
  total,
  rounded,
  coverage,
  phasedProtocols,
  featured,
  sampleNames,
  libraryHref,
}: Props) {
  const title = rounded ? fill(library.title, { n: formatNumber(lang, rounded) }) : library.titleNoCount;

  const rows: { key: CoverageLabelKey; value: number }[] = total
    ? [
        ...COVERAGE_KEYS.filter((k) => typeof coverage[k] === "number").map((k) => ({ key: k as CoverageLabelKey, value: coverage[k]! })),
        ...(phasedProtocols ? [{ key: "phased" as const, value: phasedProtocols }] : []),
      ]
    : [];

  const half = Math.ceil(sampleNames.length / 2);
  const marqueeRows = sampleNames.length >= 12 ? [sampleNames.slice(0, half), sampleNames.slice(half)] : [];

  return (
    <section id="library" aria-labelledby="library-title" className="relative scroll-mt-16 overflow-hidden py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader id="library-title" index="03" eyebrow={library.eyebrow} title={title} intro={library.intro} />
      </div>

      {marqueeRows.length > 0 && (
        <div className="lp-marquee lp-fade-x mt-14 space-y-3" role="region" aria-label={library.namesLabel}>
          {marqueeRows.map((row, r) => (
            <div key={r} className="flex overflow-hidden">
              <div
                className={`lp-marquee-track flex shrink-0 animate-marquee-slow gap-3 pr-3 ${r === 1 ? "[animation-direction:reverse]" : ""}`}
              >
                {[0, 1].map((copy) => (
                  <ul key={copy} aria-hidden={copy === 1 || undefined} className="flex shrink-0 gap-3">
                    {row.map((name) => (
                      <li
                        key={name}
                        className="whitespace-nowrap rounded-full border border-black/[0.07] bg-white/70 px-4 py-2 text-[13px] text-ink/70 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white/65"
                      >
                        {name}
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mx-auto mt-14 grid grid-cols-1 max-w-7xl items-start gap-6 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Reveal className="lp-ticks rounded-[24px] border border-black/[0.07] bg-white p-6 shadow-soft dark:border-white/[0.08] dark:bg-[#111318] sm:p-8">
          {total ? (
            <div className="border-b border-black/[0.06] pb-6 dark:border-white/[0.07]">
              <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                <p className="font-display text-[3.6rem] font-semibold leading-[0.85] tracking-[-0.05em] text-ink tabular-nums dark:text-white sm:text-[4.4rem]">
                  {formatNumber(lang, total)}
                </p>
                <p className="min-w-0 max-w-[12rem] pb-1 text-[13px] leading-snug text-ink/60 dark:text-white/55">{library.countLabel}</p>
              </div>
              {total < LIBRARY_GOAL && <Growth lang={lang} library={library} total={total} />}
            </div>
          ) : null}

          <div className="mt-6 flex items-baseline justify-between gap-3">
            <h3 className="font-display text-[15px] font-semibold text-ink dark:text-white">{library.coverageTitle}</h3>
            {total ? (
              <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink/60 dark:text-white/55">
                {fill(library.coverageLive, { n: formatNumber(lang, total) })}
              </span>
            ) : null}
          </div>

          {rows.length > 0 ? (
            <ul className="mt-5 space-y-3.5">
              {rows.map((row) => (
                <CoverageBar key={row.key} label={library.fields[row.key]} value={row.value} total={total!} lang={lang} />
              ))}
            </ul>
          ) : (
            <ul className="mt-5 grid grid-cols-2 gap-2">
              {(Object.keys(library.fields) as CoverageLabelKey[]).map((k) => (
                <li key={k} className="rounded-lg bg-mist px-3 py-2 text-[13px] text-ink/70 dark:bg-white/[0.04] dark:text-white/65">
                  {library.fields[k]}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-6 text-[12px] leading-relaxed text-ink/60 dark:text-white/55">{library.coverageNote}</p>
        </Reveal>

        <Reveal delay={0.1}>
          {featured ? (
            <Featured featured={featured} library={library} />
          ) : (
            <div className="rounded-[24px] border border-black/[0.07] bg-white p-8 shadow-soft dark:border-white/[0.08] dark:bg-[#111318]">
              <MicroLabel>{library.coverageTitle}</MicroLabel>
              <ul className="mt-4 flex flex-wrap gap-2">
                {Object.values(library.tabs).map((t) => (
                  <li key={t} className="rounded-full bg-mist px-3 py-1.5 text-[13px] text-ink/70 dark:bg-white/[0.05] dark:text-white/65">
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <TextLink href={libraryHref}>{library.cta}</TextLink>
              </div>
            </div>
          )}
        </Reveal>
      </div>

      <Reveal className="mx-auto mt-10 grid grid-cols-1 max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[auto_1fr] lg:items-center">
        <PrimaryButton href={libraryHref}>{library.cta}</PrimaryButton>
        <div className="space-y-1.5">
          <p className="flex items-center gap-2 text-sm font-medium text-ink/75 dark:text-white/70">
            <Languages size={16} aria-hidden className="shrink-0 text-electric-dark dark:text-electric-light" />
            {library.languages}
          </p>
          <p className="max-w-2xl text-[12.5px] leading-relaxed text-ink/60 dark:text-white/55">{library.templateNote}</p>
        </div>
      </Reveal>
    </section>
  );
}

// Target size of the library set by the product owner. It is shown only as a
// goal next to the live total, never as the current number of conditions.
const LIBRARY_GOAL = 800;

function Growth({ lang, library, total }: { lang: AppLang; library: LandingDict["library"]; total: number }) {
  const pct = Math.round((total / LIBRARY_GOAL) * 100);
  const goal = formatNumber(lang, LIBRARY_GOAL);
  return (
    <div className="mt-6">
      <div className="flex items-baseline justify-between gap-3 text-[12px]">
        <span className="font-semibold text-ink dark:text-white">{fill(library.growthLabel, { goal })}</span>
        <span className="font-mono text-[11px] tabular-nums text-ink/60 dark:text-white/55">
          {library.todayLabel} {formatNumber(lang, total)} · {library.goalLabel} {goal}
        </span>
      </div>
      <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-ink/[0.06] dark:bg-white/[0.08]" aria-hidden>
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-electric to-emerald"
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: EASE }}
        />
      </div>
      <p className="mt-2 text-[11.5px] leading-relaxed text-ink/60 dark:text-white/55">{fill(library.growthNote, { goal })}</p>
    </div>
  );
}

function CoverageBar({ label, value, total, lang }: { label: string; value: number; total: number; lang: AppLang }) {
  const pct = Math.max(2, Math.round((value / total) * 100));
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span className="text-ink/75 dark:text-white/75">{label}</span>
        <span className="font-mono text-[11px] tabular-nums text-ink/60 dark:text-white/55">
          {formatNumber(lang, value)} / {formatNumber(lang, total)}
        </span>
      </div>
      <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-ink/[0.06] dark:bg-white/[0.08]" aria-hidden>
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-electric to-emerald"
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: EASE }}
        />
      </div>
    </li>
  );
}

function Featured({ featured, library }: { featured: FeaturedEntry; library: LandingDict["library"] }) {
  const [active, setActive] = useState(0);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const count = featured.sections.length;

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    let next = active;
    if (e.key === "ArrowRight") next = (active + 1) % count;
    else if (e.key === "ArrowLeft") next = (active - 1 + count) % count;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = count - 1;
    else return;
    e.preventDefault();
    setActive(next);
    tabsRef.current[next]?.focus();
  };

  const level = featured.evidenceLevel ? library.levels[featured.evidenceLevel.toLowerCase()] ?? featured.evidenceLevel : null;

  return (
    <article className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-lift dark:border-white/[0.08] dark:bg-[#111318]">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-black/[0.06] p-6 dark:border-white/[0.07]">
        <div className="min-w-0">
          <MicroLabel>{library.featuredKicker}</MicroLabel>
          <h3 className="mt-2 font-display text-xl font-semibold leading-snug text-ink dark:text-white">{featured.name}</h3>
        </div>
        {level && (
          <span className="shrink-0 rounded-full bg-emerald/15 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-light">
            {library.evidence}: {level}
          </span>
        )}
      </header>

      <div role="tablist" aria-label={fill(library.tablistLabel, { name: featured.name })} className="flex gap-1 overflow-x-auto px-4 pt-4">
        {featured.sections.map((s, i) => (
          <button
            key={s.key}
            ref={(el) => {
              tabsRef.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`featured-tab-${s.key}`}
            aria-selected={active === i}
            aria-controls={`featured-panel-${s.key}`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={onKeyDown}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric ${
              active === i
                ? "bg-ink text-white dark:bg-white dark:text-ink"
                : "text-ink/60 hover:bg-ink/5 dark:text-white/60 dark:hover:bg-white/10"
            }`}
          >
            {library.tabs[s.key]}
          </button>
        ))}
      </div>

      {featured.sections.map((s, i) => (
        <div
          key={s.key}
          role="tabpanel"
          id={`featured-panel-${s.key}`}
          aria-labelledby={`featured-tab-${s.key}`}
          hidden={active !== i}
          tabIndex={0}
          className="min-h-[150px] px-6 pb-4 pt-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-electric"
        >
          <p className="text-[14.5px] leading-relaxed text-ink/80 dark:text-white/75">{s.text}</p>
        </div>
      ))}

      {featured.phaseCount > 0 && (
        <div className="px-6 pb-5">
          <div className="flex items-center gap-3">
            <MicroLabel>{library.phasesLabel}</MicroLabel>
            <ol className="flex flex-1 gap-1" aria-hidden>
              {Array.from({ length: featured.phaseCount }, (_, i) => (
                <li key={i} className="h-1 flex-1 rounded-full bg-gradient-to-r from-electric/60 to-emerald/60" />
              ))}
            </ol>
            <span className="font-mono text-[11px] text-ink/60 dark:text-white/55">{featured.phaseCount}</span>
          </div>
        </div>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] px-6 py-4 dark:border-white/[0.07]">
        <p className="text-[11.5px] text-ink/60 dark:text-white/55">
          {featured.isSource ? library.excerptSource : library.excerptTranslated}
        </p>
        <TextLink href={featured.href}>{library.openEntry}</TextLink>
      </footer>
    </article>
  );
}
