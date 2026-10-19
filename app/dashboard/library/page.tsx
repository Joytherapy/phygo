'use client';

import { useEffect, useState } from 'react';
import { Search, Lock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ClinicalActionBar from '@/components/ClinicalActionBar';
import { PageBackdrop } from '@/components/ui/premium'

interface Step {
  label: string;
  description: string;
}

interface Item {
  id: string;
  subcategory_id: string;
  title: string;
  goal: string;
  level: string;
  body_position: string;
  equipment: string;
  steps: Step[];
  reps_duration: string;
  easier_option: string;
  harder_option: string;
  tip: string;
  safety_note: string;
  image_url: string;
}

interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

const levelColor: Record<string, string> = {
  Gentle: '#32D6A0',
  Active: '#7C83FF',
  Challenge: '#A855F7',
};

export default function LibraryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [openItem, setOpenItem] = useState<Item | null>(null);

  useEffect(() => {
    fetch('/api/library/list')
      .then(async (res) => {
        if (res.status === 403) {
          setForbidden(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setCategories(data.categories || []);
        setSubcategories(data.subcategories || []);
        setItems(data.items || []);
        if (data.categories?.[0]) setActiveCategory(data.categories[0].id);
        setLoading(false);
      });
  }, []);

  const subcatsForCategory = subcategories.filter((s) => s.category_id === activeCategory);

  useEffect(() => {
    if (subcatsForCategory.length > 0) {
      setActiveSubcategory(subcatsForCategory[0].id);
    } else {
      setActiveSubcategory(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, subcategories.length]);

  const filteredItems = items.filter((item) => {
    const matchesSubcategory = activeSubcategory ? item.subcategory_id === activeSubcategory : true;
    const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase());
    return matchesSubcategory && matchesQuery;
  });

  if (forbidden) {
    return (
      <div className="relative min-h-screen bg-[#f7f7f8] dark:bg-[#050608] transition-colors">
        <Navbar />
        <div className="relative max-w-lg mx-auto pt-48 pb-24 px-6 text-center">
          <Lock size={32} className="mx-auto mb-4 text-ink/30 dark:text-white/30" />
          <h1 className="font-display text-2xl font-bold text-ink dark:text-white mb-2">
            Pro Library is a Pro feature
          </h1>
          <p className="text-sm text-ink/60 dark:text-white/50">
            Upgrade your plan to unlock the full clinical content library.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#f7f7f8] dark:bg-[#050608] overflow-hidden transition-colors">
      <Navbar />

      <PageBackdrop />

      <div className="relative max-w-5xl mx-auto pt-40 pb-24 px-6">
         <div className="inline-flex items-center gap-2 rounded-full border border-[#7C83FF]/20 bg-[#7C83FF]/10 px-3.5 py-1.5 mb-5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'linear-gradient(135deg, #7C83FF 0%, #8B5CF6 100%)' }} />
<p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#7C83FF]">Members Only</p>
        </div>
        <h1 className="font-display text-6xl font-bold tracking-tight mb-3 text-ink dark:text-white">
          Pro <span style={{ background: 'linear-gradient(135deg, #7C83FF 0%, #8B5CF6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Library</span>
        </h1>
        <p className="text-base text-ink/60 dark:text-white/50 mb-8 max-w-lg">
          Curated, clinically structured content — ready to bring straight into a session.
        </p>


        {loading ? (
          <p className="text-sm text-ink/60 dark:text-white/50">Loading…</p>
        ) : (
          <>
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    activeCategory === cat.id
                      ? 'text-white'
                      : 'text-ink/60 dark:text-white/60 bg-black/5 dark:bg-white/5'
                  }`}
                  style={
                    activeCategory === cat.id
                      ? { background: 'linear-gradient(135deg, #7C83FF 0%, #8B5CF6 100%)' }
                      : {}
                  }
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {subcatsForCategory.length > 0 && (
              <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {subcatsForCategory.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setActiveSubcategory(sub.id)}
                    className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors ${
                      activeSubcategory === sub.id
                        ? 'border-[#7C83FF] text-[#7C83FF] bg-[#7C83FF]/10'
                        : 'border-black/10 dark:border-white/15 text-ink/60 dark:text-white/50'
                    }`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            )}

            <div className="relative mb-6">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none flex items-center justify-center h-6 w-6 rounded-full bg-[#7C83FF]/15">
                <Search size={14} strokeWidth={2.5} className="text-[#7C83FF]" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search items…"
                className="relative w-full text-sm rounded-full border border-black/10 dark:border-white/15 bg-white dark:bg-white/[0.06] pl-14 pr-4 py-3.5 outline-none focus:border-[#7C83FF] text-ink dark:text-white placeholder:text-ink/55 dark:placeholder:text-white/40"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-black/[0.06] bg-white/90 backdrop-blur-xl dark:border-white/[0.07] dark:bg-white/[0.035] hover:border-black/15 dark:hover:border-white/20 transition-colors"
                >
                  <button
                    onClick={() => setOpenItem(item)}
                    className="text-left w-full"
                  >
                    {item.image_url && (
                      <div className="w-full aspect-video bg-white rounded-t-2xl overflow-hidden flex items-center justify-center">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}

                    <div className="p-5 pb-3">
                      <span
                        className="inline-block text-xs px-2.5 py-1 rounded-full text-white font-medium mb-2"
                        style={{ background: levelColor[item.level] || '#7C83FF' }}
                      >
                        {item.level}
                      </span>
                      <h3 className="text-base font-semibold text-ink dark:text-white mb-1">{item.title}</h3>
                      <p className="text-xs text-ink/60 dark:text-white/50">
                        {item.body_position} · {item.equipment}
                      </p>
                    </div>
                  </button>
                  <div className="px-5 pb-5">
                    <ClinicalActionBar contentType="exercise" contentId={item.id} />
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <p className="text-sm text-ink/60 dark:text-white/50 col-span-2">No items yet in this category.</p>
              )}
            </div>
          </>
        )}
      </div>

      {openItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setOpenItem(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-lg w-full max-h-[85vh] overflow-y-auto rounded-[24px] bg-white dark:bg-[#0e0f12] border border-black/[0.09] dark:border-white/10 p-6"
          >
            {openItem.image_url && (
              <div className="w-full aspect-video bg-white rounded-2xl overflow-hidden mb-4 flex items-center justify-center">
                <img
                  src={openItem.image_url}
                  alt={openItem.title}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <span
              className="inline-block text-xs px-2.5 py-1 rounded-full text-white font-medium mb-3"
              style={{ background: levelColor[openItem.level] || '#7C83FF' }}
            >
              {openItem.level}
            </span>
            <h2 className="text-xl font-bold text-ink dark:text-white mb-1">{openItem.title}</h2>
            <p className="text-sm text-ink/60 dark:text-white/60 mb-4">{openItem.goal}</p>

            <div className="mb-4">
              <ClinicalActionBar contentType="exercise" contentId={openItem.id} />
            </div>

            <div className="flex gap-4 text-xs text-ink/60 dark:text-white/50 mb-4">
              <span>{openItem.body_position}</span>
              <span>{openItem.equipment}</span>
              {openItem.reps_duration && <span>{openItem.reps_duration}</span>}
            </div>

            <div className="space-y-2 mb-4">
              {openItem.steps?.map((step, i) => (
                <div key={i} className="text-sm">
                  <span className="font-semibold text-ink dark:text-white">{step.label}: </span>
                  <span className="text-ink/70 dark:text-white/70">{step.description}</span>
                </div>
              ))}
            </div>

            {openItem.easier_option && (
              <p className="text-xs text-ink/60 dark:text-white/60 mb-1">
                <span className="font-semibold">Easier: </span>
                {openItem.easier_option}
              </p>
            )}
            {openItem.harder_option && (
              <p className="text-xs text-ink/60 dark:text-white/60 mb-1">
                <span className="font-semibold">Harder: </span>
                {openItem.harder_option}
              </p>
            )}
            {openItem.tip && (
              <p className="text-xs text-ink/60 dark:text-white/60 mt-3">
                <span className="font-semibold">Tip: </span>
                {openItem.tip}
              </p>
            )}
            {openItem.safety_note && (
              <p className="text-xs text-red-500 mt-2">
                <span className="font-semibold">Safety: </span>
                {openItem.safety_note}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}