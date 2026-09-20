#!/usr/bin/env python3
"""
Adds a small "Vuoi capire come funziona? -> Fisiologia" link to the hero
section of Body Map and Brain Map, right below the subtitle and above the
3D model / view-toggle — doesn't touch the 3D model code at all.

Run from the phygo project root:  python3 apply_physiology_crosslinks.py
Same anchor-based safety as apply_physiology_ui.py: aborts with nothing
written if an anchor isn't found exactly once.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BODY_MAP = ROOT / "app" / "dashboard" / "body-map" / "page.tsx"
BRAIN_MAP = ROOT / "app" / "dashboard" / "brain-map" / "page.tsx"


def apply_replacements(path: Path, replacements: list[tuple[str, str, str]]):
    text = path.read_text(encoding="utf-8")
    for label, anchor, insertion in replacements:
        count = text.count(anchor)
        if count != 1:
            print(f"ABORT [{path.name}] anchor for '{label}' found {count} times (expected 1). "
                  f"No changes were written to {path}.")
            sys.exit(1)
    for label, anchor, insertion in replacements:
        text = text.replace(anchor, anchor + insertion, 1)
    path.write_text(text, encoding="utf-8")
    print(f"OK  [{path.name}] applied {len(replacements)} insertion(s).")


IMPORT_ANCHOR = "import { useRouter, useSearchParams } from 'next/navigation';"
IMPORT_INSERT = "\nimport Link from 'next/link';"

BODY_MAP_HERO_ANCHOR = """          <motion.p
            initial="hidden"
            animate="show"
            custom={2}
            variants={fadeUp}
            className="mt-5 text-ink/55 dark:text-white/55 text-lg max-w-xl mx-auto text-balance"
          >
            {bm.subtitle}
          </motion.p>
        </div>"""

BODY_MAP_BANNER_INSERT = """

        <div className="flex justify-center mb-10">
          <Link
            href="/dashboard/physiology?system=muscular"
            className="group inline-flex items-center gap-2 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl px-4 py-2 text-xs font-medium text-ink/60 dark:text-white/60 hover:text-ink dark:hover:text-white hover:border-emerald/40 transition-colors"
          >
            {ui.physiologyCrossLink.question}
            <span className="font-semibold" style={{ color: '#32D6A0' }}>
              {ui.physiologyCrossLink.cta} →
            </span>
          </Link>
        </div>"""

BRAIN_MAP_HERO_ANCHOR = """          <p className="text-sm sm:text-base text-ink/50 dark:text-white/40 max-w-lg mx-auto leading-relaxed">
            {ui.brainMap.subtitle}
          </p>
        </div>"""

BRAIN_MAP_BANNER_INSERT = """

        <div className="flex justify-center mb-8">
          <Link
            href="/dashboard/physiology?system=neurological"
            className="group inline-flex items-center gap-2 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl px-4 py-2 text-xs font-medium text-ink/60 dark:text-white/60 hover:text-ink dark:hover:text-white hover:border-[#4F7CFF]/40 transition-colors"
          >
            {ui.physiologyCrossLink.question}
            <span className="font-semibold" style={{ color: '#4F7CFF' }}>
              {ui.physiologyCrossLink.cta} →
            </span>
          </Link>
        </div>"""


def main():
    for p in (BODY_MAP, BRAIN_MAP):
        if not p.exists():
            print(f"ABORT: {p} not found. Run this script from the phygo project root.")
            sys.exit(1)

    # Body Map: needs the ui/bm object already in scope (it does: `const ui = useUiStrings();`).
    apply_replacements(BODY_MAP, [
        ("next/link import", IMPORT_ANCHOR, IMPORT_INSERT),
        ("cross-link banner", BODY_MAP_HERO_ANCHOR, BODY_MAP_BANNER_INSERT),
    ])

    apply_replacements(BRAIN_MAP, [
        ("next/link import", IMPORT_ANCHOR, IMPORT_INSERT),
        ("cross-link banner", BRAIN_MAP_HERO_ANCHOR, BRAIN_MAP_BANNER_INSERT),
    ])

    print("\nDone. Restart `npm run dev` (stop it first, Ctrl+C) to pick up the changes.")


if __name__ == "__main__":
    main()
