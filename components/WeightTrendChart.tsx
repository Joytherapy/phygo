'use client';

import { useId, useMemo, useState } from 'react';

export type WeightTrendPoint = { date: string; weightKg: number };

const ACCENT = { light: '#6366F1', dark: '#818CF8' };

const VBW = 600;
const PAD_X = 10;
const PAD_Y = 18;

// Grafico di andamento peso — nessuna libreria di charting (stesso vincolo
// del resto della feature: niente nuove dipendenze npm da installare sul
// Mac dell'utente). Un solo SVG inline, scala reale sul tempo (non per
// indice, cosi' pesate irregolari nel tempo restano visivamente corrette),
// con crosshair + tooltip on hover come richiesto dalla dataviz skill per
// ogni grafico a linea/area.
export default function WeightTrendChart({
  data,
  height = 160,
}: {
  data: WeightTrendPoint[];
  height?: number;
}) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const chart = useMemo(() => {
    if (data.length < 2) return null;

    const times = data.map((d) => new Date(d.date).getTime());
    const weights = data.map((d) => d.weightKg);
    const minT = times[0];
    const maxT = times[times.length - 1];
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);
    const padW = Math.max((maxW - minW) * 0.2, 0.5);
    const yLo = minW - padW;
    const yHi = maxW + padW;

    const xScale = (t: number) =>
      PAD_X + ((t - minT) / (maxT - minT || 1)) * (VBW - PAD_X * 2);
    const yScale = (w: number) =>
      height - PAD_Y - ((w - yLo) / (yHi - yLo || 1)) * (height - PAD_Y * 2);

    const points = data.map((d, i) => ({
      x: xScale(times[i]),
      y: yScale(d.weightKg),
      ...d,
    }));

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const baseline = height - PAD_Y;
    const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${baseline} L${points[0].x.toFixed(1)},${baseline} Z`;

    return { points, linePath, areaPath };
  }, [data, height]);

  if (!chart) return null;
  const { points, linePath, areaPath } = chart;
  const hovered = hoverIndex != null ? points[hoverIndex] : null;

  function nearestIndexForClientX(clientX: number, svg: SVGSVGElement) {
    const rect = svg.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * VBW;
    let nearest = 0;
    let best = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX);
      if (dist < best) {
        best = dist;
        nearest = i;
      }
    });
    return nearest;
  }

  const tooltipFlip = hovered && hovered.x > VBW * 0.66;

  return (
    <div className="weight-trend-root relative">
      <style>{`
        .weight-trend-root { --wt-accent: ${ACCENT.light}; }
        .dark .weight-trend-root { --wt-accent: ${ACCENT.dark}; }
      `}</style>
      <svg
        viewBox={`0 0 ${VBW} ${height}`}
        className="w-full touch-none"
        style={{ height }}
        onMouseMove={(e) => setHoverIndex(nearestIndexForClientX(e.clientX, e.currentTarget))}
        onMouseLeave={() => setHoverIndex(null)}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          if (touch) setHoverIndex(nearestIndexForClientX(touch.clientX, e.currentTarget));
        }}
        onTouchEnd={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--wt-accent)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--wt-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={linePath} fill="none" stroke="var(--wt-accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Punti di inizio/fine sempre visibili; gli altri solo su hover, per non affollare la linea (marks-and-anatomy: label selettive, non un numero per punto). */}
        <circle cx={points[0].x} cy={points[0].y} r="3" fill="var(--wt-accent)" opacity="0.5" />
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill="var(--wt-accent)" />

        {hovered && (
          <>
            <line
              x1={hovered.x}
              x2={hovered.x}
              y1={PAD_Y * 0.4}
              y2={height - PAD_Y}
              stroke="var(--wt-accent)"
              strokeOpacity="0.25"
              strokeWidth="1"
            />
            <circle cx={hovered.x} cy={hovered.y} r="4.5" fill="var(--wt-accent)" stroke="white" strokeWidth="1.5" />
          </>
        )}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute top-0 rounded-lg bg-ink dark:bg-white text-white dark:text-ink text-[11px] font-semibold px-2.5 py-1.5 shadow-lg whitespace-nowrap"
          style={{
            left: `${(hovered.x / VBW) * 100}%`,
            transform: tooltipFlip ? 'translate(-100%, 0)' : 'translate(0, 0)',
          }}
        >
          {new Date(hovered.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} · {hovered.weightKg} kg
        </div>
      )}
    </div>
  );
}
