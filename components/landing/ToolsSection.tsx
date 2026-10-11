"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { FlaskConical, ClipboardList, Library } from "lucide-react";
import { Reveal, SectionHeader } from "./ui";

// Grounded in: app/api/science/* (PubMed import limited to RCTs, systematic
// reviews and meta-analyses; AI summaries; auto-publish only for those study
// types with relevance >= 70, otherwise editorial review), app/api/clinical-tools/*,
// and the specialty pages under app/dashboard/*.
const TABS = [
  {
    id: "evidence",
    icon: FlaskConical,
    label: "Evidence",
    title: "A research feed filtered for physiotherapy",
    text: "New PubMed studies are checked daily. Only randomised controlled trials, systematic reviews and meta-analyses on physiotherapy topics are imported, then summarised in a fixed structure.",
    items: [
      "Clinical question, design, population and intervention",
      "Main findings and clinical interpretation",
      "Auto-published only above a quality threshold — the rest wait for editorial review",
      "Related studies surfaced next to copilot drafts",
    ],
  },
  {
    id: "assessment",
    icon: ClipboardList,
    label: "Assessment tools",
    title: "The tests and scales you use every week",
    text: "Reference material for assessment, kept next to your notes instead of in another tab.",
    items: [
      "Orthopaedic special tests",
      "Functional scales and outcome measures",
      "Neurological examination",
      "Pelvic-floor questionnaires",
      "Metabolic and energy-needs calculator",
    ],
  },
  {
    id: "specialties",
    icon: Library,
    label: "Specialty libraries",
    title: "Depth beyond musculoskeletal care",
    text: "Dedicated sections for areas where physiotherapists increasingly work.",
    items: [
      "Sports medicine and return to play",
      "Cardiopulmonary rehabilitation and airway clearance",
      "Pelvic-floor rehabilitation",
      "Oncology rehabilitation",
      "First aid and BLS procedures by country",
    ],
  },
];

export default function ToolsSection() {
  const [active, setActive] = useState(0);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    let next = active;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (active + 1) % TABS.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (active - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    else return;
    e.preventDefault();
    setActive(next);
    tabsRef.current[next]?.focus();
  };

  return (
    <section id="tools" aria-labelledby="tools-title" className="relative py-24 sm:py-32 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          id="tools-title"
          eyebrow="Evidence & professional tools"
          title="The reference shelf of a modern practice."
          intro="Research, assessment tools and specialty knowledge — one click from the patient you are treating."
        />

        <Reveal className="mt-14 grid gap-6 lg:grid-cols-[280px_1fr]">
          <div role="tablist" aria-label="Professional tools" aria-orientation="vertical" className="flex lg:flex-col gap-2 overflow-x-auto">
            {TABS.map((t, i) => (
              <button
                key={t.id}
                ref={(el) => {
                  tabsRef.current[i] = el;
                }}
                role="tab"
                id={`tools-tab-${t.id}`}
                aria-selected={active === i}
                aria-controls={`tools-panel-${t.id}`}
                tabIndex={active === i ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={onKeyDown}
                className={`flex shrink-0 items-center gap-3 rounded-xl2 px-4 py-3.5 text-left text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric ${
                  active === i
                    ? "bg-white dark:bg-ink-soft text-ink dark:text-white shadow-soft ring-1 ring-black/[0.04] dark:ring-white/[0.08]"
                    : "text-ink/55 dark:text-white/50 hover:bg-ink/[0.03] dark:hover:bg-white/[0.04]"
                }`}
              >
                <t.icon size={17} aria-hidden className={active === i ? "text-electric" : ""} />
                {t.label}
              </button>
            ))}
          </div>

          {TABS.map((t, i) => (
            <div
              key={t.id}
              role="tabpanel"
              id={`tools-panel-${t.id}`}
              aria-labelledby={`tools-tab-${t.id}`}
              hidden={active !== i}
              className="rounded-xl3 bg-white dark:bg-ink-soft p-6 sm:p-10 shadow-soft ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
            >
              <h3 className="font-display text-2xl font-semibold text-ink dark:text-white">{t.title}</h3>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink/60 dark:text-white/55">{t.text}</p>
              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {t.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 rounded-xl bg-mist dark:bg-white/[0.04] px-4 py-3 text-[13.5px] leading-snug text-ink/75 dark:text-white/70">
                    <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-electric to-emerald" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
