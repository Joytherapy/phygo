import { Users, CalendarDays, Smartphone, FolderOpen, GraduationCap } from "lucide-react";
import { Reveal, SectionHeader } from "./ui";

// Grounded in: app/dashboard/patients (records + saved notes), app/dashboard/agenda
// and components/AppointmentScheduler.tsx, app/my-phygo (invite-code portal
// that reads the practitioner's saved notes), app/dashboard/workspace (PDF
// documents, annotations, notebooks, Ask PHYGO panel) and app/dashboard/quiz.
// Video calls are intentionally not advertised: they depend on an external
// provider key that is not configured in production.
const CARDS = [
  {
    icon: Users,
    title: "Patients & session history",
    text: "Every patient's saved notes, plans and linked clinical references in one record — so the next visit starts where the last one ended.",
    wide: true,
  },
  {
    icon: Smartphone,
    title: "My Phygo for patients",
    text: "Invite a patient with a code. They see the plan, exercises and plain-language summary you saved — nothing you haven't approved.",
    wide: false,
  },
  {
    icon: CalendarDays,
    title: "Agenda",
    text: "Schedule sessions, and let linked patients request appointments for you to confirm.",
    wide: false,
  },
  {
    icon: FolderOpen,
    title: "Documents & notebooks",
    text: "Upload PDFs, highlight and annotate them, keep notebooks, and ask PHYGO about the document you are reading.",
    wide: false,
  },
  {
    icon: GraduationCap,
    title: "Student mode",
    text: "Physiotherapy students get the workspace, the knowledge libraries and quizzes by subject and difficulty.",
    wide: false,
  },
];

export default function WorkspaceSection() {
  return (
    <section id="workspace" aria-labelledby="workspace-title" className="relative py-24 sm:py-32 scroll-mt-20 bg-mist/60 dark:bg-white/[0.02]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          id="workspace-title"
          eyebrow="The PHYGO workspace"
          title="Your practice, connected — not scattered across apps."
          intro="Documentation and knowledge are only half of the work. PHYGO also keeps patients, scheduling and your study material in the same place."
        />

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c, i) => (
            <Reveal
              as="li"
              key={c.title}
              delay={(i % 3) * 0.08}
              className={`list-none rounded-xl3 bg-white dark:bg-ink-soft p-6 sm:p-7 shadow-soft ring-1 ring-black/[0.04] dark:ring-white/[0.06] ${
                c.wide ? "lg:col-span-2" : ""
              }`}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-electric/15 to-emerald/15 text-electric">
                <c.icon size={18} aria-hidden />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-ink dark:text-white">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/60 dark:text-white/55">{c.text}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
