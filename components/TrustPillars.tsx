"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { PenLine, ShieldCheck, Waves } from "lucide-react";

const pillars = [
  {
    index: "01",
    icon: PenLine,
    title: "You're always in control",
    description: "Every note is a draft until you say otherwise. Edit, rewrite, or discard anything before it's sent or saved.",
    accent: "from-electric to-electric-light",
  },
  {
    index: "02",
    icon: ShieldCheck,
    title: "Privacy by design",
    description: "Sessions are encrypted end-to-end. Delete any recording the moment its note is generated — nothing lingers by default.",
    accent: "from-electric to-emerald",
  },
  {
    index: "03",
    icon: Waves,
    title: "Built for how you actually talk",
    description: "No keywords, no required structure, no dictation training. Speak the way you already think out loud.",
    accent: "from-emerald to-emerald-light",
  },
];

export default function TrustPillars() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 75%", "end 60%"],
  });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="trust" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl mb-20">
          <p className="eyebrow text-electric mb-4">Why practitioners trust it</p>
          <h2 className="font-display font-semibold text-ink dark:text-white text-3xl sm:text-5xl tracking-tight text-balance">
            Fast doesn't mean out of your hands.
          </h2>
        </div>

        <div ref={ref} className="relative grid md:grid-cols-3 gap-6">
          <div className="hidden md:block absolute top-14 left-[16.5%] right-[16.5%] h-px bg-ink/8 dark:bg-white/10">
            <motion.div
              style={{ scaleX: lineScale, transformOrigin: "left" }}
              className="h-full bg-grad-line"
            />
          </div>

          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              className="relative rounded-xl3 glass shadow-soft p-8 hover:shadow-glow transition-shadow duration-300"
            >
              <div className="flex items-center justify-between mb-6">
                <div
                  className={`relative z-10 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${p.accent} text-white shadow-soft`}
                >
                  <p.icon size={24} />
                </div>
                <span className="eyebrow text-ink/25 dark:text-white/25">{p.index}</span>
              </div>
              <h3 className="font-display font-semibold text-lg text-ink dark:text-white mb-2">
                {p.title}
              </h3>
              <p className="text-sm text-ink/60 dark:text-white/60 leading-relaxed">
                {p.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
