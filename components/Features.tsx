"use client";

import { motion } from "framer-motion";
import {
  AudioLines,
  BrainCircuit,
  History,
  FileDown,
  MessageCircle,
  Dumbbell,
  CalendarClock,
  CloudUpload,
} from "lucide-react";
import { useRef } from "react";
import { useTilt } from "./useTilt";

function TiltCard({
  children,
  className = "",
  strength = 6,
  dark = false,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  dark?: boolean;
}) {
  const { ref, rotateX, rotateY, onMouseMove, onMouseLeave } = useTilt(strength);
  const glowRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    onMouseMove(e);
    const el = ref.current;
    const glow = glowRef.current;
    if (!el || !glow) return;
    const rect = el.getBoundingClientRect();
    const color = dark ? "rgba(255,255,255,0.08)" : "rgba(79,124,255,0.12)";
    glow.style.background = `radial-gradient(240px circle at ${e.clientX - rect.left}px ${
      e.clientY - rect.top
    }px, ${color}, transparent 70%)`;
    glow.style.opacity = "1";
  };

  const handleLeave = () => {
    onMouseLeave();
    if (glowRef.current) glowRef.current.style.opacity = "0";
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={`relative isolate overflow-hidden ${className}`}
    >
      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] opacity-0 transition-opacity duration-300"
      />
      {children}
    </motion.div>
  );
}

const smallFeatures = [
  { icon: History, title: "Patient History", description: "Every session organized and searchable over time." },
  { icon: FileDown, title: "Automatic PDF", description: "Polished reports ready to print or share instantly." },
  { icon: Dumbbell, title: "Exercise Library", description: "Attach the right exercises with one tap." },
  { icon: CalendarClock, title: "Appointments", description: "Scheduling that stays in sync with your notes." },
  { icon: CloudUpload, title: "Cloud Storage", description: "Encrypted, backed up, accessible from anywhere." },
];

export default function Features() {
  return (
    <section id="features" className="relative py-28 sm:py-36 bg-mist/60 dark:bg-white/[0.03]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl mb-16">
          <p className="eyebrow text-electric mb-4">Features</p>
          <h2 className="font-display font-semibold text-ink dark:text-white text-3xl sm:text-5xl tracking-tight text-balance">
            Everything a modern practice needs.
          </h2>
        </div>

        <div className="tilt-perspective grid lg:grid-cols-3 gap-5">
          {/* Large hero feature: voice recording with live waveform */}
          <TiltCard
            strength={4}
            className="lg:col-span-2 rounded-xl3 bg-white dark:bg-ink-soft p-8 sm:p-10 shadow-soft hover:shadow-glow transition-shadow duration-300 flex flex-col sm:flex-row items-start sm:items-center gap-8"
          >
            <div className="flex-1">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-electric to-emerald text-white mb-5 shadow-soft">
                <AudioLines size={19} />
              </div>
              <h3 className="font-display font-semibold text-xl text-ink dark:text-white mb-2">
                Voice Recording
              </h3>
              <p className="text-sm text-ink/55 dark:text-white/55 leading-relaxed max-w-sm">
                Capture sessions in natural speech, in any language, with studio-grade
                clarity — no dictation training required.
              </p>
            </div>
            <div className="flex items-end gap-1 h-16 shrink-0">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="w-1.5 rounded-full bg-gradient-to-t from-electric to-emerald"
                  animate={{ height: [8, 14 + ((i * 6) % 48), 8] }}
                  transition={{
                    duration: 1.1 + (i % 5) * 0.15,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.04,
                  }}
                />
              ))}
            </div>
          </TiltCard>

          {/* Large feature: AI clinical notes */}
          <TiltCard
            strength={4}
            dark
            className="rounded-xl3 bg-ink text-white p-8 shadow-soft hover:shadow-glow transition-shadow duration-300"
          >
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white mb-5">
              <BrainCircuit size={19} />
            </div>
            <h3 className="font-display font-semibold text-xl mb-2">AI Clinical Notes</h3>
            <p className="text-sm text-white/55 leading-relaxed">
              Structured, professional notes generated automatically from what you say.
            </p>
          </TiltCard>

          {/* Wide feature: WhatsApp integration */}
          <TiltCard
            strength={4}
            className="rounded-xl3 bg-white dark:bg-ink-soft p-8 shadow-soft hover:shadow-glow transition-shadow duration-300"
          >
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald/15 to-emerald/5 text-emerald-dark mb-5">
              <MessageCircle size={19} />
            </div>
            <h3 className="font-display font-semibold text-lg text-ink dark:text-white mb-2">
              WhatsApp Integration
            </h3>
            <p className="text-sm text-ink/55 dark:text-white/55 leading-relaxed">
              Send follow-ups where your patients already are.
            </p>
          </TiltCard>

          {smallFeatures.map((f) => (
            <TiltCard
              key={f.title}
              strength={5}
              className="rounded-xl2 bg-white dark:bg-ink-soft p-6 shadow-soft hover:shadow-glow transition-shadow duration-300"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-electric/10 to-emerald/10 text-electric mb-4">
                <f.icon size={17} />
              </div>
              <h3 className="font-semibold text-ink dark:text-white text-[15px] mb-1.5">{f.title}</h3>
              <p className="text-[13px] text-ink/55 dark:text-white/55 leading-relaxed">{f.description}</p>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
}
