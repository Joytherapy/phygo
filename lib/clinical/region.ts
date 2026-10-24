// Which body regions (and which side) a piece of clinical text is about, read
// deterministically from words in Italian, English, Spanish and French. Used
// to keep everything generated from a note on the case the clinician
// described: the exercises, the exercise picked from a database, the condition
// sheet with its protocol, the papers.
//
// Neighbouring regions count as pertinent (a shoulder programme can include
// scapular and thoracic work; a knee programme hamstrings and calf). Anything
// outside the neighbourhood of every region of the case is incompatible.
// Four outcomes are kept apart (regionFit): a recognised, compatible region; a
// genuinely general activity (aerobic work such as a stationary bike); a region
// that is not recognised, which is never assumed pertinent ("unknown": shown
// as not verified, the clinician decides); an incompatible region.
//
// The case is what the clinician describes as today's problem (caseProfile):
// statements about history ("in anamnesi…", "pregresso…", "ora
// asintomatico"), negated ones ("nega dolore lombare") and self-corrections
// in dictation ("ginocchio, no scusa, caviglia") do not make a region part of
// the case, and each side is tied to the region it is said with.

export type Region =
  | 'shoulder' | 'elbow' | 'wrist_hand' | 'cervical' | 'thoracic' | 'lumbar'
  | 'hip' | 'thigh' | 'knee' | 'lower_leg' | 'ankle_foot' | 'upper_limb' | 'lower_limb'

