import { SUPPORTED_LANGS, LANG_LABELS, type Lang } from '@/lib/publicLibrary';
import { Languages } from 'lucide-react';

/**
 * Small pill-style language switcher for the public library pages. Shown on
 * every /library/condition (index + detail) page across all four languages
 * so a reader — or Googlebot following hreflang — can move between versions
 * in one click instead of hunting for a single hardcoded "read in X" link.
 *
 * `hrefFor` is supplied by the caller because the target path differs by
 * page type: the index page just needs buildConditionIndexPath(lang), while
 * a detail page needs buildConditionIdPath(id, lang) (numeric-only, since
 * the caller usually doesn't have the condition name translated into every
 * other language on hand).
 */
export default function LanguageSwitcher({
  current,
  hrefFor,
}: {
  current: Lang;
  hrefFor: (lang: Lang) => string;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-1 backdrop-blur-xl">
      <Languages size={13} className="ml-1.5 mr-0.5 text-ink/30 dark:text-white/30 shrink-0" />
      {SUPPORTED_LANGS.map((lang) => {
        const active = lang === current;
        return (
          <a
            key={lang}
            href={hrefFor(lang)}
            aria-current={active ? 'true' : undefined}
            className={
              active
                ? 'rounded-full px-2.5 py-1 text-[11px] font-semibold text-white bg-gradient-to-r from-[#4F7CFF] to-[#32D6A0]'
                : 'rounded-full px-2.5 py-1 text-[11px] font-medium text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white transition-colors'
            }
          >
            {LANG_LABELS[lang]}
          </a>
        );
      })}
    </div>
  );
}
