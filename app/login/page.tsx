"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useEntryLang } from "@/lib/i18n/useEntryLang";
import { ENTRY_STRINGS, localizeAuthError } from "@/lib/i18n/entryStrings";
import { publicPath, myPhygoLoginHref } from "@/lib/i18n/landingStrings";

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
    <main id="main-content" className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white dark:bg-[#08090b] px-4">
      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(79,124,255,0.6) 0%, rgba(50,214,160,0.5) 100%)',
        }}
      />

      <div className="relative w-full max-w-sm rounded-[28px] border border-black/[0.09] dark:border-white/10 bg-white/95 dark:bg-white/[0.04] backdrop-blur-2xl shadow-2xl p-8">
        <div className="flex justify-center mb-6">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7CFF] to-[#32D6A0] text-white text-lg font-bold shadow-[0_8px_24px_rgba(79,124,255,0.35)]">
            P
          </span>
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
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-white/[0.02] px-4 py-3 text-sm outline-none transition focus:border-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10 text-ink dark:text-white"
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
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-white/[0.02] px-4 py-3 text-sm outline-none transition focus:border-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10 text-ink dark:text-white"
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
            className="w-full rounded-xl py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(79,124,255,0.35)] transition-transform hover:scale-[1.02] disabled:opacity-50"
            style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
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
                className="font-semibold text-[#3A5FE0] dark:text-[#7B9DFF] hover:underline"
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
                className="font-semibold text-[#3A5FE0] dark:text-[#7B9DFF] hover:underline"
              >
                {t.logIn}
              </button>
            </>
          )}
        </p>

        <p className="mt-4 text-center text-xs text-ink/60 dark:text-white/55">
          {t.patientHint}{" "}
          <a href={myPhygoLoginHref(lang)} className="font-semibold text-[#3A5FE0] dark:text-[#7B9DFF] hover:underline">
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
