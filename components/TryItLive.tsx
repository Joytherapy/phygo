"use client";

import { motion } from "framer-motion";
import LiveStructuring from "./liveStructuring/LiveStructuring";

export default function TryItLive() {
  return (
    <section id="demo" className="relative py-28 sm:py-36 overflow-hidden">
      <div className="absolute inset-0 bg-grad-hero opacity-60 pointer-events-none" />
<div className="relative mx-auto max-w-5xl px-6 text-center">
        <p className="eyebrow text-electric mb-4">The real thing</p>
        <h2 className="font-display font-semibold text-ink dark:text-white text-3xl sm:text-5xl tracking-tight mb-4 text-balance">
          Talk to it. Really.
        </h2>
        <p className="text-ink/60 dark:text-white/60 mb-14 max-w-md mx-auto">
          This isn't a video. Tap the mic and describe a session out loud —
          your browser transcribes it, and you'll watch it get structured in
          front of you.
        </p>

        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <LiveStructuring instanceId="demo" variant="full" />
        </motion.div>

        <p className="mt-6 text-xs text-ink/35 dark:text-white/35 max-w-sm mx-auto">
          Voice processing happens in your browser for this demo — nothing is
          saved or sent anywhere.
        </p>
      </div>
    </section>
  );
}
