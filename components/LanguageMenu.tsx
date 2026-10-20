'use client'

import { Globe } from 'lucide-react'
import { APP_LANGS, APP_LANG_LABELS, type AppLang } from '@/lib/i18n/uiStrings'

const LABEL: Record<AppLang, string> = { it: 'Lingua', en: 'Language', es: 'Idioma', fr: 'Langue' }

// Compact language picker for pages without the dashboard Navbar: the login
// pages, the invitation page and the My Phygo portal. A native select, so it
// works the same with a keyboard, a screen reader and on phones.
export default function LanguageMenu({
  value,
  onChange,
  className = '',
}: {
  value: AppLang
  onChange: (next: AppLang) => void
  className?: string
}) {
  return (
    <label
      className={`inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink focus-within:ring-2 focus-within:ring-electric dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white ${className}`}
    >
      <Globe size={15} aria-hidden="true" />
      <span className="sr-only">{LABEL[value]}</span>
      <select
        data-testid="language-menu"
        value={value}
        onChange={(e) => onChange(e.target.value as AppLang)}
        className="cursor-pointer appearance-none bg-transparent outline-none [color-scheme:light] dark:[color-scheme:dark]"
      >
        {APP_LANGS.map((l) => (
          <option key={l} value={l}>
            {APP_LANG_LABELS[l]}
          </option>
        ))}
      </select>
    </label>
  )
}
