import Navbar from "@/components/Navbar";
import { Mail } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] transition-colors">
      <Navbar />
      <div className="relative max-w-lg mx-auto pt-40 pb-24 px-6 text-center">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#4F7CFF] mb-3">
          Get in touch
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink dark:text-white mb-4">
          Contact us
        </h1>
        <p className="text-sm text-ink/60 dark:text-white/60 mb-8">
          Questions about Phygo, feedback, or want a demo? Send us an email and we will get back to you.
        </p>
        <a
          href="mailto:hello@phygo.app"
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(79,124,255,0.35)] transition-transform hover:scale-105"
          style={{ background: "linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)" }}
        >
          <Mail size={16} />
          hello@phygo.app
        </a>
      </div>
    </div>
  );
}
