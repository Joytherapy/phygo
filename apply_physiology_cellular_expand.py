#!/usr/bin/env python3
"""
Expands the "Cellulare" tab of Fisiologia from 2 to 5 concepts by adding two
more categories: homeostasis (feedback control systems) and energy_metabolism
(cellular ATP production) — alongside the existing membrane_transport and
chemical_messengers.

Patches lib/i18n/uiStrings.ts only. Must be run AFTER apply_physiology_ui.py
and apply_physiology_cellular_ui.py have already been applied (it anchors on
text those scripts introduced).

Run from the phygo project root:  python3 apply_physiology_cellular_expand.py
Same anchor-based safety as the other patch scripts: aborts with nothing
written if an anchor isn't found exactly once.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
UI_STRINGS = ROOT / "lib" / "i18n" / "uiStrings.ts"


def apply_insertions(text: str, replacements: list[tuple[str, str, str]]) -> str:
    for label, anchor, insertion in replacements:
        count = text.count(anchor)
        if count != 1:
            print(f"ABORT: anchor for '{label}' found {count} times (expected 1). "
                  f"No changes were written. Anchor was:\n---\n{anchor}\n---")
            sys.exit(1)
    for label, anchor, insertion in replacements:
        text = text.replace(anchor, anchor + insertion, 1)
    return text


def apply_full_replacements(text: str, replacements: list[tuple[str, str, str]]) -> str:
    for label, old, new in replacements:
        count = text.count(old)
        if count != 1:
            print(f"ABORT: text for '{label}' found {count} times (expected 1). "
                  f"No changes were written. Old text was:\n---\n{old}\n---")
            sys.exit(1)
    for label, old, new in replacements:
        text = text.replace(old, new, 1)
    return text


def main():
    if not UI_STRINGS.exists():
        print(f"ABORT: {UI_STRINGS} not found. Run this script from the phygo project root.")
        sys.exit(1)

    text = UI_STRINGS.read_text(encoding="utf-8")

    # 1) Type union — full-text replacement.
    text = apply_full_replacements(text, [
        (
            "categoryLabels type union",
            "    categoryLabels: Record<'contraction_mechanics' | 'fiber_types' | 'mechanics' | 'motor_control' | 'exercise_adaptation' | 'neuromuscular' | 'smooth_cardiac' | 'cellular_basics' | 'reflexes' | 'sensory' | 'plasticity' | 'autonomic' | 'membrane_transport' | 'chemical_messengers', string>;",
            "    categoryLabels: Record<'contraction_mechanics' | 'fiber_types' | 'mechanics' | 'motor_control' | 'exercise_adaptation' | 'neuromuscular' | 'smooth_cardiac' | 'cellular_basics' | 'reflexes' | 'sensory' | 'plasticity' | 'autonomic' | 'membrane_transport' | 'chemical_messengers' | 'homeostasis' | 'energy_metabolism', string>;",
        ),
    ])

    # 2) Per-language categoryLabels — insert two new lines right after the
    #    existing `chemical_messengers:` line (the last category added by the
    #    previous cellular-tab patch, in each language).
    text = apply_insertions(text, [
        (
            "IT categoryLabels",
            "        chemical_messengers: 'Messaggeri Chimici',",
            "\n        homeostasis: 'Omeostasi e Controllo',\n        energy_metabolism: 'Metabolismo Energetico',",
        ),
        (
            "EN categoryLabels",
            "        chemical_messengers: 'Chemical Messengers',",
            "\n        homeostasis: 'Homeostasis & Control',\n        energy_metabolism: 'Energy Metabolism',",
        ),
        (
            "ES categoryLabels",
            "        chemical_messengers: 'Mensajeros Químicos',",
            "\n        homeostasis: 'Homeostasis y Control',\n        energy_metabolism: 'Metabolismo Energético',",
        ),
        (
            "FR categoryLabels",
            "        chemical_messengers: 'Messagers Chimiques',",
            "\n        homeostasis: 'Homéostasie et Contrôle',\n        energy_metabolism: 'Métabolisme Énergétique',",
        ),
    ])

    UI_STRINGS.write_text(text, encoding="utf-8")
    print(f"OK  [{UI_STRINGS.name}] homeostasis + energy_metabolism categories applied.")
    print("\nDone. Restart `npm run dev` (stop it first, Ctrl+C) to pick up the changes.")


if __name__ == "__main__":
    main()
