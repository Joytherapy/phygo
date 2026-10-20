'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAdminStrings } from '@/lib/i18n/adminStrings';

interface Step {
  label: string;
  description: string;
}

interface Item {
  id?: string;
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
  sort_order: number;
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
}

const emptyItem = (): Item => ({
  subcategory_id: '',
  title: '',
  goal: '',
  level: 'Gentle',
  body_position: '',
  equipment: 'None',
  steps: [
    { label: 'Start', description: '' },
    { label: 'Move', description: '' },
    { label: 'Return', description: '' },
  ],
  reps_duration: '',
  easier_option: '',
  harder_option: '',
  tip: '',
  safety_note: '',
  sort_order: 0,
});

export default function LibraryAdminPage() {
  const a = useAdminStrings();
  const t = a.library;
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);

  const loadAll = () => {
    setLoading(true);
    fetch('/api/library/admin')
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories || []);
        setSubcategories(data.subcategories || []);
        setItems(data.items || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch('/api/library/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      const data = await res.json();
      if (data.success) {
        setEditing(null);
        loadAll();
      } else {
        alert(data.error || t.saveError);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    await fetch('/api/library/admin', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    loadAll();
  };

  const updateStep = (index: number, field: 'label' | 'description', value: string) => {
    if (!editing) return;
    const newSteps = [...editing.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setEditing({ ...editing, steps: newSteps });
  };

  return (
    <div className="relative min-h-screen bg-[#f7f7f8] dark:bg-[#050608] transition-colors">
      <Navbar />

      <div className="relative max-w-3xl mx-auto pt-40 pb-24 px-6">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#7C83FF] mb-3">{a.common.eyebrow}</p>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-ink dark:text-white mb-2">
              {t.title}
            </h1>
            <p className="text-sm text-ink/60 dark:text-white/50">{t.total(items.length)}</p>
          </div>
          <button
            onClick={() => setEditing(emptyItem())}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold bg-ink text-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.55)] hover:bg-ink/90 dark:bg-white dark:text-ink dark:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.25)] dark:hover:bg-white/90"
          >
            <Plus size={16} /> {t.newItem}
          </button>
        </div>

        {editing && (
          <div className="mb-10 rounded-[24px] border border-black/[0.09] dark:border-white/10 bg-white/95 dark:bg-white/[0.03] backdrop-blur-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ink dark:text-white">
                {editing.id ? t.editItem : t.newItem}
              </h2>
              <button onClick={() => setEditing(null)} aria-label={t.close} className="text-ink/55 dark:text-white/40">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <select
                value={editing.subcategory_id}
                onChange={(e) => setEditing({ ...editing, subcategory_id: e.target.value })}
                className="col-span-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] px-3 py-2 text-sm text-ink dark:text-white"
              >
                <option value="">{t.selectSubcategory}</option>
                {subcategories.map((s) => {
                  const cat = categories.find((c) => c.id === s.category_id);
                  return (
                    <option key={s.id} value={s.id}>
                      {cat?.name} → {s.name}
                    </option>
                  );
                })}
              </select>

              <input
                placeholder={t.titlePh}
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="col-span-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] px-3 py-2 text-sm text-ink dark:text-white"
              />
              <input
                placeholder={t.goalPh}
                value={editing.goal}
                onChange={(e) => setEditing({ ...editing, goal: e.target.value })}
                className="col-span-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] px-3 py-2 text-sm text-ink dark:text-white"
              />

              <select
                value={editing.level}
                onChange={(e) => setEditing({ ...editing, level: e.target.value })}
                className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] px-3 py-2 text-sm text-ink dark:text-white"
              >
                {(['Gentle', 'Active', 'Challenge'] as const).map((lv) => (
                  <option key={lv} value={lv}>{t.levels[lv]}</option>
                ))}
              </select>
              <input
                placeholder={t.positionPh}
                value={editing.body_position}
                onChange={(e) => setEditing({ ...editing, body_position: e.target.value })}
                className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] px-3 py-2 text-sm text-ink dark:text-white"
              />
              <input
                placeholder={t.equipmentPh}
                value={editing.equipment}
                onChange={(e) => setEditing({ ...editing, equipment: e.target.value })}
                className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] px-3 py-2 text-sm text-ink dark:text-white"
              />
              <input
                placeholder={t.repsPh}
                value={editing.reps_duration}
                onChange={(e) => setEditing({ ...editing, reps_duration: e.target.value })}
                className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] px-3 py-2 text-sm text-ink dark:text-white"
              />
            </div>

            <p className="text-xs font-semibold text-ink/60 dark:text-white/50 mb-2 mt-4">{t.steps}</p>
            {editing.steps.map((step, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                <input
                  placeholder={t.stepLabelPh}
                  value={step.label}
                  onChange={(e) => updateStep(i, 'label', e.target.value)}
                  className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] px-3 py-2 text-sm text-ink dark:text-white"
                />
                <input
                  placeholder={t.stepDescriptionPh}
                  value={step.description}
                  onChange={(e) => updateStep(i, 'description', e.target.value)}
                  className="col-span-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] px-3 py-2 text-sm text-ink dark:text-white"
                />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3 mt-4">
              <input
                placeholder={t.easierPh}
                value={editing.easier_option}
                onChange={(e) => setEditing({ ...editing, easier_option: e.target.value })}
                className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] px-3 py-2 text-sm text-ink dark:text-white"
              />
              <input
                placeholder={t.harderPh}
                value={editing.harder_option}
                onChange={(e) => setEditing({ ...editing, harder_option: e.target.value })}
                className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] px-3 py-2 text-sm text-ink dark:text-white"
              />
              <input
                placeholder={t.tipPh}
                value={editing.tip}
                onChange={(e) => setEditing({ ...editing, tip: e.target.value })}
                className="col-span-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] px-3 py-2 text-sm text-ink dark:text-white"
              />
              <input
                placeholder={t.safetyPh}
                value={editing.safety_note}
                onChange={(e) => setEditing({ ...editing, safety_note: e.target.value })}
                className="col-span-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] px-3 py-2 text-sm text-ink dark:text-white"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold bg-ink text-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.55)] hover:bg-ink/90 dark:bg-white dark:text-ink dark:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.25)] dark:hover:bg-white/90 disabled:opacity-50"
            >
              <Save size={16} /> {saving ? t.saving : t.save}
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-ink/60 dark:text-white/50">{a.common.loading}</p>
        ) : (
          <div className="grid gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-black/[0.06] bg-white/90 backdrop-blur-xl dark:border-white/[0.07] dark:bg-white/[0.035] p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-ink dark:text-white">{item.title}</p>
                  <p className="text-xs text-ink/60 dark:text-white/50">
                    {t.levels[item.level] ?? item.level} · {item.body_position} · {item.equipment}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditing(item)}
                    className="text-xs font-semibold text-[#7C83FF] hover:underline"
                  >
                    {a.common.edit}
                  </button>
                  <button onClick={() => item.id && handleDelete(item.id)} aria-label={t.deleteLabel} title={t.deleteLabel} className="text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
