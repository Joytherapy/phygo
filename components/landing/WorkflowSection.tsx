"use client";

import { motion } from "framer-motion";
import { Mic, FileText, Dumbbell, UserCheck, ScanLine, FileDown, MessageSquareText, FlaskConical } from "lucide-react";
import { Reveal, SectionHeader } from "./ui";

// Each step describes what the copilot actually does today — see
// components/liveStructuring/LiveStructuring.tsx (voice/text input, PDF
// export, explicit save) and app/api/generate-note, refine-exercises,
// exercise-intelligence, analyze-scan and science/relevant.
const STEPS = [
  {
    icon: Mic,
    title: "Clinical conversation",
    text: "Dictate or type your session notes the way you think — in Italian, English, Spanish or French.",
    chip: "“Right shoulder, 3 weeks, painful arc…”",
  },
  {
    icon: FileText,
    title: "Structured documentation",
    text: "A SOAP draft plus clinical reasoning: hypotheses, differentials, red flags and the information still missing — written as decision support.",
    chip: "S · O · A · P + reasoning",
  },
  {
    icon: Dumbbell,
    title: "Exercises & rehab plan",
    text: "Exercises with sets, reps and frequency, refined against a phased protocol when the condition has one and matched to reference exercises where possible.",
    chip: "Phase 2 · 3 exercises",
  },
  {
    icon: UserCheck,
    title: "Your professional review",
    text: "Edit or discard anything. Nothing reaches the patient record until you save it.",
    chip: "Review → Save",
  },
];

const EXTRAS = [
  { icon: ScanLine, text: "Upload a scan or referral photo for an AI-assisted summary" },
  { icon: FlaskConical, text: "See related studies from the Evidence library" },
  { icon: FileDown, text: "Export the note as a PDF" },
  { icon: MessageSquareText, text: "Get a plain-language summary for your patient" },
];

export default function WorkflowSection() {
  return (
    <section id="how-it-works" aria-labelledby="workflow-title" className="relative py-24 sm:py-32 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          id="workflow-title"
          eyebrow="AI clinical copilot"
          title="From the session to a rehab plan — with you in control."
          intro="The copilot does the first draft of the paperwork so your attention stays on the patient. Every output is a proposal you check, edit and approve."
        />

        <ol className="relative mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {/* connector line explaining the direction of the workflow */}
          <div aria-hidden className="hidden lg:block absolute top-[38px] left-[12%] right-[12%] h-px bg-ink/10 dark:bg-white/10">
            <motion.div
              className="h-full bg-grad-line origin-left"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          {STEPS.map((s, i) => (
            <Reveal
              as="li"
              key={s.title}
              delay={i * 0.12}
              className="relative h-full list-none rounded-xl3 bg-white dark:bg-ink-soft shadow-soft p-6 ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
            >
                <div className="flex items-center justify-between">
                  <span className="relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-electric to-emerald text-white shadow-soft">
                    <s.icon size={18} aria-hidden />
                  </span>
                  <span className="eyebrow text-ink/30 dark:text-white/30">Step {i + 1}</span>
                </div>
                <h3 className="mt-5 font-display font-semibold text-lg text-ink dark:text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/60 dark:text-white/55">{s.text}</p>
                <p className="mt-4 inline-block rounded-lg bg-mist dark:bg-white/[0.05] px-2.5 py-1.5 font-mono text-[11px] text-ink/60 dark:text-white/55">
                  {s.chip}
                </p>
            </Reveal>
          ))}
        </ol>

        <Reveal className="mt-8">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {EXTRAS.map((e) => (
              <li
                key={e.text}
                className="flex items-start gap-3 rounded-xl2 border border-black/[0.06] dark:border-white/[0.07] px-4 py-3.5 text-[13px] leading-snug text-ink/65 dark:text-white/60"
              >
                <e.icon size={16} aria-hidden className="mt-0.5 shrink-0 text-electric" />
                {e.text}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
