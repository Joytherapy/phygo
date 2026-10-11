"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const faqs = [
  {
    q: "Does PHYGO replace my clinical judgement?",
    a: "No. PHYGO drafts documentation and brings relevant knowledge to hand. Every note, reasoning summary and exercise suggestion is a draft that you review, edit and approve. PHYGO does not diagnose and does not contact patients on its own.",
  },
  {
    q: "What if the AI gets something wrong?",
    a: "It can — which is why nothing is saved to a patient record until you save it. Clinical reasoning is written as cautious decision support, with red flags and missing information listed, so it is easy to check against your own assessment.",
  },
  {
    q: "How is patient data handled?",
    a: "Clinical data is stored in an EU-hosted database (Frankfurt), encrypted in transit and at rest, with row-level security so each account only reaches its own patients. Session text and uploaded images are processed by our AI provider to create drafts and are not used to train third-party models. Details are in the privacy policy.",
  },
  {
    q: "Where does the clinical library content come from?",
    a: "Entries are compiled from published literature and clinical guidelines. Each shows its evidence level, and cites sources where available. Coverage varies by condition, so treat the library as a starting point that supports your reasoning.",
  },
  {
    q: "Which languages are supported?",
    a: "You can dictate or type sessions in Italian, English, Spanish or French. The public condition library and the exercise library are available in the same four languages.",
  },
  {
    q: "Is the demo on this page the real AI?",
    a: "Yes. Speech is transcribed by your browser, then the text is sent to the same AI pipeline used in PHYGO to generate a draft. Without an account you get one free demo — please use a made-up case, not real patient details.",
  },
  {
    q: "How much does it cost to get started?",
    a: "Creating an account is free and doesn't require a credit card.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" aria-labelledby="faq-title" className="relative py-24 sm:py-32 scroll-mt-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="max-w-2xl mb-14">
          <p className="eyebrow text-electric mb-4">Questions</p>
          <h2 id="faq-title" className="font-display font-semibold text-ink dark:text-white text-3xl sm:text-5xl tracking-tight text-balance">
            Questions physiotherapists ask us.
          </h2>
        </div>

        <div className="divide-y divide-ink/8 dark:divide-white/10 rounded-xl3 glass shadow-soft">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="px-6 sm:px-8">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  data-cursor-hover
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  id={`faq-button-${i}`}
                  className="flex w-full items-center justify-between gap-4 py-6 text-left"
                >
                  <span className="font-display font-medium text-ink dark:text-white text-base sm:text-lg">
                    {item.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-mist dark:bg-white/10 text-ink dark:text-white"
                  >
                    <Plus size={16} aria-hidden />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                      id={`faq-panel-${i}`}
                      role="region"
                      aria-labelledby={`faq-button-${i}`}
                    >
                      <p className="pb-6 text-sm text-ink/60 dark:text-white/60 leading-relaxed max-w-xl">
                        {item.a}
                      </p>
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
