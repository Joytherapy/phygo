// Real PHYGO screens shown on the landing page (public/landing/*.webp).
// Captured from the built app running against the test stand-in for
// Supabase, with synthetic demo accounts (a demo patient, a demo student) and
// invented case and workspace content; the AI steps were answered by the
// capture script instead of OpenAI. No real patient, account or study
// appears. Width/height are CSS pixels; each file exists at 2x as
// <name>.webp and at 1x as <name>-sm.webp. "-m" files are narrow captures of
// the same screen, shown below 640px.
import type { AppLang } from '@/lib/i18n/uiStrings';

export type Shot = { base: string; width: number; height: number; mobile?: Shot };

const DIMS: Record<string, [number, number]> = {
  'draft-en': [830, 751],
  'plan-en': [830, 720],
  'session-en': [830, 679],
  'session-en-m': [374, 664],
  'reasoning-en': [830, 618],
  'reasoning-en-m': [316, 672],
  'portal-en': [672, 658],
  'portal-en-m': [374, 487],
  'quiz-en': [776, 888],
  'quiz-en-m': [390, 724],
  'workspace-en': [1116, 908],
  'workspace-en-m': [390, 696],
  'draft-it': [830, 772],
  'plan-it': [830, 720],
  'session-it': [830, 679],
  'session-it-m': [374, 664],
  'reasoning-it': [830, 618],
  'reasoning-it-m': [316, 672],
  'portal-it': [672, 680],
  'portal-it-m': [374, 510],
  'quiz-it': [776, 888],
  'quiz-it-m': [390, 724],
  'workspace-it': [1116, 928],
  'workspace-it-m': [390, 696],
  'draft-es': [830, 793],
  'plan-es': [830, 737],
  'session-es': [830, 679],
  'session-es-m': [374, 710],
  'reasoning-es': [830, 618],
  'reasoning-es-m': [316, 672],
  'portal-es': [672, 680],
  'portal-es-m': [374, 510],
  'quiz-es': [776, 1024],
  'quiz-es-m': [390, 724],
  'workspace-es': [1116, 908],
  'workspace-es-m': [390, 696],
  'draft-fr': [830, 793],
  'plan-fr': [830, 737],
  'session-fr': [830, 679],
  'session-fr-m': [374, 732],
  'reasoning-fr': [830, 618],
  'reasoning-fr-m': [316, 672],
  'portal-fr': [672, 680],
  'portal-fr-m': [374, 510],
  'quiz-fr': [776, 912],
  'quiz-fr-m': [390, 724],
  'workspace-fr': [1116, 928],
  'workspace-fr-m': [390, 696],
  'bodymap': [620, 820],
  'brainmap': [780, 760],
};

function shot(base: string): Shot {
  const [width, height] = DIMS[base];
  const m = DIMS[`${base}-m`];
  return { base, width, height, mobile: m ? { base: `${base}-m`, width: m[0], height: m[1] } : undefined };
}

/** Screens per language: case, draft and workspace content are written in the visitor's language. */
export function landingShots(lang: AppLang) {
  return {
    draft: shot(`draft-${lang}`),
    bodymap: shot('bodymap'),
    /** Anatomy, neuroanatomy, quiz, workspace. */
    students: [shot('bodymap'), shot('brainmap'), shot(`quiz-${lang}`), shot(`workspace-${lang}`)],
    /** Session, SOAP reasoning, exercises, follow-up in My Phygo. */
    physiotherapists: [shot(`session-${lang}`), shot(`reasoning-${lang}`), shot(`plan-${lang}`), shot(`portal-${lang}`)],
  };
}
