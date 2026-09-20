"use client";

import { motion } from "framer-motion";
import { Mic, Layers, Eye, Route, BookOpen, Users, LineChart } from "lucide-react";

const steps = [
  {
    icon: Mic,
    title: "Talk",
    description: "Describe the session naturally — voice or text, in your own language.",
  },
  {
    icon: Layers,
    title: "Structure",
    description: "Organized into SOAP format automatically: subjective, objective, assessment, plan.",
  },
  {
    icon: Eye,
    title: "Review",
    description: "Full clinical reasoning shown — hypotheses, differentials, red flags — fully editable.",
  },
  {
    icon: Route,
    title: "Plan",
    description: "A phased rehab plan and exercise prescription, matched to the patient's stage.",
  },
  {
    icon: BookOpen,
    title: "Evidence",
    description: "Relevant published research surfaced automatically, matched to the case.",
  },
  {
    icon: Users,
    title: "Connect",
    description: "The approved note reaches the patient through My Phygo — never sent unreviewed.",
  },
  {
    icon: LineChart,
    title: "Measure",
    description: "Every session builds a longitudinal record — the next visit picks up where this left off.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl mb-16">
          <p className="eyebrow text-electric mb-4">How Phygo Works</p>
          <h2 className="font-display font-semibold text-ink dark:text-white text-3xl sm:text-5xl tracking-tight text-balance">
            From a conversation to a clinical workflow.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: (i % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-xl2 glass shadow-soft p-6 hover:shadow-glow transition-shadow duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-electric to-emerald text-white shadow-soft">
                  <s.icon size={17} />
                </div>
                <span className="eyebrow text-ink/25 dark:text-white/25">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="font-display font-semibold text-base text-ink dark:text-white mb-1.5">
                {s.title}
              </h3>
              <p className="text-[13px] text-ink/55 dark:text-white/55 leading-relaxed">
                {s.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
