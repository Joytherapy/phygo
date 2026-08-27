'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
} from 'lucide-react'
import { products, categories, type Product } from '@/lib/products'

const CATEGORY_STYLE: Record<Product['category'], { icon: any; gradient: string; glow: string }> = {
  'Pelvic Floor': {
    icon: Waves,
    gradient: 'linear-gradient(135deg, #F472B6 0%, #C084FC 100%)',
    glow: 'rgba(244,114,182,0.25)',
  },
  'Low Back': {
    icon: ShieldHalf,
    gradient: 'linear-gradient(135deg, #4F7CFF 0%, #6E8FFF 100%)',
    glow: 'rgba(79,124,255,0.25)',
  },
  Posture: {
    icon: PersonStanding,
    gradient: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
    glow: 'rgba(251,191,36,0.25)',
  },
  Mobility: {
    icon: Move3d,
    gradient: 'linear-gradient(135deg, #32D6A0 0%, #22B888 100%)',
    glow: 'rgba(50,214,160,0.25)',
  },
  Recovery: {
    icon: HeartPulse,
    gradient: 'linear-gradient(135deg, #A78BFA 0%, #818CF8 100%)',
    glow: 'rgba(167,139,250,0.25)',
  },
}

export default function PatientShopPage() {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

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
        className="flex items-center gap-1.5 text-sm text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft size={15} />
        Back
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
              style={{ background: 'linear-gradient(90deg, #4F7CFF, #32D6A0)' }}
            />
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#4F7CFF]">
              Equipment
            </p>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-none text-ink dark:text-white">
            Shop
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0]">.</span>
          </h1>
          <p className="text-base text-ink/40 dark:text-white/40 mt-3 max-w-md">
            Equipment picks that support your recovery.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-black/[0.06] dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl px-4 py-2.5">
          <Sparkles size={13} className="text-[#4F7CFF]" />
          <span className="text-xs font-semibold text-ink/60 dark:text-white/60">
            {products.length} curated picks
          </span>
        </div>
      </motion.div>

      <div className="flex gap-2 mb-10 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveCategory(null)}
          className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold transition-all ${
            activeCategory === null
              ? 'text-white shadow-[0_6px_16px_rgba(79,124,255,0.35)] scale-[1.03]'
              : 'text-ink/60 dark:text-white/60 bg-black/[0.04] dark:bg-white/5 hover:bg-black/[0.07] dark:hover:bg-white/10'
          }`}
          style={activeCategory === null ? { background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' } : undefined}
        >
          All · {products.length}
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
                  ? 'text-white scale-[1.03]'
                  : 'text-ink/60 dark:text-white/60 bg-black/[0.04] dark:bg-white/5 hover:bg-black/[0.07] dark:hover:bg-white/10'
              }`}
              style={
                isActive
                  ? { background: style.gradient, boxShadow: `0 6px 16px ${style.glow}` }
                  : undefined
              }
            >
              {cat} · {countFor(cat)}
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
              className="group relative rounded-[24px] border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl overflow-hidden flex flex-col shadow-sm hover:shadow-xl transition-shadow duration-300"
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
                <span className="absolute top-3 right-3 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-sm px-2.5 py-1 text-[11px] font-bold text-ink dark:text-white shadow-sm">
                  {product.price}
                </span>
              </div>

              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.gradient }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40 dark:text-white/40">
                    {product.category}
                  </span>
                </div>
                <p className="text-sm font-bold text-ink dark:text-white mb-1.5 leading-snug">
                  {product.name}
                </p>
                <p className="text-xs text-ink/50 dark:text-white/50 leading-relaxed mb-4 flex-1">
                  {product.description}
                </p>

                <a
                  href={product.amazonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-semibold text-white transition-transform hover:scale-[1.02]"
                  style={{ background: style.gradient }}
                >
                  View on Amazon
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