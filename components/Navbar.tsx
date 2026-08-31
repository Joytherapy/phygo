"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValueEvent, useScroll, AnimatePresence } from "framer-motion";
import { Menu, X, Moon, Sun, User, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import MagneticButton from "./MagneticButton";
import { usePatientContext } from "@/contexts/PatientContext";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const linksBeforeLibrary = [
  { label: "Live demo", href: "/#demo" },
  { label: "Features", href: "/#features" },
  { label: "Trust", href: "/#trust" },
  { label: "Pricing", href: "/#pricing" },
];

const faqLink = { label: "FAQ", href: "/#faq" };

const libraryLinks = [
  { label: "Science", href: "/dashboard/science", description: "Latest research summaries" },
  { label: "Body Map", href: "/dashboard/body-map", description: "Interactive anatomy explorer" },
  { label: "Neurology", href: "/dashboard/brain-map", description: "Brain, nerves & pathways" },
{ label: "Pelvic Floor", href: "/dashboard/pelvic-floor", description: "Anatomy, conditions & rehab" },
  { label: "Cardiopulmonary", href: "/dashboard/cardiopulmonary", description: "Anatomy, conditions & rehab" },
    { label: "Oncology", href: "/dashboard/oncology", description: "Anatomy, conditions & rehab" },
  { label: "First Aid", href: "/dashboard/first-aid", description: "Protocols by country" },
  { label: "Clinical Tools", href: "/dashboard/clinical-tools", description: "Assessment scales & tests" },
  { label: "Shop", href: "/dashboard/shop", description: "Equipment picks to recommend" },
];

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
  const [accountOpen, setAccountOpen] = useState(false);
  const { currentPatient, setCurrentPatient } = usePatientContext();
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");
  const [initials, setInitials] = useState("··");
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
          href={isDashboard ? "/dashboard" : "/"}
          className="flex items-center gap-2.5 font-display font-semibold text-lg tracking-tight text-ink dark:text-white"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-electric to-emerald text-white text-base font-bold">
            P
          </span>
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

          {isDashboard && (
            <a
              href="/dashboard"
              className="relative text-sm font-medium text-ink/65 hover:text-ink dark:text-white/65 dark:hover:text-white transition-colors group"
            >
              Patients
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-ink/60 dark:bg-white/60 transition-all duration-300 group-hover:w-full" />
            </a>
          )}

          {isDashboard && (
            <div
              className="relative"
              onMouseEnter={() => setLibraryOpen(true)}
              onMouseLeave={() => setLibraryOpen(false)}
            >
              <button className="relative text-sm font-medium text-ink/65 hover:text-ink dark:text-white/65 dark:hover:text-white transition-colors flex items-center gap-1">
                Library
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
                    className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-64"
                  >
                    <div className="glass-strong rounded-xl2 shadow-soft p-2">
                      {libraryLinks.map((l) => (
                        <a
                          key={l.href}
                          href={l.href}
                          className="block rounded-xl px-3 py-2.5 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
                        >
                          <p className="text-sm font-semibold text-ink dark:text-white">{l.label}</p>
                          <p className="text-xs text-ink/50 dark:text-white/50 mt-0.5">{l.description}</p>
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {isDashboard && (
            <a
              href="/dashboard/agenda"
              className="relative text-sm font-medium text-ink/65 hover:text-ink dark:text-white/65 dark:hover:text-white transition-colors group"
            >
              Schedule
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-ink/60 dark:bg-white/60 transition-all duration-300 group-hover:w-full" />
            </a>
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
                className="flex h-9 w-9 items-center justify-center rounded-full text-white text-xs font-bold shadow-soft"
                style={{ background: "linear-gradient(135deg, #4F7CFF 0%, #32D6A0 100%)" }}
              >
                {initials}
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
                        Profile
                      </a>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/70 dark:text-white/70 hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
                      >
                        <LogOut size={14} />
                        Sign out
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
          <span className="text-xs font-semibold">Current patient: {currentPatient.name}</span>
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

          {isDashboard && (
            <a
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-ink/80 dark:text-white/80 py-1.5"
            >
              Patients
            </a>
          )}

          {isDashboard && <div className="h-px bg-ink/10 dark:bg-white/10 my-1" />}

          {isDashboard &&
            libraryLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-ink/80 dark:text-white/80 py-1.5"
              >
                {l.label}
              </a>
            ))}

          {isDashboard && (
            <>
              <div className="h-px bg-ink/10 dark:bg-white/10 my-1" />
              <a
                href="/dashboard/agenda"
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-ink/80 dark:text-white/80 py-1.5"
              >
                Schedule
              </a>
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
              Sign out
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
    </motion.header>
  );
}