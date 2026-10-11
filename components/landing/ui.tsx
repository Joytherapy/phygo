"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Fragment, type ReactNode } from "react";

export const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Renders a dictionary string: "*text*" becomes the serif-italic accent and
 * "\n" a line break (see lib/i18n/landingStrings.ts).
 */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, li) => (
        <Fragment key={li}>
          {li > 0 && <br />}
          {line.split(/(\*[^*]+\*)/g).map((part, pi) =>
            part.length > 2 && part.startsWith("*") && part.endsWith("*") ? (
              <em key={pi} className="lp-accent">
                {part.slice(1, -1)}
              </em>
            ) : (
              <Fragment key={pi}>{part}</Fragment>
            )
          )}
        </Fragment>
      ))}
    </>
  );
}

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
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={className}
    >
      {children}
    </Component>
  );
}

/** Mono eyebrow with an index, e.g. "02 — Clinical library". */
export function Eyebrow({ index, children, tone = "default" }: { index?: string; children: ReactNode; tone?: "default" | "inverse" }) {
  return (
    <p
      className={`eyebrow flex items-center gap-3 ${
        tone === "inverse" ? "text-white/60" : "text-ink/60 dark:text-white/55"
      }`}
    >
      {index && <span className="text-electric-dark dark:text-electric-light">{index}</span>}
      {index && <span aria-hidden className="h-px w-8 bg-current opacity-40" />}
      <span>{children}</span>
    </p>
  );
}

export function SectionHeader({
  eyebrow,
  index,
  title,
  intro,
  id,
  align = "left",
  tone = "default",
}: {
  eyebrow: string;
  index?: string;
  title: string;
  intro?: string;
  id?: string;
  align?: "left" | "center";
  tone?: "default" | "inverse";
}) {
  const inverse = tone === "inverse";
  return (
    <Reveal className={`max-w-3xl ${align === "center" ? "mx-auto text-center [&>p:first-child]:justify-center" : ""}`}>
      <Eyebrow index={index} tone={tone}>
        {eyebrow}
      </Eyebrow>
      <h2
        id={id}
        className={`mt-5 font-display font-semibold text-[2.15rem] leading-[1.08] sm:text-[3.4rem] sm:leading-[1.04] tracking-[-0.035em] text-balance ${
          inverse ? "text-white" : "text-ink dark:text-white"
        }`}
      >
        <Rich text={title} />
      </h2>
      {intro && (
        <p
          className={`mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-pretty ${
            align === "center" ? "mx-auto" : ""
          } ${inverse ? "text-white/65" : "text-ink/65 dark:text-white/60"}`}
        >
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
  size = "md",
}: {
  href: string;
  children: ReactNode;
  inverted?: boolean;
  size?: "md" | "sm";
}) {
  return (
    <a
      href={href}
      className={`group inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
        size === "sm" ? "px-4 py-2 text-[13px]" : "px-7 py-3.5 text-sm shadow-lift hover:shadow-glow"
      } ${inverted ? "bg-white text-ink hover:bg-white/90" : "bg-ink text-white hover:bg-ink/90 dark:bg-white dark:text-ink dark:hover:bg-white/90"}`}
    >
      {children}
      <ArrowRight size={size === "sm" ? 14 : 16} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
    </a>
  );
}

export function SecondaryButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/10 dark:border-white/15 bg-white/60 dark:bg-white/[0.04] backdrop-blur px-7 py-3.5 text-sm font-semibold text-ink dark:text-white transition-colors hover:border-ink/25 dark:hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric"
    >
      {children}
    </a>
  );
}

export function TextLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a
      href={href}
      className={`group inline-flex items-center gap-1.5 text-sm font-semibold text-electric-dark hover:text-electric-dark dark:text-electric-light dark:hover:text-white rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric ${className}`}
    >
      {children}
      <ArrowRight size={14} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
    </a>
  );
}

/** Small caption under every interface composition so nothing reads as a live screenshot. */
export function MockCaption({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`mt-4 text-center font-mono text-[10.5px] tracking-wide text-ink/60 dark:text-white/55 ${className}`}>
      {children}
    </p>
  );
}

/** A labelled interface surface used across the product compositions. */
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-black/[0.07] dark:border-white/[0.08] bg-white dark:bg-[#111318] shadow-soft dark:shadow-softDark ${className}`}
    >
      {children}
    </div>
  );
}

export function MicroLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/60 dark:text-white/55 ${className}`}>
      {children}
    </p>
  );
}
