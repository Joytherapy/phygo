import type { AppLang } from '@/lib/i18n/uiStrings'

export type ProductCategory = 'Pelvic Floor' | 'Low Back' | 'Posture' | 'Mobility' | 'Recovery' | 'Body Composition' | 'Nutrition'

export type Product = {
  id: string
  name: string
  category: ProductCategory
  description: string
  price: string
  amazonUrl: string
}

type ProductText = { name: string; description: string }

// Placeholder Amazon links — replace with your real Amazon Associates links.
// Language-independent facts about each product (id/category/price/link).
const PRODUCT_BASE: { id: string; category: ProductCategory; price: string; amazonUrl: string }[] = [
  { id: 'resistance-bands-set', category: 'Mobility', price: '€15–20', amazonUrl: 'https://www.amazon.it/s?k=resistance+bands+set' },
  { id: 'foam-roller', category: 'Recovery', price: '€20–30', amazonUrl: 'https://www.amazon.it/s?k=foam+roller' },
  { id: 'lumbar-support-cushion', category: 'Low Back', price: '€25–35', amazonUrl: 'https://www.amazon.it/s?k=lumbar+support+cushion' },
  { id: 'kegel-balls', category: 'Pelvic Floor', price: '€20–30', amazonUrl: 'https://www.amazon.it/s?k=pelvic+floor+trainer' },
  { id: 'posture-corrector', category: 'Posture', price: '€15–25', amazonUrl: 'https://www.amazon.it/s?k=posture+corrector' },
  { id: 'yoga-mat', category: 'Mobility', price: '€20–30', amazonUrl: 'https://www.amazon.it/s?k=exercise+mat' },
  { id: 'massage-ball-set', category: 'Recovery', price: '€10–15', amazonUrl: 'https://www.amazon.it/s?k=massage+ball+trigger+point' },
  { id: 'lumbar-pillow-sleep', category: 'Low Back', price: '€15–20', amazonUrl: 'https://www.amazon.it/s?k=knee+pillow+side+sleeper' },
  { id: 'balance-pad', category: 'Mobility', price: '€20–25', amazonUrl: 'https://www.amazon.it/s?k=balance+pad' },
  { id: 'standing-desk-converter', category: 'Posture', price: '€60–100', amazonUrl: 'https://www.amazon.it/s?k=standing+desk+converter' },
  // Legate al Metabolic & Macro Calculator (Clinical Toolkit / Phygo Life):
  // una bilancia affidabile e' l'unico modo per il paziente di fornire dati
  // di peso accurati nel tempo, che alimentano sia il calcolatore sia
  // "Phygo Adapt" (la ricalibrazione del TDEE sul trend reale). Due fasce
  // di prezzo, come richiesto: una di fascia alta (composizione corporea
  // completa) e una di fascia media (peso + stima base).
  { id: 'smart-scale-premium', category: 'Body Composition', price: '€90–150', amazonUrl: 'https://www.amazon.it/s?k=bilancia+impedenziometrica+smart+composizione+corporea' },
  { id: 'smart-scale-midrange', category: 'Body Composition', price: '€25–40', amazonUrl: 'https://www.amazon.it/s?k=bilancia+impedenziometrica+bluetooth' },
  // Legate agli esempi alimentari e ai target proteici del Metabolic
  // Calculator: opzioni pratiche per chiudere il gap giornaliero di
  // proteine, non un piano alimentare completo.
  { id: 'protein-powder', category: 'Nutrition', price: '€20–35', amazonUrl: 'https://www.amazon.it/s?k=proteine+in+polvere+whey' },
  { id: 'protein-bars', category: 'Nutrition', price: '€15–25', amazonUrl: 'https://www.amazon.it/s?k=barrette+proteiche' },
]

