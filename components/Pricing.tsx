"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import SpotlightBorder from "./SpotlightBorder";

const tiers = [
  {
    name: "Starter",
    monthly: 19,
    annual: 15,
    description: "For solo practitioners getting started.",
    features: ["50 sessions / month", "AI clinical notes", "PDF export", "Email support"],
    featured: false,
  },
  {
    name: "Professional",
    monthly: 49,
    annual: 39,
    description: "For full-time practices that run daily.",
    features: [
      "Unlimited sessions",
      "AI clinical notes + summaries",
      "WhatsApp integration",
      "Exercise library",
      "Priority support",
    ],
    featured: true,
  },
  {
    name: "Clinic",
    monthly: null,
    annual: null,
    description: "For multi-practitioner clinics.",
    features: [
      "Everything in Professional",
      "Multi-practitioner accounts",
      "Shared patient history",
      "Dedicated onboarding",
    ],
    featured: false,
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl mb-10">
          <p className="eyebrow text-electric mb-4">Pricing</p>
          <h2 className="font-display font-semibold text-ink dark:text-white text-3xl sm:text-5xl tracking-tight text-balance">
            Simple plans that grow with your practice.
          </h2>
        </div>

        <div className="flex items-center gap-3 mb-14">
          <span className={`text-sm font-medium ${!annual ? "text-ink dark:text-white" : "text-ink/40 dark:text-white/40"}`}>Monthly</span>
          <button
            onClick={() => setAnnual((a) => !a)}
            aria-label="Toggle annual billing"
            className={`relative h-7 w-12 rounded-full transition-colors duration-300 ${
              annual ? "bg-ink dark:bg-white" : "bg-ink/15 dark:bg-white/15"
            }`}
          >
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-1 h-5 w-5 rounded-full bg-white dark:bg-ink shadow-soft"
              style={{ left: annual ? "calc(100% - 24px)" : "4px" }}
            />
          </button>
          <span className={`text-sm font-medium ${annual ? "text-ink dark:text-white" : "text-ink/40 dark:text-white/40"}`}>Annual</span>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald/10 text-emerald-dark">
            Save 20%
          </span>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {tiers.map((tier, i) => {
            const price = tier.monthly === null ? "Custom" : `$${annual ? tier.annual : tier.monthly}`;
            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className={`relative rounded-xl3 p-8 ${
                  tier.featured
                    ? "bg-ink text-white shadow-[0_20px_60px_rgba(11,13,18,0.25)] lg:-translate-y-3"
                    : "bg-white dark:bg-ink-soft text-ink dark:text-white shadow-soft"
                }`}
              >
                {tier.featured && (
                  <>
                    <div className="absolute -inset-px rounded-xl3 bg-gradient-to-br from-electric/40 to-emerald/40 -z-10 blur-sm" />
                    <span className="absolute -top-3 left-8 rounded-full bg-gradient-to-r from-electric to-emerald text-white text-[11px] font-semibold px-3 py-1">
                      Most popular
                    </span>
                  </>
                )}
                <SpotlightBorder
                  className="rounded-xl3"
                  color={tier.featured ? "rgba(255,255,255,0.10)" : "rgba(79,124,255,0.12)"}
                >
                  <h3 className="font-display font-semibold text-lg mb-1">{tier.name}</h3>
                  <p className={`text-sm mb-6 ${tier.featured ? "text-white/50" : "text-ink/50 dark:text-white/50"}`}>
                    {tier.description}
                  </p>
                  <div className="mb-7 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-semibold">{price}</span>
                    {tier.monthly !== null && (
                      <span className={`text-sm ${tier.featured ? "text-white/40" : "text-ink/40 dark:text-white/40"}`}>
                        /month
                      </span>
                    )}
                  </div>
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check
                          size={16}
                          className={`mt-0.5 shrink-0 ${tier.featured ? "text-emerald" : "text-electric"}`}
                        />
                        <span className={tier.featured ? "text-white/80" : "text-ink/70 dark:text-white/70"}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={tier.monthly === null ? "#contact" : "/login?mode=signup"}
                    className={`block text-center rounded-full text-sm font-semibold py-3 transition-opacity hover:opacity-90 ${
                      tier.featured ? "bg-white text-ink" : "bg-ink text-white"
                    }`}
                  >
                    {tier.monthly === null ? "Contact Sales" : "Start Free"}
                  </a>
                </SpotlightBorder>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
