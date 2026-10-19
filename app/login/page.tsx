"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useChosenEntryLang, useEntryLang, useSetEntryLang } from "@/lib/i18n/useEntryLang";
import { rememberLanguage } from "@/lib/i18n/rememberLanguage";
import { ENTRY_STRINGS, localizeAuthError } from "@/lib/i18n/entryStrings";
import { publicPath, myPhygoLoginHref } from "@/lib/i18n/landingStrings";
import BrandMark from "@/components/BrandMark";
import LanguageMenu from "@/components/LanguageMenu";
import { PageBackdrop } from '@/components/ui/premium'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const lang = useEntryLang();
  const chosenLang = useChosenEntryLang();
  const setEntryLang = useSetEntryLang();
  const t = ENTRY_STRINGS[lang].login;

  const [mode, setMode] = useState<"login" | "signup">(() =>
    searchParams.get("mode") === "signup" ? "signup" : "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    // If the sign-in service cannot be reached (or is not configured, as in
    // Vercel Previews), say so instead of leaving the button on "Please wait".
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setError(error.name === "AuthRetryableFetchError" ? t.serviceUnavailable : localizeAuthError(error.message, t));
        } else {
          // The language chosen on the site or on this page becomes the
          // account's, so the dashboard opens in it (it defaults to 'it').
          if (chosenLang) await rememberLanguage(supabase, chosenLang);
          router.push("/dashboard");
          router.refresh();
          return; // stays on "Please wait" while the dashboard opens
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setError(error.name === "AuthRetryableFetchError" ? t.serviceUnavailable : localizeAuthError(error.message, t));
        } else {
          router.push("/onboarding");
          router.refresh();
          return;
        }
      }
    } catch (err) {
      console.error("Sign-in unavailable:", err instanceof Error ? err.message : err);
      setError(t.serviceUnavailable);
    }
    setLoading(false);
  };

  return (
    <main id="main-content" className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f7f8] dark:bg-[#050608] px-4">
      <PageBackdrop />

      <div className="relative w-full max-w-sm rounded-[24px] border border-black/[0.06] bg-white/90 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_44px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:border-white/[0.07] dark:bg-transparent dark:bg-gradient-to-b dark:from-white/[0.055] dark:to-white/[0.018] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] p-8">
        <LanguageMenu value={lang} onChange={setEntryLang} className="absolute right-4 top-4" />
        <div className="flex justify-center mb-6">
          <BrandMark />
        </div>

        <h1 className="mb-1 text-center text-2xl font-semibold text-ink dark:text-white">
          {mode === "login" ? t.loginTitle : t.signupTitle}
        </h1>
        <p className="mb-8 text-center text-sm text-ink/55 dark:text-white/50">
          {mode === "login" ? t.loginSub : t.signupSub}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-1 block text-xs font-medium text-ink/60 dark:text-white/55">
              {t.email}
            </label>
            <input
              id="login-email"
              autoComplete="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-white/[0.02] px-4 py-3 text-sm outline-none transition focus:border-[#8B95FF] focus:ring-4 focus:ring-[#8B95FF]/15 text-ink dark:text-white"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="mb-1 block text-xs font-medium text-ink/60 dark:text-white/55">
              {t.password}
            </label>
            <input
              id="login-password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-white/[0.02] px-4 py-3 text-sm outline-none transition focus:border-[#8B95FF] focus:ring-4 focus:ring-[#8B95FF]/15 text-ink dark:text-white"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p role="alert" className="text-xs text-red-500">{error}</p>
          )}
          {message && (
            <p className="text-xs text-emerald-600">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-semibold bg-ink text-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.55)] hover:bg-ink/90 dark:bg-white dark:text-ink dark:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.25)] dark:hover:bg-white/90 transition-transform disabled:opacity-50"
            
          >
            {loading ? t.wait : mode === "login" ? t.loginCta : t.signupCta}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink/55 dark:text-white/50">
          {mode === "login" ? (
            <>
              {t.noAccount}{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="font-semibold text-[#5B63E6] dark:text-[#A5B4FF] hover:underline"
              >
                {t.signUp}
              </button>
            </>
          ) : (
            <>
              {t.haveAccount}{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="font-semibold text-[#5B63E6] dark:text-[#A5B4FF] hover:underline"
              >
                {t.logIn}
              </button>
            </>
          )}
        </p>

        <p className="mt-4 text-center text-xs text-ink/60 dark:text-white/55">
          {t.patientHint}{" "}
          <a href={myPhygoLoginHref(lang)} className="font-semibold text-[#5B63E6] dark:text-[#A5B4FF] hover:underline">
            {t.patientLink}
          </a>
        </p>
        <p className="mt-6 flex justify-center gap-4 text-[11px] text-ink/60 dark:text-white/55">
          <a href={publicPath(lang, "terms")} className="hover:underline">{t.terms}</a>
          <a href={publicPath(lang, "privacy")} className="hover:underline">{t.privacy}</a>
        </p>
      </div>
    </main>
  );
}
