// Content for the 3 interactive questionnaires embedded in the "Pelvic
// Floor" tab of app/dashboard/clinical-tools/page.tsx (SF-36, PFDI-20,
// ICIQ-UI Short Form). Extracted verbatim from the component so every
// translatable string (item text, section titles, option labels,
// circumstance labels) gets a stable slug usable as a translateContent
// content_id. Numeric values (option `v`, `recode` tables, item `id`s,
// score thresholds) are the actual scoring logic and are NOT translated —
// only the `l`/`text`/`title` fields are.

export type SF36Domain = 'PF' | 'RP' | 'RE' | 'VT' | 'MH' | 'SF' | 'BP' | 'GH';

export interface QOption {
  v: number;
  slug: string;
  l: string;
}

export interface SF36ItemContent {
  id: number;
  slug: string;
  domain: SF36Domain | null;
  text: string;
  optionSet: string;
  recode: number[];
}

export interface SF36SectionContent {
  slug: string;
  title: string;
  ids: number[];
}

export interface PFDIItemContent {
  id: string;
  slug: string;
  text: string;
}

export interface ICIQCircumstanceContent {
  slug: string;
  text: string;
}

// ---- Reusable option sets (shared across items within a questionnaire) ----

export const OPT_HEALTH1: QOption[] = [
  { v: 1, slug: 'health1-1', l: 'Eccellente' },
  { v: 2, slug: 'health1-2', l: 'Molto buona' },
  { v: 3, slug: 'health1-3', l: 'Buona' },
  { v: 4, slug: 'health1-4', l: 'Discreta' },
  { v: 5, slug: 'health1-5', l: 'Scadente' },
];

export const OPT_CHANGE: QOption[] = [
  { v: 1, slug: 'change-1', l: 'Decisamente migliore' },
  { v: 2, slug: 'change-2', l: 'Leggermente migliore' },
  { v: 3, slug: 'change-3', l: 'Più o meno uguale' },
  { v: 4, slug: 'change-4', l: 'Leggermente peggiore' },
  { v: 5, slug: 'change-5', l: 'Decisamente peggiore' },
];

export const OPT_LIMIT3: QOption[] = [
  { v: 1, slug: 'limit3-1', l: "Sì, mi limita molto" },
  { v: 2, slug: 'limit3-2', l: "Sì, mi limita un po'" },
  { v: 3, slug: 'limit3-3', l: 'No, non mi limita affatto' },
];

export const OPT_YESNO: QOption[] = [
  { v: 1, slug: 'yesno-1', l: 'Sì' },
  { v: 2, slug: 'yesno-2', l: 'No' },
];

export const OPT_EXTENT5: QOption[] = [
  { v: 1, slug: 'extent5-1', l: 'Per niente' },
  { v: 2, slug: 'extent5-2', l: 'Un poco' },
  { v: 3, slug: 'extent5-3', l: 'Moderatamente' },
  { v: 4, slug: 'extent5-4', l: 'Molto' },
  { v: 5, slug: 'extent5-5', l: 'Moltissimo' },
];

export const OPT_PAIN6: QOption[] = [
  { v: 1, slug: 'pain6-1', l: 'Nessuno' },
  { v: 2, slug: 'pain6-2', l: 'Molto lieve' },
  { v: 3, slug: 'pain6-3', l: 'Lieve' },
  { v: 4, slug: 'pain6-4', l: 'Moderato' },
  { v: 5, slug: 'pain6-5', l: 'Forte' },
  { v: 6, slug: 'pain6-6', l: 'Molto forte' },
];

export const OPT_FREQ6: QOption[] = [
  { v: 1, slug: 'freq6-1', l: 'Sempre' },
  { v: 2, slug: 'freq6-2', l: 'Quasi sempre' },
  { v: 3, slug: 'freq6-3', l: 'Molto spesso' },
  { v: 4, slug: 'freq6-4', l: 'Qualche volta' },
  { v: 5, slug: 'freq6-5', l: 'Raramente' },
  { v: 6, slug: 'freq6-6', l: 'Mai' },
];

