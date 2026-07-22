"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useTilt } from "./useTilt";

const testimonials = [
  { quote: "I save almost one hour every day.", name: "Physiotherapist", initials: "PT", accent: "from-electric to-electric-light" },
  { quote: "The easiest software I've ever used.", name: "Osteopath", initials: "OS", accent: "from-electric to-emerald" },
  { quote: "My patients love the reports.", name: "Massage Therapist", initials: "MT", accent: "from-emerald to-emerald-light" },
];

function Card({ t, i }: { t: (typeof testimonials)[number]; i: number }) {
  const { ref, rotateX, rotateY, onMouseMove, onMouseLeave } = useTilt(5);
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="tilt-perspective"
    >
      <motion.div
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="rounded-xl3 bg-white dark:bg-ink-soft p-8 shadow-soft hover:shadow-lift transition-shadow duration-300 h-full"
      >
        <div className="flex gap-0.5 text-emerald mb-5">
          {Array.from({ length: 5 }).map((_, s) => (
            <Star key={s} size={15} fill="currentColor" strokeWidth={0} />
          ))}
        </div>
        <p className="font-display text-lg text-ink dark:text-white leading-snug mb-7 text-balance">
          “{t.quote}”
        </p>
        <div className="flex items-center gap-3">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${t.accent} text-white text-xs font-semibold`}
          >
            {t.initials}
          </span>
          <p className="eyebrow text-ink/40 dark:text-white/40">{t.name}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Testimonials() {
  return (
    <section className="relative py-28 sm:py-36 bg-mist/60 dark:bg-white/[0.03]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl mb-16">
          <p className="eyebrow text-electric mb-4">Loved by practitioners</p>
          <h2 className="font-display font-semibold text-ink dark:text-white text-3xl sm:text-5xl tracking-tight text-balance">
            Trusted in clinics everywhere.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <Card key={t.name} t={t} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
