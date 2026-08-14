"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, X, Moon, Sun } from "lucide-react";
import MagneticButton from "./MagneticButton";

const links = [
  { label: "Live demo", href: "#demo" },
  { label: "Features", href: "#features" },
  { label: "Trust", href: "#trust" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Science", href: "/dashboard/science" },
];

export default function Navbar() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
const [dark, setDark] = useState(() => {
  if (typeof window === "undefined") return false;
  const stored = window.localStorage.getItem("phygo-theme");
  if (stored) return stored === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
});

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

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
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(stored ? stored === "dark" : prefersDark);
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
          href="#"
          className="flex items-center gap-2.5 font-display font-semibold text-lg tracking-tight text-ink dark:text-white"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-electric to-emerald text-white text-base font-bold">
            P
          </span>
          Phygo
        </a>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative text-sm font-medium text-ink/65 hover:text-ink dark:text-white/65 dark:hover:text-white transition-colors group"
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-ink/60 dark:bg-white/60 transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            aria-label="Toggle dark mode"
            onClick={() => setDark((d) => !d)}
            data-cursor-hover
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink/60 hover:text-ink hover:bg-ink/5 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
          >
            {mounted ? (dark ? <Sun size={17} /> : <Moon size={17} />) : <span className="block h-[17px] w-[17px]" />}
          </button>

          <MagneticButton
            href="#pricing"
            strength={10}
            className="hidden sm:inline-flex items-center rounded-full bg-ink dark:bg-white text-white dark:text-ink text-sm font-semibold px-4 py-2 shadow-soft hover:shadow-lift transition-shadow"
          >
            Start Free
          </MagneticButton>

          <button
            aria-label="Open menu"
            onClick={() => setOpen((o) => !o)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-full text-ink dark:text-white"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-16 left-4 right-4 glass-strong rounded-xl2 shadow-soft p-4 flex flex-col gap-3 md:hidden"
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-ink/80 dark:text-white/80 py-1.5"
            >
              {l.label}
            </a>
          ))}

          <a
            href="#pricing"
            onClick={() => setOpen(false)}
            className="inline-flex items-center justify-center rounded-full bg-ink dark:bg-white text-white dark:text-ink text-sm font-semibold px-4 py-2 mt-1"
          >
            Start Free
          </a>
        </motion.div>
      )}
    </motion.header>
  );
}
