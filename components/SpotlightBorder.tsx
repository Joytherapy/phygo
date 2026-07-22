"use client";

import { useRef } from "react";

export default function SpotlightBorder({
  children,
  className = "",
  color = "rgba(79,124,255,0.18)",
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    const glow = glowRef.current;
    if (!el || !glow) return;
    const rect = el.getBoundingClientRect();
    glow.style.background = `radial-gradient(220px circle at ${e.clientX - rect.left}px ${
      e.clientY - rect.top
    }px, ${color}, transparent 70%)`;
    glow.style.opacity = "1";
  };

  const onMouseLeave = () => {
    if (glowRef.current) glowRef.current.style.opacity = "0";
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={`relative isolate ${className}`}
    >
      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 -z-10"
      />
      {children}
    </div>
  );
}
