"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { LandingDict } from "@/lib/i18n/landingStrings";
import { EASE, SectionHeader } from "./ui";

export default function FaqSection({ faq }: { faq: LandingDict["faq"] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" aria-labelledby="faq-title" className="relative scroll-mt-16 py-24 sm:py-32">
      <div className="mx-auto grid grid-cols-1 max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeader id="faq-title" index="08" eyebrow={faq.eyebrow} title={faq.title} />
        </div>

        <div className="border-t border-black/[0.08] dark:border-white/[0.09]">
          {faq.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="border-b border-black/[0.08] dark:border-white/[0.09]">
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    id={`faq-button-${i}`}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-electric"
                  >
                    <span className="font-display text-[1.05rem] font-medium leading-snug text-ink dark:text-white sm:text-lg">{item.q}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/10 text-ink dark:border-white/15 dark:text-white"
                    >
                      <Plus size={15} aria-hidden />
                    </motion.span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: EASE }}
                      className="overflow-hidden"
                      id={`faq-panel-${i}`}
                      role="region"
                      aria-labelledby={`faq-button-${i}`}
                    >
                      <p className="max-w-2xl pb-7 pr-12 text-[15px] leading-relaxed text-ink/65 dark:text-white/60">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
