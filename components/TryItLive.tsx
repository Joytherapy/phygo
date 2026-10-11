"use client";

import dynamic from "next/dynamic";
import { SectionHeader, Reveal } from "./landing/ui";

// The demo pulls in the full copilot UI (including the PDF library), so it is
// loaded on the client after the rest of the page instead of in the initial bundle.
const LiveStructuring = dynamic(() => import("./liveStructuring/LiveStructuring"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] rounded-xl3 glass shadow-soft animate-pulse" aria-label="Loading the demo" role="status" />
  ),
});

// The public demo runs the real copilot: speech is transcribed by the
// browser's Web Speech API, then the text goes to /api/generate-note (and the
// follow-up exercise/evidence routes), which is limited to one free run per
// visitor for signed-out users. The copy below says exactly that.
export default function TryItLive() {
  return (
    <section id="demo" aria-labelledby="demo-title" className="relative py-24 sm:py-32 overflow-hidden scroll-mt-20">
      <div aria-hidden className="absolute inset-0 bg-grad-hero opacity-60 pointer-events-none" />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <SectionHeader
          id="demo-title"
          align="center"
          eyebrow="Try the copilot"
          title="Describe a sample session. See the draft."
          intro="Dictate or type a short, made-up case. You'll get the same kind of AI draft clinicians work with in PHYGO — then judge it the way you would in practice."
        />

        <Reveal className="mt-12">
          <LiveStructuring instanceId="demo" variant="full" />
        </Reveal>

        <div className="mx-auto mt-6 max-w-2xl rounded-xl2 border border-black/[0.06] dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] px-5 py-4 text-[12.5px] leading-relaxed text-ink/60 dark:text-white/55">
          <p className="font-semibold text-ink/75 dark:text-white/75">How this demo works</p>
          <p className="mt-1">
            Speech is transcribed by your browser&apos;s speech recognition (Chrome may use Google&apos;s servers for
            this). The text — and any image you upload — is then sent to PHYGO&apos;s AI to generate a draft. Without
            an account you get one free demo. Please don&apos;t enter names or other details that could identify a
            real patient. Nothing is saved to a patient record. The example buttons play pre-written walkthroughs and
            don&apos;t use the AI.
          </p>
        </div>
      </div>
    </section>
  );
}
