"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValueEvent, useScroll, AnimatePresence } from "framer-motion";
import { Menu, X, Moon, Sun, User, LogOut, Search, Globe, BookOpen, ListChecks } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import MagneticButton from "./MagneticButton";
import { usePatientContext } from "@/contexts/PatientContext";
import { useLanguage, useUiStrings } from "@/contexts/LanguageContext";
import { APP_LANGS } from "@/lib/i18n/uiStrings";
import { useRoleUi } from "@/lib/i18n/roleStrings";
import { useRoleTheme } from "@/contexts/RoleThemeContext";
import { useQuizUi } from "@/lib/i18n/quizStrings";
import SearchModal from "./SearchModal";
import LibraryNavMenu, { libraryLinkHrefs } from "./LibraryNavMenu";
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const linksBeforeLibrary = [
  { label: "Live demo", href: "/#demo" },
  { label: "Platform", href: "/#features" },
  { label: "Library", href: "/library/condition" },
  { label: "Trust", href: "/#trust" },
  { label: "Pricing", href: "/#pricing" },
];

const faqLink = { label: "FAQ", href: "/#faq" };

// The Library dropdown's own 16-section list + category grouping now lives
// in components/LibraryNavMenu.tsx (it grew too long to scroll as a flat
// list — see that file). Hrefs/labels are otherwise unchanged.

