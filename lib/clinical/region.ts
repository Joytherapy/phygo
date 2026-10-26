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
  // The spine named without a level is thoracic and lumbar ("colonna", "spine"); a level, when given, wins ("rachide cervicale").
  thoracic: ['colonna vertebrale', 'colonna', 'rachide', 'vertebrale', 'vertebrali', 'spine', 'spinal', 'vertebral', 'columna vertebral', 'columna', 'colonne vertebrale', 'colonne', 'rachis', 'toracico', 'toracica', 'rachide dorsale', 'rachide toracico', 'costole', 'costale', 'dorsalgia', 'thoracic', 'thoracic spine', 'rib', 'ribs', 'toracica', 'columna dorsal', 'costillas', 'thoracique', 'cotes', 'colonna dorsale', 'tratto dorsale'],
  lumbar: ['colonna vertebrale', 'colonna', 'rachide', 'vertebrale', 'vertebrali', 'spine', 'spinal', 'vertebral', 'columna vertebral', 'columna', 'colonne vertebrale', 'colonne', 'rachis', 'tronco', 'trunk', 'tronc', 'core', 'addome', 'addominali', 'addominale', 'abdomen', 'abdominal', 'abdominals', 'abdominales', 'abdominaux', 'bacino', 'pelvi', 'pelvico', 'pelvica', 'pelvis', 'pelvic', 'pelvien', 'pelvienne', 'plank', 'planks', 'plancia', 'bird dog', 'dead bug', 'cat camel', 'gatto cammello', 'gatto e cammello', 'lombare', 'lombari', 'lombalgia', 'lombosciatalgia', 'lombosacrale', 'sciatica', 'sciatalgia', 'mal di schiena', 'rachide lombare', 'sacroiliaca', 'sacroiliache', 'low back', 'low back pain', 'lumbar', 'lumbago', 'lumbosacral', 'sacroiliac', 'lumbalgia', 'lumbar', 'ciatica', 'lombaire', 'lombalgie', 'sciatique', 'lombo'],
  // Not 'anche' (the plural of anca is also the everyday word for "also").
  hip: ['bacino', 'pelvi', 'pelvis', 'pelvic', 'anca', 'coxartrosi', 'coxofemorale', 'gluteo', 'glutei', 'gluteo medio', 'piriforme', 'trocantere', 'trocanterica', 'trocanterite', 'inguine', 'inguinale', 'femoroacetabolare', 'hip', 'hips', 'gluteal', 'gluteus', 'glute', 'glutes', 'piriformis', 'trochanter', 'trochanteric', 'groin', 'femoroacetabular', 'cadera', 'caderas', 'gluteo', 'ingle', 'hanche', 'hanches', 'fessier', 'aine', 'coxarthrose'],
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
// Terms by their first word, for a fast scan.
const BY_FIRST = new Map<string, { region: Region; words: string[] }[]>()
for (const { region, terms } of COMPILED) {
  for (const t of terms) {
    const words = t.trim().split(' ')
    BY_FIRST.set(words[0], [...(BY_FIRST.get(words[0]) ?? []), { region, words }])
  }
}

/**
 * Where region terms occur in words. A longer term wins over a shorter one it
 * contains, whatever its region ("rachide cervicale" is cervical, not also the
 * generic spine of "rachide").
 */
export function termHits(words: string[]): { region: Region; start: number; end: number }[] {
  const hits: { region: Region; start: number; end: number }[] = []
  words.forEach((w, i) => {
    for (const t of BY_FIRST.get(w) ?? []) if (t.words.every((x, k) => words[i + k] === x)) hits.push({ region: t.region, start: i, end: i + t.words.length - 1 })
  })
  return hits.filter((h) => !hits.some((g) => g !== h && g.start <= h.start && g.end >= h.end && g.end - g.start > h.end - h.start))
}

/** The regions a text names, as whole words (anywhere, whatever the context). */
export function regionsOf(text: string | null | undefined): Region[] {
  const found = new Set(termHits(normalize(text ?? '').trim().split(' ').filter(Boolean)).map((h) => h.region))
  return COMPILED.map((r) => r.region).filter((r) => found.has(r))
}

// The Exercises section's body_region codes (app/dashboard/exercise-library) and
// wger categories that the words above do not already cover. Whole-body and
// core are not general: they stay "not recognised".
const ZONE: Record<string, Region> = {
  chest: 'shoulder', biceps: 'upper_limb', triceps: 'upper_limb', forearm: 'upper_limb', 'core abdomen': 'lumbar',
}

