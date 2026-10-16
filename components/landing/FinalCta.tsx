import type { LandingDict } from "@/lib/i18n/landingStrings";
import { CONTAINER, PrimaryCta } from "./ui";

export default function FinalCta({ final, signup }: { final: LandingDict["final"]; signup: string }) {
  return (
    <section aria-labelledby="final-title" className="border-t border-black/[0.07] py-20 dark:border-white/[0.08] sm:py-24">
      <div className={`${CONTAINER} text-center`}>
        <h2 id="final-title" className="text-balance font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-ink dark:text-white sm:text-[2.25rem]">
          {final.title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-ink/70 dark:text-white/70 sm:text-[17px]">{final.text}</p>
        <PrimaryCta href={signup} className="mt-8">
          {final.cta}
        </PrimaryCta>
        <p className="mt-4 text-sm text-ink/60 dark:text-white/60">{final.note}</p>
      </div>
    </section>
  );
}
