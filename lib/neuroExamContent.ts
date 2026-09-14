// Content for the standalone Neurological Exam questionnaire
// (app/dashboard/clinical-tools/neuro-exam/page.tsx) — a self-assessment,
// multi-step exam form with no scoring/interpretation logic (it only
// collects and summarizes answers), unlike the SF-36/PFDI-20/ICIQ
// questionnaires in lib/pelvicFloorQuestionnaires.ts. Extracted verbatim so
// every translatable string (question text, section titles, option labels)
// gets a stable content_id usable with lib/contentTranslation.ts. Option
// `value`s are language-independent slugs (not the display text), since
// the exam stores answers by value and only the `label` shown to the user
// needs to be translated — this also means answers survive a language
// switch mid-exam without corrupting the free-text summary.

export type NeuroExamQuestionType = 'single' | 'multi';

export interface NeuroExamOption {
  value: string;
  label: string;
}

export interface NeuroExamQuestionContent {
  id: string;
  text: string;
  type: NeuroExamQuestionType;
  optionSet: string;
}

export interface NeuroExamSectionContent {
  key: string;
  title: string;
  questionIds: string[];
}

function optionSet(key: string, labels: string[]): NeuroExamOption[] {
  return labels.map((label, i) => ({ value: `${key}-${i}`, label }));
}

export const OPTION_SETS: Record<string, NeuroExamOption[]> = {
  normalAltered: optionSet('normalAltered', ['Normale', 'Alterato']),
  yesNo: optionSet('yesNo', ['Sì', 'No']),
  assentePresente: optionSet('assentePresente', ['Assente', 'Presente']),
  negPos: optionSet('negPos', ['Negativo', 'Positivo']),
  consciousness: optionSet('consciousness', ['Vigile', 'Sopore', 'Stupor / Stato vegetativo', 'Coma']),
  mrc: optionSet('mrc', ['0', '1', '2', '3', '4', '5']),
  rotGrade: optionSet('rotGrade', ['Assente', 'Ipoevocabile', 'Normoevocabile/Vivace', 'Scattante', 'Trepidante/Policinetico', 'Clono']),
  tono: optionSet('tono', ['Normale', 'Ipertono spastico (piramidale)', 'Ipertono plastico (extrapiramidale)', 'Ipotono', 'Flaccidità']),
  trofismo: optionSet('trofismo', ['Normale', 'Ipotrofico', 'Ipertrofico']),
  mingazzini: optionSet('mingazzini', ['Negativa', 'Positiva (deficit rilevato)']),
  babinski: optionSet('babinski', ['Normale (flessorio)', 'Positivo (patologico)']),
  abdominalReflexes: optionSet('abdominalReflexes', ['Normali', 'Assenti']),
  gaitPattern: optionSet('gaitPattern', ['Nessuno', 'Paretica/Paraparetica', 'Atassica', 'Extrapiramidale', 'Aprassia della marcia', 'Steppage', 'Anserina']),
  sensTopography: optionSet('sensTopography', ['Non applicabile', 'Territorio nervo periferico', 'Polineuropatica', 'Radicolare', 'Metamerica (livello)', 'Emisferica']),
  sensQuality: optionSet('sensQuality', ['Non applicabile', 'Ipo(an)estesia', 'Iperestesia', 'Disestesia', 'Allodinia', 'Parestesia']),
  cerebellarFindings: optionSet('cerebellarFindings', ['Nessuno', 'Frénage', 'Dismetria', 'Tremore intenzionale', 'Ipodiadococinesia', 'Atassia', 'Disequilibrio']),
  tremor: optionSet('tremor', ['Assente', 'A riposo', 'Posturale', 'Intenzionale']),
  otherMovements: optionSet('otherMovements', ['Nessuno', 'Clonie', 'Fascicolazioni', 'Tic', 'Mioclono', 'Miochimia', 'Corea', 'Atetosi']),
};