// Which region an exercise works on, from how a body part is used in its
// description, not from the mere presence of a region's name:
// - the part a movement acts on is the target ("flessione del gomito",
//   "rotazione esterna spalla destra", "mobilizzazione della colonna");
// - a part that only gives the position is not ("con le ginocchia flesse",
//   "gomito vicino al corpo", "gomito a 90° al fianco", "braccia tese");
// - a part named as the purpose is not ("flessione laterale del tronco per la
//   spalla destra" works the trunk);
// - with no target named, the movement can tell it ("rotazione esterna" is a
//   shoulder or hip movement, "ponte" a hip one); otherwise it is unknown.
const OF_WORDS = new Set(['di', 'del', 'della', 'dello', 'dei', 'degli', 'delle', 'dell', 'd', 'of', 'du', 'de', 'des'])
const WITH_WORDS = new Set(['con', 'col', 'coi', 'tenendo', 'mantenendo', 'keeping', 'with', 'avec', 'manteniendo', 'en', 'in'])
const PURPOSE_WORDS = new Set(['per', 'for', 'para', 'pour'])
const ARTICLES = new Set(['il', 'lo', 'la', 'l', 'i', 'gli', 'le', 'the', 'your', 'el', 'los', 'las', 'les', 'un', 'una', 'a', 'al', 'alla', 'allo', 'ai', 'alle', 'agli'])
const POSITION_WORDS = new Set(['vicino', 'vicina', 'vicini', 'vicine', 'aderente', 'aderenti', 'attaccato', 'attaccata', 'attaccati', 'attaccate', 'appoggiato', 'appoggiata', 'appoggiati', 'appoggiate', 'flesso', 'flessa', 'flessi', 'flesse', 'piegato', 'piegata', 'piegati', 'piegate', 'esteso', 'estesa', 'estesi', 'estese', 'teso', 'tesa', 'tesi', 'tese', 'fermo', 'ferma', 'fermi', 'bloccato', 'bloccata', 'fianco', 'fianchi', 'corpo', 'terra', 'divaricate', 'divaricati', 'close', 'near', 'against', 'bent', 'straight', 'tucked', 'pinned', 'side', 'sides', 'apart', 'floor', 'junto', 'pegado', 'pegada', 'apoyado', 'apoyada', 'flexionado', 'flexionada', 'contre', 'pres', 'plie', 'plies', 'tendu', 'tendus'])
const MOVEMENT_REGIONS: [string[], Region[]][] = [
  [['rotazione esterna', 'rotazioni esterne', 'extrarotazione', 'external rotation', 'rotacion externa', 'rotation externe', 'rotazione interna', 'rotazioni interne', 'intrarotazione', 'internal rotation', 'rotacion interna', 'rotation interne'], ['shoulder', 'hip']],
  [['abduzione', 'adduzione', 'abduction', 'adduction', 'abduccion', 'aduccion'], ['shoulder', 'hip']],
  [['ponte', 'bridge', 'puente', 'pont'], ['hip']],
]

/** The regions an exercise as written works on (positions and purposes are not regions). */
export function exerciseTextRegions(text: string | null | undefined): Region[] {
  const words = sentenceWords(text ?? '')
  const targets = new Set<Region>()
  for (const h of termHits(words)) {
    const before = words.slice(Math.max(0, h.start - 3), h.start)
    const back = (k: number) => before[before.length - k]
    // "per la spalla": purpose.
    let k = 1
    while (back(k) && ARTICLES.has(back(k)!)) k++
    if (back(k) && PURPOSE_WORDS.has(back(k)!)) continue
    // "del gomito", "di ginocchio": what the movement acts on.
    if (back(1) && OF_WORDS.has(back(1)!) || (back(2) && OF_WORDS.has(back(2)!) && ARTICLES.has(back(1)!))) {
      targets.add(h.region)
      continue
    }
    // "con le ginocchia", "gomito vicino al corpo", "gomito a 90": position.
    const withBefore = back(k) && WITH_WORDS.has(back(k)!)
    const after = words.slice(h.end + 1, h.end + 4)
    const cut = after.indexOf(BOUNDARY)
    const near = cut >= 0 ? after.slice(0, cut) : after
    const angle = near.some((w, i) => (w === 'a' || w === 'at') && /^\d+$/.test(near[i + 1] ?? ''))
    if (withBefore || angle || near.some((w) => POSITION_WORDS.has(w))) continue
    targets.add(h.region)
  }
  if (targets.size) return COMPILED.map((r) => r.region).filter((r) => targets.has(r))
  const joined = ` ${words.join(' ')} `
  const moved = new Set(MOVEMENT_REGIONS.filter(([terms]) => terms.some((t) => joined.includes(` ${t} `))).flatMap(([, regions]) => regions))
  return COMPILED.map((r) => r.region).filter((r) => moved.has(r))
}

