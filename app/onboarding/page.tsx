"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { GraduationCap, Stethoscope, Loader2 } from "lucide-react";
import { ROLE_STRINGS, type PracticeStage } from "@/lib/i18n/roleStrings";
import { useEntryLang } from "@/lib/i18n/useEntryLang";
import { ENTRY_STRINGS } from "@/lib/i18n/entryStrings";

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
    <main id="main-content" className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white dark:bg-[#08090b] px-4">
      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(79,124,255,0.6) 0%, rgba(50,214,160,0.5) 100%)',
        }}
      />

      {step === "name" && (
        <div className="relative w-full max-w-sm rounded-[28px] border border-black/[0.09] dark:border-white/10 bg-white/95 dark:bg-white/[0.04] backdrop-blur-2xl shadow-2xl p-8">
          <div className="flex justify-center mb-6">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7CFF] to-[#32D6A0] text-white text-lg font-bold shadow-[0_8px_24px_rgba(79,124,255,0.35)]">
              P
            </span>
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
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-white/[0.02] px-4 py-3 text-sm outline-none transition focus:border-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10 text-ink dark:text-white"
              placeholder={t.namePlaceholder}
              aria-label={t.askName}
              autoFocus
            />

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(79,124,255,0.35)] transition-transform hover:scale-[1.02] disabled:opacity-50"
              style={{ background: "linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)" }}
            >
              {loading ? t.saving : roleUi.onboarding.continue}
            </button>
          </form>
        </div>
      )}

      {step === "role" && (
        <div className="relative w-full max-w-md rounded-[28px] border border-black/[0.09] dark:border-white/10 bg-white/95 dark:bg-white/[0.04] backdrop-blur-2xl shadow-2xl p-8">
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
              className="w-full flex items-start gap-4 rounded-2xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-white/[0.02] p-4 text-left transition hover:border-[#4F7CFF] hover:bg-[#4F7CFF]/[0.04] disabled:opacity-60"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4F7CFF]/10 text-[#4F7CFF]">
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
              className="w-full flex items-start gap-4 rounded-2xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-white/[0.02] p-4 text-left transition hover:border-[#32D6A0] hover:bg-[#32D6A0]/[0.04] disabled:opacity-60"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#32D6A0]/10 text-[#32D6A0]">
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
