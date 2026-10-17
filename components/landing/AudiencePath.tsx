"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { AudiencePath as PathDict } from "@/lib/i18n/landingStrings";
import type { Shot } from "@/lib/landing/screenshots";
import { CheckList, CONTAINER, Eyebrow, PrimaryCta, Screenshot } from "./ui";

// One audience path (students or physiotherapists). Both paths use this same
// component, so they always get the same structure and visual weight:
// heading -> four real screens as tabs -> what else is included -> CTA.
//
// The section id (#students, #physiotherapists) is the stable anchor for
// campaigns. Tabs follow the WAI-ARIA tabs pattern (arrow keys, Home/End,
// roving tabindex); hidden panels are display:none, so their lazy images are
// fetched only when a visitor opens them.
export default function AudiencePath({
  id,
  path,
  shots,
  extras,
  ctaHref,
  footer,
  credits,
}: {
  id: "students" | "physiotherapists";
  path: PathDict;
  shots: readonly Shot[];
  /** Items for "also included" (may include live figures or optional items). */
  extras: string[];
  ctaHref: string;
  /** Extra content under the extras list (e.g. a library link). */
  footer?: ReactNode;
  /** Attribution shown under the caption (e.g. licensed 3D models). */
  credits?: ReactNode;
}) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const count = path.steps.length;

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const next =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? (i + 1) % count
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? (i - 1 + count) % count
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? count - 1
              : null;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 border-t border-black/[0.07] py-20 dark:border-white/[0.08] sm:py-24">
      <div className={CONTAINER}>
        <div className="max-w-2xl">
          <Eyebrow>{path.eyebrow}</Eyebrow>
          <h2
            id={`${id}-title`}
            className="mt-3 text-balance font-display text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-ink dark:text-white sm:text-[2.25rem]"
          >
            {path.title}
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-ink/70 dark:text-white/70 sm:text-[17px]">{path.intro}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:mt-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
          <div role="tablist" aria-label={path.tablistLabel} className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:flex-col lg:gap-1.5">
            {path.steps.map((step, i) => {
              const selected = i === active;
              return (
                <button
                  key={step.label}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`${id}-tab-${i}`}
                  aria-selected={selected}
                  aria-controls={`${id}-panel-${i}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(i)}
                  onKeyDown={(e) => onKey(e, i)}
                  className={`min-w-0 rounded-xl border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric motion-reduce:transition-none lg:px-5 lg:py-4 ${
                    selected
                      ? "border-electric/50 bg-electric/[0.07] dark:border-electric-light/40 dark:bg-white/[0.05]"
                      : "border-black/[0.08] hover:border-black/20 dark:border-white/[0.08] dark:hover:border-white/20"
                  }`}
                >
                  <span className="flex items-baseline gap-2.5">
                    <span className={`font-mono text-[12px] ${selected ? "text-electric-dark dark:text-electric-light" : "text-ink/60 dark:text-white/60"}`}>
                      0{i + 1}
                    </span>
                    <span className="min-w-0 break-words text-[14px] font-semibold text-ink dark:text-white sm:text-[15px]">
                      {step.label}
                      <span className="hidden font-normal text-ink/70 dark:text-white/70 lg:inline"> · {step.title}</span>
                    </span>
                  </span>
                  <span className={`mt-2 hidden text-[14.5px] leading-relaxed text-ink/70 dark:text-white/70 ${selected ? "lg:block" : ""}`}>{step.text}</span>
                </button>
              );
            })}
          </div>

          {path.steps.map((step, i) => (
            <div
              key={step.label}
              role="tabpanel"
              id={`${id}-panel-${i}`}
              aria-labelledby={`${id}-tab-${i}`}
              hidden={i !== active}
              tabIndex={0}
              className="min-w-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric"
            >
              {/* Below lg the step text sits here, under the compact tabs. */}
              <div className="mb-5 lg:hidden">
                <h3 className="font-display text-lg font-semibold text-ink dark:text-white">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink/70 dark:text-white/70">{step.text}</p>
              </div>
              <Screenshot
                shot={shots[i]}
                alt={step.alt}
                sizes="(min-width: 1152px) 640px, (min-width: 1024px) 56vw, 100vw"
                className={shots[i].height > shots[i].width ? "mx-auto max-w-[400px]" : shots[i].width < 700 ? "mx-auto max-w-[520px]" : ""}
              />
            </div>
          ))}
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-ink/60 dark:text-white/60 lg:text-right">
          {path.caption}
          {credits && <span className="block">{credits}</span>}
        </p>

        <div className="mt-10 grid grid-cols-1 gap-8 rounded-2xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.03] sm:p-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-12">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-semibold text-ink dark:text-white">{path.extrasTitle}</h3>
            <CheckList className="mt-5 sm:columns-2 sm:gap-8 [&>li]:break-inside-avoid [&>li]:pb-2.5 sm:space-y-0" items={extras} />
            {footer}
          </div>
          <div className="min-w-0 border-t border-black/[0.08] pt-6 dark:border-white/[0.08] lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <PrimaryCta href={ctaHref} className="w-full sm:w-auto">
              {path.cta}
            </PrimaryCta>
            <p className="mt-4 text-[14px] leading-relaxed text-ink/70 dark:text-white/70">{path.ctaNote}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
