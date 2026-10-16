import { Lock, Sparkles, UserCheck, type LucideIcon } from "lucide-react";
import type { AppLang } from "@/lib/i18n/uiStrings";
import { publicPath, type LandingDict } from "@/lib/i18n/landingStrings";
import { CheckList, CONTAINER, SectionHeading, TextLink } from "./ui";

// Every statement is checked against the code:
// - drafts are saved only on explicit action (components/liveStructuring),
//   images sent to /api/analyze-scan are not stored;
// - clinical AI routes call requireVerifiedProfessional (lib/auth/sessionServer.ts),
//   verification is a manual check against the public register (lib/verification.ts);
// - Supabase project in eu-central-1 (Frankfurt); Vercel functions in iad1 (USA);
// - row-level security on patient tables (sql/);
// - AI provider named in the privacy policy (lib/i18n/legal).
// Certifications, compliance labels and encryption details are not claimed.
const ICONS: LucideIcon[] = [Sparkles, UserCheck, Lock];

export default function TrustSection({ lang, trust }: { lang: AppLang; trust: LandingDict["trust"] }) {
  return (
    <section id="trust" aria-labelledby="trust-title" className="scroll-mt-20 border-t border-black/[0.07] py-20 dark:border-white/[0.08] sm:py-28">
      <div className={CONTAINER}>
        <SectionHeading id="trust-title" eyebrow={trust.eyebrow} title={trust.title} intro={trust.intro} />
        <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {trust.columns.map((col, i) => {
            const Icon = ICONS[i];
            return (
              <div key={col.title} className="min-w-0 border-t border-black/10 pt-6 dark:border-white/10">
                <h3 className="flex items-center gap-2.5 font-display text-lg font-semibold text-ink dark:text-white">
                  <Icon size={18} aria-hidden className="shrink-0 text-electric-dark dark:text-electric-light" />
                  {col.title}
                </h3>
                <CheckList className="mt-5" items={col.items} />
              </div>
            );
          })}
        </div>
        <TextLink href={publicPath(lang, "privacy")} className="mt-10">
          {trust.privacy}
        </TextLink>
      </div>
    </section>
  );
}
