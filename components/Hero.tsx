"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Mic, ArrowRight, ChevronDown } from "lucide-react";
import MagneticButton from "./MagneticButton";
import SignatureIllustration from "./SignatureIllustration";
import LiveStructuring from "./liveStructuring/LiveStructuring";
import LiveDemo from "./liveDemoV2/LiveDemo";

const headlineWords = [
  "The",
  "AI",
  "Assistant",
  "Every",
  "Therapist",
  "Deserves.",
];

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 1.05,
    },
  },
};

const word = {
  hidden: {
    opacity: 0,
    y: 30,
    filter: "blur(8px)",
  },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.75,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay: 1.55 + i * 0.1,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function Hero() {
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const textY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const boardY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const illustrationY = useTransform(scrollYProgress, [0, 1], [0, 120]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden pt-40 pb-24 sm:pt-48 sm:pb-32"
    >
      <div className="absolute inset-0 bg-grad-hero pointer-events-none" />

      <motion.div style={{ y: illustrationY }}>
        <SignatureIllustration
          className="absolute inset-x-0 top-16 h-40 w-full opacity-30 pointer-events-none hidden sm:block"
        />
      </motion.div>

      <div className="relative mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-20 items-center">
        <motion.div style={{ y: textY, opacity: textOpacity }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.85,
            }}
            className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-xs font-semibold tracking-wide text-ink/75 dark:text-white/75 shadow-soft mb-8"
          >
            <span className="h-2 w-2 rounded-full bg-emerald animate-pulse" />

            AI listens. Phygo structures. You stay with the patient.
          </motion.div>

          <motion.h1
            variants={container}
            initial="hidden"
            animate="show"
            className="font-display font-semibold tracking-[-0.045em] text-ink dark:text-white text-[3.1rem] leading-[1.02] sm:text-[5rem] sm:leading-none"
          >
            {headlineWords.map((w, i) =>
              w === "Therapist" ? (
                <motion.span
                  key={w + i}
                  variants={word}
                  className="relative inline-block mr-[0.28em]"
                >
                  <span className="bg-gradient-to-r from-electric via-[#6D8FFF] to-emerald bg-clip-text text-transparent">
                    {w}
                  </span>

                  <svg
                    viewBox="0 0 160 12"
                    className="absolute left-0 -bottom-2 w-full h-3"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    <motion.path
                      d="M2,7 C30,2 60,10 80,6 C100,2 130,9 158,5"
                      stroke="url(#underline-grad)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                      initial={{
                        pathLength: 0,
                        opacity: 0,
                      }}
                                            animate={{ pathLength: 1, opacity: 1 }}
                      transition={{
                        duration: 0.7,
                        delay: 2.15,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                    <defs>
                      <linearGradient
                        id="underline-grad"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop offset="0%" stopColor="#4F7CFF" />
                        <stop offset="100%" stopColor="#32D6A0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </motion.span>
              ) : (
                <motion.span
                  key={w + i}
                  variants={word}
                  className="inline-block mr-[0.28em]"
                >
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
            className="mt-8 max-w-xl text-lg leading-8 text-ink/65 dark:text-white/65 text-balance"
          >
            Transform every patient conversation into structured clinical notes,
            treatment plans, home exercise programs and professional PDF reports
            in seconds. No typing. No templates. Just focus on your patient.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          >
            <MagneticButton
              href="#pricing"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-white shadow-lift transition-all hover:shadow-glow shimmer-sweep"
            >
              Start Free
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </MagneticButton>

            <MagneticButton
              href="#demo"
              strength={12}
              className="inline-flex items-center gap-2 rounded-full glass px-7 py-3.5 text-sm font-semibold text-ink dark:text-white shadow-soft transition-all hover:shadow-glow"
            >
              <Mic size={15} />
              See Live Demo
            </MagneticButton>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            className="mt-14 flex flex-wrap items-center gap-6 text-xs eyebrow text-ink/45 dark:text-white/45"
          >
            <span>Free forever plan</span>

            <span className="h-1 w-1 rounded-full bg-ink/20 dark:bg-white/20" />

            <span>Setup in under 2 minutes</span>

            <span className="h-1 w-1 rounded-full bg-ink/20 dark:bg-white/20" />

            <span>No credit card required</span>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.9,
            delay: 1.0,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ y: boardY }}
        >
          <LiveStructuring instanceId="hero" variant="hero" />
          <div className="mt-12">
  <LiveDemo />
</div>
        </motion.div>
      </div>

      <motion.a
        href="#logos"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-ink/30 transition-colors hover:text-ink/50 dark:text-white/30 dark:hover:text-white/50 sm:flex"
        aria-label="Scroll to explore"
      >
        <span className="eyebrow">Scroll</span>

        <motion.span
          animate={{ y: [0, 5, 0] }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <ChevronDown size={16} />
        </motion.span>
      </motion.a>
    </section>
  );
}
                      