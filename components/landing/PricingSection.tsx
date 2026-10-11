"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Clock } from "lucide-react";
import type { AppLang } from "@/lib/i18n/uiStrings";
import { formatPrice, publicPath, signupHref, type LandingDict } from "@/lib/i18n/landingStrings";
import { EASE, Reveal, SectionHeader } from "./ui";

// What exists today is a free account (profiles.plan = 'free'): there is no
// checkout or billing in the code. Paid plans are therefore shown as
// planned, with no purchase buttons. Free-account limits reflect the code:
// Ask PHYGO is rate-limited per plan (app/api/ask-phygo) and the Pro Library
// requires a pro plan (app/api/library/list). Planned prices are in USD.
const PLANS = [
  { name: "Starter", monthly: 19, annual: 15 },
  { name: "Professional", monthly: 49, annual: 39 },
  { name: "Clinic", monthly: null, annual: null },
] as const;

export default function PricingSection({ lang, pricing }: { lang: AppLang; pricing: LandingDict["pricing"] }) {
  const [annual, setAnnual] = useState(false);
  const today = pricing.today;

  return (
    <section id="pricing" aria-labelledby="pricing-title" className="relative scroll-mt-16 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader id="pricing-title" index="07" eyebrow={pricing.eyebrow} title={pricing.title} intro={pricing.sub} />

        <div className="mt-14 grid grid-cols-1 items-start gap-6 lg:grid-cols-[0.85fr_1.6fr]">
          {/* Available today */}
          <Reveal className="relative flex h-full flex-col rounded-[24px] bg-ink p-7 text-white shadow-[0_24px_60px_rgba(11,13,18,0.28)] ring-1 ring-white/10 dark:bg-white dark:text-ink sm:p-9">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald/20 px-3 py-1 text-[11px] font-semibold text-emerald-light dark:bg-emerald/15 dark:text-emerald-700">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald" />
              {today.label}
            </span>
            <h3 className="mt-6 font-display text-xl font-semibold">{today.name}</h3>
            <p className="mt-2 font-display text-[3rem] font-semibold leading-none tracking-[-0.04em]">{today.price}</p>
            <p className="mt-4 text-[14px] leading-relaxed text-white/70 dark:text-ink/70">{today.text}</p>
            <ul className="mt-6 space-y-3">
              {today.items.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[14px] leading-snug text-white/90 dark:text-ink/85">
                  <Check size={16} aria-hidden className="mt-0.5 shrink-0 text-emerald" />
                  {f}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[12.5px] leading-relaxed text-white/60 dark:text-ink/60">{today.limits}</p>
            <a
              href={signupHref(lang)}
              className="group mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-semibold text-ink transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric focus-visible:ring-offset-2 dark:bg-ink dark:text-white"
            >
              {today.cta}
              <ArrowRight size={15} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
            </a>
          </Reveal>

          {/* Planned, not purchasable */}
          <Reveal delay={0.08} className="rounded-[24px] border border-dashed border-black/15 p-5 dark:border-white/20 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="font-display text-lg font-semibold text-ink dark:text-white">{pricing.planned.label}</h3>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                  <Clock size={12} aria-hidden />
                  {pricing.planned.status}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className={`text-[13px] font-medium ${!annual ? "text-ink dark:text-white" : "text-ink/60 dark:text-white/55"}`} aria-hidden>
                  {pricing.monthly}
                </span>
                <button
                  type="button"
                  onClick={() => setAnnual((a) => !a)}
                  role="switch"
                  aria-checked={annual}
                  aria-label={pricing.billingLabel}
                  className={`relative h-6 w-11 rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric focus-visible:ring-offset-2 ${
                    annual ? "bg-ink dark:bg-white" : "bg-ink/15 dark:bg-white/15"
                  }`}
                >
                  <motion.span
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-soft dark:bg-ink"
                    style={{ left: annual ? "calc(100% - 20px)" : "4px" }}
                  />
                </button>
                <span className={`text-[13px] font-medium ${annual ? "text-ink dark:text-white" : "text-ink/60 dark:text-white/55"}`} aria-hidden>
                  {pricing.annual}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {PLANS.map((plan, i) => {
                const tier = pricing.tiers[i];
                const amount = annual ? plan.annual : plan.monthly;
                return (
                  <motion.article
                    key={plan.name}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
                    className="flex flex-col rounded-2xl bg-white p-5 ring-1 ring-black/[0.06] dark:bg-[#111318] dark:ring-white/[0.08]"
                  >
                    <h4 className="font-display text-[15px] font-semibold text-ink dark:text-white">{plan.name}</h4>
                    <p className="mt-1 min-h-[2.75rem] text-[12.5px] leading-snug text-ink/60 dark:text-white/55">{tier.description}</p>
                    <p className="mt-4 flex items-baseline gap-1 text-ink/80 dark:text-white/80">
                      <span className="font-display text-[1.8rem] font-semibold leading-none tracking-[-0.03em] tabular-nums">
                        {amount === null ? pricing.custom : formatPrice(lang, amount)}
                      </span>
                      {amount !== null && <span className="text-[12.5px] text-ink/60 dark:text-white/55">{pricing.perMonth}</span>}
                    </p>
                    {annual && amount !== null && <p className="mt-1 text-[11px] text-ink/60 dark:text-white/55">{pricing.save}</p>}
                    <ul className="mb-5 mt-5 flex-1 space-y-2">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-[13px] leading-snug text-ink/70 dark:text-white/65">
                          <Check size={14} aria-hidden className="mt-0.5 shrink-0 text-ink/40 dark:text-white/40" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {tier.cta ? (
                      <a
                        href={publicPath(lang, "contact")}
                        className="inline-flex items-center justify-center rounded-full border border-black/10 py-2.5 text-[13px] font-semibold text-ink transition-colors hover:border-ink/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric dark:border-white/15 dark:text-white dark:hover:border-white/35"
                      >
                        {tier.cta}
                      </a>
                    ) : (
                      <p className="rounded-full bg-ink/[0.04] py-2.5 text-center text-[12.5px] font-medium text-ink/60 dark:bg-white/[0.05] dark:text-white/55">
                        {pricing.notYet}
                      </p>
                    )}
                  </motion.article>
                );
              })}
            </div>
            <p className="mt-5 text-[12px] leading-relaxed text-ink/60 dark:text-white/55">{pricing.planned.note}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
