"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Fade-and-rise on first scroll into view (reduced motion is handled globally by MotionProvider). */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li";
}) {
  const Component = as === "li" ? motion.li : motion.div;
  return (
    <Component
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      className={className}
    >
      {children}
    </Component>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  intro,
  id,
  align = "left",
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  id?: string;
  align?: "left" | "center";
}) {
  return (
    <Reveal className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      <p className="eyebrow text-electric mb-4">{eyebrow}</p>
      <h2
        id={id}
        className="font-display font-semibold text-ink dark:text-white text-[2rem] leading-[1.1] sm:text-5xl sm:leading-[1.05] tracking-tight text-balance"
      >
        {title}
      </h2>
      {intro && (
        <p className="mt-5 text-base sm:text-lg leading-relaxed text-ink/65 dark:text-white/60 text-pretty">
          {intro}
        </p>
      )}
    </Reveal>
  );
}

export function PrimaryButton({
  href,
  children,
  inverted = false,
}: {
  href: string;
  children: ReactNode;
  inverted?: boolean;
}) {
  return (
    <a
      href={href}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold shadow-lift transition-all hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
        inverted
          ? "bg-white text-ink"
          : "bg-ink text-white dark:bg-white dark:text-ink"
      }`}
    >
      {children}
      <ArrowRight size={16} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
    </a>
  );
}

export function SecondaryButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-full glass px-7 py-3.5 text-sm font-semibold text-ink dark:text-white shadow-soft transition-all hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric"
    >
      {children}
    </a>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-1.5 text-sm font-semibold text-electric hover:text-electric-dark dark:hover:text-electric-light rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric"
    >
      {children}
      <ArrowRight size={14} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
    </a>
  );
}

/** Small "illustrative" caption used under every interface mock-up so nothing reads as a live screenshot. */
export function MockCaption({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 text-center text-[11px] text-ink/45 dark:text-white/40">{children}</p>
  );
}
