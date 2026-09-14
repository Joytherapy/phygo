// Content for the standalone Pelvic Floor Anamnestic Questionnaire
// (app/dashboard/pelvic-floor/questionnaire/page.tsx) — a self-assessment,
// multi-step intake form with no scoring/interpretation logic (it only
// collects and summarizes answers), same shape as
// lib/neuroExamContent.ts. Extracted verbatim so every translatable
// string (question text, section titles, option labels) gets a stable
// content_id usable with lib/contentTranslation.ts. Option `value`s are
// language-independent slugs (not the display text), since the
// questionnaire stores answers by value and only the `label` shown to the
// user needs to be translated — this also means answers survive a
// language switch mid-questionnaire without corrupting the free-text
// summary. 'scale' questions (0-10 numeric) have no options: the value
// is already language-independent.

export type PFAnamnesisQuestionType = 'single' | 'multi' | 'scale';

export interface PFAnamnesisOption {
  value: string;
  label: string;
}

export interface PFAnamnesisQuestionContent {
  id: string;
  text: string;
  type: PFAnamnesisQuestionType;
  optionSet?: string;
}

export interface PFAnamnesisSectionContent {
  key: string;
  title: string;
  questionIds: string[];
}

function optionSet(key: string, labels: string[]): PFAnamnesisOption[] {
  return labels.map((label, i) => ({ value: `${key}-${i}`, label }));
}

export const OPTION_SETS: Record<string, PFAnamnesisOption[]> = {
  yesNo: optionSet('yesNo', ['Sì', 'No']),
  yesNoNA: optionSet('yesNoNA', ['Sì', 'No', 'Non applicabile']),
  deliveryType: optionSet('deliveryType', ['Vaginale spontaneo', 'Vaginale strumentale (forcipe/ventosa)', 'Taglio cesareo', 'Non applicabile']),
  priorSurgery: optionSet('priorSurgery', ['Nessuno', 'Emorroidi/ragadi anali', 'Prolasso rettale/rettocele', 'Plastica vaginale', 'Prostatectomia', 'Altro']),
  pelvicTrauma: optionSet('pelvicTrauma', ['Nessuno', 'Sinfisi pubica', 'Coccige', 'Bacino monolaterale', 'Bacino bilaterale']),
  bowelFrequency: optionSet('bowelFrequency', ['1 volta/giorno', '3-6 volte/settimana', '1-2 volte/settimana', 'Meno di 1 volta/settimana', 'Solo con lassativi/supposte']),
  stoolType: optionSet('stoolType', ['Acquose', 'Cremose', 'Formate, morbide', 'Formate, molto dure', 'Come palline', 'Miste']),
  laxativeUse: optionSet('laxativeUse', ['Mai', 'Occasionalmente', 'Almeno 1 volta/settimana', 'Quotidianamente']),
  gasControl: optionSet('gasControl', ['Sempre', 'Il più delle volte', 'Raramente', 'Mai']),
  fecalLossType: optionSet('fecalLossType', ['Nessuna perdita', 'Perdita improvvisa senza stimolo', 'Stimolo presente ma non riesco a trattenere', "Sporco dopo l'evacuazione", 'Non applicabile']),
  retentionTime: optionSet('retentionTime', ['Più di 15 min', '3-15 min', '1-2 min', 'Meno di 30 sec']),
  painLocation: optionSet('painLocation', ['Zona perianale', 'Zona perivaginale', 'Zona periuretrale', 'Sinfisi pubica', 'Zona coccigea', 'Non applicabile']),
  painTriggers: optionSet('painTriggers', ['Defecazione', 'Rapporti sessuali', 'Attività fisica', 'Stare seduti a lungo', 'Contrazione addominali', 'Nessuno di questi']),
  painInterference: optionSet('painInterference', ['Attività lavorative/casalinghe', 'Attività fisica', 'Viaggi lunghi', 'Vita di coppia', 'Nessuna interferenza significativa']),
  urinaryFrequency: optionSet('urinaryFrequency', ['3-5 volte', '6-9 volte', '10-15 volte', '15-20 volte', 'Più di 20 volte']),
  incontinenceTrigger: optionSet('incontinenceTrigger', ['Non presente', 'Colpo di tosse/starnuto', 'Sollevando pesi', 'Cambio posizione seduto-in piedi', 'Stimolo forte improvviso', 'Non me ne accorgo']),
  nocturia: optionSet('nocturia', ['Mai', '1 volta', '2 volte', '3 o più volte']),
};

