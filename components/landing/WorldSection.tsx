import type { ReactNode } from "react";
import {
  Bookmark,
  CalendarDays,
  FlaskConical,
  Globe2,
  MapPin,
} from "lucide-react";
import type { AppLang } from "@/lib/i18n/uiStrings";
import { signupHref, type LandingDict } from "@/lib/i18n/landingStrings";
import { MockCaption, Panel, PrimaryButton, Reveal, SectionHeader } from "./ui";

// PHYGO World is the dashboard's "Phygo World" menu (components/Navbar.tsx):
// - Evidence Hub, /dashboard/science: app/api/cron/science-daily pulls new
//   PubMed RCTs, systematic reviews and meta-analyses (fetch-sources), then
//   app/api/science/summarize-all writes the structured summary below and
//   auto-publishes only top-tier study types scoring >= 70 for relevance;
//   everything else stays pending_review for an admin.
// - Events, /dashboard/world/events: search, filters (type, format, level,
//   price, date), featured and online rails, near-you, saved events, and
//   links to the organiser's official registration page.
// The Shop entry of that menu uses placeholder product links, so it is not
// presented here. Both mocks are illustrative and carry no invented titles,
// dates or organisers.
export default function WorldSection({
  lang,
  world,
}: {
  lang: AppLang;
  world: LandingDict["world"];
}) {
  return (
    <section
      id="world"
      aria-labelledby="world-title"
      className="relative scroll-mt-16 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          id="world-title"
          index="05"
          eyebrow={world.eyebrow}
          title={world.title}
          intro={world.intro}
        />

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Reveal className="flex flex-col">
            <PillarHead
              icon={<FlaskConical size={18} aria-hidden />}
              title={world.evidence.title}
              text={world.evidence.text}
            />
            <Panel className="lp-ticks mt-6 flex-1 overflow-hidden">
              <div aria-hidden className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full bg-electric/10 px-2.5 py-1 text-[11px] font-semibold text-electric-dark dark:bg-electric/15 dark:text-electric-light">
                    {world.evidence.studyType}
                  </span>
                  <span className="font-mono text-[10.5px] text-ink/60 dark:text-white/55">
                    PubMed
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-3 w-11/12 rounded-full bg-ink/[0.09] dark:bg-white/[0.1]" />
                  <div className="h-3 w-3/4 rounded-full bg-ink/[0.09] dark:bg-white/[0.1]" />
                </div>
                <dl className="mt-6 space-y-3.5">
                  {world.evidence.fields.map((f, i) => (
                    <div
                      key={f}
                      className="grid grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)] items-center gap-3"
                    >
                      <dt className="text-[11.5px] font-semibold text-ink/75 dark:text-white/70">
                        {f}
                      </dt>
                      <dd
                        className="h-2 rounded-full bg-ink/[0.06] dark:bg-white/[0.07]"
                        style={{ width: `${92 - i * 9}%` }}
                      />
                    </div>
                  ))}
                </dl>
                <div className="mt-6 border-t border-black/[0.06] pt-4 dark:border-white/[0.07]">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-ink/70 dark:text-white/65">
                      {world.evidence.relevance}
                    </span>
                    <span className="font-mono text-ink/60 dark:text-white/55">
                      ≥ 70 / 100
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/[0.06] dark:bg-white/[0.08]">
                    <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-electric to-emerald" />
                  </div>
                </div>
              </div>
            </Panel>
            <p className="mt-4 text-[13px] leading-relaxed text-ink/60 dark:text-white/55">
              {world.evidence.publish}
            </p>
          </Reveal>

          <Reveal delay={0.08} className="flex flex-col">
            <PillarHead
              icon={<CalendarDays size={18} aria-hidden />}
              title={world.events.title}
              text={world.events.text}
            />
            <Panel className="lp-ticks mt-6 flex-1 overflow-hidden">
              <div aria-hidden className="flex h-full flex-col p-5 sm:p-6">
                <div className="flex flex-wrap gap-2">
                  {world.events.filters.map((f, i) => (
                    <span
                      key={f}
                      className={`rounded-full px-3 py-1 text-[11.5px] font-medium ${
                        i === 0
                          ? "bg-ink text-white dark:bg-white dark:text-ink"
                          : "bg-ink/[0.05] text-ink/70 dark:bg-white/[0.06] dark:text-white/65"
                      }`}
                    >
                      {f}
                    </span>
                  ))}
                </div>
                <ul className="mt-5 space-y-3">
                  {world.events.rows.map((row, i) => (
                    <li
                      key={row.type}
                      className="flex items-center gap-4 rounded-xl border border-black/[0.06] p-3.5 dark:border-white/[0.07]"
                    >
                      <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center gap-1 rounded-lg bg-gradient-to-br from-electric/15 to-emerald/15">
                        <span className="h-1.5 w-6 rounded-full bg-ink/20 dark:bg-white/25" />
                        <span className="h-2.5 w-4 rounded-full bg-ink/30 dark:bg-white/35" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-electric-dark dark:text-electric-light">
                          {row.type}
                          <span className="inline-flex items-center gap-1 font-medium text-ink/60 dark:text-white/55">
                            {i === 1 ? (
                              <Globe2 size={11} />
                            ) : (
                              <MapPin size={11} />
                            )}
                            {row.format}
                          </span>
                        </span>
                        <span
                          className="mt-2 block h-2.5 rounded-full bg-ink/[0.09] dark:bg-white/[0.1]"
                          style={{ width: `${86 - i * 14}%` }}
                        />
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-black/10 px-2.5 py-1 text-[11px] font-medium text-ink/70 dark:border-white/15 dark:text-white/65">
                        <Bookmark size={11} />
                        {world.events.save}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-5">
                  <div className="flex flex-wrap items-center gap-2 border-t border-black/[0.06] pt-4 text-[11.5px] font-semibold text-ink/70 dark:border-white/[0.07] dark:text-white/65">
                    <MapPin size={12} className="text-emerald" />
                    {world.events.nearYou}
                    <span className="ml-1 h-2 w-14 rounded-full bg-ink/[0.07] dark:bg-white/[0.08]" />
                    <span className="h-2 w-10 rounded-full bg-ink/[0.07] dark:bg-white/[0.08]" />
                    <span className="h-2 w-12 rounded-full bg-ink/[0.07] dark:bg-white/[0.08]" />
                  </div>
                </div>
              </div>
            </Panel>
            <p className="mt-4 text-[13px] leading-relaxed text-ink/60 dark:text-white/55">
              {world.events.note}
            </p>
          </Reveal>
        </div>

        <MockCaption>{world.caption}</MockCaption>
        <div className="mt-8 flex justify-center">
          <PrimaryButton href={signupHref(lang)}>{world.cta}</PrimaryButton>
        </div>
      </div>
    </section>
  );
}

function PillarHead({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-electric to-emerald text-white">
          {icon}
        </span>
        <h3 className="font-display text-xl font-semibold text-ink dark:text-white">
          {title}
        </h3>
      </div>
      <p className="mt-3 text-[14px] leading-relaxed text-ink/60 dark:text-white/55">
        {text}
      </p>
    </div>
  );
}
