import { Brain, PersonStanding } from "lucide-react";
import type { LandingDict } from "@/lib/i18n/landingStrings";
import BrainVideo from "./BrainVideo";
import { MockCaption, Reveal, SectionHeader } from "./ui";

// BodyMap / BrainMap live at /dashboard/body-map and /dashboard/brain-map
// (components/BodyMap3D.tsx, BrainMap3D.tsx): 3D models whose regions link to
// body_zone_conditions / brain_zone_conditions / nerve_conditions and to
// exercise programs. System explorers are the /dashboard/* specialty pages
// listed in components/LibraryNavMenu.tsx.

const HOTSPOTS = [
  { cx: 70, cy: 66 },
  { cx: 100, cy: 122 },
  { cx: 84, cy: 214 },
  { cx: 116, cy: 268 },
];

export default function AnatomySection({ anatomy }: { anatomy: LandingDict["anatomy"] }) {
  return (
    <section id="anatomy" aria-labelledby="anatomy-title" className="relative scroll-mt-16 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader id="anatomy-title" index="04" eyebrow={anatomy.eyebrow} title={anatomy.title} intro={anatomy.intro} />

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal className="lp-ticks flex flex-col rounded-[24px] border border-black/[0.07] bg-white p-6 shadow-soft dark:border-white/[0.08] dark:bg-[#111318] sm:p-8">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-electric to-emerald text-white">
                <PersonStanding size={18} aria-hidden />
              </span>
              <h3 className="font-display text-xl font-semibold text-ink dark:text-white">{anatomy.body.title}</h3>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-ink/60 dark:text-white/55">{anatomy.body.text}</p>

            <div className="lp-dots mt-6 flex flex-1 flex-col items-center justify-center gap-6 rounded-2xl border border-black/[0.05] p-6 dark:border-white/[0.06] min-[440px]:flex-row">
              <svg viewBox="0 0 200 300" className="h-72 w-auto shrink-0" role="img" aria-label={anatomy.body.svgLabel}>
                <defs>
                  <linearGradient id="lp-body-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F7CFF" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#32D6A0" stopOpacity="0.22" />
                  </linearGradient>
                </defs>
                <g fill="url(#lp-body-grad)" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.2" className="text-ink dark:text-white">
                  <circle cx="100" cy="26" r="17" />
                  <rect x="93" y="42" width="14" height="10" rx="4" />
                  <path d="M66 58 Q100 48 134 58 Q140 60 140 70 L136 132 Q134 140 126 140 L74 140 Q66 140 64 132 L60 70 Q60 60 66 58 Z" />
                  <rect x="40" y="60" width="16" height="92" rx="8" transform="rotate(8 48 60)" />
                  <rect x="144" y="60" width="16" height="92" rx="8" transform="rotate(-8 152 60)" />
                  <rect x="71" y="142" width="26" height="140" rx="12" />
                  <rect x="103" y="142" width="26" height="140" rx="12" />
                </g>
                {HOTSPOTS.map((h, i) => (
                  <g key={i}>
                    <circle cx={h.cx} cy={h.cy} r="10" fill="#4F7CFF" opacity="0.16" />
                    <circle cx={h.cx} cy={h.cy} r="4" fill="#4F7CFF" />
                    <text x={h.cx + 9} y={h.cy - 7} className="fill-ink/60 dark:fill-white/60" fontSize="9" fontFamily="var(--font-mono)">
                      {String(i + 1).padStart(2, "0")}
                    </text>
                  </g>
                ))}
              </svg>
              <ol className="space-y-2.5">
                {anatomy.body.regions.map((r, i) => (
                  <li key={r} className="flex items-center gap-2.5 text-[13px] text-ink/75 dark:text-white/70">
                    <span className="font-mono text-[10px] text-electric-dark">{String(i + 1).padStart(2, "0")}</span>
                    {r}
                  </li>
                ))}
              </ol>
            </div>
            <MockCaption>{anatomy.body.caption}</MockCaption>
          </Reveal>

          <Reveal delay={0.1} className="flex flex-col rounded-[24px] bg-ink p-6 text-white shadow-lift ring-1 ring-white/[0.06] sm:p-8">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <Brain size={18} aria-hidden />
              </span>
              <h3 className="font-display text-xl font-semibold">{anatomy.brain.title}</h3>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-white/60">{anatomy.brain.text}</p>
            <figure className="mt-6">
              <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
                <BrainVideo label={anatomy.brain.alt} />
              </div>
              <figcaption className="mt-3 text-center font-mono text-[10.5px] tracking-wide text-white/55">
                {anatomy.brain.caption}
                <span className="mt-1 block text-[10px] text-white/45">
                  {anatomy.brain.modelCredit} ·{" "}
                  <a
                    href="https://sketchfab.com/3d-models/human-brain-c9c9d4d671b94345952d012cc2ea7a24"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-white/30 underline-offset-2 hover:text-white/80"
                  >
                    “Human Brain”
                  </a>{" "}
                  ·{" "}
                  <a
                    href="https://sketchfab.com/agher08"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-white/30 underline-offset-2 hover:text-white/80"
                  >
                    agher08
                  </a>{" "}
                  ·{" "}
                  <a
                    href="https://creativecommons.org/licenses/by/4.0/"
                    target="_blank"
                    rel="noopener noreferrer license"
                    className="underline decoration-white/30 underline-offset-2 hover:text-white/80"
                  >
                    CC BY 4.0
                  </a>
                </span>
              </figcaption>
            </figure>
          </Reveal>
        </div>

        <Reveal className="mt-6 flex flex-col gap-4 rounded-[24px] border border-black/[0.07] p-6 dark:border-white/[0.08] sm:flex-row sm:items-center">
          <p className="shrink-0 text-sm font-semibold text-ink dark:text-white">{anatomy.systemsLabel}</p>
          <ul className="flex flex-wrap gap-2">
            {anatomy.systems.map((s) => (
              <li
                key={s}
                className="rounded-full bg-electric/[0.07] px-3 py-1.5 text-[12.5px] text-ink/70 dark:bg-white/[0.05] dark:text-white/65"
              >
                {s}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
