"use client";

import { motion } from "framer-motion";
import { FlaskConical, CalendarDays, ShoppingBag, ArrowRight } from "lucide-react";

const items = [
  {
    icon: FlaskConical,
    title: "Science",
    description: "Physiotherapy research, summarized weekly.",
    href: "/dashboard/science",
  },
  {
    icon: CalendarDays,
    title: "Events",
    description: "Courses and conferences worth knowing about.",
    href: "/dashboard/world/events",
  },
  {
    icon: ShoppingBag,
    title: "Shop",
    description: "Equipment picks matched to your caseload.",
    href: "/dashboard/shop",
  },
];

export default function PhygoWorld() {
  return (
    <section className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="rounded-xl3 bg-grad-mesh dark:bg-white/[0.03] p-8 sm:p-10">
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <div>
              <p className="eyebrow text-electric mb-2">Phygo World</p>
              <p className="text-sm text-ink/55 dark:text-white/55 max-w-md">
                Beyond the clinic — the wider ecosystem around Phygo.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {items.map((it, i) => (
              <motion.a
                key={it.title}
                href={it.href}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="group flex items-center gap-4 rounded-xl2 bg-white/70 dark:bg-white/[0.04] backdrop-blur-sm p-5 shadow-soft hover:shadow-glow transition-shadow duration-300"
              >
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-electric/15 to-emerald/15 text-electric">
                  <it.icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-ink dark:text-white mb-0.5">{it.title}</h3>
                  <p className="text-xs text-ink/50 dark:text-white/50 leading-relaxed">{it.description}</p>
                </div>
                <ArrowRight
                  size={15}
                  className="shrink-0 text-ink/25 dark:text-white/25 transition-transform group-hover:translate-x-1 group-hover:text-electric"
                />
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
