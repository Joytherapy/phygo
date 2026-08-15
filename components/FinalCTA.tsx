"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import MagneticButton from "./MagneticButton";

export default function FinalCTA() {
  return (
    <section className="relative py-24 sm:py-32 px-6">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-xl4 bg-ink px-8 py-20 sm:py-28 text-center">
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-electric/25 blur-[100px] animate-drift" />
        <div
          className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-emerald/20 blur-[100px] animate-drift"
          style={{ animationDelay: "-7s" }}
        />

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative font-display font-semibold text-white text-3xl sm:text-5xl tracking-tight text-balance max-w-2xl mx-auto"
        >
          Give your patients your full attention. Let Phygo handle the paperwork.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-5 text-white/50 max-w-md mx-auto"
        >
          Join practitioners who reclaimed an hour of their day, starting today.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-10"
        >
          <MagneticButton
            href="/login?mode=signup"
            className="group inline-flex items-center gap-2 rounded-full bg-white text-ink px-7 py-4 text-sm font-semibold shadow-lift shimmer-sweep"
          >
            Start Free
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  );
}
