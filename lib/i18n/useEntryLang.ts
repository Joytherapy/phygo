'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { APP_LANGS, type AppLang } from '@/lib/i18n/uiStrings';

// Language for the pages a visitor reaches from the landing before any
// LanguageProvider exists (login, onboarding, My Phygo login/join).
// Order: ?lang= in the URL (set by the landing links), then the "phygo-lang"
// preference the landing switcher stores, then the browser language, then
// English. Server and first client render use only the URL, so there is no
// hydration mismatch; the stored preference is applied after mount.

const STORAGE_KEY = 'phygo-lang';
const SKIP_LABEL: Record<AppLang, string> = {
  en: 'Skip to content',
  it: 'Vai al contenuto',
  es: 'Ir al contenido',
  fr: 'Aller au contenu',
};

function parseLang(v: string | null | undefined): AppLang | null {
  return v && (APP_LANGS as string[]).includes(v) ? (v as AppLang) : null;
}

export function useEntryLang(): AppLang {
  const fromUrl = parseLang(useSearchParams().get('lang'));
  const [lang, setLang] = useState<AppLang>(fromUrl ?? 'en');

  useEffect(() => {
    let next: AppLang = 'en';
    if (fromUrl) {
      next = fromUrl;
      try {
        window.localStorage.setItem(STORAGE_KEY, fromUrl);
      } catch {
        /* storage unavailable */
      }
    } else {
      let stored: AppLang | null = null;
      try {
        stored = parseLang(window.localStorage.getItem(STORAGE_KEY));
      } catch {
        /* storage unavailable */
      }
      next = stored ?? parseLang(navigator.language?.slice(0, 2).toLowerCase()) ?? 'en';
    }
    setLang(next);
    document.documentElement.lang = next;
    // The root layout's skip link is English; follow the page language.
    const skip = document.querySelector<HTMLAnchorElement>('a[href="#main-content"]');
    if (skip) skip.textContent = SKIP_LABEL[next];
  }, [fromUrl]);

  return lang;
}

/**
 * Switches the language of an entry page: it goes in the URL (?lang=, which
 * useEntryLang reads first) and in the "phygo-lang" preference, so the next
 * page keeps it too. A language in the URL counts as chosen: the login pages
 * save it to the account on sign-in.
 */
export function useSetEntryLang(): (next: AppLang) => void {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (next) => {
    const query = new URLSearchParams(params.toString());
    query.set('lang', next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
    router.replace(`${pathname}?${query.toString()}`, { scroll: false });
  };
}

/** The language in the URL, if any: the one the visitor chose on the site or on this page. */
export function useChosenEntryLang(): AppLang | null {
  return parseLang(useSearchParams().get('lang'));
}