const TERMS: Record<Region, string[]> = {
  shoulder: ['pendolo', 'pendulum', 'codman', 'spalla', 'spalle', 'scapola', 'scapole', 'scapolare', 'scapolo omerale', 'scapolotoracica', 'cuffia', 'cuffia dei rotatori', 'sovraspinato', 'sovraspinoso', 'infraspinato', 'infraspinoso', 'sottoscapolare', 'deltoide', 'acromion', 'acromiale', 'subacromiale', 'glenoomerale', 'gleno omerale', 'capsulite adesiva', 'spalla congelata', 'clavicola', 'acromioclavicolare', 'shoulder', 'shoulders', 'rotator cuff', 'supraspinatus', 'infraspinatus', 'subscapularis', 'deltoid', 'scapula', 'scapular', 'glenohumeral', 'subacromial', 'frozen shoulder', 'adhesive capsulitis', 'clavicle', 'acromioclavicular', 'pettorale', 'pettorali', 'pectoral', 'pectorals', 'pectoralis', 'trapezio', 'trapezius', 'hombro', 'hombros', 'manguito rotador', 'escapula', 'epaule', 'epaules', 'coiffe des rotateurs', 'omoplate'],
  elbow: ['gomito', 'gomiti', 'epicondilo', 'epicondilite', 'epitroclea', 'epitrocleite', 'olecrano', 'elbow', 'elbows', 'epicondyle', 'epicondylitis', 'epicondylalgia', 'tennis elbow', 'golfer', 'olecranon', 'codo', 'epicondilitis', 'coude', 'epicondylite'],
  wrist_hand: ['polso', 'polsi', 'mano', 'mani', 'dito', 'dita', 'pollice', 'carpo', 'carpale', 'tunnel carpale', 'de quervain', 'wrist', 'wrists', 'hand', 'hands', 'finger', 'fingers', 'thumb', 'carpal', 'carpal tunnel', 'muneca', 'dedo', 'dedos', 'pulgar', 'poignet', 'poignets', 'doigt', 'doigts', 'pouce', 'canal carpien'],
  cervical: ['cervicale', 'cervicali', 'collo', 'cervicalgia', 'cervicobrachialgia', 'colpo di frusta', 'rachide cervicale', 'neck', 'cervical', 'whiplash', 'cuello', 'cervicalgia', 'cou', 'cervicalgie', 'nuque', 'chin tuck', 'retrazione del mento'],
  // Not the bare word 'dorsale': "flessione dorsale" is the ankle.
  thoracic: ['toracico', 'toracica', 'rachide dorsale', 'rachide toracico', 'costole', 'costale', 'dorsalgia', 'thoracic', 'thoracic spine', 'rib', 'ribs', 'toracica', 'columna dorsal', 'costillas', 'thoracique', 'cotes', 'colonna dorsale', 'tratto dorsale'],
  lumbar: ['cat camel', 'gatto cammello', 'gatto e cammello', 'lombare', 'lombari', 'lombalgia', 'lombosciatalgia', 'lombosacrale', 'sciatica', 'sciatalgia', 'mal di schiena', 'rachide lombare', 'sacroiliaca', 'sacroiliache', 'low back', 'low back pain', 'lumbar', 'lumbago', 'lumbosacral', 'sacroiliac', 'lumbalgia', 'lumbar', 'ciatica', 'lombaire', 'lombalgie', 'sciatique', 'lombo'],
  // Not 'anche' (the plural of anca is also the everyday word for "also").
  hip: ['anca', 'coxartrosi', 'coxofemorale', 'gluteo', 'glutei', 'gluteo medio', 'piriforme', 'trocantere', 'trocanterica', 'trocanterite', 'inguine', 'inguinale', 'femoroacetabolare', 'hip', 'hips', 'gluteal', 'gluteus', 'glute', 'glutes', 'piriformis', 'trochanter', 'trochanteric', 'groin', 'femoroacetabular', 'cadera', 'caderas', 'gluteo', 'ingle', 'hanche', 'hanches', 'fessier', 'aine', 'coxarthrose'],
  thigh: ['coscia', 'cosce', 'ischiocrurali', 'ischiocrurale', 'bicipite femorale', 'quadricipite', 'quadricipiti', 'adduttori', 'adduttore', 'hamstring', 'hamstrings', 'quadriceps', 'quads', 'thigh', 'adductor', 'adductors', 'isquiotibiales', 'isquiotibial', 'cuadriceps', 'muslo', 'aductores', 'ischio jambiers', 'ischiojambiers', 'cuisse', 'adducteurs'],
  knee: ['ginocchio', 'ginocchia', 'rotula', 'rotuleo', 'rotulea', 'femororotuleo', 'femoro rotuleo', 'menisco', 'meniscale', 'crociato', 'lca', 'gonartrosi', 'knee', 'knees', 'patella', 'patellar', 'patellofemoral', 'meniscus', 'meniscal', 'cruciate', 'acl', 'pcl', 'rodilla', 'rodillas', 'rotuliano', 'menisco', 'genou', 'genoux', 'rotulien', 'menisque', 'ligament croise'],
  lower_leg: ['polpaccio', 'polpacci', 'gastrocnemio', 'gastrocnemi', 'soleo', 'tibia', 'tibiale', 'periostite', 'calf', 'calves', 'gastrocnemius', 'soleus', 'shin', 'shin splints', 'tibial', 'pantorrilla', 'gemelos', 'mollet', 'tibia'],
  ankle_foot: ['caviglia', 'caviglie', 'piede', 'piedi', 'tallone', 'achille', 'achilleo', 'achillea', 'fascite plantare', 'fascia plantare', 'alluce', 'avampiede', 'tarso', 'metatarso', 'metatarsale', 'ankle', 'ankles', 'foot', 'feet', 'heel', 'achilles', 'plantar', 'plantar fascia', 'plantar fasciitis', 'toe', 'toes', 'hallux', 'tobillo', 'tobillos', 'pie', 'pies', 'talon', 'aquiles', 'cheville', 'chevilles', 'pied', 'pieds', 'orteil', 'achilleen'],
  upper_limb: ['braccio', 'braccia', 'arto superiore', 'avambraccio', 'arm', 'arms', 'upper limb', 'upper extremity', 'forearm', 'brazo', 'antebrazo', 'bras', 'avant bras', 'membre superieur', 'tricipite', 'tricipiti', 'triceps', 'bicipite brachiale', 'biceps curl', 'curl bicipiti'],
  lower_limb: ['gamba', 'gambe', 'arto inferiore', 'arti inferiori', 'monopodalico', 'monopodalica', 'leg', 'legs', 'lower limb', 'lower extremity', 'single leg', 'single-leg', 'pierna', 'piernas', 'jambe', 'jambes', 'membre inferieur', 'unipodal',
    // Exercises that name no joint but load the lower limb.
    'squat', 'squats', 'affondo', 'affondi', 'lunge', 'lunges', 'step up', 'sentadilla', 'sentadillas', 'fente', 'fentes'],
}

