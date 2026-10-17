import type { AppLang } from "@/lib/i18n/uiStrings";
import { signupHref, type LandingDict } from "@/lib/i18n/landingStrings";
import { CheckList, CONTAINER, PrimaryCta, SectionHeading } from "./ui";

// The free account is the only offer that exists: there is no checkout or
// billing. Planned paid plans get one short note and no purchase button.
export default function PricingSection({
  lang,
  pricing,
}: {
  lang: AppLang;
  pricing: LandingDict["pricing"];
}) {
  const free = pricing.free;
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-20 border-t border-black/[0.07] py-20 dark:border-white/[0.08] sm:py-28">
      <div className={CONTAINER}>
        <SectionHeading id="pricing-title" eyebrow={pricing.eyebrow} title={pricing.title} intro={pricing.sub} />

        <div className="mt-12 grid grid-cols-1 overflow-hidden rounded-2xl border border-black/[0.08] bg-white dark:border-white/[0.1] dark:bg-white/[0.03] lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <div className="min-w-0 p-6 sm:p-8">
            <p className="text-[13px] font-semibold text-[#0f7a5c] dark:text-emerald">{free.label}</p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h3 className="font-display text-2xl font-semibold text-ink dark:text-white">{free.name}</h3>
              <p className="font-display text-2xl font-semibold text-ink/60 dark:text-white/60">{free.price}</p>
            </div>
            <CheckList className="mt-6" items={free.items} />
            <PrimaryCta href={signupHref(lang)} className="mt-8">
              {free.cta}
            </PrimaryCta>
          </div>
          <div className="min-w-0 border-t border-black/[0.08] bg-black/[0.02] p-6 dark:border-white/[0.08] dark:bg-white/[0.02] sm:p-8 lg:border-l lg:border-t-0">
            <p className="text-[15px] leading-relaxed text-ink/75 dark:text-white/75">{free.limits}</p>
            <div className="mt-6 border-t border-black/[0.08] pt-6 dark:border-white/[0.08]">
              <h3 className="text-[15px] font-semibold text-ink dark:text-white">{pricing.planned.title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink/70 dark:text-white/70">{pricing.planned.text}</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