/** The same text without its position phrases (kept for callers that need a string). */
export const withoutPositions = (text: string | null | undefined) => normalize(text ?? '')

/** Every single word that names a region in some language (to tell a region-only keyword). */
export const REGION_WORDS = new Set(Object.values(TERMS).flat().flatMap((t) => normalize(t).trim().split(' ')))

/** The regions of a database exercise: its name, body region and primary muscle. */
export function exerciseRegions(ex: { name?: string | null; body_region?: string | null; primary_muscle?: string | null }): Region[] {
  const zone = ZONE[normalize(ex.body_region ?? '').trim()]
  return Array.from(new Set([...exerciseTextRegions(ex.name), ...regionsOf(`${ex.body_region ?? ''} ${ex.primary_muscle ?? ''}`), ...(zone ? [zone] : [])]))
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
//
// Whether each region named in a text is part of today's problem, of the
// history, or negated is decided per mention, not per sentence: the nearest
// marker wins ("Paziente con pregresso intervento al ginocchio sinistro
// (asintomatico) e lombalgia attuale": knee history, low back current). Commas
// and brackets are soft boundaries (a marker beyond one counts as farther);
// sentences are hard ones. A negation before the mention in the same clause
// negates it. A history or resolution word next to a symptom or "now" word
// makes that word historical ("pregresso dolore", "attualmente asintomatico").

export type Status = 'active' | 'history' | 'negated'
type Kind = 'now' | 'symptom' | 'history' | 'resolved' | 'long_ago' | 'negation'
const MARKERS: Record<Kind, string[]> = {
  negation: ['nessun', 'nessuna', 'nessuno', 'nega', 'negato', 'negata', 'assente', 'assenti', 'assenza di', 'non riferisce', 'non lamenta', 'non dolente', 'senza dolore', 'non si rileva', 'non si rilevano', 'non si evidenzia', 'non si evidenziano', 'no pain', 'denies', 'denied', 'without pain', 'no evidence of', 'sin dolor', 'niega', 'sans douleur', 'aucun', 'aucune'],
  // "now" alone is not enough when next to a resolution word (see above).
  now: ['oggi', 'attualmente', 'attuale', 'adesso', 'today', 'currently', 'current', 'now', 'hoy', 'actualmente', 'aujourd hui', 'actuellement', 'trattat*', 'treated'],
  symptom: ['dolore', 'dolori', 'dolente', 'fa male', 'male', 'rigidit*', 'gonfior*', 'edema', 'formicol*', 'lamenta', 'riferisce', 'fastidio', 'pain', 'painful', 'stiff*', 'swelling', 'dolor', 'douleur', 'sospett*', 'suspected', 'non risolt*', 'non guarit*', 'not resolved', 'unresolved'],
  // Not "precedente"/"previous" alone: "rispetto alla seduta precedente" is about today.
  history: ['anamnesi', 'anamnestic*', 'anamnesis', 'in passato', 'pregress*', 'storia di', 'history of', 'past medical', 'antecedent*', 'operato in passato'],
  resolved: ['asintomatic*', 'asymptomatic', 'asymptomatique', 'risolt*', 'guarit*', 'resolved', 'healed', 'no longer', 'non piu dolente', 'non correlat*', 'unrelated', 'not related'],
  long_ago: ['anni fa', 'years ago', 'anos atras'],
}
const KIND_STATUS: Record<Exclude<Kind, 'negation'>, Status> = { now: 'active', symptom: 'active', history: 'history', resolved: 'history', long_ago: 'history' }
// A dictated self-correction: what was named before it is withdrawn.
const CORRECTION = ['no scusa', 'scusa no', 'anzi', 'cioe no', 'i mean', 'sorry', 'perdon', 'pardon']
const BOUNDARY = '|'

/** Words of a sentence, with commas, brackets and "ma/but" as boundary marks. */
function sentenceWords(sentence: string): string[] {
  return sentence
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[,()[\]]/g, ` ${BOUNDARY} `)
    .replace(/[^a-z0-9|]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (['ma', 'but', 'pero', 'mais'].includes(w) ? BOUNDARY : w))
}

