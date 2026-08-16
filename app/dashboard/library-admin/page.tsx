'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import Navbar from '@/components/Navbar';

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
        alert(data.error || 'Errore salvataggio');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo item?')) return;
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
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] transition-colors">
      <Navbar />

      <div className="relative max-w-3xl mx-auto pt-40 pb-24 px-6">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#4F7CFF] mb-3">Admin</p>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-ink dark:text-white mb-2">
              Pro Library — Manage Items
            </h1>
            <p className="text-sm text-ink/50 dark:text-white/50">{items.length} items total.</p>
          </div>
          <button
            onClick={() => setEditing(emptyItem())}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
          >
            <Plus size={16} /> New item
          </button>
        </div>

        {editing && (
          <div className="mb-10 rounded-[24px] border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ink dark:text-white">
                {editing.id ? 'Edit item' : 'New item'}
              </h2>
              <button onClick={() => setEditing(null)} className="text-ink/40 dark:text-white/40">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <select
                value={editing.subcategory_id}
                onChange={(e) => setEditing({ ...editing, subcategory_id: e.target.value })}
                className="col-span-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] px-3 py-2 text-sm text-ink dark:text-white"
              >
                <option value="">Select subcategory…</option>
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
                placeholder="Title"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="col-span-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] px-3 py-2 text-sm text-ink dark:text-white"
              />
              <input
                placeholder="Goal (short sentence)"
                value={editing.goal}
                onChange={(e) => setEditing({ ...editing, goal: e.target.value })}
                className="col-span-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] px-3 py-2 text-sm text-ink dark:text-white"
              />

              <select
                value={editing.level}
                onChange={(e) => setEditing({ ...editing, level: e.target.value })}
                className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] px-3 py-2 text-sm text-ink dark:text-white"
              >
                <option value="Gentle">Gentle</option>
                <option value="Active">Active</option>
                <option value="Challenge">Challenge</option>
              </select>
              <input
                placeholder="Position (e.g. Seated)"
                value={editing.body_position}
                onChange={(e) => setEditing({ ...editing, body_position: e.target.value })}
                className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] px-3 py-2 text-sm text-ink dark:text-white"
              />
              <input
                placeholder="Equipment"
                value={editing.equipment}
                onChange={(e) => setEditing({ ...editing, equipment: e.target.value })}
                className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] px-3 py-2 text-sm text-ink dark:text-white"
              />
              <input
                placeholder="Reps / duration"
                value={editing.reps_duration}
                onChange={(e) => setEditing({ ...editing, reps_duration: e.target.value })}
                className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] px-3 py-2 text-sm text-ink dark:text-white"
              />
            </div>

            <p className="text-xs font-semibold text-ink/50 dark:text-white/50 mb-2 mt-4">Steps (3)</p>
            {editing.steps.map((step, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                <input
                  placeholder="Label"
                  value={step.label}
                  onChange={(e) => updateStep(i, 'label', e.target.value)}
                  className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] px-3 py-2 text-sm text-ink dark:text-white"
                />
                <input
                  placeholder="Description"
                  value={step.description}
                  onChange={(e) => updateStep(i, 'description', e.target.value)}
                  className="col-span-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] px-3 py-2 text-sm text-ink dark:text-white"
                />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3 mt-4">
              <input
                placeholder="Easier option"
                value={editing.easier_option}
                onChange={(e) => setEditing({ ...editing, easier_option: e.target.value })}
                className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] px-3 py-2 text-sm text-ink dark:text-white"
              />
              <input
                placeholder="Harder option"
                value={editing.harder_option}
                onChange={(e) => setEditing({ ...editing, harder_option: e.target.value })}
                className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] px-3 py-2 text-sm text-ink dark:text-white"
              />
              <input
                placeholder="Practical tip"
                value={editing.tip}
                onChange={(e) => setEditing({ ...editing, tip: e.target.value })}
                className="col-span-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] px-3 py-2 text-sm text-ink dark:text-white"
              />
              <input
                placeholder="Safety note (optional)"
                value={editing.safety_note}
                onChange={(e) => setEditing({ ...editing, safety_note: e.target.value })}
                className="col-span-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.02] px-3 py-2 text-sm text-ink dark:text-white"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
            >
              <Save size={16} /> {saving ? 'Saving…' : 'Save item'}
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-ink/50 dark:text-white/50">Loading…</p>
        ) : (
          <div className="grid gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-ink dark:text-white">{item.title}</p>
                  <p className="text-xs text-ink/50 dark:text-white/50">
                    {item.level} · {item.body_position} · {item.equipment}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditing(item)}
                    className="text-xs font-semibold text-[#4F7CFF] hover:underline"
                  >
                    Edit
                  </button>
                  <button onClick={() => item.id && handleDelete(item.id)} className="text-red-500">
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