export const NEURO_EXAM_QUESTIONS: NeuroExamQuestionContent[] = [
  { id: 'consciousness_level', text: 'Stato di vigilanza e coscienza', type: 'single', optionSet: 'consciousness' },

  { id: 'attention', text: 'Attenzione', type: 'single', optionSet: 'normalAltered' },
  { id: 'orient_person', text: 'Orientamento verso sé stesso (persona)', type: 'single', optionSet: 'yesNo' },
  { id: 'orient_place', text: 'Orientamento nello spazio', type: 'single', optionSet: 'yesNo' },
  { id: 'orient_time', text: 'Orientamento nel tempo', type: 'single', optionSet: 'yesNo' },
  { id: 'memory', text: 'Memoria (immediata e differita)', type: 'single', optionSet: 'normalAltered' },
  { id: 'calculation', text: 'Calcolo (es. sottrazione seriale)', type: 'single', optionSet: 'normalAltered' },
  { id: 'language', text: 'Linguaggio', type: 'single', optionSet: 'normalAltered' },
  { id: 'gnosia', text: 'Gnosia (riconoscimento)', type: 'single', optionSet: 'normalAltered' },
  { id: 'praxis', text: 'Prassia (inclusa prassia costruttiva — es. copia di figura geometrica)', type: 'single', optionSet: 'normalAltered' },

  { id: 'stance', text: 'Raggiungimento e mantenimento della stazione eretta', type: 'single', optionSet: 'normalAltered' },
  { id: 'romberg', text: 'Prova di Romberg', type: 'single', optionSet: 'negPos' },
  { id: 'pull_test', text: 'Riflessi posturali (pull test)', type: 'single', optionSet: 'normalAltered' },
  { id: 'gait_base_symmetry', text: 'Base, stabilità, postura e simmetria della marcia', type: 'single', optionSet: 'normalAltered' },
  { id: 'gait_stress', text: 'Marcia in condizioni di stress (occhi chiusi, punte, talloni, tandem)', type: 'single', optionSet: 'normalAltered' },
  { id: 'gait_pattern', text: 'Pattern di marcia patologica osservato', type: 'multi', optionSet: 'gaitPattern' },

  { id: 'mingazzini', text: 'Prove di forza statiche (Mingazzini I e II)', type: 'single', optionSet: 'mingazzini' },
  { id: 'mrc_deltoid_dx', text: 'Forza dinamica (MRC 0-5) — Deltoide Destra', type: 'single', optionSet: 'mrc' },
  { id: 'mrc_deltoid_sx', text: 'Forza dinamica (MRC 0-5) — Deltoide Sinistra', type: 'single', optionSet: 'mrc' },
  { id: 'mrc_biceps_dx', text: 'Forza dinamica (MRC 0-5) — Bicipite Brachiale Destra', type: 'single', optionSet: 'mrc' },
  { id: 'mrc_biceps_sx', text: 'Forza dinamica (MRC 0-5) — Bicipite Brachiale Sinistra', type: 'single', optionSet: 'mrc' },
  { id: 'mrc_wrist_ext_dx', text: 'Forza dinamica (MRC 0-5) — Estensori del Polso Destra', type: 'single', optionSet: 'mrc' },
  { id: 'mrc_wrist_ext_sx', text: 'Forza dinamica (MRC 0-5) — Estensori del Polso Sinistra', type: 'single', optionSet: 'mrc' },
  { id: 'mrc_iliopsoas_dx', text: 'Forza dinamica (MRC 0-5) — Ileopsoas Destra', type: 'single', optionSet: 'mrc' },
  { id: 'mrc_iliopsoas_sx', text: 'Forza dinamica (MRC 0-5) — Ileopsoas Sinistra', type: 'single', optionSet: 'mrc' },
  { id: 'mrc_quadriceps_dx', text: 'Forza dinamica (MRC 0-5) — Quadricipite Destra', type: 'single', optionSet: 'mrc' },
  { id: 'mrc_quadriceps_sx', text: 'Forza dinamica (MRC 0-5) — Quadricipite Sinistra', type: 'single', optionSet: 'mrc' },
  { id: 'mrc_tibialis_ant_dx', text: 'Forza dinamica (MRC 0-5) — Tibiale Anteriore Destra', type: 'single', optionSet: 'mrc' },
  { id: 'mrc_tibialis_ant_sx', text: 'Forza dinamica (MRC 0-5) — Tibiale Anteriore Sinistra', type: 'single', optionSet: 'mrc' },
  { id: 'trofismo', text: 'Massa muscolare (trofismo)', type: 'single', optionSet: 'trofismo' },
  { id: 'tono', text: 'Tono muscolare', type: 'single', optionSet: 'tono' },

  { id: 'rot_biceps_dx', text: 'R. Bicipitale (C6) — Destra', type: 'single', optionSet: 'rotGrade' },
  { id: 'rot_biceps_sx', text: 'R. Bicipitale (C6) — Sinistra', type: 'single', optionSet: 'rotGrade' },
  { id: 'rot_triceps_dx', text: 'R. Tricipitale (C7) — Destra', type: 'single', optionSet: 'rotGrade' },
  { id: 'rot_triceps_sx', text: 'R. Tricipitale (C7) — Sinistra', type: 'single', optionSet: 'rotGrade' },
  { id: 'rot_stiloradial_dx', text: 'R. Stilo-radiale/Cubito-pronatore (C8) — Destra', type: 'single', optionSet: 'rotGrade' },
  { id: 'rot_stiloradial_sx', text: 'R. Stilo-radiale/Cubito-pronatore (C8) — Sinistra', type: 'single', optionSet: 'rotGrade' },
  { id: 'rot_patellar_dx', text: 'R. Rotuleo/Patellare (L4) — Destra', type: 'single', optionSet: 'rotGrade' },
  { id: 'rot_patellar_sx', text: 'R. Rotuleo/Patellare (L4) — Sinistra', type: 'single', optionSet: 'rotGrade' },
  { id: 'rot_achilles_dx', text: 'R. Achilleo (S1) — Destra', type: 'single', optionSet: 'rotGrade' },
  { id: 'rot_achilles_sx', text: 'R. Achilleo (S1) — Sinistra', type: 'single', optionSet: 'rotGrade' },
  { id: 'babinski_dx', text: 'Riflesso cutaneo plantare (Segno di Babinski) — Destra', type: 'single', optionSet: 'babinski' },
  { id: 'babinski_sx', text: 'Riflesso cutaneo plantare (Segno di Babinski) — Sinistra', type: 'single', optionSet: 'babinski' },
  { id: 'abdominal_reflexes', text: 'Riflessi addominali', type: 'single', optionSet: 'abdominalReflexes' },
  { id: 'hoffmann_dx', text: 'Riflesso di Hoffmann (flessore delle dita) — Destra', type: 'single', optionSet: 'negPos' },
  { id: 'hoffmann_sx', text: 'Riflesso di Hoffmann (flessore delle dita) — Sinistra', type: 'single', optionSet: 'negPos' },

  { id: 'sens_superficial', text: 'Sensibilità superficiale (termo-tattile-dolorifica)', type: 'single', optionSet: 'normalAltered' },
  { id: 'sens_deep', text: 'Sensibilità profonda (pallestesia e senso di posizione)', type: 'single', optionSet: 'normalAltered' },
  { id: 'sens_topography', text: 'Topografia del deficit (se presente)', type: 'multi', optionSet: 'sensTopography' },
  { id: 'sens_quality', text: 'Qualità del deficit (se presente)', type: 'multi', optionSet: 'sensQuality' },

  { id: 'finger_nose_dx', text: 'Indice-naso — Destra', type: 'single', optionSet: 'normalAltered' },
  { id: 'finger_nose_sx', text: 'Indice-naso — Sinistra', type: 'single', optionSet: 'normalAltered' },
  { id: 'alt_hand_movements_dx', text: 'Movimenti alternati delle mani — Destra', type: 'single', optionSet: 'normalAltered' },
  { id: 'alt_hand_movements_sx', text: 'Movimenti alternati delle mani — Sinistra', type: 'single', optionSet: 'normalAltered' },
  { id: 'heel_knee_dx', text: 'Calcagno-ginocchio — Destra', type: 'single', optionSet: 'normalAltered' },
  { id: 'heel_knee_sx', text: 'Calcagno-ginocchio — Sinistra', type: 'single', optionSet: 'normalAltered' },
  { id: 'foot_tapping_dx', text: 'Foot-tapping — Destra', type: 'single', optionSet: 'normalAltered' },
  { id: 'foot_tapping_sx', text: 'Foot-tapping — Sinistra', type: 'single', optionSet: 'normalAltered' },
  { id: 'cerebellar_findings', text: 'Reperti patologici osservati', type: 'multi', optionSet: 'cerebellarFindings' },
  { id: 'stewart_holmes', text: 'Segno di Stewart-Holmes', type: 'single', optionSet: 'negPos' },
  { id: 'scanning_speech', text: 'Parola scandita/esplosiva', type: 'single', optionSet: 'assentePresente' },
  { id: 'voice_tremor', text: 'Tremore vocale', type: 'single', optionSet: 'assentePresente' },

  { id: 'cn1', text: 'I — Olfattivo', type: 'single', optionSet: 'normalAltered' },
  { id: 'cn2', text: 'II — Ottico (acuità visiva, campo visivo, fundus oculi)', type: 'single', optionSet: 'normalAltered' },
  { id: 'pupil_isocoria', text: 'Esame pupillare — Isocoria (calibro simmetrico)', type: 'single', optionSet: 'yesNo' },
  { id: 'pupil_direct_reflex', text: 'Riflesso fotomotore diretto', type: 'single', optionSet: 'normalAltered' },
  { id: 'pupil_consensual_reflex', text: 'Riflesso fotomotore consensuale', type: 'single', optionSet: 'normalAltered' },
  { id: 'cn3_4_6', text: 'III-IV-VI — Motilità oculare estrinseca', type: 'single', optionSet: 'normalAltered' },
  { id: 'cn5', text: 'V — Trigemino (sensibilità facciale/corneale, motilità masticatoria)', type: 'single', optionSet: 'normalAltered' },
  { id: 'cn7', text: 'VII — Facciale (motilità del volto)', type: 'single', optionSet: 'normalAltered' },
  { id: 'cn8', text: 'VIII — Vestibolo-cocleare (riflessi vestibolari, udito)', type: 'single', optionSet: 'normalAltered' },
  { id: 'cn9_10', text: 'IX-X — Glossofaringeo/Vago (palato molle, deglutizione, riflesso faringeo)', type: 'single', optionSet: 'normalAltered' },
  { id: 'cn11', text: 'XI — Accessorio (trapezio, sternocleidomastoideo)', type: 'single', optionSet: 'normalAltered' },
  { id: 'cn12', text: 'XII — Ipoglosso (motilità linguale)', type: 'single', optionSet: 'normalAltered' },

  { id: 'tremor', text: 'Tremore', type: 'multi', optionSet: 'tremor' },
  { id: 'other_movements', text: 'Altri movimenti involontari osservati', type: 'multi', optionSet: 'otherMovements' },

  { id: 'rigor_nucalis', text: 'Rigor nucalis (rigidità nucale)', type: 'single', optionSet: 'assentePresente' },
  { id: 'brudzinski', text: 'Segno di Brudzinski', type: 'single', optionSet: 'negPos' },
  { id: 'kernig', text: 'Segno di Kernig', type: 'single', optionSet: 'negPos' },
  { id: 'lasegue', text: 'Segno di Lasègue', type: 'single', optionSet: 'negPos' },
];

