#!/usr/bin/env python3
"""
Refines the Body Map hero: smaller, more restrained title (matches the
text-6xl ceiling already used by every newer Library section instead of the
current text-8xl), drops the blurred glow-duplicate under the title (a
"demo landing page" trick that reads as less premium at this size), and
brings the badge in line with the border+backdrop-blur pill style already
used everywhere else (Urinary, Endocrine, Physiology, etc.) for visual
consistency across the app. Nothing else on the page — cards, CTA, legend,
3D model — is touched.

Run from the phygo project root:  python3 apply_bodymap_hero_redesign.py
Same anchor-based safety as the other patch scripts: aborts with nothing
written if the anchor isn't found exactly once.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BODY_MAP = ROOT / "app" / "dashboard" / "body-map" / "page.tsx"

OLD_HERO = """          <motion.div
            initial="hidden"
            animate="show"
            custom={0}
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-xs font-semibold tracking-wide text-ink/75 dark:text-white/75 shadow-soft mb-5"
          >
            <span className="h-2 w-2 rounded-full bg-emerald animate-pulse" />
            {calibrate ? bm.calibrationBadge : bm.badge}
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="show"
            custom={1}
            variants={fadeUp}
            className="relative font-display font-semibold tracking-[-0.03em] text-6xl sm:text-8xl leading-[1.02] sm:leading-none"
          >
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-electric via-[#6D8FFF] to-emerald bg-clip-text text-transparent blur-2xl opacity-50 select-none"
            >
              Anatomical Navigator
            </span>
            <span className="relative bg-gradient-to-r from-electric via-[#6D8FFF] to-emerald bg-clip-text text-transparent">
              Anatomical Navigator
            </span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="show"
            custom={2}
            variants={fadeUp}
            className="mt-5 text-ink/55 dark:text-white/55 text-lg max-w-xl mx-auto text-balance"
          >
            {bm.subtitle}
          </motion.p>"""

NEW_HERO = """          <motion.div
            initial="hidden"
            animate="show"
            custom={0}
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl text-xs font-semibold tracking-[0.15em] uppercase text-ink/75 dark:text-white/75 mb-4"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald animate-pulse" />
            {calibrate ? bm.calibrationBadge : bm.badge}
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="show"
            custom={1}
            variants={fadeUp}
            className="font-display font-semibold tracking-tight text-5xl sm:text-6xl"
          >
            <span className="bg-gradient-to-r from-electric via-[#6D8FFF] to-emerald bg-clip-text text-transparent">
              Anatomical Navigator
            </span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="show"
            custom={2}
            variants={fadeUp}
            className="mt-4 text-ink/55 dark:text-white/55 text-lg max-w-xl mx-auto text-balance"
          >
            {bm.subtitle}
          </motion.p>"""


def main():
    if not BODY_MAP.exists():
        print(f"ABORT: {BODY_MAP} not found. Run this script from the phygo project root.")
        sys.exit(1)

    text = BODY_MAP.read_text(encoding="utf-8")
    count = text.count(OLD_HERO)
    if count != 1:
        print(f"ABORT: hero anchor found {count} times (expected 1) in {BODY_MAP}. "
              f"The file may have changed since this script was written — no changes written.")
        sys.exit(1)

    text = text.replace(OLD_HERO, NEW_HERO, 1)
    BODY_MAP.write_text(text, encoding="utf-8")
    print(f"OK  [{BODY_MAP.name}] hero redesign applied.")
    print("\nDone. Restart `npm run dev` (stop it first, Ctrl+C) to pick up the changes.")


if __name__ == "__main__":
    main()
