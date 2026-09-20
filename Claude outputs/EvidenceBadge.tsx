'use client';

import { useUiStrings } from '@/contexts/LanguageContext';

type EvidenceLevel = 'high' | 'strong' | 'moderate' | 'low' | 'limited' | string;

const LEVEL_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  high: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  strong: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  moderate: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  low: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', dot: 'bg-orange-500' },
  limited: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', dot: 'bg-orange-500' },
};

const DEFAULT_STYLE = { bg: 'bg-black/5 dark:bg-white/10', text: 'text-ink/50 dark:text-white/50', dot: 'bg-ink/30 dark:bg-white/30' };

/**
 * Uniform "evidence level" badge used across every section of the site
 * (Anatomy / Conditions / Rehab / Function / Treatments tabs) so that
 * clinical content is consistently flagged as High / Moderate / Low /
 * Expert-consensus quality evidence, wherever it appears.
 *
 * `level` is expected to be one of the DB enum values already used in
 * `knowledge_base.evidence_level` and the various `*_structures` /
 * `*_rehab` tables: 'high' | 'strong' | 'moderate' | 'low' | 'limited'.
 * Any other/unrecognized value still renders (in a neutral gray) rather
 * than being silently dropped, so a not-yet-normalized value is visible
 * instead of invisible.
 */
export default function EvidenceBadge({
  level,
  className = '',
}: {
  level?: EvidenceLevel | null;
  className?: string;
}) {
  const ui = useUiStrings();

  if (!level) return null;

  const key = level.toLowerCase().trim();
  const style = LEVEL_STYLES[key] ?? DEFAULT_STYLE;
  const label = ui.evidenceLevels[key as keyof typeof ui.evidenceLevels] ?? level;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${style.bg} ${style.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {ui.fields.evidence}: {label}
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
    <p className={`text-[10px] text-ink/40 dark:text-white/40 leading-relaxed mt-2 pt-2 border-t border-black/[0.05] dark:border-white/[0.08] ${className}`}>
      <span className="font-semibold">{ui.fields.source}: </span>
      {source}
      {sourceDate ? ` (${sourceDate})` : ''}
    </p>
  );
}
