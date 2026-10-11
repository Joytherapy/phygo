import type { AppLang } from "@/lib/i18n/uiStrings";
import { formatNumber, type LandingDict } from "@/lib/i18n/landingStrings";

// Live figures read from the library at build/revalidation time. Any figure
// that could not be read is left out rather than replaced by a guess.
export default function ProofStrip({
  lang,
  proof,
  total,
  exercises,
  phasedProtocols,
}: {
  lang: AppLang;
  proof: LandingDict["proof"];
  total: number | null;
  exercises: number | null;
  phasedProtocols: number | null;
}) {
  const items = [
    total ? { value: formatNumber(lang, total), label: proof.conditions } : null,
    exercises ? { value: formatNumber(lang, exercises), label: proof.exercises } : null,
    phasedProtocols ? { value: formatNumber(lang, phasedProtocols), label: proof.protocols } : null,
    { value: "4", label: proof.languages },
    { value: proof.mapsValue, label: proof.maps },
  ].filter((i): i is { value: string; label: string } => i !== null);

  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <dl className="grid grid-cols-2 gap-px overflow-hidden border-y border-black/[0.07] bg-black/[0.07] dark:border-white/[0.08] dark:bg-white/[0.08] sm:grid-cols-3 lg:grid-cols-5">
          {items.map((item, i) => (
            <div
              key={item.label}
              className={`bg-[#f6f7f9] px-4 py-7 dark:bg-ink sm:px-6 sm:py-9 ${
                items.length === 5 && i === 4 ? "max-sm:col-span-2 sm:max-lg:col-span-2" : ""
              }`}
            >
              <dt className="sr-only">{item.label}</dt>
              <dd className="font-display text-[2rem] font-semibold leading-none tracking-[-0.04em] text-ink tabular-nums dark:text-white sm:text-[2.6rem]">
                {item.value}
              </dd>
              <dd aria-hidden className="mt-2.5 text-[12.5px] leading-snug text-ink/60 dark:text-white/55">
                {item.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
