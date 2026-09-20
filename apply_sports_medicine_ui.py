#!/usr/bin/env python3
"""
Applies the new "Medicina dello Sport" / "Sports Medicine" Library section to
Phygo's i18n dictionary and navbar.

Run from the phygo project root:  python3 apply_sports_medicine_ui.py

Safety: every insertion/replacement is anchored on an EXACT, currently-unique
snippet of text. If an anchor isn't found exactly once, the script aborts
with a clear error and touches NOTHING in that file.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
UI_STRINGS = ROOT / "lib" / "i18n" / "uiStrings.ts"
NAVBAR = ROOT / "components" / "Navbar.tsx"


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


CATEGORY_KEYS = (
    "'injury_classification' | 'tissue_healing' | 'clinical_reasoning' | "
    "'therapeutic_modalities' | 'on_field_emergency_rtp'"
)

TYPE_SPORTS_MEDICINE_BLOCK = f"""  sportsMedicine: {{
    atlasBadge: string;
    heading: string;
    sectionHint: string;
    loading: string;
    errorLoading: string;
    clinicalRelevanceLabel: string;
    categoryLabels: Record<{CATEGORY_KEYS}, string>;
  }};
"""

LANGS = {
    "IT": {
        "liblinks_anchor": "      physiology: { label: 'Fisiologia', description: 'Meccanismi muscolari e neurologici di base' },",
        "liblinks_label": "Medicina dello Sport",
        "liblinks_desc": "Scienza della lesione sportiva e ritorno allo sport",
        "value_close_anchor": "        energy_metabolism: 'Metabolismo Energetico',\n      },\n    },",
        "atlasBadge": "Atlante Medicina dello Sport",
        "heading": "Medicina dello Sport",
        "sectionHint": "La scienza di base della lesione sportiva e del recupero — classificazione, guarigione tissutale, ragionamento clinico e modalità terapeutiche, con le linee guida più aggiornate per un ritorno allo sport sicuro ed efficace.",
        "loading": "Caricamento...",
        "errorLoading": "Impossibile caricare i contenuti di medicina dello sport.",
        "clinicalRelevanceLabel": "Rilevanza Clinica",
        "categoryLabels": {
            "injury_classification": "Classificazione delle Lesioni",
            "tissue_healing": "Guarigione Tissutale",
            "clinical_reasoning": "Ragionamento Clinico",
            "therapeutic_modalities": "Modalità Terapeutiche",
            "on_field_emergency_rtp": "Trauma sul Campo e Ritorno allo Sport",
        },
    },
    "EN": {
        "liblinks_anchor": "      physiology: { label: 'Physiology', description: 'Foundational muscular & neurological mechanisms' },",
        "liblinks_label": "Sports Medicine",
        "liblinks_desc": "Sports injury science and return-to-play",
        "value_close_anchor": "        energy_metabolism: 'Energy Metabolism',\n      },\n    },",
        "atlasBadge": "Sports Medicine Atlas",
        "heading": "Sports Medicine",
        "sectionHint": "The foundational science of sports injury and recovery — classification, tissue healing, clinical reasoning and therapeutic modalities, with the latest guidelines for a safe and effective return to sport.",
        "loading": "Loading...",
        "errorLoading": "Unable to load sports medicine content.",
        "clinicalRelevanceLabel": "Clinical Relevance",
        "categoryLabels": {
            "injury_classification": "Injury Classification",
            "tissue_healing": "Tissue Healing",
            "clinical_reasoning": "Clinical Reasoning",
            "therapeutic_modalities": "Therapeutic Modalities",
            "on_field_emergency_rtp": "On-Field Emergency & Return to Play",
        },
    },
    "ES": {
        "liblinks_anchor": "      physiology: { label: 'Fisiología', description: 'Mecanismos musculares y neurológicos fundamentales' },",
        "liblinks_label": "Medicina Deportiva",
        "liblinks_desc": "Ciencia de la lesión deportiva y retorno al deporte",
        "value_close_anchor": "        energy_metabolism: 'Metabolismo Energético',\n      },\n    },",
        "atlasBadge": "Atlas de Medicina Deportiva",
        "heading": "Medicina Deportiva",
        "sectionHint": "La ciencia fundamental de la lesión deportiva y la recuperación — clasificación, curación tisular, razonamiento clínico y modalidades terapéuticas, con las guías más actuales para un retorno al deporte seguro y eficaz.",
        "loading": "Cargando...",
        "errorLoading": "No se pudo cargar el contenido de medicina deportiva.",
        "clinicalRelevanceLabel": "Relevancia Clínica",
        "categoryLabels": {
            "injury_classification": "Clasificación de Lesiones",
            "tissue_healing": "Curación Tisular",
            "clinical_reasoning": "Razonamiento Clínico",
            "therapeutic_modalities": "Modalidades Terapéuticas",
            "on_field_emergency_rtp": "Emergencia en Campo y Retorno al Deporte",
        },
    },
    "FR": {
        "liblinks_anchor": "      physiology: { label: 'Physiologie', description: 'Mécanismes musculaires et neurologiques fondamentaux' },",
        "liblinks_label": "Médecine du Sport",
        "liblinks_desc": "Science de la blessure sportive et retour au sport",
        "value_close_anchor": "        energy_metabolism: 'Métabolisme Énergétique',\n      },\n    },",
        "atlasBadge": "Atlas de Médecine du Sport",
        "heading": "Médecine du Sport",
        "sectionHint": "La science fondamentale de la blessure sportive et de la récupération — classification, cicatrisation tissulaire, raisonnement clinique et modalités thérapeutiques, avec les directives les plus actuelles pour un retour au sport sûr et efficace.",
        "loading": "Chargement...",
        "errorLoading": "Impossible de charger le contenu de médecine du sport.",
        "clinicalRelevanceLabel": "Pertinence Clinique",
        "categoryLabels": {
            "injury_classification": "Classification des Blessures",
            "tissue_healing": "Cicatrisation Tissulaire",
            "clinical_reasoning": "Raisonnement Clinique",
            "therapeutic_modalities": "Modalités Thérapeutiques",
            "on_field_emergency_rtp": "Urgence sur le Terrain et Retour au Sport",
        },
    },
}


def build_value_block(cfg: dict) -> str:
    cats = cfg["categoryLabels"]
    cat_lines = "\n".join(f"        {k}: '{v}'," for k, v in cats.items())
    return f"""
    sportsMedicine: {{
      atlasBadge: '{cfg['atlasBadge']}',
      heading: '{cfg['heading']}',
      sectionHint: '{cfg['sectionHint']}',
      loading: '{cfg['loading']}',
      errorLoading: '{cfg['errorLoading']}',
      clinicalRelevanceLabel: '{cfg['clinicalRelevanceLabel']}',
      categoryLabels: {{
{cat_lines}
      }},
    }},"""


def main():
    if not UI_STRINGS.exists():
        print(f"ABORT: {UI_STRINGS} not found. Run this script from the phygo project root.")
        sys.exit(1)
    if not NAVBAR.exists():
        print(f"ABORT: {NAVBAR} not found. Run this script from the phygo project root.")
        sys.exit(1)

    text = UI_STRINGS.read_text(encoding="utf-8")

    # 1) libraryLinks type field — anchored on the physiology entry.
    text = apply_insertions(text, [
        (
            "libraryLinks type field",
            "    physiology: { label: string; description: string };",
            "\n    sportsMedicine: { label: string; description: string };",
        ),
    ])

    # 2) Top-level sportsMedicine type block — inserted right before the
    #    gastrointestinal type block (confirmed unique anchor via grep).
    text = apply_full_replacements(text, [
        (
            "sportsMedicine type block",
            "  };\n  gastrointestinal: {",
            "  };\n" + TYPE_SPORTS_MEDICINE_BLOCK + "  gastrointestinal: {",
        ),
    ])

    # 3) Per-language libraryLinks content + sportsMedicine value block.
    liblinks_insertions = []
    value_insertions = []
    for lang, cfg in LANGS.items():
        liblinks_insertions.append((
            f"{lang} libraryLinks content",
            cfg["liblinks_anchor"],
            f"\n      sportsMedicine: {{ label: '{cfg['liblinks_label']}', description: '{cfg['liblinks_desc']}' }},",
        ))
        value_insertions.append((
            f"{lang} sportsMedicine value block",
            cfg["value_close_anchor"],
            build_value_block(cfg),
        ))

    text = apply_insertions(text, liblinks_insertions)
    text = apply_insertions(text, value_insertions)

    UI_STRINGS.write_text(text, encoding="utf-8")
    print(f"OK  [{UI_STRINGS.name}] sports medicine section applied.")

    # ------------------------------------------------------------------
    # 4) Navbar.tsx — add the Library dropdown entry.
    # ------------------------------------------------------------------
    navbar_text = NAVBAR.read_text(encoding="utf-8")
    navbar_anchor = '  { key: "physiology", href: "/dashboard/physiology" },'
    navbar_insert = '\n  { key: "sportsMedicine", href: "/dashboard/sports-medicine" },'
    navbar_text = apply_insertions(navbar_text, [("Library dropdown entry", navbar_anchor, navbar_insert)])
    NAVBAR.write_text(navbar_text, encoding="utf-8")
    print(f"OK  [{NAVBAR.name}] applied 1 insertion(s).")

    print("\nDone. Restart `npm run dev` (stop it first, Ctrl+C) to pick up the changes.")


if __name__ == "__main__":
    main()
