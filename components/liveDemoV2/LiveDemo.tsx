"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MagneticButton from "../MagneticButton";

type FieldKey = "subjective" | "objective" | "assessment" | "plan";

const SCRIPT =
  "Patient reports right shoulder pain for three weeks, worse with overhead movements...";

const FIELDS: Record<FieldKey, { label: string; value: string }> = {
  subjective: {
    label: "Subjective",
    value: "Right shoulder pain for 3 weeks, worsens with overhead movement.",
  },
  objective: {
    label: "Objective",
    value: "Limited ROM in flexion and abduction. Positive Neer's test.",
  },
  assessment: {
    label: "Assessment",
    value: "Presentation consistent with rotator cuff tendinopathy.",
  },
  plan: {
    label: "Plan",
    value: "Cuff strengthening + scapular mobility program, 3x/week.",
  },
};

const TAGS = ["Shoulder pain", "Overhead limitation", "3 weeks duration"];

const FIELD_ORDER: FieldKey[] = ["subjective", "objective", "assessment", "plan"];
const NUM_BARS = 30;

export default function LiveDemo() {
  const [phase, setPhase] = useState<"rec" | "processing">("rec");
  const [typed, setTyped] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [filled, setFilled] = useState<Record<FieldKey, string>>({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });
  const [flashKey, setFlashKey] = useState<FieldKey | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [bars, setBars] = useState<number[]>(() => Array(NUM_BARS).fill(4));
  const waveActive = useRef(true);
  const cycleTimeout = useRef<NodeJS.Timeout | null>(null);

  // waveform animation
  useEffect(() => {
    const id = setInterval(() => {
      setBars((prev) =>
        prev.map(() =>
          waveActive.current ? 3 + Math.random() * 17 : 3
        )
      );
    }, 110);
    return () => clearInterval(id);
  }, []);

  // main cycle
  useEffect(() => {
    let cancelled = false;
    let timerId: NodeJS.Timeout;

    function resetAll() {
      setPhase("rec");
      setTyped("");
      setSeconds(0);
      setFilled({ subjective: "", objective: "", assessment: "", plan: "" });
            setTags([]);
      setShowEvidence(false);
      waveActive.current = true;
    }


    function runCycle() {
      if (cancelled) return;
      resetAll();

      let s = 0;
      timerId = setInterval(() => {
        s += 1;
        setSeconds(s);
      }, 1000);

      let i = 0;
      function typeStep() {
        if (cancelled) return;
        if (i <= SCRIPT.length) {
          setTyped(SCRIPT.slice(0, i));
          i++;
          cycleTimeout.current = setTimeout(typeStep, 27);
        } else {
          clearInterval(timerId);
          waveActive.current = false;
          setPhase("processing");

          TAGS.forEach((t, idx) => {
            setTimeout(() => {
              if (!cancelled) setTags((prev) => [...prev, t]);
            }, idx * 260);
          });

          cycleTimeout.current = setTimeout(() => {
            let f = 0;
            function fillStep() {
              if (cancelled) return;
              const key = FIELD_ORDER[f];
              setFilled((prev) => ({ ...prev, [key]: FIELDS[key].value }));
              setFlashKey(key);
              setTimeout(() => setFlashKey(null), 1100);
              f++;
              if (f < FIELD_ORDER.length) {
                cycleTimeout.current = setTimeout(fillStep, 600);
                            } else {
                setTimeout(() => setShowEvidence(true), 300);
                cycleTimeout.current = setTimeout(runCycle, 3600);
              }

            }
            fillStep();
          }, 500);
        }
      }
      typeStep();
    }

    runCycle();

    return () => {
      cancelled = true;
      clearInterval(timerId);
      if (cycleTimeout.current) clearTimeout(cycleTimeout.current);
    };
  }, []);

  const mm = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="relative">
      {/* ambient glow */}
      <motion.div
        className="pointer-events-none absolute -inset-14 -z-10 rounded-[40px] opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 22% 10%, #4F7CFF, transparent 55%), radial-gradient(circle at 88% 90%, #32D6A0, transparent 55%)",
        }}
        animate={{ opacity: [0.24, 0.34, 0.24], x: [0, -8, 0], y: [0, 6, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-[22px] border border-black/5 dark:border-white/[0.075] bg-white/95 dark:bg-[#0e0f12]/85 shadow-[0_1px_1px_rgba(15,23,42,0.03),0_8px_24px_-8px_rgba(15,23,42,0.10),0_32px_64px_-24px_rgba(15,23,42,0.16)] dark:shadow-[0_1px_1px_rgba(0,0,0,0.4),0_20px_40px_-12px_rgba(79,124,255,0.16),0_48px_90px_-30px_rgba(0,0,0,0.65)] backdrop-blur-xl"
      >
        {/* window chrome */}
        <div className="relative flex items-center justify-center gap-2 py-3.5 px-4 border-b border-black/[0.055] dark:border-white/[0.06] bg-black/[0.012] dark:bg-white/[0.018]">
          <div className="absolute left-4 flex gap-1.5">
            <span className="h-[8.5px] w-[8.5px] rounded-full bg-[#FF5F57]" />
            <span className="h-[8.5px] w-[8.5px] rounded-full bg-[#FEBC2E]" />
            <span className="h-[8.5px] w-[8.5px] rounded-full bg-[#28C840]" />
          </div>
                    <span className="text-[12.5px] font-medium tracking-tight text-ink dark:text-white/90">
            Post-session note
          </span>
                                        


        </div>


        {/* status + waveform */}
        <div className="relative flex items-center gap-3.5 px-5 py-3.5 border-b border-black/[0.06] dark:border-white/[0.07] bg-black/[0.012] dark:bg-white/[0.018] overflow-hidden">
          {phase === "processing" && (
            <motion.div
              className="pointer-events-none absolute inset-y-0 w-2/5"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(79,124,255,0.16), transparent)",
              }}
              animate={{ left: ["-40%", "110%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] font-mono text-[10.5px] font-semibold tracking-wide ${
              phase === "rec"
                ? "bg-[#FF5F57]/10 text-[#FF5F57]"
                : "bg-electric/10 text-[#6D8FFF]"
            }`}
          >
            {phase === "rec" && (
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-[#FF5F57]"
                animate={{ opacity: [1, 0.35, 1], scale: [1, 0.85, 1] }}
                transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            {phase === "rec" ? "REC" : "PROCESSING"}
          </span>

          <div className="flex items-center gap-[2.5px] h-[22px]">
            {bars.map((h, idx) => (
              <div
                key={idx}
                className="w-[2.5px] rounded-[3px] opacity-90"
                style={{
                  height: `${h}px`,
                  background: "linear-gradient(180deg, #6D8FFF, #32D6A0)",
                  transition: "height 100ms ease-out",
                }}
              />
            ))}
          </div>

          <span className="ml-auto font-mono text-[11px] tracking-wide text-ink/50 dark:text-white/50">
            {mm}:{ss}
          </span>
        </div>

        {/* transcript */}
        <div className="px-5 py-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-ink/50 dark:text-white/50">
            Transcript
          </p>
          <p className="min-h-[2.6em] text-[14.5px] leading-relaxed text-ink dark:text-white/90">
            {typed}
            <span className="ml-[1.5px] inline-block h-[1em] w-[1.5px] animate-pulse bg-current align-[-2px]" />
          </p>
        </div>

        {/* note fields */}
        <div className="grid grid-cols-1 gap-2.5 px-5 pb-5 md:grid-cols-2">
          {FIELD_ORDER.map((key) => (
            <motion.div
              key={key}
              className="rounded-xl border border-black/[0.045] dark:border-white/[0.05] bg-black/[0.02] dark:bg-white/[0.025] p-3.5"
              animate={
                flashKey === key
                  ? {
                      boxShadow: [
                        "0 0 0 0 rgba(79,124,255,0)",
                        "0 0 0 3px rgba(79,124,255,0.22)",
                        "0 0 0 0 rgba(79,124,255,0)",
                      ],
                    }
                  : {}
              }
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-ink/50 dark:text-white/50">
                {FIELDS[key].label}
              </p>
              <p
                className={`text-[12.5px] leading-snug ${
                  filled[key]
                    ? "text-ink dark:text-white/90"
                    : "text-ink/30 dark:text-white/30"
                }`}
              >
                {filled[key] || "—"}
              </p>
            </motion.div>
          ))}
        </div>

                {/* evidence-based reveal */}
        <AnimatePresence>
          {showEvidence && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mx-5 mb-3 flex items-center gap-2 rounded-xl px-3.5 py-2.5"
              style={{
                background: "linear-gradient(90deg, rgba(50,214,160,0.12), rgba(79,124,255,0.12))",
                border: "1px solid rgba(50,214,160,0.25)",
              }}
            >
              <span className="text-base leading-none">🛡️</span>
              <span className="text-[12px] font-semibold text-ink dark:text-white/90">
                Evidence-based rehab protocol suggested
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* tags */}
        <div className="flex min-h-[30px] flex-wrap gap-1.5 px-5 pb-4">

          <AnimatePresence>
            {tags.map((t) => (
              <motion.span
                key={t}
                initial={{ opacity: 0, y: 5, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-full border border-black/[0.055] dark:border-white/[0.07] bg-black/[0.035] dark:bg-white/[0.035] px-2.5 py-1 text-[11px] font-medium text-ink/70 dark:text-white/70"
              >
                {t}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>

        {/* footer */}
        <div className="border-t border-black/[0.06] dark:border-white/[0.07] bg-black/[0.012] dark:bg-white/[0.018] px-5 py-2.5">
          <span className="text-[11px] tracking-tight text-ink/50 dark:text-white/50">
            Phygo writes the documentation as you talk.
          </span>
        </div>
      </motion.div>
    </div>
  );
}
