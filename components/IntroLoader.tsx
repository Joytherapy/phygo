"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function IntroLoader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = "";
    }, reducedMotion ? 150 : 1100);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.08, transition: { duration: 0.5 } }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3"
          >
            <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-electric to-emerald text-white text-lg font-display font-bold shadow-glow">
              T
              <motion.span
                className="absolute inset-0 rounded-2xl border border-white/40"
                animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
              />
            </span>
            <span className="font-display font-semibold text-xl text-ink tracking-tight">
              Phygo
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