// Phygo World groups the broader ecosystem (research, events, shop) apart
// from the clinical/professional Library dropdown above.
const worldLinkHrefs = [
  { key: "science", href: "/dashboard/science" },
  { key: "events", href: "/dashboard/world/events" },
  { key: "shop", href: "/dashboard/shop" },
] as const;

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function Navbar() {
  const { scrollY } = useScroll();
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
    const [libraryOpen, setLibraryOpen] = useState(false);
  const [worldOpen, setWorldOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { currentPatient, setCurrentPatient } = usePatientContext();
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");
  // Falls back to Italian defaults when rendered outside /dashboard (no
  // LanguageProvider there) — usePatientContext's own defaultValue fallback
  // is the precedent for this pattern in this file.
  const { lang, setLang } = useLanguage();
  const ui = useUiStrings();
  const roleUi = useRoleUi();
  const quizUi = useQuizUi();
  const [initials, setInitials] = useState("··");
  // Profile photo chosen on the Profile page (profiles.avatar_url, a public
  // Supabase Storage URL — see app/dashboard/profile/page.tsx). Falls back to
  // the existing gradient-initials button whenever no photo has been set.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  // Role-aware primary navigation (PHYGO Student/Professional modes — see
  // sql/2026-09_role_aware.sql). practiceStage now comes from
  // RoleThemeProvider (contexts/RoleThemeContext.tsx), which also drives the
  // role-aware brand color (--brand-from/--brand-to, see app/globals.css) —
  // one shared fetch instead of Navbar keeping its own copy.
  const { practiceStage } = useRoleTheme();
  const isStudent = isDashboard && practiceStage === "student";

  // ACTIVE NAV STATE (Student navbar audit — "verifica active state della
  // voce selezionata"): none of the primary nav items previously reflected
  // the current route at all, desktop or mobile. Workspace/Quiz are single
  // routes so a simple startsWith check is enough; Library and World are
  // dropdown triggers whose "active" state means the current page is one of
  // the pages *inside* that dropdown, checked against each menu's own real
  // href list so this never drifts out of sync with what's actually in the
  // dropdown.
  const isWorkspaceNavActive = pathname?.startsWith("/dashboard/workspace") ?? false;
  const isQuizNavActive = pathname?.startsWith("/dashboard/quiz") ?? false;
  const isLibraryNavActive = libraryLinkHrefs.some((l) => pathname?.startsWith(l.href));
  const isWorldNavActive = worldLinkHrefs.some((l) => pathname?.startsWith(l.href));
  const isScheduleNavActive = pathname?.startsWith("/dashboard/agenda") ?? false;
  const isPatientsNavActive = pathname === "/dashboard";
  // Desktop underlined-link style: shared by Workspace/Quiz/Patients/Schedule
  // — the underline is permanently drawn in for the active route instead of
  // only appearing on hover.
  const desktopLinkClass = (active: boolean) =>
    `relative text-sm font-medium transition-colors group ${
      active ? "text-ink dark:text-white" : "text-ink/65 hover:text-ink dark:text-white/65 dark:hover:text-white"
    }`;
  const desktopUnderlineClass = (active: boolean) =>
    `absolute -bottom-1 left-0 h-px bg-ink/60 dark:bg-white/60 transition-all duration-300 ${
      active ? "w-full" : "w-0 group-hover:w-full"
    }`;
  // Same idea for the Library/World dropdown trigger buttons, which don't
  // use the underline treatment (they have a chevron instead).
  const desktopDropdownTriggerClass = (active: boolean) =>
    `relative text-sm font-medium transition-colors flex items-center gap-1 ${
      active ? "text-ink dark:text-white" : "text-ink/65 hover:text-ink dark:text-white/65 dark:hover:text-white"
    }`;
  // Mobile menu rows: no underline space, so active is a filled dot + full
  // opacity/weight instead.
  const mobileLinkClass = (active: boolean) =>
    `flex items-center gap-2 text-sm py-1.5 transition-colors ${
      active ? "font-semibold text-ink dark:text-white" : "font-medium text-ink/80 dark:text-white/80"
    }`;
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem("phygo-theme");
    if (stored) return stored === "dark";
    return true;
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isDashboard) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      const displayName = user?.user_metadata?.display_name || user?.email || "";
      if (displayName) setInitials(getInitials(displayName));
      if (!user) return;
      supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.avatar_url) setAvatarUrl(data.avatar_url);
        });
    });
  }, [isDashboard]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    setScrolled(latest > 8);
    if (latest > previous && latest > 160) setHidden(true);
    else setHidden(false);
  });

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
  }, [open]);

  useEffect(() => {
    const stored = window.localStorage.getItem("phygo-theme");
    setDark(stored ? stored === "dark" : true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    window.localStorage.setItem("phygo-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <motion.header
      animate={{ y: hidden ? -110 : 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 pt-4"
    >
      <nav
        className={`w-full max-w-5xl flex items-center justify-between rounded-xl2 px-4 sm:px-6 py-3 transition-all duration-500 ${
          scrolled ? "glass-strong shadow-soft" : "bg-transparent"
        }`}
      >
        <a
          href={isDashboard ? (isStudent ? "/dashboard/workspace" : "/dashboard") : "/"}
          className="flex items-center gap-2.5 font-display font-semibold text-lg tracking-tight text-ink dark:text-white"
        >
          <img
            src="/logo-mark.png"
            alt="Phygo"
            className="h-10 w-10 rounded-lg object-cover shadow-soft"
          />
          Phygo
        </a>

        <div className="hidden md:flex items-center gap-8">
          {!isDashboard &&
            linksBeforeLibrary.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="relative text-sm font-medium text-ink/65 hover:text-ink dark:text-white/65 dark:hover:text-white transition-colors group"
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-ink/60 dark:bg-white/60 transition-all duration-300 group-hover:w-full" />
              </a>
            ))}

          {isDashboard && isStudent && (
            <a href="/dashboard/workspace" aria-current={isWorkspaceNavActive ? "page" : undefined} className={desktopLinkClass(isWorkspaceNavActive)}>
              {roleUi.nav.workspace}
              <span className={desktopUnderlineClass(isWorkspaceNavActive)} />
            </a>
          )}

          {isDashboard && isStudent && (
            <a href="/dashboard/quiz" aria-current={isQuizNavActive ? "page" : undefined} className={desktopLinkClass(isQuizNavActive)}>
              {quizUi.navLabel}
              <span className={desktopUnderlineClass(isQuizNavActive)} />
            </a>
          )}

          {isDashboard && !isStudent && (
            <a href="/dashboard" aria-current={isPatientsNavActive ? "page" : undefined} className={desktopLinkClass(isPatientsNavActive)}>
              {ui.nav.patients}
              <span className={desktopUnderlineClass(isPatientsNavActive)} />
            </a>
          )}

          {isDashboard && (
            <div
              className="relative"
              onMouseEnter={() => setLibraryOpen(true)}
              onMouseLeave={() => setLibraryOpen(false)}
            >
              <button aria-current={isLibraryNavActive ? "page" : undefined} className={desktopDropdownTriggerClass(isLibraryNavActive)}>
                {ui.nav.library}
                <svg
                  width="10"
                  height="6"
                  viewBox="0 0 10 6"
                  fill="none"
                  className={`transition-transform ${libraryOpen ? "rotate-180" : ""}`}
                >
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <AnimatePresence>
                {libraryOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-72"
                  >
                    <div className="glass-strong rounded-xl2 shadow-soft p-2">
                      <LibraryNavMenu variant="desktop" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {isDashboard && !isStudent && (
            <a href="/dashboard/agenda" aria-current={isScheduleNavActive ? "page" : undefined} className={desktopLinkClass(isScheduleNavActive)}>
              {ui.nav.schedule}
              <span className={desktopUnderlineClass(isScheduleNavActive)} />
            </a>
          )}

          {isDashboard && (
            <div
              className="relative"
              onMouseEnter={() => setWorldOpen(true)}
              onMouseLeave={() => setWorldOpen(false)}
            >
              <button aria-current={isWorldNavActive ? "page" : undefined} className={desktopDropdownTriggerClass(isWorldNavActive)}>
                {ui.nav.world}
                <svg
                  width="10"
                  height="6"
                  viewBox="0 0 10 6"
                  fill="none"
                  className={`transition-transform ${worldOpen ? "rotate-180" : ""}`}
                >
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <AnimatePresence>
                {worldOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-64"
                  >
                    <div className="glass-strong rounded-xl2 shadow-soft p-2">
                      {worldLinkHrefs.map((l) => (
                        <a
                          key={l.href}
                          href={l.href}
                          className="block rounded-xl px-3 py-2.5 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
                        >
                          <p className="text-sm font-semibold text-ink dark:text-white">{ui.worldLinks[l.key].label}</p>
                          <p className="text-xs text-ink/50 dark:text-white/50 mt-0.5">{ui.worldLinks[l.key].description}</p>
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {!isDashboard && (
            <a
              key={faqLink.href}
              href={faqLink.href}
              className="relative text-sm font-medium text-ink/65 hover:text-ink dark:text-white/65 dark:hover:text-white transition-colors group"
            >
              {faqLink.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-ink/60 dark:bg-white/60 transition-all duration-300 group-hover:w-full" />
            </a>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentPatient && (
            <div className="hidden sm:flex items-center gap-1.5 rounded-full pl-1 pr-2 py-1 bg-[#4F7CFF]/10 text-[#4F7CFF]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4F7CFF] text-white">
                <User size={12} />
              </span>
              <span className="text-xs font-semibold max-w-[100px] truncate">
                {currentPatient.name}
              </span>
              <button
                aria-label="Clear current patient"
                onClick={() => setCurrentPatient(null)}
                className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-[#4F7CFF]/20 transition-colors"
              >
                <X size={11} />
              </button>
            </div>
          )}

                   {isDashboard && (
            <button
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              data-cursor-hover
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink/60 hover:text-ink hover:bg-ink/5 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
            >
              <Search size={17} />
            </button>
          )}

          {isDashboard && (
            <div
              className="relative hidden sm:block"
              onMouseEnter={() => setLangOpen(true)}
              onMouseLeave={() => setLangOpen(false)}
            >
              <button
                aria-label="Change language"
                data-cursor-hover
                className="flex items-center gap-1 h-9 px-2.5 rounded-full text-ink/60 hover:text-ink hover:bg-ink/5 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 transition-colors text-[11px] font-bold uppercase tracking-wide"
              >
                <Globe size={15} />
                {lang}
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full right-0 pt-3 w-40"
                  >
                    <div className="glass-strong rounded-xl2 shadow-soft p-1.5 flex items-center gap-1">
                      {APP_LANGS.map((l) => (
                        <button
                          key={l}
                          onClick={() => setLang(l)}
                          aria-current={l === lang ? "true" : undefined}
                          className={`flex-1 rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                            l === lang
                              ? "bg-gradient-to-r from-[var(--brand-from)] to-[var(--brand-to)] text-white brand-glow"
                              : "text-ink/40 dark:text-white/40 hover:text-ink dark:hover:text-white"
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <button
            aria-label="Toggle dark mode"
            onClick={() => setDark((d) => !d)}
            data-cursor-hover
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink/60 hover:text-ink hover:bg-ink/5 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
          >
            {mounted ? (dark ? <Sun size={17} /> : <Moon size={17} />) : <span className="block h-[17px] w-[17px]" />}
          </button>

          {isDashboard ? (
            <div
              className="relative hidden sm:block"
              onMouseEnter={() => setAccountOpen(true)}
              onMouseLeave={() => setAccountOpen(false)}
            >
              <button
                className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-white text-xs font-bold brand-glow ${avatarUrl ? "ring-2 ring-white/70 dark:ring-white/10" : ""}`}
                style={avatarUrl ? undefined : { background: "linear-gradient(135deg, color-mix(in srgb, var(--brand-from) 100%, white 20%) 0%, var(--brand-from) 45%, var(--brand-to) 100%)" }}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </button>
              <AnimatePresence>
                {accountOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full right-0 pt-3 w-44"
                  >
                    <div className="glass-strong rounded-xl2 shadow-soft p-1.5">
                      <a
                        href="/dashboard/profile"
                        className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/70 dark:text-white/70 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
                      >
                        <User size={14} />
                        {ui.nav.profile}
                      </a>
                      {!isStudent && (
                        <a
                          href="/dashboard/workspace"
                          className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/70 dark:text-white/70 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
                        >
                          <BookOpen size={14} />
                          {roleUi.nav.workspace}
                        </a>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/70 dark:text-white/70 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
                      >
                        <LogOut size={14} />
                        {ui.nav.signOut}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <MagneticButton
              href="/login?mode=signup"
              strength={10}
              className="hidden sm:inline-flex items-center rounded-full bg-ink dark:bg-white text-white dark:text-ink text-sm font-semibold px-4 py-2 shadow-soft hover:shadow-lift transition-shadow"
            >
              Start Free
            </MagneticButton>
          )}

          <button
            aria-label="Open menu"
            onClick={() => setOpen((o) => !o)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-full text-ink dark:text-white"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {currentPatient && (
        <div className="sm:hidden absolute top-16 left-4 right-4 flex items-center justify-center gap-1.5 rounded-full py-1.5 bg-[#4F7CFF]/10 text-[#4F7CFF]">
          <User size={12} />
          <span className="text-xs font-semibold">{ui.nav.currentPatient}: {currentPatient.name}</span>
          <button
            aria-label="Clear current patient"
            onClick={() => setCurrentPatient(null)}
            className="ml-1 flex h-4 w-4 items-center justify-center rounded-full hover:bg-[#4F7CFF]/20 transition-colors"
          >
            <X size={11} />
          </button>
        </div>
      )}

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-16 left-4 right-4 glass-strong rounded-xl2 shadow-soft p-4 flex flex-col gap-3 md:hidden"
        >
          {!isDashboard &&
            linksBeforeLibrary.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-ink/80 dark:text-white/80 py-1.5"
              >
                {l.label}
              </a>
            ))}

          {isDashboard && isStudent && (
            <a
              href="/dashboard/workspace"
              onClick={() => setOpen(false)}
              aria-current={isWorkspaceNavActive ? "page" : undefined}
              className={mobileLinkClass(isWorkspaceNavActive)}
            >
              {roleUi.nav.workspace}
            </a>
          )}

          {isDashboard && isStudent && (
            <a
              href="/dashboard/quiz"
              onClick={() => setOpen(false)}
              aria-current={isQuizNavActive ? "page" : undefined}
              className={mobileLinkClass(isQuizNavActive)}
            >
              <ListChecks size={14} />
              {quizUi.navLabel}
            </a>
          )}

          {isDashboard && !isStudent && (
            <a
              href="/dashboard"
              onClick={() => setOpen(false)}
              aria-current={isPatientsNavActive ? "page" : undefined}
              className={mobileLinkClass(isPatientsNavActive)}
            >
              {ui.nav.patients}
            </a>
          )}

          {isDashboard && <div className="h-px bg-ink/10 dark:bg-white/10 my-1" />}

          {isDashboard && <LibraryNavMenu variant="mobile" onNavigate={() => setOpen(false)} />}

          {isDashboard && <div className="h-px bg-ink/10 dark:bg-white/10 my-1" />}

          {isDashboard &&
            worldLinkHrefs.map((l) => {
              const active = pathname?.startsWith(l.href) ?? false;
              return (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={mobileLinkClass(active)}
                >
                  {ui.worldLinks[l.key].label}
                </a>
              );
            })}

          {isDashboard && !isStudent && (
            <>
              <div className="h-px bg-ink/10 dark:bg-white/10 my-1" />
              <a
                href="/dashboard/agenda"
                onClick={() => setOpen(false)}
                aria-current={isScheduleNavActive ? "page" : undefined}
                className={mobileLinkClass(isScheduleNavActive)}
              >
                {ui.nav.schedule}
              </a>
            </>
          )}

          {isDashboard && !isStudent && (
            <>
              <div className="h-px bg-ink/10 dark:bg-white/10 my-1" />
              <a
                href="/dashboard/workspace"
                onClick={() => setOpen(false)}
                aria-current={isWorkspaceNavActive ? "page" : undefined}
                className={mobileLinkClass(isWorkspaceNavActive)}
              >
                <BookOpen size={14} />
                {roleUi.nav.workspace}
              </a>
            </>
          )}

          {isDashboard && (
            <>
              <div className="h-px bg-ink/10 dark:bg-white/10 my-1" />
              <div className="flex items-center gap-1">
                {APP_LANGS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    aria-current={l === lang ? "true" : undefined}
                    className={`flex-1 rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                      l === lang
                        ? "bg-gradient-to-r from-[var(--brand-from)] to-[var(--brand-to)] text-white brand-glow"
                        : "text-ink/40 dark:text-white/40"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </>
          )}

          {!isDashboard && (
            <>
              <div className="h-px bg-ink/10 dark:bg-white/10 my-1" />
              <a
                href={faqLink.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-ink/80 dark:text-white/80 py-1.5"
              >
                {faqLink.label}
              </a>
            </>
          )}

          {isDashboard ? (
            <button
              onClick={() => {
                setOpen(false);
                handleSignOut();
              }}
              className="flex items-center gap-2 rounded-full bg-ink dark:bg-white text-white dark:text-ink text-sm font-semibold px-4 py-2 mt-1"
            >
              <LogOut size={14} />
              {ui.nav.signOut}
            </button>
          ) : (
            <a
              href="/login?mode=signup"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center rounded-full bg-ink dark:bg-white text-white dark:text-ink text-sm font-semibold px-4 py-2 mt-1"
            >
              Start Free
            </a>
          )}
                </motion.div>
      )}

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </motion.header>
  );
}