export const NEURO_EXAM_SECTIONS: NeuroExamSectionContent[] = [
  { key: 'consciousness', title: 'Stato di Vigilanza e Coscienza', questionIds: ['consciousness_level'] },
  {
    key: 'cortical_functions',
    title: 'Funzioni Corticali Superiori',
    questionIds: ['attention', 'orient_person', 'orient_place', 'orient_time', 'memory', 'calculation', 'language', 'gnosia', 'praxis'],
  },
  {
    key: 'stance_gait',
    title: 'Stazione Eretta e Deambulazione',
    questionIds: ['stance', 'romberg', 'pull_test', 'gait_base_symmetry', 'gait_stress', 'gait_pattern'],
  },
  {
    key: 'strength_tone',
    title: 'Forza, Trofismo e Tono Muscolare',
    questionIds: [
      'mingazzini',
      'mrc_deltoid_dx',
      'mrc_deltoid_sx',
      'mrc_biceps_dx',
      'mrc_biceps_sx',
      'mrc_wrist_ext_dx',
      'mrc_wrist_ext_sx',
      'mrc_iliopsoas_dx',
      'mrc_iliopsoas_sx',
      'mrc_quadriceps_dx',
      'mrc_quadriceps_sx',
      'mrc_tibialis_ant_dx',
      'mrc_tibialis_ant_sx',
      'trofismo',
      'tono',
    ],
  },
  {
    key: 'reflexes',
    title: 'Riflessi Osteotendinei e Superficiali',
    questionIds: [
      'rot_biceps_dx',
      'rot_biceps_sx',
      'rot_triceps_dx',
      'rot_triceps_sx',
      'rot_stiloradial_dx',
      'rot_stiloradial_sx',
      'rot_patellar_dx',
      'rot_patellar_sx',
      'rot_achilles_dx',
      'rot_achilles_sx',
      'babinski_dx',
      'babinski_sx',
      'abdominal_reflexes',
      'hoffmann_dx',
      'hoffmann_sx',
    ],
  },
  {
    key: 'sensation',
    title: 'Sensibilità',
    questionIds: ['sens_superficial', 'sens_deep', 'sens_topography', 'sens_quality'],
  },
  {
    key: 'cerebellar',
    title: 'Prove Cerebellari',
    questionIds: [
      'finger_nose_dx',
      'finger_nose_sx',
      'alt_hand_movements_dx',
      'alt_hand_movements_sx',
      'heel_knee_dx',
      'heel_knee_sx',
      'foot_tapping_dx',
      'foot_tapping_sx',
      'cerebellar_findings',
      'stewart_holmes',
      'scanning_speech',
      'voice_tremor',
    ],
  },
  {
    key: 'cranial_nerves',
    title: 'Nervi Cranici',
    questionIds: ['cn1', 'cn2', 'pupil_isocoria', 'pupil_direct_reflex', 'pupil_consensual_reflex', 'cn3_4_6', 'cn5', 'cn7', 'cn8', 'cn9_10', 'cn11', 'cn12'],
  },
  {
    key: 'involuntary_movements',
    title: 'Movimenti Involontari',
    questionIds: ['tremor', 'other_movements'],
  },
  {
    key: 'meningeal_signs',
    title: 'Segni Meningei',
    questionIds: ['rigor_nucalis', 'brudzinski', 'kernig', 'lasegue'],
  },
];
