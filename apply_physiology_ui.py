#!/usr/bin/env python3
"""
Applies the "Fisiologia" library section to Phygo's i18n dictionary and navbar.
Run from the phygo project root:  python3 apply_physiology_ui.py

Safety: every insertion is anchored on an EXACT, currently-unique snippet of
text. If an anchor isn't found exactly once (e.g. the file has since changed),
the script aborts with a clear error and touches NOTHING in that file — it
never falls back to guessing a line number.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
UI_STRINGS = ROOT / "lib" / "i18n" / "uiStrings.ts"
NAVBAR = ROOT / "components" / "Navbar.tsx"


def apply_replacements(path: Path, replacements: list[tuple[str, str, str]]):
    """replacements: list of (label, anchor, insertion_after_anchor)"""
    text = path.read_text(encoding="utf-8")
    for label, anchor, insertion in replacements:
        count = text.count(anchor)
        if count != 1:
            print(f"ABORT [{path.name}] anchor for '{label}' found {count} times (expected 1). "
                  f"No changes were written to {path}. Anchor was:\n---\n{anchor}\n---")
            sys.exit(1)
    for label, anchor, insertion in replacements:
        text = text.replace(anchor, anchor + insertion, 1)
    path.write_text(text, encoding="utf-8")
    print(f"OK  [{path.name}] applied {len(replacements)} insertion(s).")


# ---------------------------------------------------------------------------
# 1) uiStrings.ts — type interface additions
# ---------------------------------------------------------------------------

TYPE_LIBRARYLINKS_ANCHOR = "    urinary: { label: string; description: string };"
TYPE_LIBRARYLINKS_INSERT = "\n    physiology: { label: string; description: string };"

TYPE_URINARY_BLOCK_ANCHOR = """  urinary: {
    atlasBadge: string;
    heading: string;
    subTabs: { anatomy: string; conditions: string; assessment: string; rehab: string };
    anatomyHeading: string;
    anatomyHint: string;
    anatomyIntro: string;
    conditionsHeading: string;
    conditionsHint: string;
    assessmentHeading: string;
    assessmentHint: string;
    rehabHeading: string;
    rehabHint: string;
    loading: string;
    errorLoadingStructures: string;
    errorLoadingConditions: string;
    errorLoadingTests: string;
    errorLoadingRehab: string;
    procedureLabel: string;
    interpretationLabel: string;
    protocolLabel: string;
    categoryLabels: Record<'organ' | 'physiology', string>;
    testCategoryLabels: Record<'imaging' | 'metabolic' | 'renal_function' | 'urinalysis', string>;
    rehabCategoryLabels: Record<'renal_training' | 'sports_nephrology', string>;
  };"""

PHYSIOLOGY_CATEGORY_KEYS = (
    "'contraction_mechanics' | 'fiber_types' | 'mechanics' | 'motor_control' | "
    "'exercise_adaptation' | 'neuromuscular' | 'smooth_cardiac' | 'cellular_basics' | "
    "'reflexes' | 'sensory' | 'plasticity' | 'autonomic'"
)

TYPE_PHYSIOLOGY_BLOCK_INSERT = f"""
  physiology: {{
    atlasBadge: string;
    heading: string;
    systemTabs: {{ muscular: string; neurological: string }};
    sectionHint: string;
    loading: string;
    errorLoading: string;
    clinicalRelevanceLabel: string;
    categoryLabels: Record<{PHYSIOLOGY_CATEGORY_KEYS}, string>;
  }};"""

# Also add the small cross-link pair used on Body Map / Brain Map, right
# after the libraryLinks type block closes.
TYPE_WORLDLINKS_ANCHOR = "  worldLinks: {"
TYPE_PHYSIOLOGY_CROSSLINK_INSERT = """  physiologyCrossLink: { question: string; cta: string };
"""


def build_content_block(lang_marker_anchor: str, physiology_link: dict, physiology_ui: dict, crosslink: dict):
    link_insert = f"\n      physiology: {{ label: '{physiology_link['label']}', description: '{physiology_link['description']}' }},"

    cats = physiology_ui["categoryLabels"]
    cat_lines = "\n".join(f"        {k}: '{v}'," for k, v in cats.items())

    ui_block_insert = f"""
    physiology: {{
      atlasBadge: '{physiology_ui['atlasBadge']}',
      heading: '{physiology_ui['heading']}',
      systemTabs: {{ muscular: '{physiology_ui['systemTabs']['muscular']}', neurological: '{physiology_ui['systemTabs']['neurological']}' }},
      sectionHint: '{physiology_ui['sectionHint']}',
      loading: '{physiology_ui['loading']}',
      errorLoading: '{physiology_ui['errorLoading']}',
      clinicalRelevanceLabel: '{physiology_ui['clinicalRelevanceLabel']}',
      categoryLabels: {{
{cat_lines}
      }},
    }},"""

    crosslink_insert = f"\n    physiologyCrossLink: {{ question: '{crosslink['question']}', cta: '{crosslink['cta']}' }},"

    return link_insert, ui_block_insert, crosslink_insert


IT_LINK = {"label": "Fisiologia", "description": "Meccanismi muscolari e neurologici di base"}
IT_UI = {
    "atlasBadge": "Atlante Fisiologia",
    "heading": "Fisiologia di Base",
    "systemTabs": {"muscular": "Muscolare", "neurological": "Neurologico"},
    "sectionHint": "I meccanismi fisiologici alla base del movimento e del sistema nervoso — non l\\'anatomia di una zona specifica, ma come funzionano davvero i tessuti e i circuiti che la sostengono, con la rilevanza clinica per la pratica fisioterapica.",
    "loading": "Caricamento...",
    "errorLoading": "Impossibile caricare i contenuti di fisiologia.",
    "clinicalRelevanceLabel": "Rilevanza Clinica",
    "categoryLabels": {
        "contraction_mechanics": "Meccanismi della Contrazione",
        "fiber_types": "Tipi di Fibre",
        "mechanics": "Meccanica Muscolare",
        "motor_control": "Controllo Motorio",
        "exercise_adaptation": "Adattamento all\\'Esercizio",
        "neuromuscular": "Giunzione Neuromuscolare",
        "smooth_cardiac": "Muscolo Liscio e Cardiaco",
        "cellular_basics": "Fisiologia Cellulare",
        "reflexes": "Riflessi",
        "sensory": "Sistemi Sensoriali",
        "plasticity": "Plasticità e Apprendimento",
        "autonomic": "Sistema Nervoso Autonomo",
    },
}
IT_CROSSLINK = {"question": "Vuoi capire come funziona?", "cta": "Vai a Fisiologia"}

EN_LINK = {"label": "Physiology", "description": "Foundational muscular & neurological mechanisms"}
EN_UI = {
    "atlasBadge": "Physiology Atlas",
    "heading": "Foundational Physiology",
    "systemTabs": {"muscular": "Muscular", "neurological": "Neurological"},
    "sectionHint": "The physiological mechanisms behind movement and the nervous system — not the anatomy of a single zone, but how the underlying tissues and circuits actually work, with clinical relevance for physiotherapy practice.",
    "loading": "Loading...",
    "errorLoading": "Unable to load physiology content.",
    "clinicalRelevanceLabel": "Clinical Relevance",
    "categoryLabels": {
        "contraction_mechanics": "Contraction Mechanisms",
        "fiber_types": "Fiber Types",
        "mechanics": "Muscle Mechanics",
        "motor_control": "Motor Control",
        "exercise_adaptation": "Exercise Adaptation",
        "neuromuscular": "Neuromuscular Junction",
        "smooth_cardiac": "Smooth & Cardiac Muscle",
        "cellular_basics": "Cellular Physiology",
        "reflexes": "Reflexes",
        "sensory": "Sensory Systems",
        "plasticity": "Plasticity & Learning",
        "autonomic": "Autonomic Nervous System",
    },
}
EN_CROSSLINK = {"question": "Want to understand how it works?", "cta": "Go to Physiology"}

ES_LINK = {"label": "Fisiología", "description": "Mecanismos musculares y neurológicos fundamentales"}
ES_UI = {
    "atlasBadge": "Atlas de Fisiología",
    "heading": "Fisiología Fundamental",
    "systemTabs": {"muscular": "Muscular", "neurological": "Neurológico"},
    "sectionHint": "Los mecanismos fisiológicos que sustentan el movimiento y el sistema nervioso — no la anatomía de una zona específica, sino cómo funcionan realmente los tejidos y circuitos subyacentes, con su relevancia clínica para la práctica fisioterapéutica.",
    "loading": "Cargando...",
    "errorLoading": "No se pudo cargar el contenido de fisiología.",
    "clinicalRelevanceLabel": "Relevancia Clínica",
    "categoryLabels": {
        "contraction_mechanics": "Mecanismos de Contracción",
        "fiber_types": "Tipos de Fibras",
        "mechanics": "Mecánica Muscular",
        "motor_control": "Control Motor",
        "exercise_adaptation": "Adaptación al Ejercicio",
        "neuromuscular": "Unión Neuromuscular",
        "smooth_cardiac": "Músculo Liso y Cardíaco",
        "cellular_basics": "Fisiología Celular",
        "reflexes": "Reflejos",
        "sensory": "Sistemas Sensoriales",
        "plasticity": "Plasticidad y Aprendizaje",
        "autonomic": "Sistema Nervioso Autónomo",
    },
}
ES_CROSSLINK = {"question": "¿Quieres entender cómo funciona?", "cta": "Ir a Fisiología"}

FR_LINK = {"label": "Physiologie", "description": "Mécanismes musculaires et neurologiques fondamentaux"}
FR_UI = {
    "atlasBadge": "Atlas de Physiologie",
    "heading": "Physiologie Fondamentale",
    "systemTabs": {"muscular": "Musculaire", "neurological": "Neurologique"},
    "sectionHint": "Les mécanismes physiologiques à la base du mouvement et du système nerveux — non l\\'anatomie d\\'une zone spécifique, mais le fonctionnement réel des tissus et circuits sous-jacents, avec leur pertinence clinique pour la pratique en kinésithérapie.",
    "loading": "Chargement...",
    "errorLoading": "Impossible de charger le contenu de physiologie.",
    "clinicalRelevanceLabel": "Pertinence Clinique",
    "categoryLabels": {
        "contraction_mechanics": "Mécanismes de la Contraction",
        "fiber_types": "Types de Fibres",
        "mechanics": "Mécanique Musculaire",
        "motor_control": "Contrôle Moteur",
        "exercise_adaptation": "Adaptation à l\\'Exercice",
        "neuromuscular": "Jonction Neuromusculaire",
        "smooth_cardiac": "Muscle Lisse et Cardiaque",
        "cellular_basics": "Physiologie Cellulaire",
        "reflexes": "Réflexes",
        "sensory": "Systèmes Sensoriels",
        "plasticity": "Plasticité et Apprentissage",
        "autonomic": "Système Nerveux Autonome",
    },
}
FR_CROSSLINK = {"question": "Vous voulez comprendre comment ça marche ?", "cta": "Aller à Physiologie"}


# Anchors for each language's libraryLinks.neurology line and urinary ui block
# (both unique per-language because of the localized text that follows/precedes).
IT_LIBLINKS_ANCHOR = "      neurology: { label: 'Neurologia', description: 'Encefalo, nervi e vie nervose' },"
EN_LIBLINKS_ANCHOR = "      neurology: { label: 'Neurology', description: 'Brain, nerves & neural pathways' },"
ES_LIBLINKS_ANCHOR = "      neurology: { label: 'Neurología', description: 'Cerebro, nervios y vías nerviosas' },"
FR_LIBLINKS_ANCHOR = "      neurology: { label: 'Neurologie', description: 'Cerveau, nerfs et voies nerveuses' },"

IT_URINARY_UI_ANCHOR_END = """      rehabCategoryLabels: {
        renal_training: 'Allenamento in Nefropatia',
        sports_nephrology: 'Nefrologia dello Sport',
      },
    },"""
EN_URINARY_UI_ANCHOR_END = """      rehabCategoryLabels: {
        renal_training: 'Renal Disease Training',
        sports_nephrology: 'Sports Nephrology',
      },
    },"""
ES_URINARY_UI_ANCHOR_END = """      rehabCategoryLabels: {
        renal_training: 'Entrenamiento en Nefropatía',
        sports_nephrology: 'Nefrología del Deporte',
      },
    },"""
FR_URINARY_UI_ANCHOR_END = """      rehabCategoryLabels: {
        renal_training: 'Entraînement en Néphropathie',
        sports_nephrology: 'Néphrologie du Sport',
      },
    },"""

# Anchor for the crosslink insertion: the CLOSE of libraryLinks (clinicalTools
# line + the closing brace), so physiologyCrossLink lands as a SIBLING key of
# libraryLinks/worldLinks, not nested inside libraryLinks.
IT_LIBLINKS_CLOSE_ANCHOR = "      clinicalTools: { label: 'Strumenti Clinici', description: 'Scale di valutazione e test' },\n    },"
EN_LIBLINKS_CLOSE_ANCHOR = "      clinicalTools: { label: 'Clinical Tools', description: 'Assessment scales & tests' },\n    },"
ES_LIBLINKS_CLOSE_ANCHOR = "      clinicalTools: { label: 'Herramientas Clínicas', description: 'Escalas de valoración y pruebas' },\n    },"
FR_LIBLINKS_CLOSE_ANCHOR = '      clinicalTools: { label: \'Outils Cliniques\', description: "Échelles d\'évaluation et tests" },\n    },'


def main():
    if not UI_STRINGS.exists():
        print(f"ABORT: {UI_STRINGS} not found. Run this script from the phygo project root.")
        sys.exit(1)
    if not NAVBAR.exists():
        print(f"ABORT: {NAVBAR} not found. Run this script from the phygo project root.")
        sys.exit(1)

    # The crosslink type field is inserted right BEFORE `worldLinks: {` (an
    # "insert before anchor" — done as its own text pass since
    # apply_replacements only inserts after an anchor).
    text = UI_STRINGS.read_text(encoding="utf-8")
    before_worldlinks_anchor = "\n" + TYPE_WORLDLINKS_ANCHOR
    if text.count(before_worldlinks_anchor) != 1:
        print("ABORT: worldLinks type anchor not unique/found. No changes written.")
        sys.exit(1)
    text = text.replace(before_worldlinks_anchor,
                         "\n" + TYPE_PHYSIOLOGY_CROSSLINK_INSERT + TYPE_WORLDLINKS_ANCHOR, 1)
    UI_STRINGS.write_text(text, encoding="utf-8")

    per_lang = [
        (IT_LIBLINKS_ANCHOR, IT_LIBLINKS_CLOSE_ANCHOR, IT_URINARY_UI_ANCHOR_END, IT_LINK, IT_UI, IT_CROSSLINK),
        (EN_LIBLINKS_ANCHOR, EN_LIBLINKS_CLOSE_ANCHOR, EN_URINARY_UI_ANCHOR_END, EN_LINK, EN_UI, EN_CROSSLINK),
        (ES_LIBLINKS_ANCHOR, ES_LIBLINKS_CLOSE_ANCHOR, ES_URINARY_UI_ANCHOR_END, ES_LINK, ES_UI, ES_CROSSLINK),
        (FR_LIBLINKS_ANCHOR, FR_LIBLINKS_CLOSE_ANCHOR, FR_URINARY_UI_ANCHOR_END, FR_LINK, FR_UI, FR_CROSSLINK),
    ]

    ordered = [
        ("libraryLinks type field", TYPE_LIBRARYLINKS_ANCHOR, TYPE_LIBRARYLINKS_INSERT),
        ("physiology type block", TYPE_URINARY_BLOCK_ANCHOR, TYPE_PHYSIOLOGY_BLOCK_INSERT),
    ]
    for liblinks_anchor, liblinks_close_anchor, urinary_ui_anchor, link, ui, crosslink in per_lang:
        link_insert, ui_insert, crosslink_insert = build_content_block(liblinks_anchor, link, ui, crosslink)
        ordered.append((f"libraryLinks content ({link['label']})", liblinks_anchor, link_insert))
        ordered.append((f"ui block ({link['label']})", urinary_ui_anchor, ui_insert))
        ordered.append((f"crosslink content ({link['label']})", liblinks_close_anchor, crosslink_insert))

    apply_replacements(UI_STRINGS, ordered)

    # ------------------------------------------------------------------
    # 2) Navbar.tsx — add the Library dropdown entry
    # ------------------------------------------------------------------
    navbar_anchor = '  { key: "neurology", href: "/dashboard/brain-map" },'
    navbar_insert = '\n  { key: "physiology", href: "/dashboard/physiology" },'
    apply_replacements(NAVBAR, [("Library dropdown entry", navbar_anchor, navbar_insert)])

    print("\nDone. Restart `npm run dev` (stop it first, Ctrl+C) to pick up the changes.")


if __name__ == "__main__":
    main()
