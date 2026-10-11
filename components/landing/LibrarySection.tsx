"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { BookOpen, Languages, ListChecks } from "lucide-react";
import { Reveal, SectionHeader, PrimaryButton, TextLink } from "./ui";
import type { CoverageKey, FeaturedCondition } from "@/lib/landing/libraryStats";

type Props = {
  total: number | null;
  totalLabel: string | null;
  coverage: Partial<Record<CoverageKey, number>>;
  coverageFields: { key: CoverageKey; label: string }[];
  phasedProtocols: number | null;
  featured: FeaturedCondition | null;
};

const LIBRARY_HREF = "/en/library/condition";

export default function LibrarySection({ total, totalLabel, coverage, coverageFields, phasedProtocols, featured }: Props) {
  const title = totalLabel
    ? `${totalLabel} clinical conditions, organised the way you reason.`
    : "A clinical conditions library, organised the way you reason.";

  const rows = total ? coverageFields.filter((f) => typeof coverage[f.key] === "number") : [];

  return (
    <section id="library" aria-labelledby="library-title" className="relative py-24 sm:py-32 scroll-mt-20 bg-mist/60 dark:bg-white/[0.02]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          id="library-title"
          eyebrow="Clinical knowledge"
          title={title}
          intro="Orthopaedic, neurological, cardiopulmonary, oncological, pelvic-floor and many more presentations — each entry structured around the questions you ask in clinic, and openly browsable without an account."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-[1fr_1.15fr] items-start">
          {/* What an entry contains — live coverage from the library */}
          <Reveal className="rounded-xl3 bg-white dark:bg-ink-soft p-6 sm:p-8 shadow-soft ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-electric/15 to-emerald/15 text-electric">
                <ListChecks size={18} aria-hidden />
              </span>
              <div>
                <h3 className="font-display font-semibold text-ink dark:text-white">What an entry covers</h3>
                {total ? (
                  <p className="text-xs text-ink/55 dark:text-white/50">Live from the library · {total} entries</p>
                ) : (
                  <p className="text-xs text-ink/55 dark:text-white/50">Fields available per condition</p>
                )}
              </div>
            </div>

            {rows.length > 0 ? (
              <ul className="mt-6 space-y-3.5">
                {rows.map((f) => (
                  <CoverageBar key={f.key} label={f.label} value={coverage[f.key]!} total={total!} />
                ))}
                {typeof phasedProtocols === "number" && phasedProtocols > 0 && (
                  <CoverageBar label="Phased rehab protocols" value={phasedProtocols} total={total!} />
                )}
              </ul>
            ) : (
              <ul className="mt-6 grid grid-cols-2 gap-2">
                {coverageFields.map((f) => (
                  <li key={f.key} className="rounded-lg bg-mist dark:bg-white/[0.04] px-3 py-2 text-[13px] text-ink/70 dark:text-white/65">
                    {f.label}
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-6 text-[12px] leading-relaxed text-ink/50 dark:text-white/45">
              Not every entry has every field yet. Each condition shows its evidence level, and sources
              where available. Library content supports — it does not replace — clinical judgement.
            </p>
          </Reveal>

          {/* A real entry, read from the library */}
          <Reveal delay={0.1}>
            {featured ? <FeaturedEntry featured={featured} /> : <LibraryFallback />}
          </Reveal>
        </div>

        <Reveal className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <PrimaryButton href={LIBRARY_HREF}>Browse the library</PrimaryButton>
          <p className="flex items-center gap-2 text-sm text-ink/60 dark:text-white/55">
            <Languages size={16} aria-hidden className="text-electric" />
            Available in Italian, English, Spanish and French.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function CoverageBar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = Math.max(2, Math.round((value / total) * 100));
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span className="text-ink/75 dark:text-white/75">{label}</span>
        <span className="font-mono text-[11.5px] text-ink/50 dark:text-white/45">
          {value} / {total}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-ink/[0.06] dark:bg-white/[0.08] overflow-hidden" aria-hidden>
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-electric to-emerald"
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </li>
  );
}

function FeaturedEntry({ featured }: { featured: FeaturedCondition }) {
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

  return (
    <article className="overflow-hidden rounded-xl3 bg-white dark:bg-ink-soft shadow-lift ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-black/[0.06] dark:border-white/[0.06] p-6">
        <div>
          <p className="eyebrow text-ink/45 dark:text-white/40">Real library entry</p>
          <h3 className="mt-1.5 font-display text-xl font-semibold text-ink dark:text-white">{featured.name}</h3>
        </div>
        {featured.evidenceLevel && (
          <span className="rounded-full bg-emerald/12 px-3 py-1 text-[11px] font-semibold capitalize text-emerald-dark dark:text-emerald-light">
            Evidence: {featured.evidenceLevel}
          </span>
        )}
      </header>

      <div role="tablist" aria-label={`${featured.name} sections`} className="flex gap-1 overflow-x-auto px-4 pt-4">
        {featured.sections.map((s, i) => (
          <button
            key={s.label}
            ref={(el) => {
              tabsRef.current[i] = el;
            }}
            role="tab"
            id={`featured-tab-${i}`}
            aria-selected={active === i}
            aria-controls={`featured-panel-${i}`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={onKeyDown}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric ${
              active === i
                ? "bg-ink text-white dark:bg-white dark:text-ink"
                : "text-ink/60 hover:bg-ink/5 dark:text-white/60 dark:hover:bg-white/10"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {featured.sections.map((s, i) => (
        <div
          key={s.label}
          role="tabpanel"
          id={`featured-panel-${i}`}
          aria-labelledby={`featured-tab-${i}`}
          hidden={active !== i}
          className="px-6 pb-2 pt-4 min-h-[132px]"
        >
          <p className="text-[14px] leading-relaxed text-ink/75 dark:text-white/75">{s.text}</p>
        </div>
      ))}

      {featured.phases.length > 0 && (
        <div className="px-6 pb-5 pt-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink/45 dark:text-white/40">Rehab phases</p>
          <ol className="mt-2 grid gap-2 sm:grid-cols-3">
            {featured.phases.map((p) => (
              <li key={p.number} className="rounded-lg bg-mist dark:bg-white/[0.04] px-3 py-2 text-[12px] leading-snug text-ink/70 dark:text-white/65">
                <span className="font-semibold text-electric">{p.number}.</span> {p.name}
              </li>
            ))}
          </ol>
        </div>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] dark:border-white/[0.06] px-6 py-4">
        <p className="text-[11.5px] text-ink/45 dark:text-white/40">Excerpt · English version translated from the Italian source</p>
        <TextLink href={featured.href}>Open the full entry</TextLink>
      </footer>
    </article>
  );
}

function LibraryFallback() {
  return (
    <div className="rounded-xl3 bg-white dark:bg-ink-soft p-8 shadow-lift ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
      <BookOpen size={22} aria-hidden className="text-electric" />
      <h3 className="mt-4 font-display text-xl font-semibold text-ink dark:text-white">Search by condition, read in seconds</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink/60 dark:text-white/55">
        Each entry brings together goals, clinical tests, red flags, contraindications, typical exercises and progression
        criteria, with its evidence level.
      </p>
      <div className="mt-5">
        <TextLink href={LIBRARY_HREF}>Open the public library</TextLink>
      </div>
    </div>
  );
}
