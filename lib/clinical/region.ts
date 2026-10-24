// Which body regions (and which side) a piece of clinical text is about, read
// deterministically from words in Italian, English, Spanish and French. Used
// to keep everything generated from a note on the case the clinician
// described: the exercises, the exercise picked from a database, the condition
// sheet with its protocol, the papers. Whatever names no region is "general"
// (e.g. a stationary bike) and is never judged by region.
//
// Neighbouring regions count as pertinent (a shoulder programme can include
// scapular and thoracic work; a knee programme hamstrings and calf). Anything
// outside the neighbourhood of every region the note names is off-region:
// kept out unless the note itself names that region too (multi-site cases).

export type Region =
  | 'shoulder' | 'elbow' | 'wrist_hand' | 'cervical' | 'thoracic' | 'lumbar'
  | 'hip' | 'thigh' | 'knee' | 'lower_leg' | 'ankle_foot' | 'upper_limb' | 'lower_limb'

const TERMS: Record<Region, string[]> = {
  shoulder: ['spalla', 'spalle', 'scapola', 'scapole', 'scapolare', 'scapolo omerale', 'scapolotoracica', 'cuffia', 'cuffia dei rotatori', 'sovraspinato', 'sovraspinoso', 'infraspinato', 'infraspinoso', 'sottoscapolare', 'deltoide', 'acromion', 'acromiale', 'subacromiale', 'glenoomerale', 'gleno omerale', 'capsulite adesiva', 'spalla congelata', 'clavicola', 'acromioclavicolare', 'shoulder', 'shoulders', 'rotator cuff', 'supraspinatus', 'infraspinatus', 'subscapularis', 'deltoid', 'scapula', 'scapular', 'glenohumeral', 'subacromial', 'frozen shoulder', 'adhesive capsulitis', 'clavicle', 'acromioclavicular', 'pettorale', 'pettorali', 'pectoral', 'pectorals', 'pectoralis', 'trapezio', 'trapezius', 'hombro', 'hombros', 'manguito rotador', 'escapula', 'epaule', 'epaules', 'coiffe des rotateurs', 'omoplate'],
  elbow: ['gomito', 'gomiti', 'epicondilo', 'epicondilite', 'epitroclea', 'epitrocleite', 'olecrano', 'elbow', 'elbows', 'epicondyle', 'epicondylitis', 'epicondylalgia', 'tennis elbow', 'golfer', 'olecranon', 'codo', 'epicondilitis', 'coude', 'epicondylite'],
  wrist_hand: ['polso', 'polsi', 'mano', 'mani', 'dito', 'dita', 'pollice', 'carpo', 'carpale', 'tunnel carpale', 'de quervain', 'wrist', 'wrists', 'hand', 'hands', 'finger', 'fingers', 'thumb', 'carpal', 'carpal tunnel', 'muneca', 'dedo', 'dedos', 'pulgar', 'poignet', 'poignets', 'doigt', 'doigts', 'pouce', 'canal carpien'],
  cervical: ['cervicale', 'cervicali', 'collo', 'cervicalgia', 'cervicobrachialgia', 'colpo di frusta', 'rachide cervicale', 'neck', 'cervical', 'whiplash', 'cuello', 'cervicalgia', 'cou', 'cervicalgie', 'nuque', 'chin tuck', 'retrazione del mento'],
  // Not the bare word 'dorsale': "flessione dorsale" is the ankle.
  thoracic: ['toracico', 'toracica', 'rachide dorsale', 'rachide toracico', 'costole', 'costale', 'dorsalgia', 'thoracic', 'thoracic spine', 'rib', 'ribs', 'toracica', 'columna dorsal', 'costillas', 'thoracique', 'cotes', 'colonna dorsale', 'tratto dorsale'],
  lumbar: ['lombare', 'lombari', 'lombalgia', 'lombosciatalgia', 'lombosacrale', 'sciatica', 'sciatalgia', 'mal di schiena', 'rachide lombare', 'sacroiliaca', 'sacroiliache', 'low back', 'low back pain', 'lumbar', 'lumbago', 'lumbosacral', 'sacroiliac', 'lumbalgia', 'lumbar', 'ciatica', 'lombaire', 'lombalgie', 'sciatique', 'lombo'],
  hip: ['anca', 'anche', 'coxartrosi', 'coxofemorale', 'gluteo', 'glutei', 'gluteo medio', 'piriforme', 'trocantere', 'trocanterica', 'trocanterite', 'inguine', 'inguinale', 'femoroacetabolare', 'hip', 'hips', 'gluteal', 'gluteus', 'glute', 'glutes', 'piriformis', 'trochanter', 'trochanteric', 'groin', 'femoroacetabular', 'cadera', 'caderas', 'gluteo', 'ingle', 'hanche', 'hanches', 'fessier', 'aine', 'coxarthrose'],
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

const COMPILED = (Object.entries(TERMS) as [Region, string[]][]).map(([region, terms]) => ({
  region,
  terms: Array.from(new Set(terms.map((t) => normalize(t)))),
}))

/** The regions a text names, as whole words. */
export function regionsOf(text: string | null | undefined): Region[] {
  const t = normalize(text ?? '')
  return COMPILED.filter((r) => r.terms.some((term) => t.includes(term))).map((r) => r.region)
}

// The Exercises section's body_region codes (app/dashboard/exercise-library) and
// wger categories that the words above do not already cover. Whole-body,
// core and cardio stay general.
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

/**
 * Whether something about `itemRegions` fits a case about `noteRegions`.
 * No region on either side means it cannot be judged by region: it fits.
 */
export function fitsCase(itemRegions: Region[], noteRegions: Region[]): boolean {
  if (itemRegions.length === 0 || noteRegions.length === 0) return true
  const near = pertinentTo(noteRegions)
  return itemRegions.some((r) => near.has(r))
}

// ---------------------------------------------------------------- side

export type Side = 'left' | 'right'
const LEFT = [' sinistra ', ' sinistro ', ' sinistre ', ' sinistri ', ' sx ', ' left ', ' izquierda ', ' izquierdo ', ' gauche ', ' gauches ']
const RIGHT = [' destra ', ' destro ', ' destre ', ' destri ', ' dx ', ' right ', ' derecha ', ' derecho ', ' droite ', ' droit ', ' droites ']
const BOTH = [' bilaterale ', ' bilaterali ', ' entrambi ', ' entrambe ', ' bilateral ', ' both ', ' ambos ', ' ambas ', ' les deux ', ' bilateraux ']

export function sidesOf(text: string | null | undefined): Side[] {
  const t = normalize(text ?? '')
  const out: Side[] = []
  if (LEFT.some((w) => t.includes(w))) out.push('left')
  if (RIGHT.some((w) => t.includes(w))) out.push('right')
  return out
}
export const mentionsBothSides = (text: string | null | undefined) => BOTH.some((w) => normalize(text ?? '').includes(w))

/**
 * The side the clinician's own words give, when there is exactly one
 * (e.g. "spalla sinistra"); null when none, both, or "bilateral".
 */
export function caseSide(clinicianText: string): Side | null {
  if (mentionsBothSides(clinicianText)) return null
  const sides = sidesOf(clinicianText)
  return sides.length === 1 ? sides[0] : null
}

/** A generated text that names only the opposite side of the case. */
export function contradictsSide(generated: string, side: Side | null): boolean {
  if (!side) return false
  const s = sidesOf(generated)
  return s.length > 0 && !s.includes(side)
}
