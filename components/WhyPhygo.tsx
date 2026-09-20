"use client";

import { motion } from "framer-motion";
import { Clock, GitBranch, Microscope, HeartHandshake, History, LayoutGrid } from "lucide-react";

const reasons = [
  { icon: Clock, title: "Save time", description: "Notes done in minutes, not after hours." },
  { icon: GitBranch, title: "Clinical workflow", description: "Not a chatbot — a full assessment-to-plan process." },
  { icon: Microscope, title: "Evidence", description: "Research surfaced where you're already working." },
  { icon: HeartHandshake, title: "Patient connection", description: "Programs reach patients through My Phygo." },
  { icon: History, title: "Longitudinal data", description: "Every session builds on the last, automatically." },
  { icon: LayoutGrid, title: "One platform", description: "Patients, tools and knowledge — not five apps." },
];

export default function WhyPhygo() {
  return (
    <section className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl mb-12">
          <p className="eyebrow text-electric mb-4">Why Phygo</p>
          <h2 className="font-display font-semibold text-ink dark:text-white text-2xl sm:text-4xl tracking-tight text-balance">
            What actually changes for your practice.
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-6 gap-x-6 gap-y-10">
          {reasons.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              <r.icon size={18} className="text-electric mb-3" />
              <h3 className="font-semibold text-[13px] text-ink dark:text-white mb-1">{r.title}</h3>
              <p className="text-[12px] text-ink/50 dark:text-white/50 leading-relaxed">{r.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