// Pertinent neighbourhood of each region (itself included).
const NEAR: Record<Region, Region[]> = {
  shoulder: ['shoulder', 'cervical', 'thoracic', 'upper_limb'],
  elbow: ['elbow', 'wrist_hand', 'shoulder', 'upper_limb'],
  wrist_hand: ['wrist_hand', 'elbow', 'upper_limb'],
  upper_limb: ['upper_limb', 'shoulder', 'elbow', 'wrist_hand'],
  // Symptoms from the neck and the low back often radiate down the limb.
  cervical: ['cervical', 'thoracic', 'shoulder', 'upper_limb'],
  thoracic: ['thoracic', 'cervical', 'lumbar', 'shoulder'],
  lumbar: ['lumbar', 'thoracic', 'hip', 'thigh', 'lower_limb'],
  hip: ['hip', 'lumbar', 'thigh', 'knee', 'lower_limb'],
  thigh: ['thigh', 'hip', 'knee', 'lumbar', 'lower_limb'],
  knee: ['knee', 'thigh', 'lower_leg', 'hip', 'ankle_foot', 'lower_limb'],
  lower_leg: ['lower_leg', 'knee', 'ankle_foot', 'lower_limb'],
  ankle_foot: ['ankle_foot', 'lower_leg', 'knee', 'lower_limb'],
  lower_limb: ['lower_limb', 'hip', 'thigh', 'knee', 'lower_leg', 'ankle_foot'],
}

export const normalize = (s: string) =>
  ` ${s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim()} `
const tokens = (s: string) => normalize(s).trim().split(' ').filter(Boolean)

const COMPILED = (Object.entries(TERMS) as [Region, string[]][]).map(([region, terms]) => ({
  region,
  terms: Array.from(new Set(terms.map((t) => normalize(t)))),
}))

/** The regions a text names, as whole words (anywhere, whatever the context). */
export function regionsOf(text: string | null | undefined): Region[] {
  const t = normalize(text ?? '')
  return COMPILED.filter((r) => r.terms.some((term) => t.includes(term))).map((r) => r.region)
}

// The Exercises section's body_region codes (app/dashboard/exercise-library) and
// wger categories that the words above do not already cover. Whole-body and
// core are not general: they stay "not recognised".
const ZONE: Record<string, Region> = {
  chest: 'shoulder', biceps: 'upper_limb', triceps: 'upper_limb', forearm: 'upper_limb',
}

/** The regions of a database exercise: its name, body region and primary muscle. */
export function exerciseRegions(ex: { name?: string | null; body_region?: string | null; primary_muscle?: string | null }): Region[] {
  const zone = ZONE[normalize(ex.body_region ?? '').trim()]
  return Array.from(new Set([...regionsOf(`${ex.name ?? ''} ${ex.body_region ?? ''} ${ex.primary_muscle ?? ''}`), ...(zone ? [zone] : [])]))
}

/** Every region pertinent to a set of regions (each one plus its neighbours). */
export function pertinentTo(regions: Region[]): Set<Region> {
  return new Set(regions.flatMap((r) => NEAR[r]))
}

// Activities that are general by nature (aerobic conditioning), named as such.
const GENERAL = ['cyclette', 'bicicletta', 'bicicletta stazionaria', 'cicloergometro', 'bici', 'stationary bike', 'exercise bike', 'stationary cycling', 'cycling', 'camminata', 'camminare', 'passeggiata', 'walking', 'brisk walking', 'walk', 'treadmill', 'tapis roulant', 'nuoto', 'swimming', 'aquatic exercise', 'ellittica', 'elliptical', 'attivita aerobica', 'esercizio aerobico', 'aerobic exercise', 'aerobic', 'aerobico', 'cardio', 'bicicleta estatica', 'caminar', 'caminata', 'marcha', 'natacion', 'velo d appartement', 'velo', 'marche', 'natation'].map(normalize)

/** Whether a text names a genuinely general activity (aerobic conditioning). */
export const isGeneralActivity = (text: string | null | undefined) => {
  const t = normalize(text ?? '')
  return GENERAL.some((g) => t.includes(g))
}

export type Fit = 'compatible' | 'general' | 'unknown' | 'incompatible'

/**
 * How something about `itemRegions` relates to a case about `caseRegions`:
 * a region of the item is pertinent to the case ('compatible'); none is
 * ('incompatible'); the item names no region but is a general activity
 * ('general'); or there is nothing to judge by, on either side ('unknown',
 * never assumed pertinent).
 */
export function regionFit(itemRegions: Region[], caseRegions: Region[], general = false): Fit {
  if (itemRegions.length && caseRegions.length) return itemRegions.some((r) => pertinentTo(caseRegions).has(r)) ? 'compatible' : 'incompatible'
  if (general && !itemRegions.length) return 'general'
  return 'unknown'
}

