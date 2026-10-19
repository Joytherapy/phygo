'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ExternalLink,
  Waves,
  ShieldHalf,
  PersonStanding,
  Move3d,
  HeartPulse,
  Sparkles,
  Scale,
  Apple,
} from 'lucide-react'
import { getProducts, categories, type Product } from '@/lib/products'
import { useLanguage, useUiStrings } from '@/contexts/LanguageContext'
import { MY_PHYGO_STRINGS } from '@/lib/i18n/myPhygoStrings'

const CATEGORY_STYLE: Record<Product['category'], { icon: any; gradient: string; glow: string }> = {
  'Pelvic Floor': {
    icon: Waves,
    gradient: 'linear-gradient(135deg, #F472B6 0%, #C084FC 100%)',
    glow: 'rgba(244,114,182,0.25)',
  },
  'Low Back': {
    icon: ShieldHalf,
    gradient: 'linear-gradient(135deg, #A5B4FF 0%, #7C83FF 100%)',
    glow: 'rgba(124,131,255,0.25)',
  },
  Posture: {
    icon: PersonStanding,
    gradient: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
    glow: 'rgba(251,191,36,0.25)',
  },
  Mobility: {
    icon: Move3d,
    gradient: 'linear-gradient(135deg, #6EE7B7 0%, #34A389 100%)',
    glow: 'rgba(52,163,137,0.22)',
  },
  Recovery: {
    icon: HeartPulse,
    gradient: 'linear-gradient(135deg, #A78BFA 0%, #818CF8 100%)',
    glow: 'rgba(167,139,250,0.25)',
  },
  // Stessa coppia indaco/violetto del Metabolic Calculator (Clinical
  // Toolkit / Phygo Life) — segnala visivamente che questi prodotti
  // supportano quella funzione, non una categoria scollegata.
  'Body Composition': {
    icon: Scale,
    gradient: 'linear-gradient(135deg, #8B95FF 0%, #A78BFA 100%)',
    glow: 'rgba(139,149,255,0.25)',
  },
  Nutrition: {
    icon: Apple,
    gradient: 'linear-gradient(135deg, #FB923C 0%, #EA580C 100%)',
    glow: 'rgba(251,146,60,0.25)',
  },
}

export default function PatientShopPage() {
  return (
    <Suspense fallback={null}>
      <PatientShopPageInner />
    </Suspense>
  )
}

// Legge ?category= per pre-filtrare (es. il link "Vedi bilance consigliate"
// dalla pagina Metabolic Profile) — deve stare in un componente separato
// avvolto in <Suspense>, stesso pattern gia' usato da clinical-tools/page.tsx
// per useSearchParams in App Router.
function PatientShopPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { lang } = useLanguage()
  const ui = useUiStrings().shop
  const t = MY_PHYGO_STRINGS[lang].shop
  // Same catalogue (ids, categories, prices, links) in every language; only
  // the product names and descriptions are translated.
  const products = useMemo(() => getProducts(lang), [lang])
  const initialCategory = searchParams.get('category')
  const [activeCategory, setActiveCategory] = useState<string | null>(
    (initialCategory && categories.includes(initialCategory as Product['category'])) ? initialCategory : null
  )

  const filteredProducts = activeCategory
    ? products.filter((p) => p.category === activeCategory)
    : products

  const countFor = (cat: string) => products.filter((p) => p.category === cat).length

  return (
    <div className="relative max-w-5xl mx-auto pt-40 pb-24 px-6">
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => router.push('/my-phygo/home')}
        className="flex items-center gap-1.5 text-sm text-ink/60 dark:text-white/50 hover:text-ink dark:hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft size={15} />
        {t.back}
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-end justify-between gap-6 mb-10 flex-wrap"
      >
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ background: 'linear-gradient(135deg, #A5B4FF 0%, #7C83FF 50%, #A78BFA 100%)' }}
            />
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#6B73F0] dark:text-[#A5B4FF]">
              {ui.eyebrow}
            </p>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-none text-ink dark:text-white">
            {ui.heading}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C83FF] to-[#A78BFA]">.</span>
          </h1>
          <p className="text-base text-ink/55 dark:text-white/40 mt-3 max-w-md">
            {t.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/80 px-4 py-2.5 backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.04]">
          <Sparkles size={13} className="text-[#7C83FF]" />
          <span className="text-xs font-semibold text-ink/60 dark:text-white/60">
            {products.length} {ui.curatedPicksSuffix}
          </span>
        </div>
      </motion.div>

      <div className="flex gap-2 mb-10 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveCategory(null)}
          className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold transition-all ${
            activeCategory === null
              ? 'bg-ink text-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.55)] hover:bg-ink/90 dark:bg-white dark:text-ink dark:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.25)] dark:hover:bg-white/90'
              : 'text-ink/60 dark:text-white/60 bg-black/[0.04] dark:bg-white/5 hover:bg-black/[0.07] dark:hover:bg-white/10'
          }`}
        >
          {ui.allLabel} · {products.length}
        </button>
        {categories.map((cat) => {
          const style = CATEGORY_STYLE[cat]
          const isActive = activeCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-ink text-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.55)] hover:bg-ink/90 dark:bg-white dark:text-ink dark:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.25)] dark:hover:bg-white/90'
                  : 'text-ink/60 dark:text-white/60 bg-black/[0.04] dark:bg-white/5 hover:bg-black/[0.07] dark:hover:bg-white/10'
              }`}
            >
              {ui.categoryLabels[cat]} · {countFor(cat)}
            </button>
          )
        })}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map((product, i) => {
          const style = CATEGORY_STYLE[product.category]
          const Icon = style.icon
          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(i, 12) * 0.05 }}
              whileHover={{ y: -4 }}
              className="group relative rounded-[24px] border border-black/[0.06] bg-white/90 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_44px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:border-white/[0.07] dark:bg-transparent dark:bg-gradient-to-b dark:from-white/[0.055] dark:to-white/[0.018] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden flex flex-col transition-shadow duration-300"
            >
              <div
                className="relative h-32 flex items-center justify-center overflow-hidden"
                style={{ background: `linear-gradient(160deg, ${style.glow} 0%, transparent 100%)` }}
              >
                <div
                  className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-30 blur-2xl transition-transform duration-500 group-hover:scale-125"
                  style={{ background: style.gradient }}
                />
                <div
                  className="relative flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                  style={{ background: style.gradient }}
                >
                  <Icon size={26} strokeWidth={1.75} />
                </div>
                <span className="absolute top-3 right-3 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-sm px-2.5 py-1 text-[11px] font-bold text-ink dark:text-white shadow-soft">
                  {product.price}
                </span>
              </div>

              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.gradient }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink/55 dark:text-white/40">
                    {ui.categoryLabels[product.category]}
                  </span>
                </div>
                <p className="text-sm font-bold text-ink dark:text-white mb-1.5 leading-snug">
                  {product.name}
                </p>
                <p className="text-xs text-ink/60 dark:text-white/50 leading-relaxed mb-4 flex-1">
                  {product.description}
                </p>

                <a
                  href={product.amazonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-semibold transition-colors border border-black/[0.08] bg-white text-ink hover:border-black/20 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-white dark:hover:border-white/25"
                >
                  {ui.viewOnAmazonCta}
                  <ExternalLink size={12} />
                </a>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}