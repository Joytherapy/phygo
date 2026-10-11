"use client";

import { Reveal, PrimaryButton, TextLink } from "./landing/ui";

export default function FinalCTA() {
  return (
    <section aria-labelledby="final-cta-title" className="relative py-24 sm:py-32 px-4 sm:px-6">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-xl4 bg-ink px-6 py-16 sm:px-8 sm:py-24 text-center">
        <div aria-hidden className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-electric/25 blur-[100px] animate-drift" />
        <div
          aria-hidden
          className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-emerald/20 blur-[100px] animate-drift"
          style={{ animationDelay: "-7s" }}
        />

        <Reveal className="relative">
          <h2
            id="final-cta-title"
            className="font-display font-semibold text-white text-3xl sm:text-5xl tracking-tight text-balance max-w-2xl mx-auto"
          >
            Spend your attention on the patient, not on the paperwork.
          </h2>
          <p className="mt-5 text-white/60 max-w-lg mx-auto">
            Create a free account and try the copilot, the condition library and the exercise tools on your next
            session.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-5">
            <PrimaryButton href="/login?mode=signup" inverted>
              Start free
            </PrimaryButton>
            <span className="[&_a]:text-white/80 [&_a:hover]:text-white">
              <TextLink href="/en/library/condition">Browse the library first</TextLink>
            </span>
          </div>
          <p className="mt-6 text-xs text-white/40">No credit card required.</p>
        </Reveal>
      </div>
    </section>
  );
}