/** regionFit for a database or note exercise. */
export const exerciseFit = (ex: { name?: string | null; body_region?: string | null; primary_muscle?: string | null }, caseRegions: Region[]) =>
  regionFit(exerciseRegions(ex), caseRegions, isGeneralActivity(ex.name))

// ---------------------------------------------------------------- side

export type Side = 'left' | 'right'
const LEFT = new Set(['sinistra', 'sinistro', 'sinistre', 'sinistri', 'sx', 'left', 'izquierda', 'izquierdo', 'gauche', 'gauches'])
const RIGHT = new Set(['destra', 'destro', 'destre', 'destri', 'dx', 'right', 'derecha', 'derecho', 'droite', 'droit', 'droites'])
const BOTH = [' bilaterale ', ' bilaterali ', ' entrambi ', ' entrambe ', ' bilateral ', ' both ', ' ambos ', ' ambas ', ' les deux ', ' bilateraux ']

// ---------------------------------------------------------------- statements

export type Status = 'active' | 'history' | 'negated'
const has = (t: string, words: string[]) => words.some((w) => t.includes(w))
// Explicitly about now: wins over history words ("operato anni fa, oggi dolore").
const NOW = [' oggi ', ' attualmente ', ' attuale ', ' adesso ', ' today ', ' currently ', ' now ', ' hoy ', ' actualmente ', ' aujourd hui ', ' actuellement ']
const NEGATED = [' nessun ', ' nessuna ', ' nessuno ', ' nega ', ' negato ', ' negata ', ' assente ', ' assenza di ', ' non riferisce ', ' non lamenta ', ' non dolente ', ' senza dolore ', ' non fa piu male ', ' no pain ', ' denies ', ' denied ', ' without pain ', ' sin dolor ', ' niega ', ' sans douleur ', ' aucun ', ' aucune ']
// Not "precedente"/"previous" alone: "rispetto alla seduta precedente" is about today.
const HISTORY = [' anamnesi ', ' anamnestic', ' anamnesis ', ' in passato ', ' pregress', ' storia di ', ' history of ', ' past medical ', ' asintomatic', ' risolt', ' guarit', ' resolved ', ' asymptomatic ', ' no longer ', ' antecedent', ' asymptomatique ']
const UNRESOLVED = [' non risolt', ' non guarit', ' not resolved ', ' unresolved ', ' no resuelt', ' non resolu']
const SYMPTOM = [' dolore ', ' dolori ', ' dolente ', ' fa male ', ' male ', ' rigidit', ' gonfior', ' edema ', ' formicol', ' trattat', ' trattament', ' lamenta ', ' riferisce ', ' pain ', ' painful ', ' stiff', ' swelling ', ' treated ', ' dolor ', ' douleur ', ' sospett', ' suspected ']
const LONG_AGO = [' anni fa ', ' years ago ', ' anos atras ', ' il y a ans ']
// A dictated self-correction: what was named before it is withdrawn.
const CORRECTION = [' no scusa ', ' scusa no ', ' anzi ', ' cioe no ', ' i mean ', ' sorry ', ' perdon ', ' pardon ']

/** A text in statements (sentences and clauses), each current, about history, or negated. */
export function statementsOf(text: string | null | undefined): { text: string; status: Status }[] {
  const out: { text: string; status: Status }[] = []
  let carried: Status = 'active'
  for (const part of (text ?? '').split(/[.;:!?\n]+|,|\s+(?:ma|but|pero|mais)\s+/i)) {
    if (!part.trim()) continue
    const t = normalize(part)
    let status: Status
    if (has(t, NEGATED)) status = 'negated'
    else if (has(t, NOW)) status = 'active'
    else if (has(t, HISTORY) && !has(t, UNRESOLVED)) status = 'history'
    else if (has(t, SYMPTOM)) status = 'active'
    else if (has(t, LONG_AGO)) status = 'history'
    else status = carried
    if (status !== 'negated') carried = status
    out.push({ text: part, status })
  }
  return out
}

export type Mention = { region: Region; side: Side | 'both' | null }

/**
 * The regions a statement names, each with the side said next to it
 * ("spalla destra e ginocchio sinistro": shoulder right, knee left).
 */
