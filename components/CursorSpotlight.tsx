"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const SIZE = 900;

export default function CursorSpotlight() {
  const [enabled, setEnabled] = useState(false);
  const x = useMotionValue(-SIZE);
  const y = useMotionValue(-SIZE);
  const sx = useSpring(x, { stiffness: 120, damping: 25, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 120, damping: 25, mass: 0.6 });

  useEffect(() => {
    const isFine = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(isFine && !reducedMotion);
    if (!isFine || reducedMotion) return;

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX - SIZE / 2);
      y.set(e.clientY - SIZE / 2);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed z-[1] hidden lg:block rounded-full"
      style={{
        width: SIZE,
        height: SIZE,
        x: sx,
        y: sy,
        background:
          "radial-gradient(circle, rgba(79,124,255,0.07) 0%, rgba(50,214,160,0.04) 45%, transparent 72%)",
      }}
    />
  );
}
