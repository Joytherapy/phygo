import { Search, PlayCircle, Languages, Layers, ArrowUpRight } from "lucide-react";
import { Reveal, SectionHeader, MockCaption } from "./ui";
import type { FeaturedCondition } from "@/lib/landing/libraryStats";

// Exercise library: app/dashboard/exercise-library (search + filters by body
// region, equipment and difficulty; image + video assets; it/en/es/fr
// translations). Copilot prescriptions: app/api/refine-exercises and
// app/api/exercise-intelligence. Phased protocols: rehab_phases.
export default function ExerciseSection({
  phasedProtocols,
  featured,
}: {
  phasedProtocols: number | null;
  featured: FeaturedCondition | null;
}) {
  const points = [
    {
      icon: Search,
      title: "Searchable exercise library",
      text: "Find exercises by name, body region, equipment and difficulty.",
    },
    {
      icon: PlayCircle,
      title: "Images and video",
      text: "Exercises come with demonstration media, so instructions are easier to follow.",
    },
    {
      icon: Languages,
      title: "Four languages",
      text: "Exercise names and instructions in Italian, English, Spanish and French.",
    },
    {
      icon: Layers,
      title: "Phased rehab protocols",
      text:
        typeof phasedProtocols === "number" && phasedProtocols > 0
          ? `Structured phases with criteria to progress for ${phasedProtocols} conditions — used by the copilot to fit exercises to the patient's stage.`
          : "Structured phases with criteria to progress, used by the copilot to fit exercises to the patient's stage.",
    },
  ];

  const phases = featured?.phases.length ? featured.phases : null;

  return (
    <section id="exercises" aria-labelledby="exercises-title" className="relative py-24 sm:py-32 scroll-mt-20 bg-mist/60 dark:bg-white/[0.02]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 grid gap-14 lg:grid-cols-2 items-center">
        <div>
          <SectionHeader
            id="exercises-title"
            eyebrow="Exercise & rehabilitation"
            title="From assessment to dosage, in the same flow."
            intro="Copilot drafts include exercises with sets, reps and frequency. Check them against the library, adjust the dose and keep the plan aligned with the patient's phase of recovery."
          />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2">
            {points.map((p, i) => (
              <Reveal as="li" key={p.title} delay={i * 0.06} className="list-none">
                <p.icon size={18} aria-hidden className="text-electric" />
                <h3 className="mt-3 font-semibold text-[15px] text-ink dark:text-white">{p.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink/60 dark:text-white/55">{p.text}</p>
              </Reveal>
            ))}
          </ul>
        </div>

        <Reveal delay={0.1}>
          <div className="rounded-xl3 bg-white dark:bg-ink-soft p-5 sm:p-6 shadow-lift ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink/50 dark:text-white/45">Rehab plan · draft</p>
              {featured && (
                <span className="text-[11.5px] font-medium text-ink/55 dark:text-white/50 truncate max-w-[60%]">{featured.name}</span>
              )}
            </div>

            {phases && (
              <ol className="mt-4 flex gap-2" aria-label="Rehab phases">
                {phases.map((p, i) => (
                  <li
                    key={p.number}
                    className={`flex-1 rounded-lg px-2.5 py-2 text-[11px] leading-snug ${
                      i === 1
                        ? "bg-gradient-to-br from-electric to-emerald text-white font-semibold"
                        : "bg-mist dark:bg-white/[0.04] text-ink/60 dark:text-white/55"
                    }`}
                  >
                    Phase {p.number}
                    <span className="mt-0.5 block font-normal opacity-90">{p.name}</span>
                  </li>
                ))}
              </ol>
            )}

            <div className="mt-4 space-y-2.5">
              {[
                { name: "Isometric hamstring bridge", dose: "3 × 30 s · daily" },
                { name: "Single-leg Romanian deadlift", dose: "3 × 10 · 3× week" },
                { name: "Progressive running drills", dose: "As tolerated · criteria-based" },
              ].map((e) => (
                <div key={e.name} className="flex items-center gap-3 rounded-xl border border-black/[0.05] dark:border-white/[0.06] p-3">
                  <span aria-hidden className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg bg-grad-mesh text-electric">
                    <PlayCircle size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink dark:text-white">{e.name}</p>
                    <p className="text-[11.5px] text-ink/55 dark:text-white/50">{e.dose}</p>
                  </div>
                  <ArrowUpRight size={14} aria-hidden className="text-ink/30 dark:text-white/30" />
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-lg bg-amber-400/10 px-3 py-2 text-[11.5px] text-amber-800 dark:text-amber-200">
              Suggested doses are a starting point — adjust them to your clinical assessment.
            </p>
          </div>
          <MockCaption>
            Illustrative plan. {phases ? "Phase names come from the real library protocol; exercises are a sample." : "Exercises are a sample."}
          </MockCaption>
        </Reveal>
      </div>
    </section>
  );
}
