"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { AppLang } from "@/lib/i18n/uiStrings";
import { formatPrice, type LandingDict } from "@/lib/i18n/landingStrings";
import { EASE, SectionHeader } from "./ui";

// Plan names stay as product names in every language. Prices are shown in
// USD everywhere (as before the redesign); Intl formats them per locale.
// There is no checkout yet: every paid CTA opens the free sign-up, and the
// Clinic plan goes to /contact.
const PLANS = [
  { name: "Starter", monthly: 19, annual: 15, featured: false },
  { name: "Professional", monthly: 49, annual: 39, featured: true },
  { name: "Clinic", monthly: null, annual: null, featured: false },
] as const;

export default function PricingSection({ lang, pricing }: { lang: AppLang; pricing: LandingDict["pricing"] }) {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" aria-labelledby="pricing-title" className="relative scroll-mt-16 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader id="pricing-title" index="07" eyebrow={pricing.eyebrow} title={pricing.title} intro={pricing.sub} />

          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${!annual ? "text-ink dark:text-white" : "text-ink/60 dark:text-white/55"}`} aria-hidden>
              {pricing.monthly}
            </span>
            <button
              type="button"
              onClick={() => setAnnual((a) => !a)}
              role="switch"
              aria-checked={annual}
              aria-label={pricing.billingLabel}
              className={`relative h-7 w-12 rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric focus-visible:ring-offset-2 ${
                annual ? "bg-ink dark:bg-white" : "bg-ink/15 dark:bg-white/15"
              }`}
            >
              <motion.span
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-soft dark:bg-ink"
                style={{ left: annual ? "calc(100% - 24px)" : "4px" }}
              />
            </button>
            <span className={`text-sm font-medium ${annual ? "text-ink dark:text-white" : "text-ink/60 dark:text-white/55"}`} aria-hidden>
              {pricing.annual}
            </span>
            <span className="rounded-full bg-emerald/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-light">
              {pricing.save}
            </span>
          </div>
        </div>

        <div className="mt-14 grid items-stretch gap-5 lg:grid-cols-3">
          {PLANS.map((plan, i) => {
            const tier = pricing.tiers[i];
            const amount = annual ? plan.annual : plan.monthly;
            const featured = plan.featured;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
                className={`relative flex flex-col rounded-[24px] p-7 sm:p-8 ${
                  featured
                    ? "bg-ink text-white shadow-[0_24px_60px_rgba(11,13,18,0.28)] ring-1 ring-white/10 dark:bg-white dark:text-ink"
                    : "border border-black/[0.07] bg-white text-ink shadow-soft dark:border-white/[0.08] dark:bg-[#111318] dark:text-white"
                }`}
              >
                {featured && (
                  <span className="absolute -top-3 left-7 rounded-full bg-gradient-to-r from-electric to-emerald px-3 py-1 text-[11px] font-semibold text-white">
                    {pricing.popular}
                  </span>
                )}
                <h3 className="font-display text-lg font-semibold">{plan.name}</h3>
                <p className={`mt-1.5 text-[13.5px] lg:min-h-[4.5rem] leading-snug ${featured ? "text-white/60 dark:text-ink/60" : "text-ink/60 dark:text-white/55"}`}>
                  {tier.description}
                </p>
                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="font-display text-[2.6rem] font-semibold leading-none tracking-[-0.04em] tabular-nums">
                    {amount === null ? pricing.custom : formatPrice(lang, amount)}
                  </span>
                  {amount !== null && (
                    <span className={`text-sm ${featured ? "text-white/55 dark:text-ink/60" : "text-ink/60 dark:text-white/55"}`}>
                      {pricing.perMonth}
                    </span>
                  )}
                </div>
                <ul className="mb-8 mt-7 flex-1 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[14px] leading-snug">
                      <Check size={16} aria-hidden className={`mt-0.5 shrink-0 ${featured ? "text-emerald" : "text-electric-dark"}`} />
                      <span className={featured ? "text-white/85 dark:text-ink/80" : "text-ink/75 dark:text-white/70"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={plan.monthly === null ? "/contact" : "/login?mode=signup"}
                  className={`block rounded-full py-3 text-center text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric focus-visible:ring-offset-2 ${
                    featured ? "bg-white text-ink dark:bg-ink dark:text-white" : "bg-ink text-white dark:bg-white dark:text-ink"
                  }`}
                >
                  {tier.cta}
                </a>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
