#!/usr/bin/env python3
"""
Adds two shared, reusable i18n keys used by the new in-page search box
that is being rolled out to Library sections (starting with Physiology and
Sports Medicine, more sections to follow):
  - librarySearchPlaceholder
  - librarySearchNoResults

These are added ONCE as top-level keys (not nested per section) so future
sections can reuse them without any further uiStrings.ts patch.

Run from the phygo project root:  python3 apply_library_search.py

Safety: every insertion/replacement is anchored on an EXACT, currently-unique
snippet of text (verified against this project's actual current file via
grep before this script was written). If an anchor isn't found exactly
once, the script aborts with a clear error and touches NOTHING in that file.
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


# (label, anchor = exact end of the sportsMedicine categoryLabels value block
#  for that language, insertion = the two new shared top-level keys)
LANG_INSERTIONS = {
    "IT": (
        "        rehabilitation_programming: 'Riabilitazione e Ricondizionamento',\n      },\n    },",
        "\n    librarySearchPlaceholder: 'Cerca in questa sezione...',\n    librarySearchNoResults: 'Nessun risultato per la tua ricerca.',",
    ),
    "EN": (
        "        rehabilitation_programming: 'Rehabilitation Programming',\n      },\n    },",
        "\n    librarySearchPlaceholder: 'Search this section...',\n    librarySearchNoResults: 'No results found for your search.',",
    ),
    "ES": (
        "        rehabilitation_programming: 'Programación de la Rehabilitación',\n      },\n    },",
        "\n    librarySearchPlaceholder: 'Buscar en esta sección...',\n    librarySearchNoResults: 'No se han encontrado resultados para tu búsqueda.',",
    ),
    "FR": (
        "        rehabilitation_programming: 'Programmation de la Rééducation',\n      },\n    },",
        "\n    librarySearchPlaceholder: 'Rechercher dans cette section...',\n    librarySearchNoResults: 'Aucun résultat trouvé pour votre recherche.',",
    ),
}


def main():
    if not UI_STRINGS.exists():
        print(f"ABORT: {UI_STRINGS} not found. Run this script from the phygo project root.")
        sys.exit(1)

    text = UI_STRINGS.read_text(encoding="utf-8")

    # 1) Type interface — add the two new shared keys right before `gastrointestinal:`.
    text = apply_full_replacements(text, [
        (
            "librarySearch type keys",
            "  };\n  gastrointestinal: {",
            "  };\n  librarySearchPlaceholder: string;\n  librarySearchNoResults: string;\n  gastrointestinal: {",
        ),
    ])

    # 2) Per-language values — add right after the sportsMedicine block closes.
    insertions = [
        (f"{lang} librarySearch values", anchor, insertion)
        for lang, (anchor, insertion) in LANG_INSERTIONS.items()
    ]
    text = apply_insertions(text, insertions)

    UI_STRINGS.write_text(text, encoding="utf-8")
    print(f"OK  [{UI_STRINGS.name}] librarySearchPlaceholder / librarySearchNoResults applied (4 languages).")
    print("\nDone. Restart `npm run dev` (stop it first, Ctrl+C) to pick up the changes.")


if __name__ == "__main__":
    main()
