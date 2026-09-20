#!/usr/bin/env python3
"""
Adds the new "rehabilitation_programming" category to the Sports Medicine
section's i18n dictionary (lib/i18n/uiStrings.ts).

This assumes install_sports_medicine.sh has ALREADY been run successfully
(the sportsMedicine type block and per-language content must already exist).

Run from the phygo project root:  python3 apply_sports_medicine_rehab_expansion.py

Safety: every insertion/replacement is anchored on an EXACT, currently-unique
snippet of text. If an anchor isn't found exactly once, the script aborts
with a clear error and touches NOTHING in that file.
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


# Per-language: (anchor line = the existing on_field_emergency_rtp entry,
# unique because of its translated value; insertion = the new key + value).
LANG_INSERTIONS = {
    "IT": (
        "        on_field_emergency_rtp: 'Trauma sul Campo e Ritorno allo Sport',",
        "\n        rehabilitation_programming: 'Riabilitazione e Ricondizionamento',",
    ),
    "EN": (
        "        on_field_emergency_rtp: 'On-Field Emergency & Return to Play',",
        "\n        rehabilitation_programming: 'Rehabilitation Programming',",
    ),
    "ES": (
        "        on_field_emergency_rtp: 'Emergencia en Campo y Retorno al Deporte',",
        "\n        rehabilitation_programming: 'Programación de la Rehabilitación',",
    ),
    "FR": (
        "        on_field_emergency_rtp: 'Urgence sur le Terrain et Retour au Sport',",
        "\n        rehabilitation_programming: 'Programmation de la Rééducation',",
    ),
}


def main():
    if not UI_STRINGS.exists():
        print(f"ABORT: {UI_STRINGS} not found. Run this script from the phygo project root.")
        sys.exit(1)

    text = UI_STRINGS.read_text(encoding="utf-8")

    # 1) categoryLabels type union — add 'rehabilitation_programming'.
    text = apply_full_replacements(text, [
        (
            "sportsMedicine categoryLabels type union",
            "categoryLabels: Record<'injury_classification' | 'tissue_healing' | 'clinical_reasoning' | 'therapeutic_modalities' | 'on_field_emergency_rtp', string>;",
            "categoryLabels: Record<'injury_classification' | 'tissue_healing' | 'clinical_reasoning' | 'therapeutic_modalities' | 'on_field_emergency_rtp' | 'rehabilitation_programming', string>;",
        ),
    ])

    # 2) Per-language categoryLabels value — add the rehabilitation_programming entry.
    insertions = [
        (f"{lang} rehabilitation_programming label", anchor, insertion)
        for lang, (anchor, insertion) in LANG_INSERTIONS.items()
    ]
    text = apply_insertions(text, insertions)

    UI_STRINGS.write_text(text, encoding="utf-8")
    print(f"OK  [{UI_STRINGS.name}] rehabilitation_programming category label applied (4 languages).")
    print("\nDone. Restart `npm run dev` (stop it first, Ctrl+C) to pick up the changes.")


if __name__ == "__main__":
    main()
