"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Globe, Menu, Moon, Sun, X } from "lucide-react";
import { APP_LANG_LABELS, type AppLang } from "@/lib/i18n/uiStrings";
import { LANDING_LANGS, LANDING_PATH, type LandingDict } from "@/lib/i18n/landingStrings";
import { EASE } from "./ui";

// Landing-only header. The shared components/Navbar.tsx also serves the
// dashboard (account menu, search, LanguageContext), so the public pages get
// their own localized header instead of more branches in that component.
//
// Language switching navigates between /, /it, /es and /fr and stores the
// choice under the same "phygo-lang" key LanguageContext reads, so the app
// opens in the language the visitor picked here.

const LANG_STORAGE_KEY = "phygo-lang";
const THEME_STORAGE_KEY = "phygo-theme";

function rememberLanguage(lang: AppLang) {
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    /* storage unavailable: navigation still works */
  }
}

export default function LandingHeader({
  lang,
  nav,
  libraryHref,
}: {
  lang: AppLang;
  nav: LandingDict["nav"];
  libraryHref: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [dark, setDark] = useState<boolean | null>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const langButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the language menu on outside click / Escape.
  useEffect(() => {
    if (!langOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLangOpen(false);
        langButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [langOpen]);

  // Mobile menu: Escape closes it, and the page behind does not scroll.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const toggleTheme = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
    } catch {
      /* ignore */
    }
    setDark(next);
  };

  const links = [
    { label: nav.tour, href: "#tour" },
    { label: nav.library, href: libraryHref },
    { label: nav.pricing, href: "#pricing" },
    { label: nav.faq, href: "#faq" },
  ];

  const themeLabel = dark ? nav.lightMode : nav.darkMode;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled || menuOpen
          ? "border-b border-black/[0.06] dark:border-white/[0.07] bg-[#f6f7f9]/80 dark:bg-ink/75 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <a
          href={LANDING_PATH[lang]}
          aria-label={nav.home}
          className="flex items-center gap-2.5 rounded-lg font-display text-[17px] font-bold tracking-tight text-ink dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" width={28} height={28} className="h-7 w-7 rounded-md object-cover" />
          PHYGO
        </a>

        <nav className="hidden md:block">
          <ul className="flex items-center gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="rounded-full px-3.5 py-2 text-[13.5px] font-medium text-ink/65 transition-colors hover:text-ink dark:text-white/60 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Language */}
          <div ref={langRef} className="relative hidden sm:block">
            <button
              ref={langButtonRef}
              type="button"
              onClick={() => setLangOpen((o) => !o)}
              aria-expanded={langOpen}
              aria-controls="landing-lang-menu"
              aria-label={`${nav.language}: ${APP_LANG_LABELS[lang]}`}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium text-ink/70 transition-colors hover:bg-ink/[0.05] hover:text-ink dark:text-white/65 dark:hover:bg-white/[0.07] dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric"
            >
              <Globe size={15} aria-hidden />
              <span className="font-mono text-[11.5px] uppercase tracking-wider">{lang}</span>
              <ChevronDown size={13} aria-hidden className={`transition-transform ${langOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.ul
                  id="landing-lang-menu"
                  aria-label={nav.language}
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: EASE }}
                  className="absolute right-0 mt-2 w-48 origin-top-right overflow-hidden rounded-2xl border border-black/[0.07] bg-white p-1.5 shadow-lift dark:border-white/10 dark:bg-[#15171d]"
                >
                  {LANDING_LANGS.map((l) => (
                    <li key={l}>
                      <LangLink lang={l} current={lang} onPick={() => setLangOpen(false)} />
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={themeLabel}
            title={themeLabel}
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/[0.05] hover:text-ink dark:text-white/65 dark:hover:bg-white/[0.07] dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric"
          >
            {dark === null ? <span className="h-4 w-4" /> : dark ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
          </button>

          <a
            href="/login"
            className="hidden md:inline-flex rounded-full px-3.5 py-2 text-[13.5px] font-medium text-ink/70 transition-colors hover:text-ink dark:text-white/65 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric"
          >
            {nav.login}
          </a>
          <a
            href="/login?mode=signup"
            className="hidden sm:inline-flex items-center rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-ink/85 dark:bg-white dark:text-ink dark:hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric focus-visible:ring-offset-2"
          >
            {nav.startFree}
          </a>

          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-menu"
            aria-label={menuOpen ? nav.closeMenu : nav.openMenu}
            className="flex md:hidden h-10 w-10 items-center justify-center rounded-full text-ink dark:text-white hover:bg-ink/[0.05] dark:hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric"
          >
            {menuOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="landing-mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "calc(100dvh - 4rem)" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="md:hidden overflow-y-auto border-t border-black/[0.06] dark:border-white/[0.07]"
          >
            <nav className="px-4 pb-10 pt-4">
              <ul className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
                {links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      onClick={() => setMenuOpen(false)}
                      className="block py-4 font-display text-2xl font-semibold tracking-tight text-ink dark:text-white"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
                <li>
                  <a href="/login" className="block py-4 font-display text-2xl font-semibold tracking-tight text-ink/70 dark:text-white/70">
                    {nav.login}
                  </a>
                </li>
              </ul>

              <p className="eyebrow mt-8 text-ink/60 dark:text-white/55">{nav.language}</p>
              <ul className="mt-3 grid grid-cols-2 gap-2">
                {LANDING_LANGS.map((l) => (
                  <li key={l}>
                    <LangLink lang={l} current={lang} onPick={() => setMenuOpen(false)} boxed />
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex items-center gap-3">
                <a
                  href="/login?mode=signup"
                  className="flex-1 rounded-full bg-ink py-3.5 text-center text-sm font-semibold text-white dark:bg-white dark:text-ink"
                >
                  {nav.startFree}
                </a>
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label={themeLabel}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 text-ink dark:border-white/15 dark:text-white"
                >
                  {dark ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function LangLink({
  lang,
  current,
  onPick,
  boxed = false,
}: {
  lang: AppLang;
  current: AppLang;
  onPick: () => void;
  boxed?: boolean;
}) {
  const active = lang === current;
  return (
    <a
      href={LANDING_PATH[lang]}
      hrefLang={lang}
      lang={lang}
      aria-current={active ? "page" : undefined}
      onClick={() => {
        rememberLanguage(lang);
        onPick();
      }}
      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-[13.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric ${
        boxed ? "border border-black/[0.07] dark:border-white/10" : ""
      } ${
        active
          ? "bg-electric/[0.08] font-semibold text-ink dark:bg-white/[0.08] dark:text-white"
          : "text-ink/70 hover:bg-ink/[0.04] hover:text-ink dark:text-white/65 dark:hover:bg-white/[0.06] dark:hover:text-white"
      }`}
    >
      <span className="flex items-center gap-2.5">
        <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink/60 dark:text-white/55">{lang}</span>
        {APP_LANG_LABELS[lang]}
      </span>
      {active && <Check size={14} aria-hidden className="text-electric-dark" />}
    </a>
  );
}
