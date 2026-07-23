import React from "react";
type Props = {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
};

export default function TranscriptPanel({
  title = "Live Consultation",
  subtitle = "Patient • AI Clinician",
  children,
}: Props) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-xl overflow-hidden">

      <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 px-6 py-4">

        <div className="flex items-center gap-3">

          <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />

          <div>
            <h3 className="text-sm font-semibold text-ink dark:text-white">
              {title}
            </h3>

            <p className="text-xs text-ink/50 dark:text-white/50">
              {subtitle}
            </p>
          </div>

        </div>

        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-500">
          LIVE
        </span>

      </div>

      <div className="p-6">
  {children}
</div>

        
    </div>
  );
}