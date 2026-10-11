import type { LandingDict } from "@/lib/i18n/landingStrings";
import { PrimaryButton, Reveal, Rich, TextLink } from "./ui";

export default function FinalCta({ final, libraryHref }: { final: LandingDict["final"]; libraryHref: string }) {
  return (
    <section aria-labelledby="final-cta-title" className="relative px-4 py-24 sm:px-6 sm:py-32">
      <div className="lp-ticks relative mx-auto max-w-6xl">
        <div className="lp-dots relative overflow-hidden rounded-[32px] border border-black/[0.07] bg-white/60 text-center dark:border-white/[0.08] dark:bg-white/[0.02]">
          <div aria-hidden className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-electric/25 blur-[100px]" />
          <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-emerald/20 blur-[100px]" />
          <Reveal className="relative px-6 py-16 sm:py-24">
            <h2
              id="final-cta-title"
              className="mx-auto max-w-4xl font-display text-[2.3rem] font-semibold leading-[1.05] tracking-[-0.04em] text-ink dark:text-white sm:text-[3.9rem] text-balance"
            >
              <Rich text={final.title} />
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink/60 dark:text-white/55 sm:text-lg">{final.text}</p>
            <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row">
              <PrimaryButton href="/login?mode=signup">{final.cta}</PrimaryButton>
              <TextLink href={libraryHref}>{final.secondary}</TextLink>
            </div>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.12em] text-ink/60 dark:text-white/55">{final.note}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
