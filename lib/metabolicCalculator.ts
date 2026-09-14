// Motore di calcolo del Metabolic & Macro Calculator di Phygo.
// Puro (nessuna dipendenza da React/DB) cosi' e' testabile e riusabile sia
// lato server (app/api/metabolic/*) sia lato client per un'anteprima istantanea.
//
// Ogni risultato porta con se' `calculationMethod`, una stringa versionata
// (es. "mifflin_st_jeor_v1" / "katch_mcardle_v1") salvata insieme al risultato
// cosi' un profilo storico resta riproducibile anche se in futuro cambiano le
// costanti o si aggiungono altre formule (architettura pensata per questo, vedi
// FORMULA_VERSION e i moltiplicatori esportati sotto).

export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | 'extreme';
export type Goal = 'maintain' | 'fat_loss' | 'muscle_gain' | 'performance';
export type MacroStrategy = 'balanced' | 'high_protein' | 'high_carb' | 'low_carb' | 'custom';

export interface MetabolicInput {
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  bodyFatPct?: number | null;
  goal: Goal;
  macroStrategy: MacroStrategy;
  /** Solo se macroStrategy === 'custom': percentuali che sommano a 100. */
  customMacroPct?: { protein: number; carbs: number; fat: number } | null;
}

export interface MetabolicResult {
  calculationMethod: string;
  bmr: number;
  tdee: number;
  bmi: number;
  bmiCategory: 'underweight' | 'normal' | 'overweight' | 'obese';
  leanBodyMassKg: number | null;
  fatMassKg: number | null;
  calorieTargets: {
    maintain: number;
    fat_loss: number;
    muscle_gain: number;
    performance: number;
  };
  /** Il target calorico corrispondente al `goal` scelto in input. */
  calorieTarget: number;
  macros: {
    strategy: MacroStrategy;
    proteinG: number;
    carbsG: number;
    fatG: number;
    proteinPct: number;
    carbsPct: number;
    fatPct: number;
    proteinGPerKg: number;
  };
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Costanti configurabili — nessun numero "magico" incorporato nella logica.
// ---------------------------------------------------------------------------

export const FORMULA_VERSION = 'v1';

// Moltiplicatori di attivita' standard (Mifflin-St Jeor / ACSM).
export const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extreme: 1.9,
};

// Scostamento dal TDEE per ciascun obiettivo. Volutamente conservativo
// (nessun deficit/surplus aggressivo): -20% e' un deficit moderato e
// sostenibile, +12% un surplus lean-bulk, non aggressivo.
export const GOAL_ADJUSTMENT: Record<Goal, number> = {
  maintain: 0,
  fat_loss: -0.2,
  muscle_gain: 0.12,
  performance: 0,
};

// Soglia di sicurezza: il target calorico non scende mai sotto questa frazione
// del BMR, indipendentemente dall'obiettivo scelto (evita deficit estremi).
export const MIN_CALORIE_FLOOR_OF_BMR = 1.0;

