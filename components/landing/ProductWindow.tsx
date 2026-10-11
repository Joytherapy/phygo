"use client";

import { motion } from "framer-motion";
import {
  Users,
  Mic,
  BookOpen,
  PersonStanding,
  Dumbbell,
  FlaskConical,
  ShieldCheck,
  PencilLine,
} from "lucide-react";

// Illustrative product window for the hero. It mirrors the real copilot
// output shape (SOAP draft + reasoning + exercises, see
// app/api/generate-note/route.ts) and the real library linking, but the text
// is a sample case — the caption under it says so.

const NAV = [
  { icon: Users, label: "Patients" },
  { icon: Mic, label: "Copilot", active: true },
  { icon: BookOpen, label: "Conditions" },
  { icon: PersonStanding, label: "Body map" },
  { icon: Dumbbell, label: "Exercises" },
  { icon: FlaskConical, label: "Evidence" },
];

const SOAP = [
  { k: "S", label: "Subjective", text: "Right shoulder pain for 3 weeks, worse with overhead reaching." },
  { k: "O", label: "Objective", text: "Painful arc 70–120°. Reduced strength on resisted external rotation." },
  { k: "A", label: "Assessment", text: "Presentation may be consistent with rotator cuff related shoulder pain." },
  { k: "P", label: "Plan", text: "Graded loading of the cuff and scapular muscles; review in 2 weeks." },
];

const EXERCISES = ["Isometric external rotation · 5×30s", "Side-lying external rotation · 3×12", "Scapular retraction with band · 3×15"];

export default function ProductWindow() {
  const appear = (i: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay: 0.5 + i * 0.18, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <div className="relative" aria-label="Illustrative PHYGO interface: a session draft linked to the condition library" role="img">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-10 -z-10 rounded-[48px] opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 20% 15%, rgba(79,124,255,0.55), transparent 55%), radial-gradient(circle at 85% 85%, rgba(50,214,160,0.45), transparent 55%)",
        }}
      />
      <div className="overflow-hidden rounded-[22px] border border-black/[0.08] dark:border-white/[0.08] bg-white/95 dark:bg-[#0e0f12]/90 shadow-lift dark:shadow-softDark backdrop-blur-xl">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-black/[0.06] dark:border-white/[0.06] px-4 py-3">
          <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
          <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
          <span className="h-2 w-2 rounded-full bg-[#28C840]" />
          <span className="ml-3 text-[12px] font-medium text-ink/70 dark:text-white/70">Session · Sample patient</span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-0.5 text-[10.5px] font-semibold text-amber-700 dark:text-amber-300">
            <PencilLine size={11} aria-hidden /> Draft — not saved
          </span>
        </div>

        <div className="grid md:grid-cols-[150px_1fr_220px]">
          {/* sidebar */}
          <nav aria-hidden className="hidden md:flex flex-col gap-0.5 border-r border-black/[0.06] dark:border-white/[0.06] p-3">
            {NAV.map((n) => (
              <span
                key={n.label}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium ${
                  n.active
                    ? "bg-electric/10 text-electric dark:text-electric-light"
                    : "text-ink/55 dark:text-white/50"
                }`}
              >
                <n.icon size={14} />
                {n.label}
              </span>
            ))}
          </nav>

          {/* SOAP draft */}
          <div className="p-4 sm:p-5 space-y-2.5">
            {SOAP.map((f, i) => (
              <motion.div
                key={f.k}
                {...appear(i)}
                className="flex gap-3 rounded-xl border border-black/[0.05] dark:border-white/[0.06] bg-black/[0.015] dark:bg-white/[0.025] p-3"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-electric to-emerald text-[11px] font-bold text-white">
                  {f.k}
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink/50 dark:text-white/45">{f.label}</p>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-ink/85 dark:text-white/85">{f.text}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* linked knowledge + exercises */}
          <div className="border-t md:border-t-0 md:border-l border-black/[0.06] dark:border-white/[0.06] p-4 space-y-3">
            <motion.div {...appear(4)} className="rounded-xl bg-electric/[0.07] dark:bg-electric/10 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-electric">Linked condition</p>
              <p className="mt-1 text-[12.5px] font-semibold leading-snug text-ink dark:text-white">
                Rotator Cuff Related Shoulder Pain
              </p>
              <p className="mt-1 text-[11px] text-ink/55 dark:text-white/50">Goals · Tests · Red flags · Rehab phases</p>
            </motion.div>
            <motion.div {...appear(5)} className="rounded-xl border border-black/[0.05] dark:border-white/[0.06] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink/50 dark:text-white/45">Exercise draft</p>
              <ul className="mt-1.5 space-y-1">
                {EXERCISES.map((e) => (
                  <li key={e} className="text-[11.5px] leading-snug text-ink/75 dark:text-white/75">
                    {e}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              {...appear(6)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-ink dark:bg-white px-3 py-2 text-[11.5px] font-semibold text-white dark:text-ink"
            >
              <ShieldCheck size={13} aria-hidden /> Review &amp; save
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
