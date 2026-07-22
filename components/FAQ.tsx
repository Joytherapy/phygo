"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const faqs = [
  {
    q: "Is patient data actually secure?",
    a: "Yes. Recordings and notes are encrypted in transit and at rest, and you can delete any session's audio the moment its report is generated — nothing lingers longer than you want it to.",
  },
  {
    q: "What if the AI gets something wrong?",
    a: "Every generated note is fully editable before it's sent or saved. Think of it as a first draft written by someone who was in the room — you always have the final word.",
  },
  {
    q: "Do I need to change how I run sessions?",
    a: "No. Speak the way you already talk to a colleague or to yourself while working. There's no required structure, keywords, or dictation training.",
  },
  {
    q: "Which languages are supported?",
    a: "Phygo follows natural speech in most major languages and matches the language you speak in your report output automatically.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes — plans are month-to-month with no lock-in contracts. Annual billing is optional and simply reflects the discount.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-3xl px-6">
        <div className="max-w-2xl mb-14">
          <p className="eyebrow text-electric mb-4">Questions</p>
          <h2 className="font-display font-semibold text-ink dark:text-white text-3xl sm:text-5xl tracking-tight text-balance">
            Everything you're probably wondering.
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
                    <Plus size={16} />
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