// Categorie BMI standard OMS.
export function bmiCategory(bmi: number): MetabolicResult['bmiCategory'] {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

// Grammi di proteina per kg di peso corporeo, per strategia macro — ancorati
// al peso corporeo (pratica clinica standard) invece di percentuali arbitrarie.
// Grassi come quota % delle calorie totali; i carboidrati riempiono il resto.
const MACRO_STRATEGY_CONFIG: Record<
  Exclude<MacroStrategy, 'custom'>,
  { proteinGPerKg: number; fatPctOfCalories: number }
> = {
  balanced: { proteinGPerKg: 1.6, fatPctOfCalories: 0.25 },
  high_protein: { proteinGPerKg: 2.2, fatPctOfCalories: 0.25 },
  high_carb: { proteinGPerKg: 1.6, fatPctOfCalories: 0.2 },
  low_carb: { proteinGPerKg: 2.0, fatPctOfCalories: 0.35 },
};

const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;

// Limiti fisiologicamente plausibili: fuori da questi range chiediamo di
// verificare il dato invece di generare un risultato fuorviante (§21 brief).
export const INPUT_BOUNDS = {
  age: { min: 14, max: 100 },
  weightKg: { min: 30, max: 300 },
  heightCm: { min: 100, max: 230 },
  bodyFatPct: { min: 3, max: 60 },
};

export function validateInput(input: MetabolicInput): string[] {
  const errors: string[] = [];
  if (input.age < INPUT_BOUNDS.age.min || input.age > INPUT_BOUNDS.age.max) {
    errors.push('age_out_of_range');
  }
  if (input.weightKg < INPUT_BOUNDS.weightKg.min || input.weightKg > INPUT_BOUNDS.weightKg.max) {
    errors.push('weight_out_of_range');
  }
  if (input.heightCm < INPUT_BOUNDS.heightCm.min || input.heightCm > INPUT_BOUNDS.heightCm.max) {
    errors.push('height_out_of_range');
  }
  if (
    input.bodyFatPct != null &&
    (input.bodyFatPct < INPUT_BOUNDS.bodyFatPct.min || input.bodyFatPct > INPUT_BOUNDS.bodyFatPct.max)
  ) {
    errors.push('body_fat_out_of_range');
  }
  if (
    input.macroStrategy === 'custom' &&
    input.customMacroPct &&
    Math.round(input.customMacroPct.protein + input.customMacroPct.carbs + input.customMacroPct.fat) !== 100
  ) {
    errors.push('custom_macro_pct_not_100');
  }
  return errors;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * BMR — usa Katch-McArdle (basato sulla massa magra) quando la % di grasso
 * corporeo e' nota: piu' accurata perche' non assume una composizione
 * corporea media. Altrimenti usa Mifflin-St Jeor (standard attuale, piu'
 * accurata della vecchia Harris-Benedict), su peso/altezza/eta'/sesso.
 */
function calculateBMR(input: MetabolicInput, leanBodyMassKg: number | null): { bmr: number; method: string } {
  if (leanBodyMassKg != null) {
    // Katch-McArdle: BMR = 370 + 21.6 * massa magra (kg)
    return { bmr: 370 + 21.6 * leanBodyMassKg, method: `katch_mcardle_${FORMULA_VERSION}` };
  }
  // Mifflin-St Jeor
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  const bmr = input.sex === 'male' ? base + 5 : base - 161;
  return { bmr, method: `mifflin_st_jeor_${FORMULA_VERSION}` };
}

// ---------------------------------------------------------------------------
// Calibrazione adattiva — "Phygo Adapt"
// ---------------------------------------------------------------------------
// Il vantaggio che una calcolatrice TDEE standalone non puo' avere: Phygo
// conosce lo storico REALE del paziente (peso + target calorico seguito nel
// tempo), quindi puo' confrontare cosa prediceva la formula con cosa e'
// successo davvero, e restituire un TDEE "implicito" piu' accurato della
// sola stima Mifflin-St Jeor/Katch-McArdle. Stessa tecnica usata dalle app
// di tracking piu' sofisticate (es. calibrazione TDEE da trend di peso),
// qui applicata dentro il contesto clinico di Phygo invece che come prodotto
// a se stante — e' un dato che matura ad ogni visita, non un calcolo isolato.
//
// Metodo: 1 kg di variazione di peso corrisponde a circa 7700 kcal di
// bilancio energetico cumulato (approssimazione standard, comunicata come
// tale). Dati la variazione di peso osservata tra la prima e l'ultima voce
// e il target calorico medio seguito nel periodo, si ricava il TDEE che
// avrebbe prodotto esattamente quella variazione — non il TDEE teorico.

const KCAL_PER_KG_BODY_MASS = 7700;
const MIN_DAYS_FOR_ADAPTIVE_INSIGHT = 10;

export interface AdaptiveInsightInput {
  weightKg: number;
  calorieTarget: number;
  createdAt: string; // ISO date
}

export interface AdaptiveInsight {
  /** TDEE implicito dal trend di peso reale, in kcal/giorno. */
  impliedTdee: number;
  /** Differenza rispetto all'ultimo TDEE calcolato dalla formula (impliedTdee - formulaTdee). */
  deltaFromFormula: number;
  daysSpanned: number;
  weightChangeKg: number;
  entriesUsed: number;
  /** Ritmo di variazione del peso osservato, kg/giorno, con segno (negativo = in calo). Base per la proiezione dell'obiettivo. */
  dailyRateKg: number;
}

export type AdaptiveInsightResult =
  | { available: true; insight: AdaptiveInsight }
  | { available: false; reason: 'not_enough_entries' | 'not_enough_days' };

/**
 * `entries` deve essere ordinato dal piu' vecchio al piu' recente. Usa il
 * primo e l'ultimo per il calcolo (semplice e robusto contro le oscillazioni
 * quotidiane del peso rispetto a una regressione su pochi punti); richiede
 * almeno 10 giorni tra le due misurazioni per non amplificare il rumore
 * naturale del peso corporeo in un numero fuorviante.
 */
export function calculateAdaptiveInsight(
  entries: AdaptiveInsightInput[],
  formulaTdee: number
): AdaptiveInsightResult {
  if (entries.length < 2) return { available: false, reason: 'not_enough_entries' };

  const first = entries[0];
  const last = entries[entries.length - 1];
  const daysSpanned = Math.round((new Date(last.createdAt).getTime() - new Date(first.createdAt).getTime()) / 86400000);

  if (daysSpanned < MIN_DAYS_FOR_ADAPTIVE_INSIGHT) {
    return { available: false, reason: 'not_enough_days' };
  }

  const weightChangeKg = last.weightKg - first.weightKg;
  const avgCalorieTarget = entries.reduce((sum, e) => sum + e.calorieTarget, 0) / entries.length;
  const dailyEnergyBalance = (weightChangeKg * KCAL_PER_KG_BODY_MASS) / daysSpanned;
  const impliedTdee = Math.round(avgCalorieTarget - dailyEnergyBalance);

  return {
    available: true,
    insight: {
      impliedTdee,
      deltaFromFormula: impliedTdee - Math.round(formulaTdee),
      daysSpanned,
      weightChangeKg: round1(weightChangeKg),
      entriesUsed: entries.length,
      dailyRateKg: weightChangeKg / daysSpanned,
    },
  };
}

// ---------------------------------------------------------------------------
// Proiezione dell'obiettivo — estende Phygo Adapt
// ---------------------------------------------------------------------------
// Non una proiezione teorica ("al deficit X dovresti perdere Y kg/settimana"):
// usa il ritmo REALE gia' osservato (dailyRateKg da calculateAdaptiveInsight)
// per stimare quando un peso obiettivo verrebbe raggiunto se il trend
// attuale continuasse. Richiede lo storico del paziente, quindi e' un altro
// vantaggio che una calcolatrice TDEE isolata non puo' offrire.

const MIN_MEANINGFUL_DAILY_RATE_KG = 0.005; // sotto questa soglia il trend e' indistinguibile dal rumore di misura

export interface GoalProjectionInput {
  currentWeightKg: number;
  targetWeightKg: number;
  /** insight.dailyRateKg da un AdaptiveInsight disponibile. */
  dailyRateKg: number;
}

export type GoalProjectionResult =
  | { achievable: true; daysRemaining: number; projectedDate: string }
  | { achievable: false; reason: 'wrong_direction' | 'no_progress' };

export function calculateGoalProjection(input: GoalProjectionInput): GoalProjectionResult {
  const weightDeltaNeededKg = input.targetWeightKg - input.currentWeightKg;

  if (Math.abs(input.dailyRateKg) < MIN_MEANINGFUL_DAILY_RATE_KG) {
    return { achievable: false, reason: 'no_progress' };
  }
  if (Math.abs(weightDeltaNeededKg) < 0.05) {
    // Gia' al peso obiettivo (entro l'arrotondamento di una pesata).
    return { achievable: true, daysRemaining: 0, projectedDate: new Date().toISOString() };
  }
  if (Math.sign(weightDeltaNeededKg) !== Math.sign(input.dailyRateKg)) {
    return { achievable: false, reason: 'wrong_direction' };
  }

  const daysRemaining = Math.round(weightDeltaNeededKg / input.dailyRateKg);
  const projectedDate = new Date(Date.now() + daysRemaining * 86400000);
  return { achievable: true, daysRemaining, projectedDate: projectedDate.toISOString() };
}

export function calculateMetabolicProfile(input: MetabolicInput): MetabolicResult {
  const warnings = validateInput(input);

  const heightM = input.heightCm / 100;
  const bmi = input.weightKg / (heightM * heightM);

  const leanBodyMassKg =
    input.bodyFatPct != null ? round1(input.weightKg * (1 - input.bodyFatPct / 100)) : null;
  const fatMassKg = input.bodyFatPct != null ? round1(input.weightKg - (leanBodyMassKg ?? 0)) : null;

  const { bmr, method } = calculateBMR(input, leanBodyMassKg);
  const tdee = bmr * ACTIVITY_MULTIPLIER[input.activityLevel];

  const calorieTargets = {
    maintain: Math.round(tdee * (1 + GOAL_ADJUSTMENT.maintain)),
    fat_loss: Math.round(Math.max(tdee * (1 + GOAL_ADJUSTMENT.fat_loss), bmr * MIN_CALORIE_FLOOR_OF_BMR)),
    muscle_gain: Math.round(tdee * (1 + GOAL_ADJUSTMENT.muscle_gain)),
    performance: Math.round(tdee * (1 + GOAL_ADJUSTMENT.performance)),
  };
  const calorieTarget = calorieTargets[input.goal];

  // --- Macro ---
  let proteinGPerKg: number;
  let fatPctOfCalories: number;
  if (input.macroStrategy === 'custom' && input.customMacroPct) {
    const proteinKcal = (calorieTarget * input.customMacroPct.protein) / 100;
    proteinGPerKg = proteinKcal / KCAL_PER_G.protein / input.weightKg;
    fatPctOfCalories = input.customMacroPct.fat / 100;
  } else {
    const cfg = MACRO_STRATEGY_CONFIG[(input.macroStrategy as Exclude<MacroStrategy, 'custom'>) || 'balanced'];
    proteinGPerKg = cfg.proteinGPerKg;
    fatPctOfCalories = cfg.fatPctOfCalories;
  }

  const proteinG = Math.round(proteinGPerKg * input.weightKg);
  const proteinKcal = proteinG * KCAL_PER_G.protein;
  const fatKcal = calorieTarget * fatPctOfCalories;
  const fatG = Math.round(fatKcal / KCAL_PER_G.fat);
  const remainingKcal = Math.max(calorieTarget - proteinKcal - fatG * KCAL_PER_G.fat, 0);
  const carbsG = Math.round(remainingKcal / KCAL_PER_G.carbs);

  const totalKcalFromMacros = proteinG * KCAL_PER_G.protein + carbsG * KCAL_PER_G.carbs + fatG * KCAL_PER_G.fat;
  const proteinPct = Math.round((proteinG * KCAL_PER_G.protein * 100) / totalKcalFromMacros);
  const carbsPct = Math.round((carbsG * KCAL_PER_G.carbs * 100) / totalKcalFromMacros);
  const fatPct = Math.max(0, 100 - proteinPct - carbsPct);

  return {
    calculationMethod: method,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    bmi: round1(bmi),
    bmiCategory: bmiCategory(bmi),
    leanBodyMassKg,
    fatMassKg,
    calorieTargets,
    calorieTarget,
    macros: {
      strategy: input.macroStrategy,
      proteinG,
      carbsG,
      fatG,
      proteinPct,
      carbsPct,
      fatPct,
      proteinGPerKg: round1(proteinGPerKg),
    },
    warnings,
  };
}
