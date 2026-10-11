"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  Check,
  FileDown,
  FileText,
  HelpCircle,
  ImageIcon,
  Lightbulb,
  Mic,
  Play,
  ShieldCheck,
  Smartphone,
  Split,
  UserRound,
  Video,
  X,
} from "lucide-react";
import type { LandingDict } from "@/lib/i18n/landingStrings";
import { EASE, MicroLabel, MockCaption, SectionHeader } from "./ui";

// The clinical workflow, verified step by step in the code:
// 1. Agenda — app/dashboard/agenda: week view, appointments linked to
//    patients (in person / video label), patient requests from My Phygo to
//    confirm or decline. Video calls (Daily.co, components/VideoCallPanel)
//    start from the patient's session page and the patient joins from My
//    Phygo; they are only mentioned when DAILY_API_KEY is configured.
// 2. Session — components/liveStructuring: dictation or typing, SOAP draft +
//    hedged clinical reasoning (app/api/generate-note).
// 3. Plan — library linking (knowledge-lookup, rehab_phases) and exercises
//    with dose (refine-exercises).
// 4. Export — "Download PDF" (jspdf) on the generated note; image upload to
//    app/api/analyze-scan returns a hedged summary, the image is not stored.
//    There is no document storage on the patient record, so none is shown.
// 5. Follow-up — explicit save to `notes`; the patient page lists past notes
//    (date + assessment) and linked references; My Phygo shows saved notes.

type Props = {
  story: LandingDict["story"];
  evidenceLabel: string;
  highLabel: string;
  condition: { name: string; phases: string[]; href: string } | null;
  libraryExercise: string | null;
  videoCalls: boolean;
};

export default function StoryTour(props: Props) {
  const { story, videoCalls } = props;
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
      {/* Older links pointed at #how-it-works and #demo; both now land on the workflow. */}
      <span id="how-it-works" className="absolute top-0 scroll-mt-16" aria-hidden />
      <span id="demo" className="absolute top-0 scroll-mt-16" aria-hidden />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader id="tour-title" index="02" eyebrow={story.eyebrow} title={story.title} intro={story.intro} />

        <div className="mt-16 grid grid-cols-1 gap-10 lg:mt-20 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <div className="min-w-0">
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
                    <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink/65 dark:text-white/60 text-pretty">
                      {c.text}
                      {videoCalls && c.videoText ? ` ${c.videoText}` : ""}
                    </p>
                    <dl className="mt-5 grid max-w-md gap-2 text-[13px] leading-snug">
                      <div className="flex gap-3">
                        <dt className="w-14 shrink-0 font-mono text-[10.5px] uppercase tracking-[0.1em] text-electric-dark dark:text-electric-light">
                          {story.roles.phygo}
                        </dt>
                        <dd className="text-ink/70 dark:text-white/65">{c.phygo}</dd>
                      </div>
                      <div className="flex gap-3">
                        <dt className="w-14 shrink-0 font-mono text-[10.5px] uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-light">
                          {story.roles.you}
                        </dt>
                        <dd className="font-medium text-ink dark:text-white">{c.you}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="mt-8 lg:hidden">
                    <Frame story={story}>
                      <ChapterVisual index={i} {...props} />
                    </Frame>
                  </div>
                </li>
              ))}
            </ol>
          </div>

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
      <div className="lp-dots flex min-h-[460px] flex-col justify-center p-4 sm:p-7">{children}</div>
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

