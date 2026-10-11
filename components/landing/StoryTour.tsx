"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BookOpen,
  Check,
  FileDown,
  HelpCircle,
  Lightbulb,
  Mic,
  PersonStanding,
  Play,
  ShieldCheck,
  Smartphone,
  Split,
} from "lucide-react";
import type { LandingDict } from "@/lib/i18n/landingStrings";
import { EASE, MicroLabel, MockCaption, SectionHeader } from "./ui";

// The product tour follows one sample patient through the real workflow:
// dictation (components/liveStructuring), the SOAP + reasoning draft
// (app/api/generate-note), library linking (knowledge_base), exercise
// suggestions with dose (app/api/refine-exercises) and the explicit save that
// shares the plan with the patient portal (/my-phygo). Text is a sample case;
// the condition name and its rehab phases come from the live library.

type Props = {
  story: LandingDict["story"];
  tabs: LandingDict["library"]["tabs"];
  evidenceLabel: string;
  highLabel: string;
  condition: { name: string; phases: string[]; href: string } | null;
  libraryExercise: string | null;
};

export default function StoryTour(props: Props) {
  const { story } = props;
  const [active, setActive] = useState(0);
  const chapterRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const i = Number((entry.target as HTMLElement).dataset.index);
            if (!Number.isNaN(i)) setActive(i);
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    chapterRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="tour" aria-labelledby="tour-title" className="relative scroll-mt-16 py-24 sm:py-32">
      {/* Older links pointed at #how-it-works and #demo; both now land on the tour. */}
      <span id="how-it-works" className="absolute top-0 scroll-mt-16" aria-hidden />
      <span id="demo" className="absolute top-0 scroll-mt-16" aria-hidden />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader id="tour-title" index="01" eyebrow={story.eyebrow} title={story.title} intro={story.intro} />

        <div className="mt-16 grid grid-cols-1 gap-10 lg:mt-20 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <div className="min-w-0">
            {/* Chapter progress (desktop) */}
            <nav aria-label={story.chapterNav} className="sticky top-16 z-10 hidden bg-[#f6f7f9]/85 py-4 backdrop-blur-md dark:bg-ink/85 lg:block">
              <ol className="flex gap-3">
                {story.chapters.map((c, i) => (
                  <li key={c.kicker} className="min-w-0 flex-1">
                    <a
                      href={`#chapter-${i + 1}`}
                      aria-current={active === i ? "step" : undefined}
                      className="group block rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric"
                    >
                      <span
                        className={`block h-[3px] rounded-full transition-colors duration-500 ${
                          i <= active ? "bg-gradient-to-r from-electric to-emerald" : "bg-ink/10 dark:bg-white/10"
                        }`}
                      />
                      <span
                        title={c.kicker}
                        className={`mt-2 block truncate font-mono text-[10px] uppercase tracking-[0.08em] transition-colors ${
                          active === i ? "text-ink dark:text-white" : "text-ink/60 dark:text-white/55"
                        }`}
                      >
                        {c.kicker}
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <ol>
              {story.chapters.map((c, i) => (
                <li
                  key={c.kicker}
                  id={`chapter-${i + 1}`}
                  data-index={i}
                  ref={(el) => {
                    chapterRefs.current[i] = el;
                  }}
                  className="scroll-mt-32 py-8 lg:flex lg:min-h-[62vh] lg:flex-col lg:justify-center lg:py-0 lg:first:min-h-[50vh]"
                >
                  <div
                    className={`transition-colors duration-500 lg:border-l-2 lg:pl-6 ${
                      active === i ? "lg:border-electric" : "lg:border-ink/10 dark:lg:border-white/10"
                    }`}
                  >
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-electric-dark dark:text-electric-light">
                      {String(i + 1).padStart(2, "0")} · {c.kicker}
                    </p>
                    <h3 className="mt-3 font-display text-[1.6rem] font-semibold leading-[1.15] tracking-[-0.025em] text-ink dark:text-white sm:text-[2rem] text-balance">
                      {c.title}
                    </h3>
                    <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink/65 dark:text-white/60 text-pretty">{c.text}</p>
                  </div>
                  {/* Mobile / tablet: the visual sits under its chapter */}
                  <div className="mt-8 lg:hidden">
                    <Frame story={story}>
                      <ChapterVisual index={i} {...props} />
                    </Frame>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Desktop: one sticky stage that follows the active chapter */}
          <div className="hidden lg:block">
            <div className="sticky top-28">
              <Frame story={story}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4, ease: EASE }}
                  >
                    <ChapterVisual index={active} {...props} />
                  </motion.div>
                </AnimatePresence>
              </Frame>
              <MockCaption>{story.caption}</MockCaption>
            </div>
          </div>
        </div>
        <MockCaption className="lg:hidden">{story.caption}</MockCaption>
      </div>
    </section>
  );
}

function Frame({ story, children }: { story: LandingDict["story"]; children: ReactNode }) {
  return (
    <div
      aria-hidden
      className="lp-ticks relative overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-lift dark:border-white/[0.09] dark:bg-[#0f1116] dark:shadow-softDark"
    >
      <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-5 py-3.5 dark:border-white/[0.06]">
        <span className="truncate font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink/60 dark:text-white/55">
          {story.caseLabel}
        </span>
        <span className="flex shrink-0 gap-1.5">
          <span className="h-2 w-2 rounded-full bg-ink/10 dark:bg-white/15" />
          <span className="h-2 w-2 rounded-full bg-ink/10 dark:bg-white/15" />
        </span>
      </div>
      <div className="lp-dots flex min-h-[440px] flex-col justify-center p-5 sm:p-7">{children}</div>
    </div>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-black/[0.06] bg-white/90 p-4 shadow-soft backdrop-blur dark:border-white/[0.07] dark:bg-[#15171d]/90 ${className}`}>
      {children}
    </div>
  );
}

function ChapterVisual({ index, story, tabs, evidenceLabel, highLabel, condition, libraryExercise }: Props & { index: number }) {
  const phases = condition?.phases ?? [];

  if (index === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-electric px-3 py-1.5 text-[11.5px] font-semibold text-white">
            <Mic size={13} /> {story.listening}
          </span>
          <span className="rounded-full border border-black/[0.08] px-3 py-1.5 font-mono text-[10.5px] text-ink/60 dark:border-white/10 dark:text-white/55">
            {story.languagesPill}
          </span>
        </div>
        <Card>
          <div className="flex h-12 items-center gap-[3px]">
            {Array.from({ length: 48 }, (_, i) => (
              <span
                key={i}
                className="block w-[3px] flex-1 origin-center animate-wave rounded-full bg-gradient-to-t from-electric/50 to-emerald/70"
                style={{ height: `${30 + ((i * 37) % 70)}%`, animationDelay: `${(i % 9) * 0.09}s` }}
              />
            ))}
          </div>
        </Card>
        <Card>
          <p className="text-[14.5px] leading-relaxed text-ink/85 dark:text-white/85">
            {story.transcript}
            <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-caret bg-electric" />
          </p>
        </Card>
      </div>
    );
  }

  if (index === 1) {
    const icons = [Lightbulb, Split, AlertTriangle, HelpCircle];
    return (
      <div className="grid gap-3 sm:grid-cols-[1.15fr_1fr]">
        <div className="space-y-2.5">
          {story.soap.map((text, i) => (
            <Card key={i} className="!p-3">
              <div className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-electric to-emerald text-[11px] font-bold text-white">
                  {story.soapLabels[i].charAt(0)}
                </span>
                <div>
                  <MicroLabel>{story.soapLabels[i]}</MicroLabel>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-ink/85 dark:text-white/85">{text}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <Card className="!p-3.5">
          <ul className="space-y-3.5">
            {story.reasoning.map((r, i) => {
              const Icon = icons[i] ?? Lightbulb;
              return (
                <li key={r.label} className="flex gap-2.5">
                  <Icon size={14} className={`mt-0.5 shrink-0 ${i === 2 ? "text-amber-500" : "text-electric-dark"}`} />
                  <div>
                    <MicroLabel>{r.label}</MicroLabel>
                    <p className="mt-0.5 text-[12.5px] leading-snug text-ink/80 dark:text-white/80">{r.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="space-y-3">
        <Card className="!p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <MicroLabel className="!text-electric dark:!text-electric-light">{story.linkedLabel}</MicroLabel>
            <span className="rounded-full bg-emerald/15 px-2.5 py-0.5 text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-light">
              {evidenceLabel} · {highLabel}
            </span>
          </div>
          <p className="mt-2 flex items-start gap-2 font-display text-[1.15rem] font-semibold leading-snug text-ink dark:text-white">
            <BookOpen size={18} className="mt-1 shrink-0 text-electric-dark" />
            {condition?.name ?? story.reasoning[0].text}
          </p>
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {Object.values(tabs).map((t) => (
              <li key={t} className="rounded-full bg-mist px-3 py-1 text-[11.5px] font-medium text-ink/70 dark:bg-white/[0.06] dark:text-white/70">
                {t}
              </li>
            ))}
          </ul>
        </Card>
        <div className="grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
          <Card className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-electric/15 to-emerald/15 text-electric-dark">
              <PersonStanding size={18} />
            </span>
            <p className="text-[12.5px] font-medium leading-snug text-ink/80 dark:text-white/75">{story.region}</p>
          </Card>
          {phases.length > 0 && (
            <Card>
              <MicroLabel>{story.phasesLabel}</MicroLabel>
              <ol className="mt-2 space-y-1.5">
                {phases.map((p, i) => (
                  <li key={p} className="flex items-baseline gap-2 text-[12px] leading-snug text-ink/75 dark:text-white/70">
                    <span className="font-mono text-[10px] text-electric-dark">{i + 1}</span>
                    {p}
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>
      </div>
    );
  }

  if (index === 3) {
    return (
      <div className="space-y-3">
        {story.exercises.map((e) => (
          <Card key={e.name} className="flex items-center gap-4 !p-3.5">
            <span className="relative flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-ink to-[#1d2433]">
              <span className="absolute inset-0 lp-dots opacity-50" />
              <Play size={14} className="relative ml-0.5 text-white" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold leading-snug text-ink dark:text-white">{e.name}</p>
              <p className="mt-1 font-mono text-[11px] text-ink/60 dark:text-white/55">{e.dose}</p>
            </div>
          </Card>
        ))}
        {libraryExercise && (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-electric/40 px-4 py-3">
            <BookOpen size={15} className="shrink-0 text-electric-dark" />
            <p className="min-w-0 text-[12px] leading-snug text-ink/70 dark:text-white/65">
              <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-ink/60 dark:text-white/55">
                {story.fromLibrary} · {story.videoLabel}
              </span>
              <span className="font-medium text-ink dark:text-white">{libraryExercise}</span>
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-3">
        <Card>
          <MicroLabel>{story.phasesLabel}</MicroLabel>
          <ol className="mt-3 space-y-2">
            {(phases.length ? phases : story.soapLabels.slice(0, 3)).map((p, i) => (
              <li key={p} className="flex items-center gap-2.5">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    i === 0 ? "bg-gradient-to-br from-electric to-emerald text-white" : "bg-ink/[0.06] text-ink/60 dark:bg-white/10 dark:text-white/55"
                  }`}
                >
                  {i + 1}
                </span>
                <span className={`text-[12.5px] leading-snug ${i === 0 ? "font-semibold text-ink dark:text-white" : "text-ink/60 dark:text-white/55"}`}>
                  {p}
                </span>
                {i === 0 && (
                  <span className="ml-auto shrink-0 rounded-full bg-emerald/15 px-2 py-0.5 text-[9.5px] font-semibold text-emerald-700 dark:text-emerald-light">
                    {story.current}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </Card>
        <div className="flex gap-2">
          <span className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-ink px-3 py-3 text-[12px] font-semibold text-white dark:bg-white dark:text-ink">
            <ShieldCheck size={14} /> {story.review}
          </span>
          <span className="flex items-center justify-center gap-1.5 rounded-xl border border-black/10 px-3 py-3 text-[12px] font-semibold text-ink/75 dark:border-white/15 dark:text-white/75">
            <FileDown size={14} /> {story.pdf}
          </span>
        </div>
        <p className="flex items-center gap-1.5 text-[11.5px] text-ink/60 dark:text-white/55">
          <Check size={13} className="text-emerald" /> {story.savedTo}
        </p>
      </div>
      <div className="mx-auto w-full max-w-[230px] rounded-[28px] border border-black/10 bg-mist p-2.5 shadow-lift dark:border-white/10 dark:bg-[#0b0d12]">
        <div className="rounded-[22px] bg-white p-4 dark:bg-[#15171d]">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald/15 text-emerald-700 dark:text-emerald-light">
              <Smartphone size={12} />
            </span>
            <MicroLabel>{story.portalTitle}</MicroLabel>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-ink/80 dark:text-white/75">{story.portalText}</p>
          <ul className="mt-3 space-y-1.5">
            {story.exercises.map((e) => (
              <li key={e.name} className="flex items-center gap-2 rounded-lg bg-mist px-2.5 py-1.5 text-[10.5px] text-ink/70 dark:bg-white/[0.05] dark:text-white/65">
                <Play size={10} className="shrink-0 text-electric-dark" />
                <span className="truncate">{e.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
