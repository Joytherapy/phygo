"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { GraduationCap, Stethoscope, Loader2 } from "lucide-react";
import { ROLE_STRINGS, type PracticeStage } from "@/lib/i18n/roleStrings";
import { useEntryLang } from "@/lib/i18n/useEntryLang";
import { ENTRY_STRINGS } from "@/lib/i18n/entryStrings";
import BrandMark from "@/components/BrandMark";
import { PageBackdrop } from '@/components/ui/premium'

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <Onboarding />
    </Suspense>
  );
}

function Onboarding() {
  const router = useRouter();
  const supabase = createClient();
  // No LanguageProvider exists before the dashboard (and a new profile's
  // preferred_language defaults to 'it'), so this page follows the language
  // the visitor chose on the public site — see lib/i18n/useEntryLang.ts.
  const lang = useEntryLang();
  const roleUi = ROLE_STRINGS[lang];
  const t = ENTRY_STRINGS[lang].onboarding;

  const [step, setStep] = useState<"name" | "role">("name");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectingRole, setSelectingRole] = useState<PracticeStage | null>(null);

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      data: { display_name: name },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep("role");
  };

  // "How will you use PHYGO?" — sets profiles.practice_stage, a dimension
  // independent from profiles.role (account category: physio/patient, already
  // existing) and from the subscription plan. See sql/2026-09_role_aware.sql.
  const handleRoleSelect = async (stage: PracticeStage) => {
    setSelectingRole(stage);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError(t.sessionExpired);
      setSelectingRole(null);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      // preferred_language: keep the language chosen on the public site, so
      // the dashboard (LanguageContext) opens in it instead of the 'it' default.
      .update({ practice_stage: stage, preferred_language: lang })
      .eq("id", user.id);

    if (error) {
      setError(error.message);
      setSelectingRole(null);
      return;
    }

    router.push(stage === "student" ? "/dashboard/workspace" : "/dashboard");
    router.refresh();
  };

  return (
    <main id="main-content" className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f7f8] dark:bg-[#050608] px-4">
      <PageBackdrop />

      {step === "name" && (
        <div className="relative w-full max-w-sm rounded-[24px] border border-black/[0.06] bg-white/90 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_44px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:border-white/[0.07] dark:bg-transparent dark:bg-gradient-to-b dark:from-white/[0.055] dark:to-white/[0.018] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] p-8">
          <div className="flex justify-center mb-6">
            <BrandMark />
          </div>

          <h1 className="mb-1 text-center text-2xl font-semibold text-ink dark:text-white">
            {t.welcome}
          </h1>
          <p className="mb-8 text-center text-sm text-ink/55 dark:text-white/50">
            {t.askName}
          </p>

          <form onSubmit={handleNameSubmit} className="space-y-4">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-white/[0.02] px-4 py-3 text-sm outline-none transition focus:border-[#8B95FF] focus:ring-4 focus:ring-[#8B95FF]/15 text-ink dark:text-white"
              placeholder={t.namePlaceholder}
              aria-label={t.askName}
              autoFocus
            />

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-semibold bg-ink text-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.55)] hover:bg-ink/90 dark:bg-white dark:text-ink dark:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.25)] dark:hover:bg-white/90 transition-transform disabled:opacity-50"
              
            >
              {loading ? t.saving : roleUi.onboarding.continue}
            </button>
          </form>
        </div>
      )}

      {step === "role" && (
        <div className="relative w-full max-w-md rounded-[24px] border border-black/[0.06] bg-white/90 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_44px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:border-white/[0.07] dark:bg-transparent dark:bg-gradient-to-b dark:from-white/[0.055] dark:to-white/[0.018] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] p-8">
          <h1 className="mb-1 text-center text-2xl font-semibold text-ink dark:text-white">
            {roleUi.onboarding.roleQuestion}
          </h1>
          <p className="mb-8 text-center text-sm text-ink/55 dark:text-white/50">
            {name ? `${name}, ` : ""}{t.roleSub}
          </p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleRoleSelect("student")}
              disabled={!!selectingRole}
              className="w-full flex items-start gap-4 rounded-2xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-white/[0.02] p-4 text-left transition hover:border-black/15 dark:hover:border-white/20 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] disabled:opacity-60"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/[0.04] text-ink/70 dark:bg-white/[0.06] dark:text-white/75">
                {selectingRole === "student" ? <Loader2 size={18} className="animate-spin" /> : <GraduationCap size={18} />}
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink dark:text-white">{roleUi.onboarding.studentTitle}</span>
                <span className="block text-xs text-ink/60 dark:text-white/50 mt-0.5">{roleUi.onboarding.studentDescription}</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect("professional")}
              disabled={!!selectingRole}
              className="w-full flex items-start gap-4 rounded-2xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-white/[0.02] p-4 text-left transition hover:border-black/15 dark:hover:border-white/20 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] disabled:opacity-60"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/[0.04] text-ink/70 dark:bg-white/[0.06] dark:text-white/75">
                {selectingRole === "professional" ? <Loader2 size={18} className="animate-spin" /> : <Stethoscope size={18} />}
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink dark:text-white">{roleUi.onboarding.professionalTitle}</span>
                <span className="block text-xs text-ink/60 dark:text-white/50 mt-0.5">{roleUi.onboarding.professionalDescription}</span>
              </span>
            </button>
          </div>

          {error && <p className="mt-4 text-xs text-red-500 text-center">{error}</p>}
        </div>
      )}
    </main>
  );
}