/** Where a phrase occurs in words ("word*" matches any ending of the last word). */
function findPhrase(words: string[], phrase: string): { start: number; end: number }[] {
  const pw = phrase.split(' ')
  const out: { start: number; end: number }[] = []
  for (let i = 0; i + pw.length <= words.length; i++) {
    if (pw.every((p, k) => (p.endsWith('*') ? words[i + k].startsWith(p.slice(0, -1)) : words[i + k] === p))) out.push({ start: i, end: i + pw.length - 1 })
  }
  return out
}

const COMPILED_WORDS = COMPILED.map(({ region, terms }) => ({ region, terms: terms.map((t) => t.trim()) }))

export type Mention = { region: Region; side: Side | 'both' | null; status: Status }

/** Every region named in a text, with its side and whether it is current, history or negated. */
export function analyzeMentions(text: string | null | undefined): Mention[] {
  const out: Mention[] = []
  let carried: Status = 'active'
  for (const sentence of (text ?? '').split(/[.;:!?\n]+/)) {
    let words = sentenceWords(sentence)
    if (!words.length) continue
    for (const c of CORRECTION) {
      const hits = findPhrase(words, c)
      if (hits.length) words = words.slice(hits[hits.length - 1].end + 1)
    }
    const boundariesBetween = (a: number, b: number) => words.slice(Math.min(a, b) + 1, Math.max(a, b)).filter((w) => w === BOUNDARY).length
    // Markers, with words that are a condition in themselves ("lombalgia") as symptoms.
    const markers: { kind: Kind; start: number; end: number }[] = []
    for (const kind of Object.keys(MARKERS) as Kind[]) for (const m of MARKERS[kind]) for (const h of findPhrase(words, m)) markers.push({ kind, ...h })
    words.forEach((w, i) => { if (/(algia|algie|algy|dynia)$/.test(w)) markers.push({ kind: 'symptom', start: i, end: i }) })
    // "non risolto" is a symptom, not a resolution; drop the resolution found inside it.
    const unresolved = markers.filter((m) => m.kind === 'symptom' && words[m.start] === 'non' && /^(risolt|guarit)/.test(words[m.end] ?? ''))
    const marks = markers.filter((m) => !(m.kind === 'resolved' && unresolved.some((u) => u.end === m.end)))
    // A symptom or "now" next to a history or resolution word takes its meaning.
    for (const m of marks) {
      if (m.kind !== 'symptom' && m.kind !== 'now') continue
      const near = marks.find((x) => (x.kind === 'history' || x.kind === 'resolved') && x !== m && boundariesBetween(x.start, m.start) === 0 && (Math.abs(x.end - m.start) <= 2 || Math.abs(m.end - x.start) <= 2))
      if (near && !unresolved.includes(m)) m.kind = near.kind
    }
    // Overlapping terms (cuffia / cuffia dei rotatori, rachide / rachide cervicale): the longest, one per place.
    const hits = termHits(words)
    const mentions = hits.filter((f, i) => !hits.some((g, j) => j < i && g.region === f.region && g.start === f.start && g.end === f.end))
    // "Both" applies to the region it is said with ("entrambe le ginocchia",
    // "dolore bilaterale alle ginocchia"), not to every region of the sentence
    // ("spalla e ginocchio, trattati entrambi oggi").
    const bothAt = ['bilaterale', 'bilaterali', 'entrambi', 'entrambe', 'bilateral', 'both', 'ambos', 'ambas', 'les deux'].flatMap((w) => findPhrase(words, w))
    const sideWords = words.map((w, i) => ({ i, side: LEFT.has(w) ? ('left' as const) : RIGHT.has(w) ? ('right' as const) : null })).filter((x) => x.side)
    const sentenceStatus: Status[] = []
    for (const f of mentions) {
      // Negation before it in the same clause.
      const clauseStart = words.lastIndexOf(BOUNDARY, f.start) + 1
      const negated = marks.some((m) => m.kind === 'negation' && m.end < f.start && m.start >= clauseStart)
      let status: Status
      if (negated) status = 'negated'
      else {
        const nearest = marks
          .filter((m) => m.kind !== 'negation')
          .map((m) => {
            const overlap = m.start <= f.end && m.end >= f.start
            const gap = overlap ? 0 : m.start > f.end ? m.start - f.end - 1 : f.start - m.end - 1
            return { m, d: gap + 5 * boundariesBetween(m.start, f.start) }
          })
          .sort((a, b) => a.d - b.d)[0]
        status = nearest ? KIND_STATUS[nearest.m.kind as Exclude<Kind, 'negation'>] : carried
      }
      // Side: the nearest side word within three words, after the region first ("spalla destra"), then before ("right shoulder").
      let side: Mention['side'] = null
      if (bothAt.some((b) => (b.start > f.end ? b.start - f.end : f.start - b.end) <= 3 && boundariesBetween(b.start, f.start) === 0)) side = 'both'
      else {
        const near = sideWords
          .map((x) => ({ ...x, d: x.i > f.end ? x.i - f.end : f.start - x.i, after: x.i > f.end }))
          .filter((x) => x.d > 0 && x.d <= 3 && boundariesBetween(x.i, f.start) === 0)
          .sort((a, b) => a.d - b.d || Number(b.after) - Number(a.after))[0]
        if (near) side = near.side
        else if (new Set(mentions.map((m) => m.region)).size === 1 && new Set(sideWords.map((x) => x.side)).size === 1) side = sideWords[0].side
      }
      sentenceStatus.push(status)
      out.push({ region: f.region, side, status })
    }
    // A sentence without regions passes its meaning on ("Oggi lombalgia. Trattata con…").
    const own = marks.filter((m) => m.kind !== 'negation').sort((a, b) => b.end - a.end)[0]
    if (sentenceStatus.length) carried = sentenceStatus.includes('active') ? 'active' : sentenceStatus[sentenceStatus.length - 1] === 'negated' ? carried : 'history'
    else if (own) carried = KIND_STATUS[own.kind as Exclude<Kind, 'negation'>]
  }
  return out
}

