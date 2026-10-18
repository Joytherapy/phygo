// The PHYGO logo and wordmark exactly as the landing page header shows them
// (components/landing/LandingHeader.tsx): the 28px mark and "PHYGO" in the
// display font, bold, 17px. Used by the app headers so the dashboard and My
// Phygo carry the same brand as the landing page.
export default function BrandMark({ prefix }: { prefix?: string }) {
  return (
    <span className="flex items-center gap-2.5 font-display text-[17px] font-bold tracking-tight text-ink dark:text-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mark.png" alt="" width={28} height={28} className="h-7 w-7 rounded-md object-cover" />
      <span>
        {prefix && <span className="font-medium text-ink/55 dark:text-white/55">{prefix} </span>}
        PHYGO
      </span>
    </span>
  )
}
