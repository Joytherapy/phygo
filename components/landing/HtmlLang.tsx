"use client";

import { useEffect } from "react";

// The root layout renders <html lang="en"> for every route. The localized
// landing pages correct it on the client (hreflang alternates in the page
// metadata tell search engines the language up front) and localize the
// layout's skip link, which otherwise reads "Skip to content".
export default function HtmlLang({ lang, skipLabel }: { lang: string; skipLabel: string }) {
  useEffect(() => {
    const html = document.documentElement;
    const previous = html.lang;
    html.lang = lang;
    const skip = document.querySelector<HTMLAnchorElement>('a[href="#main-content"]');
    const previousSkip = skip?.textContent ?? null;
    if (skip) skip.textContent = skipLabel;
    return () => {
      html.lang = previous;
      if (skip && previousSkip !== null) skip.textContent = previousSkip;
    };
  }, [lang, skipLabel]);
  return null;
}