export const PF_ANAMNESIS_QUESTIONS: PFAnamnesisQuestionContent[] = [
  { id: 'pregnancies', text: 'Ha avuto gravidanze con parto?', type: 'single', optionSet: 'yesNo' },
  { id: 'delivery_type', text: 'Se sì, tipo di parto prevalente', type: 'single', optionSet: 'deliveryType' },
  { id: 'menopause', text: 'È in menopausa?', type: 'single', optionSet: 'yesNoNA' },
  { id: 'prior_surgery', text: 'Interventi chirurgici pelvici pregressi', type: 'multi', optionSet: 'priorSurgery' },
  { id: 'pelvic_trauma', text: 'Traumi pelvici pregressi (fratture)', type: 'multi', optionSet: 'pelvicTrauma' },

  { id: 'bowel_frequency', text: 'Con quale frequenza va di corpo?', type: 'single', optionSet: 'bowelFrequency' },
  { id: 'stool_type', text: 'Come sono generalmente le feci?', type: 'single', optionSet: 'stoolType' },
  { id: 'straining', text: 'Deve sforzarsi molto per evacuare, almeno 1 volta su 4?', type: 'single', optionSet: 'yesNo' },
  { id: 'incomplete_evac', text: 'Sensazione di evacuazione incompleta', type: 'single', optionSet: 'yesNo' },
  { id: 'laxative_use', text: 'Usa lassativi/supposte/clisteri?', type: 'single', optionSet: 'laxativeUse' },

  { id: 'gas_control', text: 'Riesce a trattenere i gas?', type: 'single', optionSet: 'gasControl' },
  { id: 'fecal_loss_type', text: 'Tipo di perdita fecale, se presente', type: 'single', optionSet: 'fecalLossType' },
  { id: 'retention_time', text: 'Per quanto tempo riesce a trattenere quando ha lo stimolo?', type: 'single', optionSet: 'retentionTime' },

  { id: 'pain_present', text: 'Soffre di dolore del pavimento pelvico?', type: 'single', optionSet: 'yesNo' },
  { id: 'pain_location', text: 'Localizzazione del dolore', type: 'multi', optionSet: 'painLocation' },
  { id: 'pain_intensity', text: 'Intensità del dolore (0 = assente, 10 = massimo)', type: 'scale' },
  { id: 'pain_triggers', text: 'Il dolore aumenta con', type: 'multi', optionSet: 'painTriggers' },
  { id: 'pain_interference', text: 'Il dolore interferisce con', type: 'multi', optionSet: 'painInterference' },

  { id: 'urinary_frequency', text: 'Quante volte al giorno urina?', type: 'single', optionSet: 'urinaryFrequency' },
  { id: 'incontinence_trigger', text: "L'incontinenza si verifica (se presente)", type: 'multi', optionSet: 'incontinenceTrigger' },
  { id: 'urgency_intensity', text: 'Intensità dello stimolo di urgenza (0 = assente, 10 = massimo)', type: 'scale' },
  { id: 'nocturia', text: 'Si sveglia di notte per urinare?', type: 'single', optionSet: 'nocturia' },
  { id: 'recurrent_uti', text: 'Ha mai sofferto di cistiti ricorrenti?', type: 'single', optionSet: 'yesNo' },
];

export const PF_ANAMNESIS_SECTIONS: PFAnamnesisSectionContent[] = [
  {
    key: 'history',
    title: 'Anamnesi Generale',
    questionIds: ['pregnancies', 'delivery_type', 'menopause', 'prior_surgery', 'pelvic_trauma'],
  },
  {
    key: 'bowel',
    title: 'Funzione Intestinale',
    questionIds: ['bowel_frequency', 'stool_type', 'straining', 'incomplete_evac', 'laxative_use'],
  },
  {
    key: 'fecal_incontinence',
    title: 'Incontinenza Fecale',
    questionIds: ['gas_control', 'fecal_loss_type', 'retention_time'],
  },
  {
    key: 'pain',
    title: 'Dolore del Pavimento Pelvico',
    questionIds: ['pain_present', 'pain_location', 'pain_intensity', 'pain_triggers', 'pain_interference'],
  },
  {
    key: 'urinary',
    title: 'Funzione Urinaria',
    questionIds: ['urinary_frequency', 'incontinence_trigger', 'urgency_intensity', 'nocturia', 'recurrent_uti'],
  },
];
