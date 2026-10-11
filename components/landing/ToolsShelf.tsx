import { ClipboardCheck, FlaskConical, Library } from "lucide-react";
import type { LandingDict } from "@/lib/i18n/landingStrings";
import { Reveal, SectionHeader } from "./ui";

// Evidence: app/api/cron/science-daily (PubMed, RCT / systematic review /
// meta-analysis filter, structured summary, quality-gated auto-publish) and
// app/api/science/relevant. Assessment tools and specialty libraries are the
// /dashboard/* pages listed in components/LibraryNavMenu.tsx.
const ICONS = [FlaskConical, ClipboardCheck, Library];

export default function ToolsShelf({ tools }: { tools: LandingDict["tools"] }) {
  return (
    <section id="tools" aria-labelledby="tools-title" className="relative scroll-mt-16 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader id="tools-title" index="04" eyebrow={tools.eyebrow} title={tools.title} intro={tools.intro} />

        <div className="mt-14 grid border-t border-black/[0.08] dark:border-white/[0.09] md:grid-cols-3">
          {tools.columns.map((col, i) => {
            const Icon = ICONS[i] ?? Library;
            return (
              <Reveal
                key={col.title}
                delay={i * 0.08}
                className={`py-8 md:px-8 md:py-10 ${i === 0 ? "md:pl-0" : "border-t border-black/[0.08] dark:border-white/[0.09] md:border-l md:border-t-0"} ${
                  i === tools.columns.length - 1 ? "md:pr-0" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon size={20} aria-hidden className="text-electric-dark dark:text-electric-light" />
                  <span className="font-mono text-[10.5px] text-ink/60 dark:text-white/55">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-6 font-display text-xl font-semibold tracking-tight text-ink dark:text-white">{col.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-ink/60 dark:text-white/55">{col.text}</p>
                <ul className="mt-6 space-y-2.5">
                  {col.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-ink/75 dark:text-white/70">
                      <span aria-hidden className="mt-[7px] h-1 w-3 shrink-0 rounded-full bg-gradient-to-r from-electric to-emerald" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
