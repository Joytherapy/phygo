import Image from "next/image";
import { PersonStanding, Brain } from "lucide-react";
import { Reveal, SectionHeader, MockCaption } from "./ui";

// BodyMap / BrainMap live at /dashboard/body-map and /dashboard/brain-map
// (components/BodyMap3D.tsx, BrainMap3D.tsx): 3D models whose regions link to
// body_zone_conditions / brain_zone_conditions / nerve_conditions and to
// exercise programs. System explorers are the /dashboard/* specialty pages
// listed in components/LibraryNavMenu.tsx.
const SYSTEMS = [
  "Pelvic floor",
  "Cardiopulmonary",
  "Endocrine",
  "Gastrointestinal",
  "Urinary",
  "Immune",
  "Haematology",
  "Oncology",
  "Fascia",
  "Physiology",
];

const HOTSPOTS = [
  { cx: 70, cy: 66, label: "Shoulder" },
  { cx: 100, cy: 122, label: "Lumbar spine" },
  { cx: 84, cy: 214, label: "Knee" },
  { cx: 116, cy: 268, label: "Ankle" },
];

export default function AnatomySection() {
  return (
    <section id="anatomy" aria-labelledby="anatomy-title" className="relative py-24 sm:py-32 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          id="anatomy-title"
          eyebrow="Anatomy & neuroanatomy"
          title="Start from the body. Land on the condition."
          intro="Explore interactive 3D models, select a region and go straight to the conditions — and, for body regions, the exercise programs — linked to it."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <Reveal className="flex flex-col rounded-xl3 bg-white dark:bg-ink-soft p-6 sm:p-8 shadow-soft ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-electric to-emerald text-white">
                <PersonStanding size={18} aria-hidden />
              </span>
              <h3 className="font-display text-xl font-semibold text-ink dark:text-white">Body map</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink/60 dark:text-white/55">
              A 3D musculoskeletal model with selectable regions. Each region opens the conditions associated
              with it and the related exercise programs.
            </p>

            <div className="mt-6 flex flex-1 items-center justify-center rounded-xl2 bg-grad-mesh dark:bg-white/[0.03] p-6">
              <svg viewBox="0 0 200 300" className="h-72 w-auto shrink-0" role="img" aria-label="Illustrative body outline with selectable regions">
                <defs>
                  <linearGradient id="body-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F7CFF" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#32D6A0" stopOpacity="0.25" />
                  </linearGradient>
                </defs>
                <g fill="url(#body-grad)" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.2" className="text-ink dark:text-white">
                  <circle cx="100" cy="26" r="17" />
                  <rect x="93" y="42" width="14" height="10" rx="4" />
                  <path d="M66 58 Q100 48 134 58 Q140 60 140 70 L136 132 Q134 140 126 140 L74 140 Q66 140 64 132 L60 70 Q60 60 66 58 Z" />
                  <rect x="40" y="60" width="16" height="92" rx="8" transform="rotate(8 48 60)" />
                  <rect x="144" y="60" width="16" height="92" rx="8" transform="rotate(-8 152 60)" />
                  <rect x="71" y="142" width="26" height="140" rx="12" />
                  <rect x="103" y="142" width="26" height="140" rx="12" />
                </g>
                {HOTSPOTS.map((h) => (
                  <g key={h.label}>
                    <circle cx={h.cx} cy={h.cy} r="9" fill="#4F7CFF" opacity="0.18" />
                    <circle cx={h.cx} cy={h.cy} r="4" fill="#4F7CFF" />
                  </g>
                ))}
              </svg>
              <ul className="ml-4 space-y-2">
                {HOTSPOTS.map((h) => (
                  <li key={h.label} className="flex items-center gap-2 text-[12.5px] text-ink/70 dark:text-white/65">
                    <span aria-hidden className="h-2 w-2 rounded-full bg-electric" />
                    {h.label}
                  </li>
                ))}
              </ul>
            </div>
            <MockCaption>Simplified illustration — the app uses an interactive 3D model.</MockCaption>
          </Reveal>

          <Reveal delay={0.1} className="flex flex-col rounded-xl3 bg-ink p-6 sm:p-8 shadow-lift text-white">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <Brain size={18} aria-hidden />
              </span>
              <h3 className="font-display text-xl font-semibold">Brain map</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Neuroanatomy in 3D: brain areas and peripheral nerves linked to the neurological conditions you
              treat, with reference views like the one below.
            </p>
            <div className="mt-6 overflow-hidden rounded-xl2 ring-1 ring-white/10">
              <Image
                src="/images/brain-lateral-view.png"
                alt="PHYGO neuroanatomy reference: lateral view of the brain with the four lobes, cerebellum and brainstem, their functions and lobar lesion syndromes"
                width={1672}
                height={941}
                sizes="(min-width: 1024px) 560px, 100vw"
                className="h-auto w-full"
              />
            </div>
            <p className="mt-3 text-center text-[11px] text-white/40">Reference view from the PHYGO brain map</p>
          </Reveal>
        </div>

        <Reveal className="mt-6 rounded-xl3 border border-black/[0.06] dark:border-white/[0.07] p-6">
          <p className="text-sm font-semibold text-ink dark:text-white">Plus system explorers</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {SYSTEMS.map((s) => (
              <li key={s} className="rounded-full bg-electric/[0.07] dark:bg-white/[0.05] px-3 py-1.5 text-[12.5px] text-ink/70 dark:text-white/65">
                {s}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
