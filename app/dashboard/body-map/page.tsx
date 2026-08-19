'use client';

import { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

type View = 'front' | 'back';
type Point = { x: number; y: number };

interface Zone {
  slug: string;
  name: string;
  points: Partial<Record<View, Point[]>>;
}

const IMAGE_BASE =
  'https://dckmumxswheamyymerea.supabase.co/storage/v1/object/public/library-images';

const INITIAL_ZONES: Zone[] = [
  {
    slug: 'cervical-spine',
    name: 'Cervical Spine',
    points: {
      front: [{ x: 50, y: 18.9 }],
      back: [{ x: 50, y: 12 }], // stima, da calibrare — base cranio/suboccipitale
    },
  },
  {
    slug: 'trapezius',
    name: 'Trapezius / Upper Trap',
    points: { back: [{ x: 40, y: 19 }, { x: 60, y: 19 }] }, // stima, da calibrare
  },
  {
    slug: 'shoulder',
    name: 'Shoulder',
    points: {
      front: [{ x: 35.5, y: 21.9 }, { x: 64.3, y: 21.9 }],
      back: [{ x: 34.5, y: 21.9 }, { x: 64.3, y: 21.9 }],
    },
  },
  {
    slug: 'chest',
    name: 'Chest / Pectorals',
    points: { front: [{ x: 50, y: 26 }] }, // stima, da calibrare
  },
  {
    slug: 'biceps',
    name: 'Biceps',
    points: { front: [{ x: 33.2, y: 30 }, { x: 65.7, y: 30 }] },
  },
  {
    slug: 'triceps',
    name: 'Triceps',
    points: { back: [{ x: 31.9, y: 30 }, { x: 67.3, y: 30 }] },
  },
  {
    slug: 'elbow',
    name: 'Elbow',
    points: { front: [{ x: 32.1, y: 36.2 }, { x: 67.2, y: 36.2 }] },
  },
  {
    slug: 'forearm',
    name: 'Forearm',
    points: { front: [{ x: 30, y: 40.5 }, { x: 69, y: 40.5 }] }, // stima, da calibrare
  },
  {
    slug: 'wrist-hand',
    name: 'Wrist / Hand',
    points: { front: [{ x: 28, y: 44.9 }, { x: 71, y: 44.9 }] },
  },
  {
    slug: 'core-abdomen',
    name: 'Core / Abdomen',
    points: { front: [{ x: 50, y: 33.9 }] },
  },
  {
    slug: 'thoracic-spine',
    name: 'Thoracic Spine / Upper Back',
    points: { back: [{ x: 50, y: 20 }, { x: 50, y: 28 }] }, // stima, da calibrare
  },
  {
    slug: 'lumbar-spine',
    name: 'Lumbar Spine / Lower Back',
    points: { back: [{ x: 49.5, y: 41.8 }] },
  },
  {
    slug: 'hip',
    name: 'Hip',
    points: {
      front: [{ x: 44.6, y: 41.7 }, { x: 54.2, y: 41.7 }],
      back: [{ x: 41.7, y: 45.4 }, { x: 57.4, y: 45.4 }],
    },
  },
  {
    slug: 'glutes',
    name: 'Glutes',
    points: { back: [{ x: 41, y: 50 }, { x: 58, y: 50 }] }, // stima, da calibrare
  },
  {
    slug: 'quadriceps',
    name: 'Quadriceps',
    points: { front: [{ x: 42.7, y: 52.4 }, { x: 55.8, y: 52.4 }] }, // stima, da calibrare
  },
  {
    slug: 'hamstrings',
    name: 'Hamstrings',
    points: { back: [{ x: 41.7, y: 54 }, { x: 57.4, y: 54 }] }, // stima, da calibrare
  },
  {
    slug: 'knee',
    name: 'Knee',
    points: { front: [{ x: 40.9, y: 63.1 }, { x: 57.4, y: 63.1 }] },
  },
  {
    slug: 'calf',
    name: 'Calf',
    points: { back: [{ x: 40, y: 75 }, { x: 58.7, y: 75 }] }, // stima, da calibrare
  },
  {
    slug: 'ankle-foot',
    name: 'Ankle / Foot',
    points: {
      front: [{ x: 39.3, y: 85.3 }, { x: 59.3, y: 85.3 }],
      back: [{ x: 39.8, y: 87.1 }, { x: 58.7, y: 87.1 }],
    },
  },
];

export default function BodyMapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const calibrate = searchParams.get('calibrate') === '1';
  const containerRef = useRef<HTMLDivElement>(null);

  const [view, setView] = useState<View>('front');
  const [hovered, setHovered] = useState<string | null>(null);
  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [dragging, setDragging] = useState<{ slug: string; index: number } | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [isolated, setIsolated] = useState<string | null>(null);

  const imageSrc = view === 'front' ? `${IMAGE_BASE}/bodymap-front.png` : `${IMAGE_BASE}/bodymap-back.png`;

  function updatePoint(slug: string, index: number, x: number, y: number) {
    setZones((prev) =>
      prev.map((z) => {
        if (z.slug !== slug) return z;
        const pts = [...(z.points[view] || [])];
        pts[index] = { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
        return { ...z, points: { ...z.points, [view]: pts } };
      })
    );
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));
    updatePoint(dragging.slug, dragging.index, x, y);
  }

  function exportCode() {
    const lines = zones.map((z) => {
      const parts: string[] = [];
      if (z.points.front) parts.push(`      front: ${JSON.stringify(z.points.front)},`);
      if (z.points.back) parts.push(`      back: ${JSON.stringify(z.points.back)},`);
      return `  {\n    slug: '${z.slug}',\n    name: '${z.name}',\n    points: {\n${parts.join('\n')}\n    },\n  },`;
    });
    return `const ZONES: Zone[] = [\n${lines.join('\n')}\n];`;
  }

  return (
    <div className="min-h-screen bg-[#08090b] text-white relative overflow-hidden">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(79,124,255,0.6) 0%, rgba(50,214,160,0.5) 100%)' }}
      />

      <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-24">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-xl text-xs font-semibold tracking-[0.15em] uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0]" />
            {calibrate ? 'Calibration Mode — drag the dots' : 'Interactive Body Map'}
          </div>
          <h1 className="text-6xl font-bold tracking-tight">
            Anatomical{' '}
            <span className="bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0] bg-clip-text text-transparent">
              Navigator
            </span>
          </h1>
        </div>

        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-xl p-1">
            {(['front', 'back'] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-6 py-2 rounded-full text-sm font-semibold capitalize transition-all ${
                  view === v ? 'bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0] text-black' : 'text-white/60 hover:text-white'
                }`}
              >
                {v === 'front' ? 'Front' : 'Back'}
              </button>
            ))}
          </div>
        </div>

        {calibrate && (
          <div className="flex justify-center mb-6">
            <select
              value={isolated ?? ''}
              onChange={(e) => setIsolated(e.target.value || null)}
              className="px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-sm"
            >
              <option value="">Mostra tutte le zone</option>
              {zones
                .filter((z) => z.points[view])
                .map((z) => (
                  <option key={z.slug} value={z.slug}>
                    Isola: {z.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        <div className="flex justify-center">
          <div
            ref={containerRef}
            className="relative w-full max-w-md select-none touch-none"
            onPointerMove={handlePointerMove}
            onPointerUp={() => setDragging(null)}
            onPointerLeave={() => setDragging(null)}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={view}
                src={imageSrc}
                alt={`Anatomical body map - ${view}`}
                className="w-full h-auto pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                draggable={false}
              />
            </AnimatePresence>

            {zones.flatMap((zone) => {
              const pts = zone.points[view];
              if (!pts) return [];
              if (calibrate && isolated && isolated !== zone.slug) return [];
              return pts.map((p, i) => (
                <div
                  key={`${zone.slug}-${view}-${i}`}
                  onPointerDown={(e) => {
                    if (!calibrate) return;
                    e.preventDefault();
                    setDragging({ slug: zone.slug, index: i });
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!calibrate) router.push(`/dashboard/body-map/${zone.slug}`);
                  }}
                  onMouseEnter={() => setHovered(`${zone.slug}-${i}`)}
                  onMouseLeave={() => setHovered(null)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 group flex items-center justify-center ${
                    calibrate ? 'cursor-grab active:cursor-grabbing p-3' : 'cursor-pointer'
                  }`}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                >
                  <span className="relative flex h-5 w-5">
                    {!calibrate && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#32D6A0] opacity-60" />
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-5 w-5 border-2 ${
                        calibrate
                          ? 'bg-red-500/70 border-red-300'
                          : 'bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0] border-white/40'
                      }`}
                    />
                  </span>
                  {calibrate && (
                    <span className="absolute left-1/2 -translate-x-1/2 -top-5 whitespace-nowrap px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white/70 pointer-events-none">
                      {p.x}, {p.y}
                    </span>
                  )}
                  {!calibrate && hovered === `${zone.slug}-${i}` && (
                    <span className="absolute left-1/2 -translate-x-1/2 -top-8 whitespace-nowrap px-3 py-1 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-xs font-medium pointer-events-none">
                      {zone.name}
                    </span>
                  )}
                </div>
              ));
            })}
          </div>
        </div>

        {!calibrate && (
          <div className="flex justify-center mt-10">
            <button
              onClick={() => router.push('/dashboard/body-map/whole-body')}
              className="px-6 py-3 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.06] transition-all text-sm font-semibold"
            >
              Whole Body / Balance &amp; Gait →
            </button>
          </div>
        )}

        {calibrate && (
          <div className="flex flex-col items-center gap-4 mt-8">
            <p className="text-white/50 text-sm text-center max-w-md">
              Trascina ogni pallino rosso esattamente sopra il punto anatomico giusto. Usa il menu sopra per isolare una zona se ce ne sono troppe vicine. Quando hai finito con Front e Back, premi Esporta.
            </p>
            <button
              onClick={() => setShowExport(true)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0] text-black text-sm font-bold"
            >
              Esporta coordinate
            </button>
          </div>
        )}

        {showExport && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50" onClick={() => setShowExport(false)}>
            <div
              className="bg-[#0e0f12] border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm text-white/60 mb-3">
                Copia questo testo e incollalo qui in chat — sostituirò l'array ZONES definitivo.
              </p>
              <pre className="text-xs bg-black/40 p-4 rounded-xl overflow-auto whitespace-pre-wrap">{exportCode()}</pre>
              <button
                onClick={() => setShowExport(false)}
                className="mt-4 px-4 py-2 rounded-xl bg-white/10 text-sm"
              >
                Chiudi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
