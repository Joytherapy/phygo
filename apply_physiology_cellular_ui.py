#!/usr/bin/env python3
"""
Extends the "Fisiologia" section with a third tab, "Cellulare" (basic cellular
mechanisms: membrane transport + chemical messenger signal transduction) —
content that underlies both the muscular and neurological systems and doesn't
belong under either one specifically.

Patches lib/i18n/uiStrings.ts only:
  1. The `physiology` type block: adds `cellular: string` to systemTabs, and
     'membrane_transport' | 'chemical_messengers' to the categoryLabels union.
  2. Each language's systemTabs value object: adds the `cellular` label.
  3. Each language's categoryLabels object: adds membrane_transport and
     chemical_messengers translations.

Run from the phygo project root:  python3 apply_physiology_cellular_ui.py
Same anchor-based safety as the other patch scripts: aborts with nothing
written if an anchor isn't found exactly once, or isn't found at all.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
UI_STRINGS = ROOT / "lib" / "i18n" / "uiStrings.ts"


def apply_insertions(text: str, replacements: list[tuple[str, str, str]]) -> str:
    """replacements: list of (label, anchor, insertion_after_anchor)"""
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
    """replacements: list of (label, old_exact_text, new_exact_text)"""
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

    # ------------------------------------------------------------------
    # 1) Type block — two full-text replacements.
    # ------------------------------------------------------------------
    type_replacements = [
        (
            "systemTabs type field",
            "    systemTabs: { muscular: string; neurological: string };",
            "    systemTabs: { muscular: string; neurological: string; cellular: string };",
        ),
        (
            "categoryLabels type union",
            "    categoryLabels: Record<'contraction_mechanics' | 'fiber_types' | 'mechanics' | 'motor_control' | 'exercise_adaptation' | 'neuromuscular' | 'smooth_cardiac' | 'cellular_basics' | 'reflexes' | 'sensory' | 'plasticity' | 'autonomic', string>;",
            "    categoryLabels: Record<'contraction_mechanics' | 'fiber_types' | 'mechanics' | 'motor_control' | 'exercise_adaptation' | 'neuromuscular' | 'smooth_cardiac' | 'cellular_basics' | 'reflexes' | 'sensory' | 'plasticity' | 'autonomic' | 'membrane_transport' | 'chemical_messengers', string>;",
        ),
    ]
    text = apply_full_replacements(text, type_replacements)

    # ------------------------------------------------------------------
    # 2) Per-language systemTabs value — full-text replacement.
    # ------------------------------------------------------------------
    systemtabs_replacements = [
        (
            "IT systemTabs",
            "      systemTabs: { muscular: 'Muscolare', neurological: 'Neurologico' },",
            "      systemTabs: { muscular: 'Muscolare', neurological: 'Neurologico', cellular: 'Cellulare' },",
        ),
        (
            "EN systemTabs",
            "      systemTabs: { muscular: 'Muscular', neurological: 'Neurological' },",
            "      systemTabs: { muscular: 'Muscular', neurological: 'Neurological', cellular: 'Cellular' },",
        ),
        (
            "ES systemTabs",
            "      systemTabs: { muscular: 'Muscular', neurological: 'Neurológico' },",
            "      systemTabs: { muscular: 'Muscular', neurological: 'Neurológico', cellular: 'Celular' },",
        ),
        (
            "FR systemTabs",
            "      systemTabs: { muscular: 'Musculaire', neurological: 'Neurologique' },",
            "      systemTabs: { muscular: 'Musculaire', neurological: 'Neurologique', cellular: 'Cellulaire' },",
        ),
    ]
    text = apply_full_replacements(text, systemtabs_replacements)

    # ------------------------------------------------------------------
    # 3) Per-language categoryLabels — insert two new lines right after the
    #    existing `autonomic:` line (the last category in each language's
    #    physiology.categoryLabels object).
    # ------------------------------------------------------------------
    category_insertions = [
        (
            "IT categoryLabels",
            "        autonomic: 'Sistema Nervoso Autonomo',",
            "\n        membrane_transport: 'Trasporto di Membrana',\n        chemical_messengers: 'Messaggeri Chimici',",
        ),
        (
            "EN categoryLabels",
            "        autonomic: 'Autonomic Nervous System',",
            "\n        membrane_transport: 'Membrane Transport',\n        chemical_messengers: 'Chemical Messengers',",
        ),
        (
            "ES categoryLabels",
            "        autonomic: 'Sistema Nervioso Autónomo',",
            "\n        membrane_transport: 'Transporte de Membrana',\n        chemical_messengers: 'Mensajeros Químicos',",
        ),
        (
            "FR categoryLabels",
            "        autonomic: 'Système Nerveux Autonome',",
            "\n        membrane_transport: 'Transport Membranaire',\n        chemical_messengers: 'Messagers Chimiques',",
        ),
    ]
    text = apply_insertions(text, category_insertions)

    UI_STRINGS.write_text(text, encoding="utf-8")
    print(f"OK  [{UI_STRINGS.name}] cellular tab + translations applied.")
    print("\nDone. Restart `npm run dev` (stop it first, Ctrl+C) to pick up the changes.")


if __name__ == "__main__":
    main()