function ChapterVisual({ index, story, evidenceLabel, highLabel, condition, libraryExercise, videoCalls }: Props & { index: number }) {
  const phases = condition?.phases ?? [];

  if (index === 0) {
    const a = story.agenda;
    // Appointment blocks: [day index, row index, patient, remote?]
    const slots: [number, number, string, boolean][] = [
      [0, 0, a.patientA, false],
      [1, 2, a.patientB, false],
      [2, 1, a.patientC, videoCalls],
      [4, 0, a.patientA, false],
    ];
    const times = ["09:00", "10:30", "14:00"];
    return (
      <div className="space-y-3">
        <Card className="!p-3 sm:!p-4">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays size={15} className="text-electric-dark dark:text-electric-light" />
            <MicroLabel>{a.title}</MicroLabel>
          </div>
          <div className="grid grid-cols-[36px_repeat(5,minmax(0,1fr))] gap-1 text-[10px]">
            <span />
            {a.days.map((d) => (
              <span key={d} className="pb-1 text-center font-mono uppercase tracking-wide text-ink/60 dark:text-white/55">
                {d}
              </span>
            ))}
            {times.map((tm, row) => (
              <Row key={tm} time={tm} row={row} slots={slots} remoteLabel={a.remote} inPersonLabel={a.inPerson} />
            ))}
          </div>
        </Card>
        <div className={`grid gap-3 ${videoCalls ? "sm:grid-cols-2" : ""}`}>
          <Card className="!p-3.5">
            <div className="flex items-center gap-2">
              <Smartphone size={14} className="text-emerald-700 dark:text-emerald-light" />
              <MicroLabel>{a.request}</MicroLabel>
            </div>
            <p className="mt-1.5 text-[13px] font-semibold text-ink dark:text-white">
              {a.patientB} · {a.requestWhen}
            </p>
            <div className="mt-3 flex gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-semibold text-white dark:bg-white dark:text-ink">
                <Check size={12} /> {a.confirm}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg border border-black/10 px-2.5 py-1.5 text-[11px] font-semibold text-ink/70 dark:border-white/15 dark:text-white/70">
                <X size={12} /> {a.decline}
              </span>
            </div>
          </Card>
          {videoCalls && (
            <Card className="!p-3.5">
              <div className="flex items-center gap-2">
                <Video size={14} className="text-electric-dark dark:text-electric-light" />
                <MicroLabel>{a.call}</MicroLabel>
              </div>
              <div className="mt-2 flex h-14 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-ink to-[#1d2433]">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white">
                  <UserRound size={14} />
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-electric/80 text-white">
                  <UserRound size={14} />
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-snug text-ink/60 dark:text-white/55">{a.callText}</p>
            </Card>
          )}
        </div>
      </div>
    );
  }

  if (index === 1) {
    const icons = [Lightbulb, Split, AlertTriangle, HelpCircle];
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-electric px-3 py-1.5 text-[11.5px] font-semibold text-white">
            <Mic size={13} /> {story.listening}
          </span>
          <span className="flex h-5 items-center gap-[3px]">
            {[0.1, 0.3, 0.5, 0.2, 0.4, 0.15, 0.35, 0.25].map((d, i) => (
              <span key={i} className="block h-full w-[3px] origin-center animate-wave rounded-full bg-electric/70" style={{ animationDelay: `${d}s` }} />
            ))}
          </span>
          <span className="rounded-full border border-black/[0.08] px-3 py-1 font-mono text-[10.5px] text-ink/60 dark:border-white/10 dark:text-white/55">
            {story.languagesPill}
          </span>
        </div>
        <Card className="!p-3.5">
          <p className="text-[12.5px] italic leading-relaxed text-ink/70 dark:text-white/65">
            “{story.transcript}”
            <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-caret bg-electric" />
          </p>
        </Card>
        <div className="grid gap-3 sm:grid-cols-[1.1fr_1fr]">
          <Card className="!p-3">
            <ul className="space-y-2.5">
              {story.soap.map((text, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-electric to-emerald text-[10px] font-bold text-white">
                    {story.soapLabels[i].charAt(0)}
                  </span>
                  <p className="text-[11.5px] leading-snug text-ink/80 dark:text-white/80">{text}</p>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="!p-3">
            <ul className="space-y-2.5">
              {story.reasoning.map((r, i) => {
                const Icon = icons[i] ?? Lightbulb;
                return (
                  <li key={r.label} className="flex gap-2">
                    <Icon size={13} className={`mt-0.5 shrink-0 ${i === 2 ? "text-amber-600" : "text-electric-dark dark:text-electric-light"}`} />
                    <div>
                      <MicroLabel>{r.label}</MicroLabel>
                      <p className="mt-0.5 text-[11.5px] leading-snug text-ink/80 dark:text-white/80">{r.text}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="space-y-3">
        <Card className="!p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <MicroLabel className="!text-electric-dark dark:!text-electric-light">{story.linkedLabel}</MicroLabel>
            <span className="rounded-full bg-emerald/15 px-2.5 py-0.5 text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-light">
              {evidenceLabel} · {highLabel}
            </span>
          </div>
          <p className="mt-2 flex items-start gap-2 font-display text-[1.05rem] font-semibold leading-snug text-ink dark:text-white">
            <BookOpen size={17} className="mt-1 shrink-0 text-electric-dark dark:text-electric-light" />
            {condition?.name ?? story.reasoning[0].text}
          </p>
          {phases.length > 0 && (
            <ol className="mt-3 grid gap-1.5 sm:grid-cols-3">
              {phases.map((p, i) => (
                <li
                  key={p}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] leading-snug ${
                    i === 0 ? "bg-electric/10 font-semibold text-ink dark:text-white" : "bg-mist text-ink/70 dark:bg-white/[0.05] dark:text-white/65"
                  }`}
                >
                  <span className="font-mono text-[10px] text-electric-dark dark:text-electric-light">{i + 1}</span> {p}
                </li>
              ))}
            </ol>
          )}
        </Card>
        {story.exercises.map((e) => (
          <Card key={e.name} className="flex items-center gap-3 !p-3">
            <span className="relative flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-ink to-[#1d2433]">
              <Play size={12} className="ml-0.5 text-white" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold leading-snug text-ink dark:text-white">{e.name}</p>
              <p className="mt-0.5 font-mono text-[10.5px] text-ink/60 dark:text-white/55">{e.dose}</p>
            </div>
          </Card>
        ))}
        {libraryExercise && (
          <p className="flex items-center gap-2 px-1 text-[11.5px] text-ink/60 dark:text-white/55">
            <BookOpen size={13} className="shrink-0 text-electric-dark dark:text-electric-light" />
            <span>
              {story.fromLibrary} · {story.videoLabel} · <span className="font-medium text-ink dark:text-white">{libraryExercise}</span>
            </span>
          </p>
        )}
      </div>
    );
  }

  if (index === 3) {
    const pdf = story.pdf;
    return (
      <div className="grid gap-3 sm:grid-cols-[1fr_0.95fr]">
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-lift dark:border-white/10 dark:bg-[#f4f5f7]">
          <div className="flex items-center justify-between border-b border-black/10 pb-2">
            <span className="font-display text-[12px] font-bold text-ink">PHYGO</span>
            <span className="font-mono text-[9.5px] text-ink/60">{pdf.file}</span>
          </div>
          <ul className="mt-3 space-y-2.5">
            {pdf.sections.map((s, i) => (
              <li key={s}>
                <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-[#3A5FE0]">{s}</p>
                <span className="mt-1 block h-1.5 rounded-full bg-ink/10" style={{ width: `${92 - ((i * 17) % 40)}%` }} />
                {i < 4 && <span className="mt-1 block h-1.5 w-3/5 rounded-full bg-ink/10" />}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3">
          <span className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-3 py-3 text-[12px] font-semibold text-white dark:bg-white dark:text-ink">
            <FileDown size={14} /> {pdf.download}
          </span>
          <Card className="!p-3.5">
            <div className="flex items-center gap-2">
              <ImageIcon size={14} className="text-electric-dark dark:text-electric-light" />
              <MicroLabel>{pdf.scanTitle}</MicroLabel>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-ink/75 dark:text-white/70">{pdf.scanText}</p>
            <p className="mt-2.5 inline-flex rounded-full bg-amber-400/15 px-2.5 py-1 text-[10px] font-semibold text-amber-800 dark:text-amber-300">
              {pdf.scanNote}
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const r = story.record;
  return (
    <div className="grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-3">
        <Card>
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-electric-dark dark:text-electric-light" />
            <MicroLabel>{r.title}</MicroLabel>
          </div>
          <ol className="mt-3 space-y-3 border-l border-black/10 pl-4 dark:border-white/10">
            {r.entries.map((e, i) => (
              <li key={e.when} className="relative">
                <span className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ${i === 0 ? "bg-electric" : "bg-ink/20 dark:bg-white/25"}`} />
                <p className="font-mono text-[10px] uppercase tracking-wide text-ink/60 dark:text-white/55">{e.when}</p>
                <p className="mt-0.5 text-[12px] leading-snug text-ink/80 dark:text-white/75">{e.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-mist px-2.5 py-1 text-[10.5px] text-ink/70 dark:bg-white/[0.06] dark:text-white/65">
              {r.references}: {condition?.name ? condition.name.replace(/\s*\([^)]*\)\s*$/, "") : story.reasoning[0].text}
            </span>
          </div>
        </Card>
        <div className="flex items-center gap-2">
          <span className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-ink px-3 py-2.5 text-[12px] font-semibold text-white dark:bg-white dark:text-ink">
            <ShieldCheck size={14} /> {story.review}
          </span>
        </div>
        <p className="flex items-center gap-1.5 text-[11.5px] text-ink/60 dark:text-white/55">
          <Check size={13} className="text-emerald-700 dark:text-emerald-light" /> {story.savedTo}
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
          <p className="mt-3 text-[11.5px] leading-relaxed text-ink/80 dark:text-white/75">{story.portalText}</p>
          <ul className="mt-3 space-y-1.5">
            {story.exercises.map((e) => (
              <li key={e.name} className="rounded-lg bg-mist px-2.5 py-1.5 text-[10.5px] text-ink/70 dark:bg-white/[0.05] dark:text-white/65">
                <span className="block truncate">{e.name}</span>
                <span className="font-mono text-[9.5px] text-ink/60 dark:text-white/55">{e.dose.split(" · ")[0]}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-center gap-1.5 text-[10.5px] font-semibold text-ink dark:text-white">
            <CalendarDays size={12} className="text-electric-dark dark:text-electric-light" /> {r.next}
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({
  time,
  row,
  slots,
  remoteLabel,
  inPersonLabel,
}: {
  time: string;
  row: number;
  slots: [number, number, string, boolean][];
  remoteLabel: string;
  inPersonLabel: string;
}) {
  return (
    <>
      <span className="pt-2 font-mono text-[9.5px] text-ink/60 dark:text-white/55">{time}</span>
      {[0, 1, 2, 3, 4].map((day) => {
        const slot = slots.find(([d, r]) => d === day && r === row);
        if (!slot) return <span key={day} className="h-[52px] rounded-lg border border-dashed border-black/[0.06] dark:border-white/[0.06]" />;
        const [, , name, remote] = slot;
        return (
          <span
            key={day}
            className={`flex h-[52px] flex-col justify-between overflow-hidden rounded-lg p-1.5 ${
              remote ? "bg-electric/15 text-ink dark:text-white" : "bg-emerald/15 text-ink dark:text-white"
            }`}
          >
            <span className="truncate text-[10px] font-semibold leading-tight">
              <span className="sm:hidden">{name.split(" ").pop()}</span>
              <span className="hidden sm:inline">{name}</span>
            </span>
            <span className="flex items-center gap-1 truncate text-[9px] text-ink/70 dark:text-white/65">
              {remote ? <Video size={9} className="shrink-0" /> : <UserRound size={9} className="shrink-0" />}
              <span className="hidden truncate sm:inline">{remote ? remoteLabel : inPersonLabel}</span>
            </span>
          </span>
        );
      })}
    </>
  );
}
