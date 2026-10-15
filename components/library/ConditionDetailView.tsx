import { createClient } from "@supabase/supabase-js";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Info,
  Quote,
  ShieldAlert,
} from "lucide-react";
import type { ReactNode } from "react";
import type { AppLang } from "@/lib/i18n/uiStrings";
import { signupHref } from "@/lib/i18n/landingStrings";
import {
  CONDITION_PAGE_STRINGS,
  evidenceKey,
  type ConditionSectionKey,
} from "@/lib/i18n/conditionPageStrings";
import {
  buildConditionIdPath,
  buildConditionIndexPath,
} from "@/lib/publicLibrary";
import LanguageSwitcher from "@/components/library/LanguageSwitcher";
import PublicHeader from "@/components/landing/PublicHeader";
import Footer from "@/components/Footer";

// One template for every public condition page in every language, so all
// 600+ entries share the same section hierarchy. Sections without content
// are listed as "not yet available" in the guide index and never filled in
// with generated text. Rehab phases come from the public rehab_phases table
// (Italian columns, or translations[lang] for en/es/fr).

type TextKey = Exclude<ConditionSectionKey, "rehab_phases" | "source">;

export type ConditionViewData = {
  id: number;
  name: string;
  fields: Partial<Record<TextKey, string | null>>;
  evidenceLevel: string | null;
  source: string | null;
  sourceDate: string | null;
  /** en/es/fr: the cached translation failed and Italian text is shown. */
  translationFailed?: boolean;
  /** en/es/fr: fields shown in Italian because no translation exists for them. */
  untranslated?: string[];
};

type Phase = {
  number: number;
  name: string;
  start?: string;
  duration?: string;
  goals?: string;
  exercises?: string;
  progress?: string;
};

const ORDER: ConditionSectionKey[] = [
  "goals",
  "clinical_tests",
  "red_flags",
  "contraindications",
  "typical_exercises",
  "rehab_phases",
  "progression_criteria",
  "return_to_activity_criteria",
  "outcome_measures",
  "source",
];

const EVIDENCE_TONE: Record<string, string> = {
  strong: "bg-emerald/15 text-emerald-700 dark:text-emerald-light",
  high: "bg-emerald/15 text-emerald-700 dark:text-emerald-light",
  moderate_high: "bg-emerald/10 text-emerald-700 dark:text-emerald-light",
  moderate: "bg-electric/10 text-electric-dark dark:text-electric-light",
  low_moderate: "bg-slate-400/15 text-slate-700 dark:text-slate-300",
  low: "bg-slate-400/15 text-slate-700 dark:text-slate-300",
  limited: "bg-slate-400/15 text-slate-700 dark:text-slate-300",
};

const clean = (v: unknown) =>
  typeof v === "string" && v.trim() ? v.trim() : undefined;

async function getPhases(conditionId: number, lang: AppLang): Promise<Phase[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false },
    });
    const { data } = await supabase
      .from("rehab_phases")
      .select(
        "phase_number, phase_name, phase_criteria_to_start, typical_duration, phase_goals, phase_exercises, criteria_to_progress, translations",
      )
      .eq("condition_id", conditionId)
      .order("phase_number", { ascending: true })
      .order("id", { ascending: false });
    // A few protocols were imported twice, so the same phase number can appear
    // more than once; show each phase once, keeping the most recent copy.
    const seen = new Set<number>();
    const unique = (data ?? []).filter((p: any) => {
      if (seen.has(p.phase_number)) return false;
      seen.add(p.phase_number);
      return true;
    });
    return unique
      .map((p: any): Phase | null => {
        const src = lang === "it" ? p : p.translations?.[lang];
        const name = clean(src?.phase_name);
        if (!name) return null;
        return {
          number: p.phase_number,
          name,
          start: clean(src.phase_criteria_to_start),
          duration: clean(src.typical_duration),
          goals: clean(src.phase_goals),
          exercises: clean(src.phase_exercises),
          progress: clean(src.criteria_to_progress),
        };
      })
      .filter((p): p is Phase => p !== null);
  } catch {
    return [];
  }
}

function Prose({ children }: { children: ReactNode }) {
  return (
    <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink/75 dark:text-white/70">
      {children}
    </p>
  );
}

