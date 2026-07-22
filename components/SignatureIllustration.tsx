"use client";

import { useId, useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function SignatureIllustration({
  className = "",
}: {
  className?: string;
}) {
  const gradId = useId();
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <svg
      ref={ref}
      viewBox="0 0 1200 220"
      fill="none"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4F7CFF" stopOpacity="0" />
          <stop offset="18%" stopColor="#4F7CFF" />
          <stop offset="60%" stopColor="#32D6A0" />
          <stop offset="100%" stopColor="#32D6A0" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Voice waveform, morphing amplitude left to right */}
      <motion.path
        d="M0,110
           C 20,60 40,160 60,110
           C 80,50 100,170 120,110
           C 140,40 160,180 180,110
           C 200,70 220,150 240,110
           C 260,85 280,135 300,110
           C 330,95 360,125 390,112
           C 430,102 470,118 510,110
           C 560,105 620,113 680,110"
        stroke={`url(#${gradId})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={inView ? { pathLength: 1, opacity: 1 } : {}}
        transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Document lines it resolves into */}
      {[
        { y: 96, w: 380, delay: 0.9 },
        { y: 118, w: 320, delay: 1.02 },
        { y: 140, w: 350, delay: 1.14 },
      ].map((line, i) => (
        <motion.line
          key={i}
          x1="740"
          y1={line.y}
          x2={740 + line.w}
          y2={line.y}
          stroke="#0B0D12"
          strokeOpacity="0.12"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={inView ? { pathLength: 1, opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: line.delay, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}

      {/* Small resolving dot marking the transition point */}
      <motion.circle
        cx="700"
        cy="110"
        r="4"
        fill="#32D6A0"
        initial={{ scale: 0, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.85 }}
      />
    </svg>
  );
}
