"use client";

import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

const before = [
  "Typing notes after every patient, often after hours",
  "Trying to remember details from three sessions ago",
  "Reformatting the same summary for insurance, PDF, and WhatsApp",
  "Paperwork eating into time with the next patient",
];

const after = [
  "Notes are done before the patient reaches the front desk",
  "Every detail captured while it's still fresh",
  "One session, three formats — automatically",
  "Full attention stays on the person in the room",
];

export default function BeforeAfter() {
  return (
    <section className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl mb-16">
          <p className="eyebrow text-electric mb-4">The actual difference</p>
          <h2 className="font-display font-semibold text-ink dark:text-white text-3xl sm:text-5xl tracking-tight text-balance">
            Same session. Completely different evening.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-xl3 bg-mist/70 dark:bg-white/[0.03] p-8 sm:p-10"
          >
            <p className="eyebrow text-ink/35 dark:text-white/35 mb-6">Without Phygo</p>
            <ul className="space-y-4">
              {before.map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <X size={16} className="mt-0.5 shrink-0 text-ink/30 dark:text-white/30" />
                  <span className="text-sm text-ink/50 dark:text-white/50 leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-xl3 bg-ink dark:bg-ink-soft p-8 sm:p-10 shadow-lift"
          >
            <p className="eyebrow text-emerald mb-6">With Phygo</p>
            <ul className="space-y-4">
              {after.map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <Check size={16} className="mt-0.5 shrink-0 text-emerald" />
                  <span className="text-sm text-white/80 leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
