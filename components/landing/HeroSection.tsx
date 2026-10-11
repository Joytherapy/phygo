"use client";

import { motion } from "framer-motion";
import ProductWindow from "./ProductWindow";
import { PrimaryButton, SecondaryButton, MockCaption } from "./ui";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function HeroSection({ conditionsLabel }: { conditionsLabel: string | null }) {
  const enter = (i: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay: 0.08 * i, ease: EASE },
  });

  const conditions = conditionsLabel ? `${conditionsLabel} clinical conditions` : "a library of clinical conditions";

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden pt-36 pb-20 sm:pt-44 sm:pb-28">
      <div aria-hidden className="absolute inset-0 bg-grad-hero pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-[1fr_1.05fr] gap-14 lg:gap-12 items-center">
        <div className="text-center lg:text-left">
          <motion.p
            {...enter(0)}
            className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-xs font-semibold tracking-wide text-ink/75 dark:text-white/75 shadow-soft"
          >
            <span aria-hidden className="h-2 w-2 rounded-full bg-emerald" />
            Built for physiotherapists
          </motion.p>

          <motion.h1
            id="hero-title"
            {...enter(1)}
            className="mt-6 font-display font-semibold tracking-[-0.04em] text-ink dark:text-white text-[2.6rem] leading-[1.04] sm:text-[3.9rem] sm:leading-[1.02] text-balance"
          >
            The{" "}
            <span className="bg-gradient-to-r from-electric via-[#6D8FFF] to-emerald bg-clip-text text-transparent">
              clinical workspace
            </span>{" "}
            for physiotherapy.
          </motion.h1>

          <motion.p
            {...enter(2)}
            className="mt-6 max-w-xl mx-auto lg:mx-0 text-lg leading-8 text-ink/65 dark:text-white/65 text-pretty"
          >
            Turn a session into a structured SOAP draft, check {conditions}, explore
            anatomy and build exercise plans — in one place. The AI drafts.{" "}
            <span className="font-semibold text-ink dark:text-white">You decide.</span>
          </motion.p>

          <motion.div
            {...enter(3)}
            className="mt-9 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3"
          >
            <PrimaryButton href="/login?mode=signup">Start free</PrimaryButton>
            <SecondaryButton href="#how-it-works">See how it works</SecondaryButton>
          </motion.div>

          <motion.ul
            {...enter(4)}
            className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-[13px] text-ink/55 dark:text-white/50"
          >
            <li>Free to start</li>
            <li aria-hidden className="h-1 w-1 rounded-full bg-ink/20 dark:bg-white/20" />
            <li>No credit card required</li>
            <li aria-hidden className="h-1 w-1 rounded-full bg-ink/20 dark:bg-white/20" />
            <li>Italian · English · Spanish · French</li>
          </motion.ul>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.25, ease: EASE }}
        >
          <ProductWindow />
          <MockCaption>Illustrative interface with a sample case. You review every draft before it is saved.</MockCaption>
        </motion.div>
      </div>
    </section>
  );
}
