"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";

function Counter({
  to,
  suffix = "",
  prefix = "",
}: {
  to: number;
  suffix?: string;
  prefix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { damping: 30, stiffness: 60 });

  useEffect(() => {
    if (inView) motionVal.set(to);
  }, [inView, to, motionVal]);

  useEffect(() => {
    const unsub = spring.on("change", (v) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${Math.floor(v).toLocaleString()}${suffix}`;
      }
    });
    return unsub;
  }, [spring, prefix, suffix]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
}

const stats = [
  { to: 42000, suffix: "+", label: "Reports generated" },
  { to: 58, prefix: "", suffix: " min", label: "Saved per day, on average" },
  { to: 98, suffix: "%", label: "Would recommend to a colleague" },
];

export default function StatsBar() {
  return (
    <section className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-6 grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-center sm:text-left"
          >
            <div className="font-display text-4xl sm:text-5xl font-semibold tracking-tight bg-gradient-to-r from-ink to-ink/70 dark:from-white dark:to-white/70 bg-clip-text text-transparent">
              <Counter to={s.to} suffix={s.suffix} prefix={s.prefix ?? ""} />
            </div>
            <p className="mt-2 text-sm text-ink/50 dark:text-white/50">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
