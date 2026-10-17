import { Plus } from "lucide-react";
import type { LandingDict } from "@/lib/i18n/landingStrings";
import { CONTAINER, SectionHeading } from "./ui";

// Native <details>: keyboard and screen-reader support without client JavaScript.
export default function FaqSection({ faq }: { faq: LandingDict["faq"] }) {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 border-t border-black/[0.07] py-20 dark:border-white/[0.08] sm:py-28">
      <div className={`${CONTAINER} grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16`}>
        <SectionHeading id="faq-title" eyebrow={faq.eyebrow} title={faq.title} />
        <div className="min-w-0 border-t border-black/10 dark:border-white/10">
          {faq.items.map((item) => (
            <details key={item.q} className="group border-b border-black/10 dark:border-white/10">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-electric [&::-webkit-details-marker]:hidden">
                <h3 className="min-w-0 font-display text-[16.5px] font-medium leading-snug text-ink dark:text-white">{item.q}</h3>
                <Plus size={18} aria-hidden className="shrink-0 text-ink/60 transition-transform group-open:rotate-45 motion-reduce:transition-none dark:text-white/60" />
              </summary>
              <p className="max-w-2xl pb-6 pr-8 text-[15px] leading-relaxed text-ink/70 dark:text-white/70">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