export default async function ConditionDetailView({
  lang,
  data,
  jsonLd,
}: {
  lang: AppLang;
  data: ConditionViewData;
  jsonLd: Record<string, unknown>;
}) {
  const t = CONDITION_PAGE_STRINGS[lang];
  const phases = await getPhases(data.id, lang);
  const ev = evidenceKey(data.evidenceLevel);
  const langHrefs: Record<AppLang, string> = {
    it: buildConditionIdPath(data.id, "it"),
    en: buildConditionIdPath(data.id, "en"),
    es: buildConditionIdPath(data.id, "es"),
    fr: buildConditionIdPath(data.id, "fr"),
  };

  const has = (k: ConditionSectionKey) =>
    k === "rehab_phases"
      ? phases.length > 0
      : k === "source"
        ? !!clean(data.source)
        : !!clean(data.fields[k]);

  const machineTranslated =
    lang !== "it" &&
    !data.translationFailed &&
    (has("red_flags") || has("contraindications"));

  const shownInItalian = (k: string) =>
    lang !== "it" && !data.translationFailed && data.untranslated?.includes(k) && t.shownInItalian ? (
      <p className="mb-2 text-[12px] italic text-amber-800 dark:text-amber-300">
        {t.shownInItalian}
      </p>
    ) : null;

  const section = (k: TextKey) =>
    has(k) ? (
      <section
        key={k}
        id={k}
        aria-labelledby={`${k}-title`}
        className="scroll-mt-28 border-t border-black/[0.07] py-8 dark:border-white/[0.08]"
      >
        <h2
          id={`${k}-title`}
          className="mb-3 font-display text-lg font-semibold tracking-tight text-ink dark:text-white"
        >
          {t.sections[k]}
        </h2>
        {shownInItalian(k)}
        <Prose>{data.fields[k]}</Prose>
      </section>
    ) : null;

  return (
    <div
      className="relative min-h-screen overflow-x-clip bg-[#f6f7f9] text-ink dark:bg-ink dark:text-white"
      lang={lang}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicHeader lang={lang} langHrefs={langHrefs} />

      <main
        id="main-content"
        className="relative mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6 sm:pt-36"
      >
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <a
            href={buildConditionIndexPath(lang)}
            className="inline-flex items-center gap-2 rounded text-sm font-medium text-ink/60 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric dark:text-white/55 dark:hover:text-white"
          >
            <ArrowLeft size={16} aria-hidden />
            {t.backToLibrary}
          </a>
          <LanguageSwitcher
            current={lang}
            hrefFor={(l) => buildConditionIdPath(data.id, l)}
          />
        </div>

        <header className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow text-electric-dark dark:text-electric-light">
              {t.kicker}
            </span>
            {ev && (
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${EVIDENCE_TONE[ev]}`}
              >
                {t.evidence[ev]}
              </span>
            )}
            {lang !== "it" && !data.translationFailed && t.aiTranslated && (
              <span className="rounded-full border border-black/10 px-2.5 py-1 text-[11px] font-medium text-ink/70 dark:border-white/15 dark:text-white/65">
                {t.aiTranslated}
              </span>
            )}
          </div>
          <h1 className="mt-4 font-display text-[2.2rem] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl text-balance">
            {data.name}
          </h1>
        </header>

        {data.translationFailed && t.translating && (
          <p className="mt-6 flex max-w-3xl items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-400/10 p-3 text-[13px] text-amber-900 dark:text-amber-200">
            <Info size={15} aria-hidden className="mt-0.5 shrink-0" />
            {t.translating}
          </p>
        )}

        <div className="mt-10 grid gap-10 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-14">
          <div>
            <nav aria-label={t.inThisGuide} className="lg:sticky lg:top-28">
              <p className="eyebrow text-ink/60 dark:text-white/55">
                {t.inThisGuide}
              </p>
              <ol className="mt-4 grid grid-cols-2 gap-1 lg:grid-cols-1">
                {ORDER.map((k, i) => {
                  const ok = has(k);
                  return (
                    <li key={k}>
                      {ok ? (
                        <a
                          href={`#${k === "red_flags" || k === "contraindications" ? "safety" : k}`}
                          className="flex items-baseline gap-2.5 rounded-lg px-2 py-1.5 text-[13px] text-ink/75 transition-colors hover:bg-ink/[0.04] hover:text-ink dark:text-white/70 dark:hover:bg-white/[0.05] dark:hover:text-white"
                        >
                          <span className="font-mono text-[10px] text-electric-dark dark:text-electric-light">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {t.sections[k]}
                        </a>
                      ) : (
                        <span className="flex items-baseline gap-2.5 px-2 py-1.5 text-[13px] text-ink/60 dark:text-white/55">
                          <span className="font-mono text-[10px]">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span>
                            <span className="line-through decoration-ink/30 dark:decoration-white/30">
                              {t.sections[k]}
                            </span>
                            <span className="sr-only"> — </span>
                            <span className="block text-[11px] italic">
                              {t.notAvailable}
                            </span>
                          </span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
              <p className="mt-5 hidden text-[11.5px] leading-relaxed text-ink/60 dark:text-white/55 lg:block">
                {t.missingNote}
              </p>
            </nav>
          </div>

          <article className="min-w-0 max-w-3xl">
            {section("goals")}
            {section("clinical_tests")}

            {(has("red_flags") || has("contraindications")) && (
              <section
                id="safety"
                aria-labelledby="safety-title"
                className="scroll-mt-28 border-t border-black/[0.07] py-8 dark:border-white/[0.08]"
              >
                <h2
                  id="safety-title"
                  className="mb-4 font-display text-lg font-semibold tracking-tight text-ink dark:text-white"
                >
                  {t.safety}
                </h2>
                <div className="grid gap-3">
                  {has("red_flags") && (
                    <div
                      id="red_flags"
                      className="rounded-2xl border border-red-500/25 bg-red-500/[0.05] p-5"
                    >
                      <h3 className="mb-2 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-400">
                        <AlertTriangle size={15} aria-hidden />
                        {t.sections.red_flags}
                      </h3>
                      {shownInItalian("red_flags")}
                      <Prose>{data.fields.red_flags}</Prose>
                    </div>
                  )}
                  {has("contraindications") && (
                    <div
                      id="contraindications"
                      className="rounded-2xl border border-amber-500/30 bg-amber-400/[0.07] p-5"
                    >
                      <h3 className="mb-2 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                        <ShieldAlert size={15} aria-hidden />
                        {t.sections.contraindications}
                      </h3>
                      {shownInItalian("contraindications")}
                      <Prose>{data.fields.contraindications}</Prose>
                    </div>
                  )}
                </div>
                {machineTranslated && t.machineTranslated && (
                  <p className="mt-3 text-[12px] italic text-ink/60 dark:text-white/55">
                    {t.machineTranslated}
                  </p>
                )}
              </section>
            )}

            {section("typical_exercises")}

            {phases.length > 0 && (
              <section
                id="rehab_phases"
                aria-labelledby="rehab_phases-title"
                className="scroll-mt-28 border-t border-black/[0.07] py-8 dark:border-white/[0.08]"
              >
                <h2
                  id="rehab_phases-title"
                  className="mb-5 font-display text-lg font-semibold tracking-tight text-ink dark:text-white"
                >
                  {t.sections.rehab_phases}
                </h2>
                <ol className="space-y-4">
                  {phases.map((p) => (
                    <li
                      key={p.number}
                      className="rounded-2xl border border-black/[0.07] bg-white p-5 dark:border-white/[0.08] dark:bg-[#111318]"
                    >
                      <p className="flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-electric to-emerald text-[12px] font-bold text-white">
                          {p.number}
                        </span>
                        <span className="font-display text-[15px] font-semibold text-ink dark:text-white">
                          <span className="sr-only">
                            {t.phase} {p.number}:{" "}
                          </span>
                          {p.name}
                        </span>
                      </p>
                      {(p.goals ||
                        p.exercises ||
                        p.start ||
                        p.progress ||
                        p.duration) && (
                        <dl className="mt-4 grid gap-x-6 gap-y-3 text-[14px] sm:grid-cols-2">
                          {(
                            [
                              ["goals", p.goals],
                              ["exercises", p.exercises],
                              ["start", p.start],
                              ["progress", p.progress],
                              ["duration", p.duration],
                            ] as const
                          )
                            .filter(([, v]) => !!v)
                            .map(([k, v]) => (
                              <div
                                key={k}
                                className={
                                  k === "goals" || k === "exercises"
                                    ? "sm:col-span-2"
                                    : ""
                                }
                              >
                                <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink/60 dark:text-white/55">
                                  {t.phaseFields[k]}
                                </dt>
                                <dd className="mt-1 leading-relaxed text-ink/75 dark:text-white/70">
                                  {v}
                                </dd>
                              </div>
                            ))}
                        </dl>
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {section("progression_criteria")}
            {section("return_to_activity_criteria")}
            {section("outcome_measures")}

            {has("source") && (
              <section
                id="source"
                aria-labelledby="source-title"
                className="scroll-mt-28 border-t border-black/[0.07] py-8 dark:border-white/[0.08]"
              >
                <h2
                  id="source-title"
                  className="mb-3 font-display text-lg font-semibold tracking-tight text-ink dark:text-white"
                >
                  {t.sections.source}
                </h2>
                <p className="flex items-start gap-2 text-[13.5px] leading-relaxed text-ink/70 dark:text-white/65">
                  <Quote size={14} aria-hidden className="mt-1 shrink-0" />
                  <span>
                    {data.source}
                    {data.sourceDate ? ` — ${data.sourceDate}` : ""}
                  </span>
                </p>
                {lang !== "it" && (
                  <p className="mt-2 text-[12px] italic text-ink/60 dark:text-white/55">
                    {t.sourceLanguageNote}
                  </p>
                )}
              </section>
            )}

            <p className="border-t border-black/[0.07] pt-6 text-[12px] leading-relaxed text-ink/60 dark:border-white/[0.08] dark:text-white/55 lg:hidden">
              {t.missingNote}
            </p>

            <div className="mt-10 rounded-[24px] border border-black/[0.07] bg-white p-8 dark:border-white/[0.08] dark:bg-[#111318]">
              <p className="font-display text-xl font-semibold tracking-tight">
                {t.ctaTitle}
              </p>
              <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-ink/65 dark:text-white/60">
                {t.ctaText}
              </p>
              <a
                href={signupHref(lang)}
                className="group mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric focus-visible:ring-offset-2 dark:bg-white dark:text-ink dark:hover:bg-white/90"
              >
                {t.ctaButton}
                <ArrowRight
                  size={15}
                  aria-hidden
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </a>
            </div>
          </article>
        </div>
      </main>

      <Footer lang={lang} langHrefs={langHrefs} />
    </div>
  );
}
