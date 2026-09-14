import type { AppLang } from '@/lib/i18n/uiStrings'

export type FoodMacro = 'protein' | 'carbs' | 'fat'

export type FoodExample = {
  id: string
  macro: FoodMacro
  /** Grammi del macronutriente per 100g dell'alimento — valori generali/
   *  indicativi (fonti nutrizionali standard), non specifici di un prodotto
   *  o marca. Serve solo a rendere concreti i target in grammi del
   *  Calcolatore Metabolico, non e' un database alimentare o un piano
   *  nutrizionale: per questo restano pochi alimenti molto comuni invece
   *  di un catalogo esteso. */
  gramsPer100g: number
}

type FoodText = { name: string }

const FOOD_BASE: { id: string; macro: FoodMacro; gramsPer100g: number }[] = [
  { id: 'chicken-breast', macro: 'protein', gramsPer100g: 31 },
  { id: 'canned-tuna', macro: 'protein', gramsPer100g: 26 },
  { id: 'eggs', macro: 'protein', gramsPer100g: 13 },
  { id: 'greek-yogurt', macro: 'protein', gramsPer100g: 10 },
  { id: 'lentils', macro: 'protein', gramsPer100g: 9 },
  { id: 'turkey-breast', macro: 'protein', gramsPer100g: 29 },
  { id: 'cottage-cheese', macro: 'protein', gramsPer100g: 11 },
  { id: 'whey-protein-powder', macro: 'protein', gramsPer100g: 80 },
  { id: 'tofu', macro: 'protein', gramsPer100g: 8 },
  { id: 'chickpeas', macro: 'protein', gramsPer100g: 9 },

  { id: 'white-rice', macro: 'carbs', gramsPer100g: 28 },
  { id: 'pasta', macro: 'carbs', gramsPer100g: 25 },
  { id: 'banana', macro: 'carbs', gramsPer100g: 23 },
  { id: 'potatoes', macro: 'carbs', gramsPer100g: 17 },
  { id: 'whole-wheat-bread', macro: 'carbs', gramsPer100g: 41 },
  { id: 'oats', macro: 'carbs', gramsPer100g: 66 },
  { id: 'quinoa', macro: 'carbs', gramsPer100g: 21 },
  { id: 'sweet-potato', macro: 'carbs', gramsPer100g: 20 },
  { id: 'apple', macro: 'carbs', gramsPer100g: 14 },
  { id: 'couscous', macro: 'carbs', gramsPer100g: 23 },

  { id: 'olive-oil', macro: 'fat', gramsPer100g: 100 },
  { id: 'almonds', macro: 'fat', gramsPer100g: 50 },
  { id: 'peanut-butter', macro: 'fat', gramsPer100g: 50 },
  { id: 'salmon', macro: 'fat', gramsPer100g: 13 },
  { id: 'avocado', macro: 'fat', gramsPer100g: 15 },
  { id: 'walnuts', macro: 'fat', gramsPer100g: 65 },
  { id: 'chia-seeds', macro: 'fat', gramsPer100g: 31 },
  { id: 'parmesan-cheese', macro: 'fat', gramsPer100g: 29 },
  { id: 'coconut-oil', macro: 'fat', gramsPer100g: 100 },
  { id: 'dark-chocolate', macro: 'fat', gramsPer100g: 43 },
]

