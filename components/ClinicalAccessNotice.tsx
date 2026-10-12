'use client'

import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { useClinicalLocked } from '@/lib/useClinicalAccess'
import { useVerificationStrings } from '@/lib/i18n/verificationStrings'

// Shown on patient-management pages to accounts that may not manage real
// patients: explains why actions are disabled and where to request verification.
export default function ClinicalAccessNotice({ compact = false }: { compact?: boolean }) {
  const locked = useClinicalLocked()
  const t = useVerificationStrings()
  if (!locked) return null
  return (
    <div
      role="note"
      className={`flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-900 dark:text-amber-200 ${compact ? 'p-3 text-xs' : 'p-4 text-sm mb-6'}`}
    >
      <ShieldCheck size={compact ? 14 : 16} className="mt-0.5 shrink-0" aria-hidden />
      <p>
        {t.patientsLocked}{' '}
        <Link href="/dashboard/profile" className="font-semibold underline underline-offset-2">
          {t.patientsLockedLink}
        </Link>
      </p>
    </div>
  )
}
