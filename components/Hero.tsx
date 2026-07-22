"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Mic, ArrowRight, ChevronDown } from "lucide-react";
import MagneticButton from "./MagneticButton";
import SignatureIllustration from "./SignatureIllustration";
import LiveStructuring from "./liveStructuring/LiveStructuring";

const headlineWords = ["The", "AI", "Assistant", "Every", "Therapist", "Deserves."];

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 1.15 },
  },
};

const word = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 1.6 + i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const textY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const boardY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const illustrationY = useTransform(scrollYProgress, [0, 1], [0, 120]);

  return (
    <section ref={ref} className="relative overflow-hidden pt-40 pb-20 sm:pt-48 sm:pb-28">
      <div className="absolute inset-0 bg-grad-hero pointer-events-none" />
      <motion.div style={{ y: illustrationY }}>
        <SignatureIllustration className="absolute inset-x-0 top-16 w-full h-32 sm:h-40 opacity-[0.35] pointer-events-none hidden sm:block" />
      </motion.div>

      <div className="relative mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div style={{ y: textY, opacity: textOpacity }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.85 }}
            className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-xs font-medium text-ink/70 dark:text-white/70 shadow-soft mb-8"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald animate-pulse" />
            Watch it structure a real session, live, to the right
          </motion.div>

          <motion.h1
            variants={container}
            initial="hidden"
            animate="show"
            className="font-display font-semibold tracking-[-0.03em] text-ink dark:text-white text-[2.9rem] leading-[1.04] sm:text-[4.6rem] sm:leading-[1.0]"
          >
            {headlineWords.map((w, i) =>
              w === "Therapist" ? (
                <motion.span key={w + i} variants={word} className="relative inline-block mr-[0.28em]">
                  <span className="bg-gradient-to-r from-electric to-emerald bg-clip-text text-transparent">
                    {w}
                  </span>
                  <svg
                    viewBox="0 0 160 12"
                    className="absolute left-0 -bottom-2 w-full h-3"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    <motion.path
                      d="M2,7 C 30,2 60,10 80,6 C 100,2 130,9 158,5"
                      stroke="url(#underline-grad)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.7, delay: 2.15, ease: [0.22, 1, 0.36, 1] }}
                    />
                    <defs>
                      <linearGradient id="underline-grad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#4F7CFF" />
                        <stop offset="100%" stopColor="#32D6A0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </motion.span>
              ) : (
                <motion.span key={w + i} variants={word} className="inline-block mr-[0.28em]">
                  {w}
                </motion.span>
              )
            )}
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0}
            className="mt-7 text-lg text-ink/60 dark:text-white/60 max-w-lg leading-relaxed text-balance"
          >
            Speak for thirty seconds. Watch your words sort themselves into a
            finished clinical note — no typing, no templates, no cleanup.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="mt-9 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          >
            <MagneticButton
              href="#pricing"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-ink text-white px-6 py-3.5 text-sm font-semibold shadow-lift hover:shadow-glow transition-shadow shimmer-sweep"
            >
              Start Free
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </MagneticButton>
            <MagneticButton
              href="#demo"
              strength={12}
              className="inline-flex items-center gap-2 rounded-full glass px-6 py-3.5 text-sm font-semibold text-ink dark:text-white shadow-soft hover:shadow-glow transition-shadow"
            >
              <Mic size={14} />
              Try With Your Voice
            </MagneticButton>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            className="mt-14 flex items-center gap-6 text-ink/40 dark:text-white/40 text-xs eyebrow"
          >
            <span>No credit card required</span>
            <span className="h-1 w-1 rounded-full bg-ink/20 dark:bg-white/20" />
            <span>Setup in 2 minutes</span>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
          style={{ y: boardY }}
        >
          <LiveStructuring instanceId="hero" variant="hero" />
        </motion.div>
      </div>

      <motion.a
        href="#logos"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-1 text-ink/30 dark:text-white/30 hover:text-ink/50 dark:text-white/50 transition-colors"
        aria-label="Scroll to explore"
      >
        <span className="eyebrow">Scroll</span>
        <motion.span
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={16} />
        </motion.span>
      </motion.a>
    </section>
  );
}
