// Labels for the public condition detail page (/library/condition/[id] and
// its /en, /es, /fr equivalents), shared by all four languages so every
// condition follows one template. Additive file, like agendaStrings.ts.

import type { AppLang } from '@/lib/i18n/uiStrings';
import { frenchTypography } from '@/lib/i18n/landingStrings';

export type ConditionSectionKey =
  | 'goals'
  | 'clinical_tests'
  | 'red_flags'
  | 'contraindications'
  | 'typical_exercises'
  | 'rehab_phases'
  | 'progression_criteria'
  | 'return_to_activity_criteria'
  | 'outcome_measures'
  | 'source';

export type EvidenceKey = 'strong' | 'high' | 'moderate_high' | 'moderate' | 'low_moderate' | 'low' | 'limited';

type ConditionPageDict = {
  backToLibrary: string;
  kicker: string;
  inThisGuide: string;
  notAvailable: string;
  sections: Record<ConditionSectionKey, string>;
  safety: string;
  phase: string;
  phaseFields: { start: string; duration: string; goals: string; exercises: string; progress: string };
  evidence: Record<EvidenceKey, string>;
  translating: string;
  machineTranslated: string;
  aiTranslated: string;
  shownInItalian: string;
  sourceLanguageNote: string;
  missingNote: string;
  ctaTitle: string;
  ctaText: string;
  ctaButton: string;
};

const en: ConditionPageDict = {
  backToLibrary: 'Clinical library',
  kicker: 'Clinical guide',
  inThisGuide: 'In this guide',
  notAvailable: 'Not yet available',
  sections: {
    goals: 'Rehabilitation goals',
    clinical_tests: 'Clinical tests',
    red_flags: 'Red flags',
    contraindications: 'Contraindications',
    typical_exercises: 'Typical exercises',
    rehab_phases: 'Rehabilitation phases',
    progression_criteria: 'Progression criteria',
    return_to_activity_criteria: 'Return-to-activity criteria',
    outcome_measures: 'Outcome measures',
    source: 'Sources',
  },
  safety: 'Safety screening',
  phase: 'Phase',
  phaseFields: {
    start: 'Criteria to start',
    duration: 'Typical duration',
    goals: 'Goals',
    exercises: 'Exercises',
    progress: 'Criteria to progress',
  },
  evidence: {
    strong: 'Strong evidence',
    high: 'High evidence',
    moderate_high: 'Moderate-to-high evidence',
    moderate: 'Moderate evidence',
    low_moderate: 'Low-to-moderate evidence',
    low: 'Low evidence',
    limited: 'Limited evidence',
  },
  translating:
    'The English translation of this page is being generated — the original Italian content is shown for now. Please come back later to read it in English.',
  aiTranslated: 'Machine-translated from Italian',
  shownInItalian: 'Shown in the original Italian — no translation available yet',
  machineTranslated:
    'Machine-translated from Italian — for clinical decisions, please verify red flags and contraindications against the original source.',
  sourceLanguageNote: 'Sources are cited as published.',
  missingNote:
    'Sections marked “not yet available” have no content for this condition yet. Nothing is filled in automatically — the library supports, and does not replace, clinical judgement.',
  ctaTitle: 'Are you a physiotherapist?',
  ctaText:
    'Use the clinical library next to your patients: AI-drafted SOAP notes you review, exercises with dose and phased rehab plans — free to start, no credit card required.',
  ctaButton: 'Start free',
};

const it: ConditionPageDict = {
  backToLibrary: 'Libreria clinica',
  kicker: 'Guida clinica',
  inThisGuide: 'In questa guida',
  notAvailable: 'Non ancora disponibile',
  sections: {
    goals: 'Obiettivi riabilitativi',
    clinical_tests: 'Test clinici',
    red_flags: 'Red flag',
    contraindications: 'Controindicazioni',
    typical_exercises: 'Esercizi tipici',
    rehab_phases: 'Fasi riabilitative',
    progression_criteria: 'Criteri di progressione',
    return_to_activity_criteria: 'Criteri di ritorno all’attività',
    outcome_measures: 'Misure di outcome',
    source: 'Fonti',
  },
  safety: 'Screening di sicurezza',
  phase: 'Fase',
  phaseFields: {
    start: 'Criteri di inizio',
    duration: 'Durata tipica',
    goals: 'Obiettivi',
    exercises: 'Esercizi',
    progress: 'Criteri per progredire',
  },
  evidence: {
    strong: 'Evidenza forte',
    high: 'Evidenza alta',
    moderate_high: 'Evidenza moderata-alta',
    moderate: 'Evidenza moderata',
    low_moderate: 'Evidenza bassa-moderata',
    low: 'Evidenza bassa',
    limited: 'Evidenza limitata',
  },
  translating: '',
  aiTranslated: '',
  shownInItalian: '',
  machineTranslated: '',
  sourceLanguageNote: 'Le fonti sono citate come pubblicate.',
  missingNote:
    'Le sezioni indicate come «non ancora disponibile» non hanno ancora contenuti per questa condizione. Nulla viene compilato automaticamente: la libreria supporta il giudizio clinico, non lo sostituisce.',
  ctaTitle: 'Sei un fisioterapista?',
  ctaText:
    'Usa la libreria clinica accanto ai tuoi pazienti: note SOAP preparate dall’AI che rivedi tu, esercizi con dosaggio e piani riabilitativi a fasi — gratis per iniziare, senza carta di credito.',
  ctaButton: 'Inizia gratis',
};

