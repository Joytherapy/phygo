import { Twitter, Linkedin, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative border-t border-ink/5 dark:border-white/5 py-12">
      <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <a href="#" className="flex items-center gap-2 font-display font-semibold text-ink dark:text-white">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-electric to-emerald text-white text-xs font-bold">
            P
          </span>
          Phygo
        </a>

        <div className="flex items-center gap-6 text-sm text-ink/50 dark:text-white/50">
          <a href="#" className="hover:text-ink dark:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-ink dark:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-ink dark:text-white transition-colors">Contact</a>
        </div>

        <div className="flex items-center gap-4 text-ink/40 dark:text-white/40">
          <a href="#" aria-label="Twitter" className="hover:text-ink dark:text-white transition-colors"><Twitter size={17} /></a>
          <a href="#" aria-label="LinkedIn" className="hover:text-ink dark:text-white transition-colors"><Linkedin size={17} /></a>
          <a href="#" aria-label="Instagram" className="hover:text-ink dark:text-white transition-colors"><Instagram size={17} /></a>
        </div>
      </div>
      <p className="mt-8 text-center text-xs text-ink/30 dark:text-white/30">
        © {new Date().getFullYear()} Phygo. All rights reserved.
      </p>
    </footer>
  );
}
