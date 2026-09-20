"use client";

import { motion } from "framer-motion";
import {
  Stethoscope,
  FlaskConical,
  Smartphone,
  Users,
  PersonStanding,
  BookOpen,
  ShoppingBag,
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

const toolkitPills = ["Functional Scales", "Orthopedic Tests", "Pelvic Floor", "Manual Therapy", "Metabolic Calculator"];

const smallFeatures = [
  { icon: Users, title: "Patients & Sessions", description: "Full history, notes and treatment plans for every patient, always searchable." },
  { icon: PersonStanding, title: "Body Map & Anatomy", description: "Interactive 2D/3D anatomy across musculoskeletal, neurological, cardiopulmonary and oncology systems, linked straight to conditions." },
  { icon: BookOpen, title: "Clinical Knowledge", description: "Conditions, assessment, reasoning, rehab phases and exercises — ask Phygo directly and get sourced answers while you work." },
  { icon: ShoppingBag, title: "Shop", description: "Curated equipment recommendations, matched to what you're actually treating." },
];

export default function Ecosystem() {
  return (
    <section id="features" className="relative py-28 sm:py-36 bg-mist/60 dark:bg-white/[0.03]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl mb-16">
          <p className="eyebrow text-electric mb-4">Platform</p>
          <h2 className="font-display font-semibold text-ink dark:text-white text-3xl sm:text-5xl tracking-tight text-balance">
            One platform, not one feature.
          </h2>
          <p className="mt-4 text-base text-ink/55 dark:text-white/55 leading-relaxed">
            The AI session note is the entry point. Behind it is a complete clinical
            practice — patients, tools, evidence and knowledge on one connected record.
          </p>
        </div>

        <div className="tilt-perspective grid lg:grid-cols-3 gap-5">
          {/* Large hero card: the clinical toolkit */}
          <TiltCard
            strength={4}
            className="lg:col-span-2 rounded-xl3 bg-white dark:bg-ink-soft p-8 sm:p-10 shadow-soft hover:shadow-glow transition-shadow duration-300"
          >
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-electric to-emerald text-white mb-5 shadow-soft">
              <Stethoscope size={19} />
            </div>
            <h3 className="font-display font-semibold text-xl text-ink dark:text-white mb-2">
              Clinical Tools
            </h3>
            <p className="text-sm text-ink/55 dark:text-white/55 leading-relaxed max-w-sm mb-5">
              A full clinical toolkit alongside the AI engine — not a separate app to switch to.
            </p>
            <div className="flex flex-wrap gap-2">
              {toolkitPills.map((p) => (
                <span
                  key={p}
                  className="rounded-full bg-electric/8 dark:bg-white/5 px-3 py-1.5 text-xs font-medium text-ink/65 dark:text-white/65"
                >
                  {p}
                </span>
              ))}
            </div>
          </TiltCard>

          {/* Dark accent card: scientific evidence */}
          <TiltCard
            strength={4}
            dark
            className="rounded-xl3 bg-ink text-white p-8 shadow-soft hover:shadow-glow transition-shadow duration-300"
          >
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white mb-5">
              <FlaskConical size={19} />
            </div>
            <h3 className="font-display font-semibold text-xl mb-2">Scientific Evidence</h3>
            <p className="text-sm text-white/55 leading-relaxed">
              Published research, summarized for physiotherapy practice and surfaced right
              inside your clinical notes — not a separate library to remember to check.
            </p>
          </TiltCard>

          {/* Wide card: My Phygo patient portal */}
          <TiltCard
            strength={4}
            className="lg:col-span-2 rounded-xl3 bg-white dark:bg-ink-soft p-8 shadow-soft hover:shadow-glow transition-shadow duration-300 flex flex-col sm:flex-row items-start sm:items-center gap-6"
          >
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald/15 to-emerald/5 text-emerald-dark shrink-0">
              <Smartphone size={19} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-ink dark:text-white mb-2">
                My Phygo — Patient Portal
              </h3>
              <p className="text-sm text-ink/55 dark:text-white/55 leading-relaxed">
                Patients see their program, book appointments, join video calls and track
                progress — reached from the same note you just approved.
              </p>
            </div>
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