const es: ConditionPageDict = {
  backToLibrary: 'Biblioteca clínica',
  kicker: 'Guía clínica',
  inThisGuide: 'En esta guía',
  notAvailable: 'Aún no disponible',
  sections: {
    goals: 'Objetivos de rehabilitación',
    clinical_tests: 'Pruebas clínicas',
    red_flags: 'Banderas rojas',
    contraindications: 'Contraindicaciones',
    typical_exercises: 'Ejercicios habituales',
    rehab_phases: 'Fases de rehabilitación',
    progression_criteria: 'Criterios de progresión',
    return_to_activity_criteria: 'Criterios de vuelta a la actividad',
    outcome_measures: 'Medidas de resultado',
    source: 'Fuentes',
  },
  safety: 'Cribado de seguridad',
  phase: 'Fase',
  phaseFields: {
    start: 'Criterios de inicio',
    duration: 'Duración habitual',
    goals: 'Objetivos',
    exercises: 'Ejercicios',
    progress: 'Criterios para progresar',
  },
  evidence: {
    strong: 'Evidencia fuerte',
    high: 'Evidencia alta',
    moderate_high: 'Evidencia moderada-alta',
    moderate: 'Evidencia moderada',
    low_moderate: 'Evidencia baja-moderada',
    low: 'Evidencia baja',
    limited: 'Evidencia limitada',
  },
  translating:
    'Se está generando la traducción al español de esta página: por ahora se muestra el contenido original en italiano. Vuelve más tarde para leerla en español.',
  aiTranslated: 'Traducción automática del italiano',
  shownInItalian: 'Se muestra en el italiano original: aún no hay traducción disponible',
  machineTranslated:
    'Traducción automática del italiano: para decisiones clínicas, comprueba las banderas rojas y las contraindicaciones en la fuente original.',
  sourceLanguageNote: 'Las fuentes se citan tal como se publicaron.',
  missingNote:
    'Las secciones marcadas como «aún no disponible» todavía no tienen contenido para esta condición. Nada se rellena automáticamente: la biblioteca apoya el juicio clínico, no lo sustituye.',
  ctaTitle: '¿Eres fisioterapeuta?',
  ctaText:
    'Usa la biblioteca clínica junto a tus pacientes: notas SOAP preparadas por IA que tú revisas, ejercicios con dosis y planes de rehabilitación por fases — gratis para empezar, sin tarjeta de crédito.',
  ctaButton: 'Empieza gratis',
};

const fr: ConditionPageDict = {
  backToLibrary: 'Bibliothèque clinique',
  kicker: 'Guide clinique',
  inThisGuide: 'Dans ce guide',
  notAvailable: 'Pas encore disponible',
  sections: {
    goals: 'Objectifs de rééducation',
    clinical_tests: 'Tests cliniques',
    red_flags: 'Drapeaux rouges',
    contraindications: 'Contre-indications',
    typical_exercises: 'Exercices types',
    rehab_phases: 'Phases de rééducation',
    progression_criteria: 'Critères de progression',
    return_to_activity_criteria: 'Critères de reprise d’activité',
    outcome_measures: 'Mesures de résultat',
    source: 'Sources',
  },
  safety: 'Dépistage de sécurité',
  phase: 'Phase',
  phaseFields: {
    start: 'Critères de début',
    duration: 'Durée habituelle',
    goals: 'Objectifs',
    exercises: 'Exercices',
    progress: 'Critères de progression',
  },
  evidence: {
    strong: 'Niveau de preuve fort',
    high: 'Niveau de preuve élevé',
    moderate_high: 'Niveau de preuve modéré à élevé',
    moderate: 'Niveau de preuve modéré',
    low_moderate: 'Niveau de preuve faible à modéré',
    low: 'Niveau de preuve faible',
    limited: 'Niveau de preuve limité',
  },
  translating:
    'La traduction française de cette page est en cours de génération : le contenu original en italien est affiché pour le moment. Revenez plus tard pour la lire en français.',
  aiTranslated: 'Traduction automatique de l’italien',
  shownInItalian: 'Affiché dans l’italien original : pas encore de traduction disponible',
  machineTranslated:
    'Traduction automatique de l’italien : pour toute décision clinique, vérifiez les drapeaux rouges et les contre-indications dans la source originale.',
  sourceLanguageNote: 'Les sources sont citées telles que publiées.',
  missingNote:
    'Les rubriques indiquées « pas encore disponible » n’ont pas encore de contenu pour cette pathologie. Rien n’est complété automatiquement : la bibliothèque soutient le jugement clinique, elle ne le remplace pas.',
  ctaTitle: 'Vous êtes kinésithérapeute ?',
  ctaText:
    'Utilisez la bibliothèque clinique à côté de vos patients : notes SOAP préparées par l’IA que vous relisez, exercices dosés et plans de rééducation par phases — gratuit pour commencer, sans carte bancaire.',
  ctaButton: 'Commencer gratuitement',
};

export const CONDITION_PAGE_STRINGS: Record<AppLang, ConditionPageDict> = { en, it, es, fr: frenchTypography(fr) };

/**
 * knowledge_base.evidence_level is mostly a keyword (high / moderate / low /
 * strong / limited) but about 40 entries hold a sentence starting with the
 * level ("Moderata-Alta - …"). Map both to one label; unknown values return null.
 */
export function evidenceKey(raw: string | null | undefined): EvidenceKey | null {
  const v = (raw ?? '').trim().toLowerCase();
  if (!v) return null;
  if (/^(moderata-alta|moderate-high)/.test(v)) return 'moderate_high';
  if (/^(low-moderate|bassa-moderata)/.test(v)) return 'low_moderate';
  if (/^(strong|forte)/.test(v)) return 'strong';
  if (/^(high|alta)/.test(v)) return 'high';
  if (/^(moderate|moderata)/.test(v)) return 'moderate';
  if (/^(low|bassa)/.test(v)) return 'low';
  if (/^(limited|limitata)/.test(v)) return 'limited';
  return null;
}
