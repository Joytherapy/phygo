import { CalendarDays, FileText, GraduationCap, Smartphone, Users } from "lucide-react";
import type { LandingDict } from "@/lib/i18n/landingStrings";
import { Reveal, SectionHeader } from "./ui";

// Patients & sessions: /dashboard/patients. My Phygo: /my-phygo (invite
// codes, patient sees only saved plans). Agenda: /dashboard/agenda with
// appointment requests. Documents & notebooks: /dashboard/workspace.
// Student mode: profiles.practice_stage + quizzes.
const ICONS = [Users, Smartphone, CalendarDays, FileText, GraduationCap];

export default function WorkspaceSection({ workspace }: { workspace: LandingDict["workspace"] }) {
  return (
    <section id="workspace" aria-labelledby="workspace-title" className="relative scroll-mt-16 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader id="workspace-title" index="05" eyebrow={workspace.eyebrow} title={workspace.title} intro={workspace.intro} />

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {workspace.items.map((item, i) => {
            const Icon = ICONS[i] ?? FileText;
            const wide = i < 2;
            return (
              <Reveal
                as="li"
                key={item.title}
                delay={i * 0.06}
                className={`group relative list-none overflow-hidden rounded-[22px] border border-black/[0.07] bg-white p-6 shadow-soft transition-shadow hover:shadow-lift dark:border-white/[0.08] dark:bg-[#111318] ${
                  wide ? "lg:col-span-3 sm:p-8" : "lg:col-span-2"
                } ${i === 4 ? "sm:col-span-2 lg:col-span-2" : ""}`}
              >
                <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-electric/15 to-emerald/15 text-electric-dark dark:text-electric-light">
                  <Icon size={18} aria-hidden />
                </span>
                <h3 className={`relative mt-5 font-display font-semibold tracking-tight text-ink dark:text-white ${wide ? "text-xl" : "text-lg"}`}>
                  {item.title}
                </h3>
                <p className="relative mt-2 text-[14px] leading-relaxed text-ink/60 dark:text-white/55">{item.text}</p>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
