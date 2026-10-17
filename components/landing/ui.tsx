import { ArrowRight, Check } from "lucide-react";
import type { ReactNode } from "react";
import type { Shot } from "@/lib/landing/screenshots";

// Shared building blocks of the public landing page. Server components only:
// the page has no scroll animations, so nothing here needs client JavaScript.

/** Easing used by the header's menus (components/landing/LandingHeader.tsx). */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Page width and side gutters shared by every section. */
export const CONTAINER = "mx-auto w-full max-w-6xl px-4 sm:px-6";

/** Small uppercase label above a section heading. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[13px] font-semibold tracking-wide text-electric-dark dark:text-electric-light">{children}</p>;
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  intro,
  center = false,
}: {
  id: string;
  eyebrow: string;
  title: string;
  intro?: string;
  center?: boolean;
}) {
  return (
    <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2
        id={id}
        className="mt-3 text-balance font-display text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-ink dark:text-white sm:text-[2.25rem]"
      >
        {title}
      </h2>
      {intro && <p className="mt-4 text-pretty text-base leading-relaxed text-ink/70 dark:text-white/70 sm:text-[17px]">{intro}</p>}
    </div>
  );
}

/** The one primary action of the page: start a free account. */
export function PrimaryCta({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a
      href={href}
      data-cta="primary"
      className={`group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-electric-dark px-6 text-[15px] font-semibold text-white transition-colors hover:bg-[#2f51c4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0a0e17] ${className}`}
    >
      {children}
      <ArrowRight size={16} aria-hidden className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
    </a>
  );
}

export function TextLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a
      href={href}
      className={`group inline-flex items-center gap-1.5 rounded text-[15px] font-semibold text-electric-dark underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric dark:text-electric-light ${className}`}
    >
      {children}
      <ArrowRight size={15} aria-hidden className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
    </a>
  );
}

/** Bulleted list with a small check mark, used for feature and trust items. */
export function CheckList({ items, className = "" }: { items: string[]; className?: string }) {
  return (
    <ul className={`space-y-2.5 ${className}`}>
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-ink/75 dark:text-white/75">
          <Check size={16} aria-hidden className="mt-[5px] shrink-0 text-emerald-dark dark:text-emerald" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * A real PHYGO screenshot (public/landing, captured from the app with
 * synthetic demo accounts — see lib/landing/screenshots.ts). Files exist at
 * 2x (<base>.webp) and 1x (<base>-sm.webp); a narrow capture, when there is
 * one, replaces the wide one below 640px.
 */
export function Screenshot({
  shot,
  alt,
  sizes,
  priority = false,
  className = "",
}: {
  shot: Shot;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const set = (s: Shot) => `/landing/${s.base}-sm.webp ${s.width}w, /landing/${s.base}.webp ${s.width * 2}w`;
  return (
    <div className={`overflow-hidden rounded-2xl border border-black/10 bg-[#0f1116] shadow-[0_24px_60px_-28px_rgba(11,16,32,0.5)] dark:border-white/10 ${className}`}>
      <picture>
        {shot.mobile && (
          <source media="(max-width: 639px)" srcSet={set(shot.mobile)} sizes="100vw" width={shot.mobile.width} height={shot.mobile.height} />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/landing/${shot.base}-sm.webp`}
          srcSet={set(shot)}
          sizes={sizes}
          width={shot.width}
          height={shot.height}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          // React 18 passes the lowercase attribute through unchanged.
          {...(priority ? ({ fetchpriority: "high" } as Record<string, string>) : {})}
          className="block h-auto w-full"
        />
      </picture>
    </div>
  );
}