export const OPT_FREQ5: QOption[] = [
  { v: 1, slug: 'freq5-1', l: 'Sempre' },
  { v: 2, slug: 'freq5-2', l: 'Quasi sempre' },
  { v: 3, slug: 'freq5-3', l: 'A volte' },
  { v: 4, slug: 'freq5-4', l: 'Raramente' },
  { v: 5, slug: 'freq5-5', l: 'Mai' },
];

export const OPT_TRUEFALSE5: QOption[] = [
  { v: 1, slug: 'truefalse5-1', l: 'Assolutamente vero' },
  { v: 2, slug: 'truefalse5-2', l: 'Abbastanza vero' },
  { v: 3, slug: 'truefalse5-3', l: 'Non so' },
  { v: 4, slug: 'truefalse5-4', l: 'Abbastanza falso' },
  { v: 5, slug: 'truefalse5-5', l: 'Assolutamente falso' },
];

export const OPT_PFDI: QOption[] = [
  { v: 0, slug: 'pfdi-opt-0', l: 'No' },
  { v: 1, slug: 'pfdi-opt-1', l: 'Sì — per niente' },
  { v: 2, slug: 'pfdi-opt-2', l: 'Sì — un poco' },
  { v: 3, slug: 'pfdi-opt-3', l: 'Sì — moderatamente' },
  { v: 4, slug: 'pfdi-opt-4', l: 'Sì — molto' },
];

export const OPT_ICIQ_FREQ: QOption[] = [
  { v: 0, slug: 'iciq-freq-0', l: 'Mai' },
  { v: 1, slug: 'iciq-freq-1', l: 'Circa una volta a settimana o meno' },
  { v: 2, slug: 'iciq-freq-2', l: 'Due o tre volte a settimana' },
  { v: 3, slug: 'iciq-freq-3', l: 'Circa una volta al giorno' },
  { v: 4, slug: 'iciq-freq-4', l: 'Diverse volte al giorno' },
  { v: 5, slug: 'iciq-freq-5', l: 'Continuamente' },
];

export const OPT_ICIQ_AMOUNT: QOption[] = [
  { v: 0, slug: 'iciq-amount-0', l: 'Nessuna' },
  { v: 2, slug: 'iciq-amount-2', l: 'Una piccola quantità' },
  { v: 4, slug: 'iciq-amount-4', l: 'Una quantità moderata' },
  { v: 6, slug: 'iciq-amount-6', l: 'Una grande quantità' },
];

export const OPTION_SETS: Record<string, QOption[]> = {
  health1: OPT_HEALTH1,
  change: OPT_CHANGE,
  limit3: OPT_LIMIT3,
  yesno: OPT_YESNO,
  extent5: OPT_EXTENT5,
  pain6: OPT_PAIN6,
  freq6: OPT_FREQ6,
  freq5: OPT_FREQ5,
  truefalse5: OPT_TRUEFALSE5,
  pfdi: OPT_PFDI,
  iciqFreq: OPT_ICIQ_FREQ,
  iciqAmount: OPT_ICIQ_AMOUNT,
};

// ---- Recode tables (language-independent scoring, unchanged) ----

export const RECODE_5_DESC = [100, 75, 50, 25, 0];
export const RECODE_5_ASC = [0, 25, 50, 75, 100];
export const RECODE_3 = [0, 50, 100];
export const RECODE_2 = [0, 100];
export const RECODE_6_DESC = [100, 80, 60, 40, 20, 0];
export const RECODE_6_ASC = [0, 20, 40, 60, 80, 100];

// ---- SF-36 ----

