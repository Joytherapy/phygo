"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Dumbbell,
  FlaskConical,
  Mic,
  PencilLine,
  PersonStanding,
  Play,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";
import type { LandingDict } from "@/lib/i18n/landingStrings";
import { EASE, MicroLabel, MockCaption, PrimaryButton, Rich, SecondaryButton } from "./ui";

type Props = {
  hero: LandingDict["hero"];
  story: LandingDict["story"];
  conditionsText: string;
  exercisesText: string;
  condition: { name: string; phases: string[] } | null;
  libraryExercise: string | null;
};

const SIDEBAR_ICONS = [Users, Mic, BookOpen, PersonStanding, Dumbbell, FlaskConical];

const enter = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay: 0.06 * i, ease: EASE },
});

const appear = (delay: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: EASE },
});

/** Renders the hero sub-line, swapping {conditions}/{exercises} for emphasised phrases. */
function Sub({ text, conditions, exercises }: { text: string; conditions: string; exercises: string }) {
  const parts = text.split(/(\{conditions\}|\{exercises\})/g);
  return (
    <>
      {parts.map((p, i) =>
        p === "{conditions}" ? (
          <strong key={i} className="font-semibold text-ink dark:text-white">
            {conditions}
          </strong>
        ) : p === "{exercises}" ? (
          <strong key={i} className="font-semibold text-ink dark:text-white">
            {exercises}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

export default function Hero({ hero, story, conditionsText, exercisesText, condition, libraryExercise }: Props) {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 lp-dots [mask-image:radial-gradient(70%_60%_at_50%_30%,#000,transparent)]" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] bg-grad-hero" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <motion.p {...enter(0)} className="eyebrow inline-flex items-center gap-2.5 text-ink/60 max-sm:text-[9.5px] max-sm:tracking-[0.08em] dark:text-white/55">
            <span aria-hidden className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald" />
            </span>
            {hero.eyebrow}
          </motion.p>

          <motion.h1
            id="hero-title"
            {...enter(1)}
            className="mt-7 font-display font-semibold tracking-[-0.045em] text-ink dark:text-white text-[2.5rem] leading-[1.02] sm:text-[4.6rem] sm:leading-[0.98] lg:text-[5.4rem] text-balance"
          >
            <Rich text={hero.title} />
          </motion.h1>

          <motion.p
            {...enter(2)}
            className="mx-auto mt-7 max-w-2xl text-[1.06rem] leading-8 text-ink/65 dark:text-white/60 sm:text-lg text-pretty"
          >
            <Sub text={hero.sub} conditions={conditionsText} exercises={exercisesText} />
          </motion.p>

          <motion.div {...enter(3)} className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <PrimaryButton href="/login?mode=signup">{hero.ctaPrimary}</PrimaryButton>
            <SecondaryButton href="#tour">{hero.ctaSecondary}</SecondaryButton>
          </motion.div>

          <motion.ul
            {...enter(4)}
            className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink/60 dark:text-white/55"
          >
            {hero.assurances.map((a, i) => (
              <li key={a} className="flex items-center gap-4">
                {i > 0 && <span aria-hidden className="hidden h-3 w-px bg-current opacity-40 sm:block" />}
                {a}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: EASE }}
          className="relative mx-auto mt-16 max-w-6xl sm:mt-20"
        >
          <Stage hero={hero} story={story} condition={condition} libraryExercise={libraryExercise} />
          <MockCaption>{hero.caption}</MockCaption>
        </motion.div>
      </div>
    </section>
  );
}

function Stage({
  hero,
  story,
  condition,
  libraryExercise,
}: Pick<Props, "hero" | "story" | "condition" | "libraryExercise">) {
  const s = hero.stage;
  const phases = condition?.phases.length ? condition.phases : null;

  return (
    <div role="img" aria-label={s.ariaLabel} className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 -inset-y-12 -z-10 opacity-60 blur-3xl dark:opacity-50"
        style={{
          background:
            "radial-gradient(40% 50% at 25% 30%, rgba(79,124,255,0.35), transparent 70%), radial-gradient(35% 45% at 80% 75%, rgba(50,214,160,0.28), transparent 70%)",
        }}
      />

      {/* Main window */}
      <div aria-hidden className="lp-ticks overflow-hidden rounded-[22px] border border-black/[0.08] bg-white/95 shadow-lift backdrop-blur-xl dark:border-white/[0.09] dark:bg-[#0f1116]/95 dark:shadow-softDark">
        <div className="flex items-center gap-2 border-b border-black/[0.06] px-4 py-3 dark:border-white/[0.06]">
          <span className="h-2.5 w-2.5 rounded-full bg-ink/10 dark:bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink/10 dark:bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink/10 dark:bg-white/15" />
          <span className="ml-3 truncate text-[12px] font-medium text-ink/70 dark:text-white/70">{s.windowTitle}</span>
          <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-1 text-[10.5px] font-semibold text-amber-700 dark:text-amber-300">
            <PencilLine size={11} /> {s.draft}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[168px_minmax(0,1fr)_260px]">
          <div className="hidden md:flex flex-col gap-0.5 border-r border-black/[0.06] p-3 dark:border-white/[0.06]">
            {s.sidebar.map((label, i) => {
              const Icon = SIDEBAR_ICONS[i] ?? BookOpen;
              const active = i === 1;
              return (
                <span
                  key={label}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-medium ${
                    active ? "bg-electric/10 text-electric-dark dark:text-electric-light" : "text-ink/60 dark:text-white/55"
                  }`}
                >
                  <Icon size={14} />
                  <span className="truncate">{label}</span>
                </span>
              );
            })}
          </div>

          <div className="min-w-0 space-y-2.5 p-4 sm:p-5">
            <motion.div
              {...appear(0.55)}
              className="flex items-center gap-3 rounded-xl border border-electric/20 bg-electric/[0.05] px-3 py-2.5 dark:bg-electric/[0.08]"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-electric text-white">
                <Mic size={13} />
              </span>
              <span className="flex h-5 items-center gap-[3px]">
                {[0.1, 0.3, 0.5, 0.2, 0.4, 0.15, 0.35].map((d, i) => (
                  <span
                    key={i}
                    className="block h-full w-[3px] origin-center animate-wave rounded-full bg-electric/70"
                    style={{ animationDelay: `${d}s` }}
                  />
                ))}
              </span>
              <span className="min-w-0 truncate text-[12px] italic text-ink/70 dark:text-white/65">{s.voiceText}</span>
            </motion.div>

            {story.soap.map((text, i) => (
              <motion.div
                key={i}
                {...appear(0.8 + i * 0.16)}
                className="flex gap-3 rounded-xl border border-black/[0.05] bg-black/[0.015] p-3 dark:border-white/[0.06] dark:bg-white/[0.025]"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-electric to-emerald text-[11px] font-bold text-white">
                  {story.soapLabels[i].charAt(0)}
                </span>
                <div className="min-w-0">
                  <MicroLabel>{story.soapLabels[i]}</MicroLabel>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-ink/85 dark:text-white/85">{text}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="min-w-0 space-y-3 border-t border-black/[0.06] p-4 dark:border-white/[0.06] md:border-l md:border-t-0">
            <motion.div {...appear(1.5)} className="rounded-xl bg-electric/[0.07] p-3 dark:bg-electric/10">
              <div className="flex items-center justify-between gap-2">
                <MicroLabel className="!text-electric dark:!text-electric-light">{s.linkedLabel}</MicroLabel>
                <span className="shrink-0 whitespace-nowrap rounded-full bg-emerald/15 px-2 py-0.5 text-[9.5px] font-semibold text-emerald-700 dark:text-emerald-light">
                  {s.evidence}
                </span>
              </div>
              <p className="mt-1.5 text-[12.5px] font-semibold leading-snug text-ink dark:text-white">
                {condition?.name ?? story.reasoning[0].text}
              </p>
            </motion.div>

            <motion.div {...appear(1.7)} className="rounded-xl border border-black/[0.05] p-3 dark:border-white/[0.06]">
              <MicroLabel>{s.exerciseLabel}</MicroLabel>
              <ul className="mt-1.5 space-y-1.5">
                {story.exercises.map((e) => (
                  <li key={e.name} className="text-[11.5px] leading-snug">
                    <span className="text-ink/80 dark:text-white/80">{e.name}</span>
                    <span className="block font-mono text-[10px] text-ink/60 dark:text-white/55">{e.dose}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {phases && (
              <motion.div {...appear(1.9)}>
                <MicroLabel>{s.phasesLabel}</MicroLabel>
                <ol className="mt-1.5 flex gap-1">
                  {phases.map((p, i) => (
                    <li
                      key={p}
                      title={p}
                      className={`h-1.5 flex-1 rounded-full ${i === 0 ? "bg-gradient-to-r from-electric to-emerald" : "bg-ink/10 dark:bg-white/10"}`}
                    />
                  ))}
                </ol>
                <p className="mt-1.5 truncate text-[10.5px] text-ink/60 dark:text-white/55">1 · {phases[0]}</p>
              </motion.div>
            )}

            <motion.div
              {...appear(2.1)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-ink px-3 py-2.5 text-[11.5px] font-semibold text-white dark:bg-white dark:text-ink"
            >
              <ShieldCheck size={13} /> {s.reviewSave}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Floating: real exercise from the library */}
      {libraryExercise && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.2, ease: EASE }}
          className="absolute -right-6 -bottom-10 hidden w-64 lg:block xl:-right-14"
        >
          <div className="animate-floatSlow rounded-2xl border border-black/[0.07] bg-white p-3 shadow-lift dark:border-white/10 dark:bg-[#15171d]">
            <div className="relative flex h-24 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-ink to-[#1d2433]">
              <div className="absolute inset-0 lp-dots opacity-60" />
              <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-soft">
                <Play size={16} className="ml-0.5" />
              </span>
              <span className="absolute left-2 top-2 rounded-full bg-white/15 px-2 py-0.5 text-[9.5px] font-semibold text-white">
                {story.videoLabel}
              </span>
            </div>
            <MicroLabel className="mt-2.5">{story.fromLibrary}</MicroLabel>
            <p className="mt-0.5 text-[12px] font-semibold leading-snug text-ink dark:text-white">{libraryExercise}</p>
          </div>
        </motion.div>
      )}

      {/* Floating: patient view */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 2.4, ease: EASE }}
        className="absolute -left-6 -bottom-12 hidden w-60 lg:block xl:-left-14"
      >
        <div className="animate-float rounded-2xl border border-black/[0.07] bg-white p-3.5 shadow-lift dark:border-white/10 dark:bg-[#15171d]" style={{ animationDuration: "8s" }}>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald/15 text-emerald-700 dark:text-emerald-light">
              <Smartphone size={12} />
            </span>
            <MicroLabel>{story.portalTitle}</MicroLabel>
          </div>
          <p className="mt-2 text-[11.5px] leading-snug text-ink/75 dark:text-white/70">{story.portalText}</p>
        </div>
      </motion.div>
    </div>
  );
}