const FOOD_TEXT: Record<AppLang, Record<string, FoodText>> = {
  it: {
    'chicken-breast': { name: 'Petto di pollo (cotto)' },
    'canned-tuna': { name: 'Tonno in scatola (al naturale)' },
    eggs: { name: 'Uova' },
    'greek-yogurt': { name: 'Yogurt greco' },
    lentils: { name: 'Lenticchie (cotte)' },
    'white-rice': { name: 'Riso bianco (cotto)' },
    pasta: { name: 'Pasta (cotta)' },
    banana: { name: 'Banana' },
    potatoes: { name: 'Patate (bollite)' },
    'whole-wheat-bread': { name: 'Pane integrale' },
    'olive-oil': { name: 'Olio extravergine d\'oliva' },
    almonds: { name: 'Mandorle' },
    'peanut-butter': { name: 'Burro d\'arachidi' },
    salmon: { name: 'Salmone (cotto)' },
    avocado: { name: 'Avocado' },
    'turkey-breast': { name: 'Petto di tacchino (cotto)' },
    'cottage-cheese': { name: 'Fiocchi di latte' },
    'whey-protein-powder': { name: 'Proteine whey in polvere' },
    tofu: { name: 'Tofu' },
    chickpeas: { name: 'Ceci (cotti)' },
    oats: { name: 'Fiocchi d\'avena (crudi)' },
    quinoa: { name: 'Quinoa (cotta)' },
    'sweet-potato': { name: 'Patata dolce (bollita)' },
    apple: { name: 'Mela' },
    couscous: { name: 'Cous cous (cotto)' },
    walnuts: { name: 'Noci' },
    'chia-seeds': { name: 'Semi di chia' },
    'parmesan-cheese': { name: 'Parmigiano' },
    'coconut-oil': { name: 'Olio di cocco' },
    'dark-chocolate': { name: 'Cioccolato fondente (70-85%)' },
  },
  en: {
    'chicken-breast': { name: 'Chicken breast (cooked)' },
    'canned-tuna': { name: 'Canned tuna (in water)' },
    eggs: { name: 'Eggs' },
    'greek-yogurt': { name: 'Greek yogurt' },
    lentils: { name: 'Lentils (cooked)' },
    'white-rice': { name: 'White rice (cooked)' },
    pasta: { name: 'Pasta (cooked)' },
    banana: { name: 'Banana' },
    potatoes: { name: 'Potatoes (boiled)' },
    'whole-wheat-bread': { name: 'Whole wheat bread' },
    'olive-oil': { name: 'Extra virgin olive oil' },
    almonds: { name: 'Almonds' },
    'peanut-butter': { name: 'Peanut butter' },
    salmon: { name: 'Salmon (cooked)' },
    avocado: { name: 'Avocado' },
    'turkey-breast': { name: 'Turkey breast (cooked)' },
    'cottage-cheese': { name: 'Cottage cheese' },
    'whey-protein-powder': { name: 'Whey protein powder' },
    tofu: { name: 'Tofu' },
    chickpeas: { name: 'Chickpeas (cooked)' },
    oats: { name: 'Oats (dry)' },
    quinoa: { name: 'Quinoa (cooked)' },
    'sweet-potato': { name: 'Sweet potato (boiled)' },
    apple: { name: 'Apple' },
    couscous: { name: 'Couscous (cooked)' },
    walnuts: { name: 'Walnuts' },
    'chia-seeds': { name: 'Chia seeds' },
    'parmesan-cheese': { name: 'Parmesan cheese' },
    'coconut-oil': { name: 'Coconut oil' },
    'dark-chocolate': { name: 'Dark chocolate (70-85%)' },
  },
  es: {
    'chicken-breast': { name: 'Pechuga de pollo (cocida)' },
    'canned-tuna': { name: 'Atún en lata (al natural)' },
    eggs: { name: 'Huevos' },
    'greek-yogurt': { name: 'Yogur griego' },
    lentils: { name: 'Lentejas (cocidas)' },
    'white-rice': { name: 'Arroz blanco (cocido)' },
    pasta: { name: 'Pasta (cocida)' },
    banana: { name: 'Plátano' },
    potatoes: { name: 'Patatas (hervidas)' },
    'whole-wheat-bread': { name: 'Pan integral' },
    'olive-oil': { name: 'Aceite de oliva virgen extra' },
    almonds: { name: 'Almendras' },
    'peanut-butter': { name: 'Mantequilla de cacahuete' },
    salmon: { name: 'Salmón (cocido)' },
    avocado: { name: 'Aguacate' },
    'turkey-breast': { name: 'Pechuga de pavo (cocida)' },
    'cottage-cheese': { name: 'Requesón' },
    'whey-protein-powder': { name: 'Proteína de suero en polvo' },
    tofu: { name: 'Tofu' },
    chickpeas: { name: 'Garbanzos (cocidos)' },
    oats: { name: 'Copos de avena (crudos)' },
    quinoa: { name: 'Quinoa (cocida)' },
    'sweet-potato': { name: 'Boniato (hervido)' },
    apple: { name: 'Manzana' },
    couscous: { name: 'Cuscús (cocido)' },
    walnuts: { name: 'Nueces' },
    'chia-seeds': { name: 'Semillas de chía' },
    'parmesan-cheese': { name: 'Queso parmesano' },
    'coconut-oil': { name: 'Aceite de coco' },
    'dark-chocolate': { name: 'Chocolate negro (70-85%)' },
  },
  fr: {
    'chicken-breast': { name: 'Blanc de poulet (cuit)' },
    'canned-tuna': { name: 'Thon en conserve (au naturel)' },
    eggs: { name: 'Œufs' },
    'greek-yogurt': { name: 'Yaourt grec' },
    lentils: { name: 'Lentilles (cuites)' },
    'white-rice': { name: 'Riz blanc (cuit)' },
    pasta: { name: 'Pâtes (cuites)' },
    banana: { name: 'Banane' },
    potatoes: { name: 'Pommes de terre (bouillies)' },
    'whole-wheat-bread': { name: 'Pain complet' },
    'olive-oil': { name: 'Huile d\'olive extra vierge' },
    almonds: { name: 'Amandes' },
    'peanut-butter': { name: 'Beurre de cacahuète' },
    salmon: { name: 'Saumon (cuit)' },
    avocado: { name: 'Avocat' },
    'turkey-breast': { name: 'Blanc de dinde (cuit)' },
    'cottage-cheese': { name: 'Fromage cottage' },
    'whey-protein-powder': { name: 'Protéine whey en poudre' },
    tofu: { name: 'Tofu' },
    chickpeas: { name: 'Pois chiches (cuits)' },
    oats: { name: 'Flocons d\'avoine (crus)' },
    quinoa: { name: 'Quinoa (cuit)' },
    'sweet-potato': { name: 'Patate douce (bouillie)' },
    apple: { name: 'Pomme' },
    couscous: { name: 'Couscous (cuit)' },
    walnuts: { name: 'Noix' },
    'chia-seeds': { name: 'Graines de chia' },
    'parmesan-cheese': { name: 'Parmesan' },
    'coconut-oil': { name: 'Huile de coco' },
    'dark-chocolate': { name: 'Chocolat noir (70-85%)' },
  },
}

export function getFoodExamples(lang: AppLang): (FoodExample & FoodText)[] {
  const text = FOOD_TEXT[lang] ?? FOOD_TEXT.en
  return FOOD_BASE.map((base) => {
    const t = text[base.id] ?? FOOD_TEXT.en[base.id]
    return { ...base, name: t.name }
  })
}

export function getFoodExamplesByMacro(lang: AppLang, macro: FoodMacro): (FoodExample & FoodText)[] {
  return getFoodExamples(lang).filter((f) => f.macro === macro)
}