export const SF36_ITEMS: SF36ItemContent[] = [
  { id: 1, slug: 'sf36-item-1', domain: 'GH', text: 'In generale, direbbe che la sua salute è:', optionSet: 'health1', recode: RECODE_5_DESC },
  { id: 2, slug: 'sf36-item-2', domain: null, text: 'Rispetto a un anno fa, come valuterebbe la sua salute in generale, adesso?', optionSet: 'change', recode: RECODE_5_DESC },
  { id: 3, slug: 'sf36-item-3', domain: 'PF', text: 'Attività intense, come correre, sollevare oggetti pesanti, praticare sport faticosi', optionSet: 'limit3', recode: RECODE_3 },
  { id: 4, slug: 'sf36-item-4', domain: 'PF', text: "Attività di moderato impegno, come spostare un tavolo, usare l'aspirapolvere, andare in bicicletta", optionSet: 'limit3', recode: RECODE_3 },
  { id: 5, slug: 'sf36-item-5', domain: 'PF', text: 'Sollevare o portare le borse della spesa', optionSet: 'limit3', recode: RECODE_3 },
  { id: 6, slug: 'sf36-item-6', domain: 'PF', text: 'Salire diverse rampe di scale', optionSet: 'limit3', recode: RECODE_3 },
  { id: 7, slug: 'sf36-item-7', domain: 'PF', text: 'Salire una sola rampa di scale', optionSet: 'limit3', recode: RECODE_3 },
  { id: 8, slug: 'sf36-item-8', domain: 'PF', text: 'Piegarsi, inginocchiarsi o chinarsi', optionSet: 'limit3', recode: RECODE_3 },
  { id: 9, slug: 'sf36-item-9', domain: 'PF', text: 'Camminare per più di un chilometro', optionSet: 'limit3', recode: RECODE_3 },
  { id: 10, slug: 'sf36-item-10', domain: 'PF', text: 'Camminare per alcune centinaia di metri', optionSet: 'limit3', recode: RECODE_3 },
  { id: 11, slug: 'sf36-item-11', domain: 'PF', text: 'Camminare per circa cento metri', optionSet: 'limit3', recode: RECODE_3 },
  { id: 12, slug: 'sf36-item-12', domain: 'PF', text: 'Fare il bagno o vestirsi da soli', optionSet: 'limit3', recode: RECODE_3 },
  { id: 13, slug: 'sf36-item-13', domain: 'RP', text: 'Ha dovuto ridurre il tempo dedicato al lavoro o ad altre attività', optionSet: 'yesno', recode: RECODE_2 },
  { id: 14, slug: 'sf36-item-14', domain: 'RP', text: 'Ha ottenuto meno di quanto avrebbe voluto', optionSet: 'yesno', recode: RECODE_2 },
  { id: 15, slug: 'sf36-item-15', domain: 'RP', text: 'Ha dovuto limitare alcuni tipi di lavoro o di altre attività', optionSet: 'yesno', recode: RECODE_2 },
  { id: 16, slug: 'sf36-item-16', domain: 'RP', text: 'Ha avuto difficoltà nello svolgere il lavoro o altre attività (per esempio, le è costato uno sforzo maggiore)', optionSet: 'yesno', recode: RECODE_2 },
  { id: 17, slug: 'sf36-item-17', domain: 'RE', text: 'Ha dovuto ridurre il tempo dedicato al lavoro o ad altre attività', optionSet: 'yesno', recode: RECODE_2 },
  { id: 18, slug: 'sf36-item-18', domain: 'RE', text: 'Ha ottenuto meno di quanto avrebbe voluto', optionSet: 'yesno', recode: RECODE_2 },
  { id: 19, slug: 'sf36-item-19', domain: 'RE', text: 'Ha svolto il lavoro o le altre attività con meno cura del solito', optionSet: 'yesno', recode: RECODE_2 },
  { id: 20, slug: 'sf36-item-20', domain: 'SF', text: 'In che misura la salute fisica o i problemi emotivi hanno interferito con le sue normali attività sociali con famiglia, amici o vicini?', optionSet: 'extent5', recode: RECODE_5_DESC },
  { id: 21, slug: 'sf36-item-21', domain: 'BP', text: 'Quanto dolore fisico ha provato?', optionSet: 'pain6', recode: RECODE_6_DESC },
  { id: 22, slug: 'sf36-item-22', domain: 'BP', text: 'Quanto il dolore ha interferito con il suo normale lavoro (compreso il lavoro fuori casa e le faccende domestiche)?', optionSet: 'extent5', recode: RECODE_5_DESC },
  { id: 23, slug: 'sf36-item-23', domain: 'VT', text: 'Si è sentito pieno di energia e vitalità?', optionSet: 'freq6', recode: RECODE_6_DESC },
  { id: 24, slug: 'sf36-item-24', domain: 'MH', text: 'È stato/a una persona molto nervosa?', optionSet: 'freq6', recode: RECODE_6_ASC },
  { id: 25, slug: 'sf36-item-25', domain: 'MH', text: 'Si è sentito così giù di morale che niente riusciva a tirarla su?', optionSet: 'freq6', recode: RECODE_6_ASC },
  { id: 26, slug: 'sf36-item-26', domain: 'MH', text: 'Si è sentito calmo e sereno?', optionSet: 'freq6', recode: RECODE_6_DESC },
  { id: 27, slug: 'sf36-item-27', domain: 'VT', text: 'Ha avuto molta energia?', optionSet: 'freq6', recode: RECODE_6_DESC },
  { id: 28, slug: 'sf36-item-28', domain: 'MH', text: 'Si è sentito scoraggiato e triste?', optionSet: 'freq6', recode: RECODE_6_ASC },
  { id: 29, slug: 'sf36-item-29', domain: 'VT', text: 'Si è sentito sfinito?', optionSet: 'freq6', recode: RECODE_6_ASC },
  { id: 30, slug: 'sf36-item-30', domain: 'MH', text: 'È stato/a una persona felice?', optionSet: 'freq6', recode: RECODE_6_DESC },
  { id: 31, slug: 'sf36-item-31', domain: 'VT', text: 'Si è sentito stanco?', optionSet: 'freq6', recode: RECODE_6_ASC },
  { id: 32, slug: 'sf36-item-32', domain: 'SF', text: 'Per quanto tempo la salute fisica o i problemi emotivi hanno interferito con le sue attività sociali (visitare amici, parenti, ecc.)?', optionSet: 'freq5', recode: RECODE_5_ASC },
  { id: 33, slug: 'sf36-item-33', domain: 'GH', text: "Mi sembra di ammalarmi un po' più facilmente delle altre persone", optionSet: 'truefalse5', recode: RECODE_5_ASC },
  { id: 34, slug: 'sf36-item-34', domain: 'GH', text: 'Sono sano/a quanto chiunque altro conosca', optionSet: 'truefalse5', recode: RECODE_5_DESC },
  { id: 35, slug: 'sf36-item-35', domain: 'GH', text: 'Mi aspetto che la mia salute peggiori', optionSet: 'truefalse5', recode: RECODE_5_ASC },
  { id: 36, slug: 'sf36-item-36', domain: 'GH', text: 'La mia salute è eccellente', optionSet: 'truefalse5', recode: RECODE_5_DESC },
];