export function mentionsOf(statement: string): Mention[] {
  let words = tokens(statement)
  const joined = ` ${words.join(' ')} `
  const cut = Math.max(-1, ...CORRECTION.map((c) => (joined.lastIndexOf(c) >= 0 ? joined.lastIndexOf(c) + c.length - 1 : -1)))
  if (cut >= 0) words = joined.slice(cut).trim().split(' ').filter(Boolean)
  const both = has(` ${words.join(' ')} `, BOTH)
  const found: { region: Region; start: number; end: number }[] = []
  for (const { region, terms } of COMPILED) {
    for (const term of terms) {
      const tw = term.trim().split(' ')
      for (let i = 0; i + tw.length <= words.length; i++) {
        if (tw.every((w, k) => words[i + k] === w)) found.push({ region, start: i, end: i + tw.length - 1 })
      }
    }
  }
  const sides = words.map((w, i) => ({ i, side: LEFT.has(w) ? ('left' as const) : RIGHT.has(w) ? ('right' as const) : null })).filter((x) => x.side)
  const regions = Array.from(new Set(found.map((f) => f.region)))
  const out = new Map<Region, Set<Side | 'both'>>()
  for (const f of found) {
    const set = out.get(f.region) ?? new Set()
    out.set(f.region, set)
    if (both) { set.add('both'); continue }
    // The nearest side word within three words, after the region first ("spalla destra"), then before ("right shoulder").
    const near = sides
      .map((x) => ({ ...x, d: x.i > f.end ? x.i - f.end : f.start - x.i, after: x.i > f.end }))
      .filter((x) => x.d > 0 && x.d <= 3)
      .sort((a, b) => a.d - b.d || Number(b.after) - Number(a.after))[0]
    if (near) set.add(near.side!)
    else if (regions.length === 1 && new Set(sides.map((x) => x.side)).size === 1) set.add(sides[0].side!)
  }
  return Array.from(out.entries()).map(([region, set]) => ({
    region,
    side: set.has('both') || (set.has('left') && set.has('right')) ? 'both' : set.has('left') ? 'left' : set.has('right') ? 'right' : null,
  }))
}

export type CaseProfile = {
  /** Regions of today's problem, as the clinician describes it. */
  active: Region[]
  /** Regions named only in history (past problems, now resolved). */
  history: Region[]
  /** Regions named only as negated ("nega dolore lombare"). */
  negated: Region[]
  /** The side given for each region of today's problem. */
  sides: Partial<Record<Region, Side | 'both'>>
}

/** Today's case in the clinician's words: active regions with their side, history, negations. */
export function caseProfile(text: string | null | undefined): CaseProfile {
  const active = new Map<Region, Set<Side | 'both'>>()
  const history = new Set<Region>()
  const negated = new Set<Region>()
  for (const s of statementsOf(text)) {
    for (const m of mentionsOf(s.text)) {
      if (s.status === 'history') history.add(m.region)
      else if (s.status === 'negated') negated.add(m.region)
      else {
        const set = active.get(m.region) ?? new Set()
        if (m.side) set.add(m.side)
        active.set(m.region, set)
      }
    }
  }
  const sides: CaseProfile['sides'] = {}
  for (const [region, set] of Array.from(active.entries())) {
    if (set.has('both') || (set.has('left') && set.has('right'))) sides[region] = 'both'
    else if (set.size === 1) sides[region] = Array.from(set)[0]
  }
  const act = Array.from(active.keys())
  return { active: act, history: Array.from(history).filter((r) => !active.has(r)), negated: Array.from(negated).filter((r) => !active.has(r) && !history.has(r)), sides }
}

/**
 * Sides a generated text gets wrong: a region named with the side opposite to
 * the one the clinician gave for it. A side named without any region is
 * judged against the case only when the case has a single side.
 */
export function sideContradictions(generated: string, profile: CaseProfile): Region[] {
  const out = new Set<Region>()
  const given = Array.from(new Set(Object.values(profile.sides).filter((s) => s !== 'both')))
  for (const s of statementsOf(generated)) {
    if (s.status !== 'active') continue
    const mentions = mentionsOf(s.text)
    for (const m of mentions) {
      const said = profile.sides[m.region]
      if (said && said !== 'both' && m.side && m.side !== 'both' && m.side !== said) out.add(m.region)
    }
    if (mentions.length === 0 && given.length === 1 && Object.values(profile.sides).every((x) => x !== 'both')) {
      const words = tokens(s.text)
      const opposite = given[0] === 'left' ? RIGHT : LEFT
      const same = given[0] === 'left' ? LEFT : RIGHT
      if (words.some((w) => opposite.has(w)) && !words.some((w) => same.has(w))) out.add(Object.keys(profile.sides)[0] as Region)
    }
  }
  return Array.from(out)
}