/** The regions a text names, each with the side said next to it (whatever their status). */
export function mentionsOf(text: string): { region: Region; side: Side | 'both' | null }[] {
  const merged = new Map<Region, Set<Side | 'both'>>()
  for (const m of analyzeMentions(text)) {
    const set = merged.get(m.region) ?? new Set()
    if (m.side) set.add(m.side)
    merged.set(m.region, set)
  }
  return Array.from(merged.entries()).map(([region, set]) => ({ region, side: set.has('both') || (set.has('left') && set.has('right')) ? 'both' : set.has('left') ? 'left' : set.has('right') ? 'right' : null }))
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
  for (const m of analyzeMentions(text)) {
    if (m.status === 'history') history.add(m.region)
    else if (m.status === 'negated') negated.add(m.region)
    else {
      const set = active.get(m.region) ?? new Set()
      if (m.side) set.add(m.side)
      active.set(m.region, set)
    }
  }
  const sides: CaseProfile['sides'] = {}
  for (const [region, set] of Array.from(active.entries())) {
    if (set.has('both') || (set.has('left') && set.has('right'))) sides[region] = 'both'
    else if (set.size === 1) sides[region] = Array.from(set)[0]
  }
  return { active: Array.from(active.keys()), history: Array.from(history).filter((r) => !active.has(r)), negated: Array.from(negated).filter((r) => !active.has(r) && !history.has(r)), sides }
}

/**
 * Sides a generated text gets wrong: a current mention of a region with the
 * side opposite to the one the clinician gave for it. A side named without
 * any region is judged against the case only when the case has a single side.
 */
export function sideContradictions(generated: string, profile: CaseProfile): Region[] {
  const out = new Set<Region>()
  for (const m of analyzeMentions(generated)) {
    if (m.status !== 'active') continue
    const said = profile.sides[m.region]
    if (said && said !== 'both' && m.side && m.side !== 'both' && m.side !== said) out.add(m.region)
  }
  const given = Object.entries(profile.sides)
  if (given.length === 1 && given[0][1] !== 'both') {
    const [region, side] = given[0] as [Region, Side]
    for (const sentence of generated.split(/[.;:!?\n]+/)) {
      if (analyzeMentions(sentence).length) continue
      const words = sentenceWords(sentence)
      const opposite = side === 'left' ? RIGHT : LEFT
      const same = side === 'left' ? LEFT : RIGHT
      if (words.some((w) => opposite.has(w)) && !words.some((w) => same.has(w))) out.add(region)
    }
  }
  return Array.from(out)
}