export const SF36_SECTIONS: SF36SectionContent[] = [
  { slug: 'sf36-section-1', title: 'Salute generale', ids: [1] },
  { slug: 'sf36-section-2', title: 'Cambiamento rispetto a un anno fa (informativo, non incluso nei punteggi)', ids: [2] },
  { slug: 'sf36-section-3', title: 'La sua salute la limita attualmente in queste attività? Se sì, quanto?', ids: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { slug: 'sf36-section-4', title: 'Nelle ultime 4 settimane, a causa della sua salute FISICA, ha avuto uno di questi problemi sul lavoro o in altre attività abituali?', ids: [13, 14, 15, 16] },
  { slug: 'sf36-section-5', title: 'Nelle ultime 4 settimane, a causa di problemi EMOTIVI (es. sentirsi depresso o ansioso), ha avuto uno di questi problemi sul lavoro o in altre attività abituali?', ids: [17, 18, 19] },
  { slug: 'sf36-section-6', title: 'Attività sociali e dolore', ids: [20, 21, 22] },
  { slug: 'sf36-section-7', title: 'Nelle ultime 4 settimane, per quanto tempo...', ids: [23, 24, 25, 26, 27, 28, 29, 30, 31] },
  { slug: 'sf36-section-8', title: 'Attività sociali (continua)', ids: [32] },
  { slug: 'sf36-section-9', title: 'Quanto sono vere o false per lei le seguenti affermazioni?', ids: [33, 34, 35, 36] },
];

// ---- PFDI-20 ----

export const PFDI_POPDI: PFDIItemContent[] = [
  { id: 'p1', slug: 'pfdi-p1', text: 'Sensazione di pressione nella zona pelvica' },
  { id: 'p2', slug: 'pfdi-p2', text: 'Sensazione di un rigonfiamento o di qualcosa che "scende" dalla vagina' },
  { id: 'p3', slug: 'pfdi-p3', text: 'Rigonfiamento o massa vaginale che si può vedere o toccare' },
  { id: 'p4', slug: 'pfdi-p4', text: "Necessità di spingere con le dita in vagina o intorno al retto per svuotare completamente l'intestino" },
  { id: 'p5', slug: 'pfdi-p5', text: 'Sensazione di svuotamento incompleto della vescica dopo la minzione' },
  { id: 'p6', slug: 'pfdi-p6', text: 'Necessità di spingere un rigonfiamento vaginale per riuscire a urinare o completare la minzione' },
];

export const PFDI_CRADI: PFDIItemContent[] = [
  { id: 'c1', slug: 'pfdi-c1', text: 'Necessità di sforzarsi eccessivamente per evacuare' },
  { id: 'c2', slug: 'pfdi-c2', text: 'Sensazione di evacuazione incompleta al termine della defecazione' },
  { id: 'c3', slug: 'pfdi-c3', text: 'Perdita involontaria di feci liquide' },
  { id: 'c4', slug: 'pfdi-c4', text: 'Perdita involontaria di feci solide' },
  { id: 'c5', slug: 'pfdi-c5', text: 'Perdita involontaria di gas intestinali' },
  { id: 'c6', slug: 'pfdi-c6', text: "Dolore durante l'evacuazione" },
  { id: 'c7', slug: 'pfdi-c7', text: 'Urgenza intestinale improvvisa e forte, con difficoltà a trattenersi' },
  { id: 'c8', slug: 'pfdi-c8', text: 'Protrusione di parte del retto durante o dopo la defecazione, che richiede di essere ridotta manualmente' },
];

export const PFDI_UDI: PFDIItemContent[] = [
  { id: 'u1', slug: 'pfdi-u1', text: 'Frequenza urinaria eccessiva' },
  { id: 'u2', slug: 'pfdi-u2', text: 'Perdita di urina associata a un forte stimolo improvviso (urgenza)' },
  { id: 'u3', slug: 'pfdi-u3', text: 'Perdita di urina associata a tosse, starnuti o risate' },
  { id: 'u4', slug: 'pfdi-u4', text: 'Perdita di urina in piccole quantità (gocciolamento)' },
  { id: 'u5', slug: 'pfdi-u5', text: 'Difficoltà a svuotare completamente la vescica' },
  { id: 'u6', slug: 'pfdi-u6', text: 'Dolore o fastidio nella zona pelvica o genitale' },
];

// ---- ICIQ-UI Short Form ----

export const ICIQ_QUESTIONS = {
  frequency: { slug: 'iciq-q-frequency', text: 'Con quale frequenza perde urina involontariamente?' },
  amount: { slug: 'iciq-q-amount', text: 'Quanta urina perde di solito (con o senza protezione)?' },
  impact: { slug: 'iciq-q-impact', text: 'In generale, quanto la perdita di urina interferisce con la sua vita quotidiana? (0 = per niente, 10 = moltissimo)' },
  circumstancesLabel: { slug: 'iciq-q-circumstances-label', text: 'Quando perde urina? (informativo, non incluso nel punteggio — può selezionare più risposte)' },
};

export const ICIQ_CIRCUMSTANCES: ICIQCircumstanceContent[] = [
  { slug: 'iciq-circ-before-bathroom', text: 'Prima di raggiungere il bagno' },
  { slug: 'iciq-circ-cough-sneeze', text: 'Quando tossisce o starnutisce' },
  { slug: 'iciq-circ-sleep', text: 'Durante il sonno' },
  { slug: 'iciq-circ-activity', text: 'Durante attività fisica o sforzo' },
  { slug: 'iciq-circ-after-dressed', text: 'Dopo aver finito di urinare e essersi rivestito/a' },
  { slug: 'iciq-circ-no-reason', text: 'Senza un motivo evidente' },
  { slug: 'iciq-circ-continuous', text: 'In modo continuo' },
];
