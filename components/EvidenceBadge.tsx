'use client';

import { useLanguage, useUiStrings } from '@/contexts/LanguageContext';
import { EVIDENCE_STYLE, evidenceLabel, evidenceTier } from '@/lib/evidence';

/**
 * Uniform "evidence level" badge used across every section of the site, so
 * that clinical content is flagged with the same colour for the same level
 * wherever it appears (lib/evidence.ts): green high, teal moderate-high,
 * amber moderate, orange low-moderate, red low, blue expert consensus, grey
 * when the stored value is not recognised (then shown as written, never
 * dropped). The words are always there; the colour only makes them stand out.
 */
export default function EvidenceBadge({
  level,
  className = '',
  prefix = true,
  size = 'sm',
}: {
  level?: string | null;
  className?: string;
  /** Show "Evidence:" before the level. */
  prefix?: boolean;
  size?: 'sm' | 'md';
}) {
  const ui = useUiStrings();
  const { lang } = useLanguage();

  if (!level || !level.trim()) return null;

  const tier = evidenceTier(level);
  const style = EVIDENCE_STYLE[tier ?? 'unknown'];
  const label = evidenceLabel(level, lang);

  return (
    <span
      data-testid="evidence-badge"
      data-tier={tier ?? 'unknown'}
      title={level}
      className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wide ${size === 'md' ? 'px-3 py-1 text-[11px]' : 'px-2 py-0.5 text-[10px]'} ${style.chip} ${className}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
      {prefix ? `${ui.fields.evidence}: ${label}` : label}
    </span>
  );
}

/**
 * Small citation line for a real scientific source, shown under content
 * that has one (knowledge_base.source / source_date, or an equivalent
 * per-section field). Renders nothing when no source is present, so it's
 * safe to drop into any card unconditionally.
 */
export function SourceCitation({
  source,
  sourceDate,
  className = '',
}: {
  source?: string | null;
  sourceDate?: string | null;
  className?: string;
}) {
  const ui = useUiStrings();

  if (!source) return null;

  return (
    <p className={`text-[10px] text-ink/55 dark:text-white/40 leading-relaxed mt-2 pt-2 border-t border-black/[0.05] dark:border-white/[0.08] ${className}`}>
      <span className="font-semibold">{ui.fields.source}: </span>
      {source}
      {sourceDate ? ` (${sourceDate})` : ''}
    </p>
  );
}
