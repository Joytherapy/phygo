import { PenLine, Lock, Cpu, Scale } from "lucide-react";
import { Reveal, SectionHeader, TextLink } from "./ui";

// Every statement here is checked against the implementation or the privacy
// policy (app/privacy/page.tsx):
// - drafts: LiveStructuring only saves on an explicit "save to patient";
//   generate-note asks for hedged, decision-support reasoning.
// - data: Supabase project in eu-central-1 (Frankfurt), RLS on every table,
//   encryption in transit/at rest per the privacy policy.
// - AI processing: transcripts and uploaded images are sent to OpenAI to
//   produce drafts; the policy states clinical data is not used to train
//   third-party models.
// - evidence: each library entry carries an evidence level; sources where present.
const PILLARS = [
  {
    icon: PenLine,
    title: "Drafts, not decisions",
    text: "AI output is a proposal. Reasoning is phrased as decision support, and nothing is saved to a patient record until you review and save it.",
  },
  {
    icon: Lock,
    title: "Access-controlled clinical data",
    text: "Data is stored in an EU-hosted database (Frankfurt), encrypted in transit and at rest, with row-level security so each account only reaches its own patients.",
  },
  {
    icon: Cpu,
    title: "Transparent AI processing",
    text: "To create a draft, session text — and any image you upload — is processed by our AI provider. Clinical data is not used to train third-party models.",
  },
  {
    icon: Scale,
    title: "Evidence you can weigh",
    text: "Library entries show their evidence level and cite sources where available, so you can judge how much weight to give them.",
  },
];

export default function TrustSection() {
  return (
    <section id="trust" aria-labelledby="trust-title" className="relative py-24 sm:py-32 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          id="trust-title"
          eyebrow="Clinical responsibility"
          title="Built to support your judgement, never to replace it."
          intro="PHYGO is a documentation and knowledge tool for qualified professionals. It does not diagnose, and it does not act on patients without you."
        />

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p, i) => (
            <Reveal
              as="li"
              key={p.title}
              delay={i * 0.08}
              className="list-none rounded-xl3 glass shadow-soft p-6"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-electric to-emerald text-white shadow-soft">
                <p.icon size={19} aria-hidden />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-ink dark:text-white">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/60 dark:text-white/55">{p.text}</p>
            </Reveal>
          ))}
        </ul>

        <Reveal className="mt-8">
          <TextLink href="/privacy">Read the privacy policy</TextLink>
        </Reveal>
      </div>
    </section>
  );
}
