'use client'

import Link from 'next/link'
import { ArrowRight, Stethoscope } from 'lucide-react'
import { useMyPhygoStrings } from '@/lib/i18n/myPhygoStrings'
import { PRIMARY_BTN, SURFACE } from '@/components/ui/premium'

/** Shown in My Phygo when the signed-in account is a clinician's (it owns
 *  patient records): the patient portal is not for this account. */
export default function ClinicianNotice() {
  const t = useMyPhygoStrings().profile
  return (
    <div className="relative mx-auto max-w-xl px-6 pb-24 pt-40">
      <div role="status" data-testid="clinician-notice" className={`${SURFACE} p-7 sm:p-8`}>
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C83FF] to-[#A78BFA] text-white">
          <Stethoscope size={20} aria-hidden />
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-[-0.03em] text-ink dark:text-white">{t.clinicianTitle}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink/65 dark:text-white/60">{t.clinicianBody}</p>
        <Link href="/dashboard" className={`mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-full px-6 text-sm font-semibold transition ${PRIMARY_BTN}`}>
          {t.clinicianCta}
          <ArrowRight size={15} aria-hidden />
        </Link>
      </div>
    </div>
  )
}
