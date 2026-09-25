'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Star, Trash2, BookOpen } from 'lucide-react'
import { useWorkspaceUi } from '@/lib/i18n/workspaceStrings'

// Deliberately flat for V1 — Home / Starred / Trash. A live folder tree here
// would duplicate the folder browsing that folder/[id] pages already do, and
// the implementation brief explicitly scopes V1 to "reusable components, not
// giant/duplicated UI" — nested folders are navigated by drilling into folder
// cards + breadcrumbs instead (see app/dashboard/workspace/folder/[id]).
export default function WorkspaceSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const ui = useWorkspaceUi()

  const items = [
    { key: 'home', href: '/dashboard/workspace', label: ui.nav.home, icon: Home },
    { key: 'starred', href: '/dashboard/workspace/starred', label: ui.nav.starred, icon: Star },
    { key: 'trash', href: '/dashboard/workspace/trash', label: ui.nav.trash, icon: Trash2 },
  ]

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col gap-1 pr-2">
      <div className="flex items-center gap-2 px-3 py-2 mb-2">
        {/* Role-aware brand gradient (Student vs Professional) — see
            app/globals.css / contexts/RoleThemeContext.tsx. brand-glow adds
            the soft colored shadow that makes a flat gradient badge read as
            premium rather than just "colored". */}
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--brand-from)] to-[var(--brand-to)] text-white brand-glow">
          <BookOpen size={13} />
        </span>
        <span className="text-sm font-semibold text-ink dark:text-white">{ui.nav.workspace}</span>
      </div>

      {items.map((item) => {
        const active = pathname === item.href
        const Icon = item.icon
        return (
          <button
            key={item.key}
            onClick={() => router.push(item.href)}
            className={`flex items-center gap-2.5 rounded-xl border-l-2 px-3 py-2.5 text-sm transition-colors text-left ${
              active
                ? 'border-[var(--brand-from)] bg-[color-mix(in_srgb,var(--brand-from)_12%,transparent)] font-semibold text-[var(--brand-from)]'
                : 'border-transparent font-medium text-ink/60 dark:text-white/60 hover:bg-ink/5 dark:hover:bg-white/10 hover:text-ink dark:hover:text-white'
            }`}
          >
            <Icon size={15} />
            {item.label}
          </button>
        )
      })}
    </aside>
  )
}
