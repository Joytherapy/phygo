import { Database, FileCheck2, Scale, ShieldCheck } from "lucide-react";
import type { LandingDict } from "@/lib/i18n/landingStrings";
import { Reveal, SectionHeader, TextLink } from "./ui";

// Every statement here is checked against the code: drafts are only saved on
// explicit action (components/liveStructuring), Supabase project region
// eu-central-1 with RLS on patient tables, AI processing disclosed in
// app/privacy, evidence_level + source fields in knowledge_base.
const ICONS = [FileCheck2, Database, ShieldCheck, Scale];

export default function TrustSection({ trust }: { trust: LandingDict["trust"] }) {
  return (
    <section id="trust" aria-labelledby="trust-title" className="relative scroll-mt-16 px-4 py-8 sm:px-6">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-ink px-6 py-16 text-white ring-1 ring-white/[0.07] sm:px-12 sm:py-24">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:22px_22px]" />
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-electric/25 blur-[110px]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-emerald/15 blur-[110px]" />

        <div className="relative">
          <SectionHeader id="trust-title" index="06" eyebrow={trust.eyebrow} title={trust.title} intro={trust.intro} tone="inverse" />

          <ul className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-[22px] bg-white/[0.08] sm:grid-cols-2">
            {trust.items.map((item, i) => {
              const Icon = ICONS[i] ?? ShieldCheck;
              return (
                <Reveal as="li" key={item.title} delay={i * 0.06} className="list-none bg-[#101218] p-6 sm:p-8">
                  <Icon size={20} aria-hidden className="text-emerald-light" />
                  <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-white/60">{item.text}</p>
                </Reveal>
              );
            })}
          </ul>

          <div className="mt-10">
            <TextLink href="/privacy" className="!text-white/80 hover:!text-white">
              {trust.privacy}
            </TextLink>
          </div>
        </div>
      </div>
    </section>
  );
}