const PRODUCT_TEXT: Record<AppLang, Record<string, ProductText>> = {
  it: {
    'resistance-bands-set': { name: 'Set di Elastici di Resistenza (5 livelli)', description: 'Elastici ad anello in lattice per lavoro progressivo di forza e mobilità, ideali per programmi di esercizio domiciliare.' },
    'foam-roller': { name: 'Foam Roller ad Alta Densità', description: 'Rullo standard da 33cm per rilascio miofasciale e recupero post-seduta.' },
    'lumbar-support-cushion': { name: 'Cuscino di Supporto Lombare', description: 'Cuscino ergonomico per sedie da ufficio e sedili auto, aiuta a mantenere la curva lombare durante lunghe sedute.' },
    'kegel-balls': { name: 'Pesi per Allenamento del Pavimento Pelvico', description: 'Set di pesi graduati per esercizi progressivi di rinforzo del pavimento pelvico.' },
    'posture-corrector': { name: 'Correttore di Postura', description: 'Tutore dorsale regolabile per l\'allenamento della consapevolezza posturale, per brevi periodi di utilizzo quotidiano.' },
    'yoga-mat': { name: 'Tappetino Antiscivolo per Esercizi', description: 'Tappetino spesso e antiscivolo per esercizi riabilitativi a terra e routine di stretching.' },
    'massage-ball-set': { name: 'Set di Palline da Massaggio Trigger Point', description: 'Piccole palline dure per il rilascio mirato dei trigger point su glutei, piedi e spalle.' },
    'lumbar-pillow-sleep': { name: 'Cuscino tra le Ginocchia per chi Dorme di Lato', description: 'Cuscino sagomato per mantenere l\'allineamento spinale in chi dorme di lato con dolore lombare.' },
    'balance-pad': { name: 'Tappetino per Equilibrio e Stabilità', description: 'Tappetino in schiuma per allenamento propriocettivo e stabilità della caviglia.' },
    'standing-desk-converter': { name: 'Convertitore per Scrivania in Piedi', description: 'Rialzo da scrivania regolabile in altezza per alternare postura seduta ed eretta durante il lavoro.' },
    'smart-scale-premium': { name: 'Bilancia Smart con Analisi Corporea Completa', description: 'Bilancia impedenziometrica di fascia alta: peso, massa grassa e massa muscolare, con app dedicata per il monitoraggio nel tempo — ideale per alimentare il Calcolatore Metabolico con dati accurati.' },
    'smart-scale-midrange': { name: 'Bilancia Impedenziometrica Bluetooth', description: 'Bilancia connessa di fascia media per peso e stima della composizione corporea, comoda per pesate regolari a casa.' },
    'protein-powder': { name: 'Proteine in Polvere (Whey o Vegetali)', description: 'Un modo pratico per raggiungere il tuo obiettivo giornaliero di proteine calcolato nel Calcolatore Metabolico, soprattutto nei giorni più impegnativi.' },
    'protein-bars': { name: 'Snack e Barrette Proteiche', description: 'Spuntini pratici ad alto contenuto proteico, utili per completare il tuo target di proteine tra un pasto e l\'altro.' },
  },
  en: {
    'resistance-bands-set': { name: 'Resistance Bands Set (5 levels)', description: 'Latex loop bands for progressive strength and mobility work, ideal for home exercise programs.' },
    'foam-roller': { name: 'High-Density Foam Roller', description: 'Standard 33cm roller for myofascial release and post-session recovery.' },
    'lumbar-support-cushion': { name: 'Lumbar Support Cushion', description: 'Ergonomic cushion for desk chairs and car seats, helps maintain lumbar curve during long sitting.' },
    'kegel-balls': { name: 'Pelvic Floor Training Weights', description: 'Graduated weight set for progressive pelvic floor strengthening exercises.' },
    'posture-corrector': { name: 'Posture Corrector Brace', description: 'Adjustable back brace for postural awareness training, for short daily wear periods.' },
    'yoga-mat': { name: 'Non-Slip Exercise Mat', description: 'Thick, non-slip mat for floor-based rehab exercises and stretching routines.' },
    'massage-ball-set': { name: 'Trigger Point Massage Ball Set', description: 'Small firm balls for targeted trigger point release in glutes, feet, and shoulders.' },
    'lumbar-pillow-sleep': { name: 'Knee Pillow for Side Sleepers', description: 'Contoured pillow to maintain spinal alignment for side sleepers with low back pain.' },
    'balance-pad': { name: 'Balance & Stability Pad', description: 'Foam balance pad for proprioception and ankle stability training.' },
    'standing-desk-converter': { name: 'Standing Desk Converter', description: 'Height-adjustable desktop riser to alternate sitting and standing during work.' },
    'smart-scale-premium': { name: 'Smart Scale with Full Body Composition', description: 'High-end impedance scale: weight, fat mass and muscle mass, with a companion app for tracking over time — great for feeding the Metabolic Calculator with accurate data.' },
    'smart-scale-midrange': { name: 'Bluetooth Body Composition Scale', description: 'Mid-range connected scale for weight and basic body composition estimates, convenient for regular at-home weigh-ins.' },
    'protein-powder': { name: 'Protein Powder (Whey or Plant-Based)', description: 'A practical way to hit the daily protein target from the Metabolic Calculator, especially on busier days.' },
    'protein-bars': { name: 'Protein Bars & Snacks', description: 'Convenient high-protein snacks to help close the gap toward your daily protein target between meals.' },
  },
  es: {
    'resistance-bands-set': { name: 'Set de Bandas de Resistencia (5 niveles)', description: 'Bandas de látex para trabajo progresivo de fuerza y movilidad, ideales para programas de ejercicio en casa.' },
    'foam-roller': { name: 'Foam Roller de Alta Densidad', description: 'Rodillo estándar de 33cm para liberación miofascial y recuperación tras la sesión.' },
    'lumbar-support-cushion': { name: 'Cojín de Soporte Lumbar', description: 'Cojín ergonómico para sillas de oficina y asientos de coche, ayuda a mantener la curva lumbar durante sesiones largas.' },
    'kegel-balls': { name: 'Pesas de Entrenamiento del Suelo Pélvico', description: 'Set de pesas graduadas para ejercicios progresivos de fortalecimiento del suelo pélvico.' },
    'posture-corrector': { name: 'Corrector de Postura', description: 'Soporte de espalda ajustable para el entrenamiento de la conciencia postural, para periodos cortos de uso diario.' },
    'yoga-mat': { name: 'Esterilla Antideslizante para Ejercicio', description: 'Esterilla gruesa y antideslizante para ejercicios de rehabilitación en el suelo y rutinas de estiramiento.' },
    'massage-ball-set': { name: 'Set de Pelotas de Masaje para Puntos Gatillo', description: 'Pelotas pequeñas y firmes para la liberación dirigida de puntos gatillo en glúteos, pies y hombros.' },
    'lumbar-pillow-sleep': { name: 'Cojín entre Rodillas para Dormir de Lado', description: 'Cojín anatómico para mantener la alineación de la columna en quienes duermen de lado con dolor lumbar.' },
    'balance-pad': { name: 'Cojín de Equilibrio y Estabilidad', description: 'Cojín de espuma para entrenamiento propioceptivo y estabilidad de tobillo.' },
    'standing-desk-converter': { name: 'Convertidor de Escritorio de Pie', description: 'Elevador de escritorio con altura ajustable para alternar entre sentado y de pie durante el trabajo.' },
    'smart-scale-premium': { name: 'Báscula Inteligente con Análisis Corporal Completo', description: 'Báscula de impedancia de gama alta: peso, masa grasa y masa muscular, con app dedicada para el seguimiento en el tiempo — ideal para alimentar la Calculadora Metabólica con datos precisos.' },
    'smart-scale-midrange': { name: 'Báscula de Impedancia Bluetooth', description: 'Báscula conectada de gama media para peso y estimación básica de composición corporal, cómoda para pesajes regulares en casa.' },
    'protein-powder': { name: 'Proteína en Polvo (Whey o Vegetal)', description: 'Una forma práctica de alcanzar tu objetivo diario de proteínas de la Calculadora Metabólica, sobre todo en los días más ocupados.' },
    'protein-bars': { name: 'Barritas y Snacks Proteicos', description: 'Snacks prácticos con alto contenido proteico, útiles para completar tu objetivo de proteínas entre comidas.' },
  },
  fr: {
    'resistance-bands-set': { name: 'Set d\'Élastiques de Résistance (5 niveaux)', description: 'Bandes élastiques en latex pour un travail progressif de force et de mobilité, idéales pour les programmes d\'exercices à domicile.' },
    'foam-roller': { name: 'Rouleau de Massage Haute Densité', description: 'Rouleau standard de 33cm pour la libération myofasciale et la récupération après séance.' },
    'lumbar-support-cushion': { name: 'Coussin de Soutien Lombaire', description: 'Coussin ergonomique pour chaises de bureau et sièges auto, aide à maintenir la courbure lombaire lors de longues positions assises.' },
    'kegel-balls': { name: 'Poids d\'Entraînement du Plancher Pelvien', description: 'Set de poids gradués pour des exercices progressifs de renforcement du plancher pelvien.' },
    'posture-corrector': { name: 'Correcteur de Posture', description: 'Orthèse dorsale ajustable pour l\'entraînement de la conscience posturale, à porter sur de courtes périodes quotidiennes.' },
    'yoga-mat': { name: 'Tapis d\'Exercice Antidérapant', description: 'Tapis épais et antidérapant pour les exercices de rééducation au sol et les routines d\'étirement.' },
    'massage-ball-set': { name: 'Set de Balles de Massage Trigger Point', description: 'Petites balles fermes pour la libération ciblée des points gâchette au niveau des fessiers, pieds et épaules.' },
    'lumbar-pillow-sleep': { name: 'Coussin entre les Genoux pour Dormir sur le Côté', description: 'Coussin ergonomique pour maintenir l\'alignement de la colonne chez les personnes qui dorment sur le côté avec des lombalgies.' },
    'balance-pad': { name: 'Coussin d\'Équilibre et de Stabilité', description: 'Coussin en mousse pour l\'entraînement proprioceptif et la stabilité de la cheville.' },
    'standing-desk-converter': { name: 'Convertisseur de Bureau Debout', description: 'Rehausseur de bureau à hauteur réglable pour alterner entre position assise et debout pendant le travail.' },
    'smart-scale-premium': { name: 'Balance Connectée avec Analyse Corporelle Complète', description: 'Balance à impédancemétrie haut de gamme : poids, masse grasse et masse musculaire, avec application dédiée pour le suivi dans le temps — idéale pour alimenter le Calculateur Métabolique avec des données précises.' },
    'smart-scale-midrange': { name: 'Balance à Impédancemétrie Bluetooth', description: 'Balance connectée de milieu de gamme pour le poids et une estimation de base de la composition corporelle, pratique pour des pesées régulières à la maison.' },
    'protein-powder': { name: 'Protéines en Poudre (Whey ou Végétales)', description: 'Un moyen pratique d\'atteindre votre objectif quotidien de protéines du Calculateur Métabolique, surtout les jours chargés.' },
    'protein-bars': { name: 'Barres et Encas Protéinés', description: 'Des encas pratiques riches en protéines pour vous aider à atteindre votre objectif de protéines entre les repas.' },
  },
}

export const categories: ProductCategory[] = ['Pelvic Floor', 'Low Back', 'Posture', 'Mobility', 'Recovery', 'Body Composition', 'Nutrition']

// Builds the localized product list for the Shop page — same base data
// (id/category/price/link) in every language, translated name+description.
// Falls back to English text if a given id is ever missing a translation.
export function getProducts(lang: AppLang): Product[] {
  const text = PRODUCT_TEXT[lang] ?? PRODUCT_TEXT.en
  return PRODUCT_BASE.map((base) => {
    const t = text[base.id] ?? PRODUCT_TEXT.en[base.id]
    return { ...base, name: t.name, description: t.description }
  })
}

// Backward-compatible export (Italian was the original hardcoded language
// before this file was localized) — prefer getProducts(lang) in new code.
export const products: Product[] = getProducts('en')
