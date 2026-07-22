# Phygo — Landing Page (v6, experience redesign)

A $100M-startup-grade landing page for **Phygo**, an AI voice-to-report assistant for therapists, physiotherapists, and osteopaths.

## The core idea (read this first)

Every version before this one showed a *looping animation* of someone else's session — polished, but passive, and duplicated (the hero phone and the lower "demo" section did the same thing twice). This version replaces both with one real mechanism:

**`components/liveStructuring/`** — a shared "engine" that takes a sentence (either a curated example or your actual voice via the Web Speech API) and visibly moves each phrase from a transcript into the correct clinical field (Findings / Assessment / Plan / Follow-up), using Framer Motion's shared `layoutId` transitions so the phrase genuinely appears to fly from one place to the other.

- **In the hero**, it auto-runs a curated example ~2.5s after the page settles, so a visitor understands the entire value proposition — unstructured speech becomes structured documentation — without clicking anything, inside about 5 seconds of the page loading.
- **In "Talk to it. Really." (`TryItLive.tsx`)**, visitors can use their actual microphone. It's genuinely live: real `SpeechRecognition` transcript, a lightweight keyword categorizer, the same fly-into-place animation — not a video, not a fake.

This is the "unique interaction no competitor has": most clinical-documentation marketing sites show a static screenshot or a stock demo video. This one lets you talk to it before you've signed up for anything.

## What else changed structurally (not just visuals)

- **Removed duplication** — the old hero phone loop and the separate "Interactive Demo" section did the same three-stage story twice. Now there's one mechanism used in two depths (glance vs. full try-it).
- **Added `BeforeAfter.tsx`** — a stark, concrete before/after comparison. Previous versions asserted the value in copy; this makes it visceral.
- **Replaced the redundant "How It Works" 3-step explainer with `TrustPillars.tsx`** — now that the hero *shows* the mechanism directly, repeating "record → organize → send" in prose added nothing. The section now does real conversion work instead: control (everything's editable before it's sent), privacy (encryption, delete-on-demand), and fit (no rigid dictation format required).
- **Nav and page flow reordered** around a hook → proof → capability → deeper-proof → trust → conversion narrative, rather than a flat feature list.

## Stack

- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- Framer Motion (including shared `layoutId` transitions for the flying-phrase effect)
- lucide-react icons
- Web Speech API (`SpeechRecognition`) for the live-voice demo, with graceful fallback when unsupported

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Notes before shipping

- The live-voice categorizer is a small keyword heuristic (see `categorize()` in `liveStructuring/data.ts`), not real AI — appropriate honesty for a marketing-page demo, but don't let it get confused with the actual product's backend.
- `SpeechRecognition` is Chrome/Edge-first; Safari and Firefox support is inconsistent. The "Use your voice" button only appears when the API is detected, and the curated examples (which work everywhere) are always available alongside it.
- I could not run `npm install` or a build in this sandbox (no network access) — the shared-layoutId animation in particular is worth checking locally, since it's the one piece I couldn't visually verify myself.

---

## Version history


## What's new in this pass (v5)

This round focused on real gaps rather than more decoration:

- **FAQ section** (`FAQ.tsx`) — an accordion handling the objections that actually block sign-up (data security, AI accuracy, language support, cancellation). Directly serves the "conversion and trust" brief, which didn't have dedicated objection-handling before.
- **Scroll-linked hero parallax** — the headline, phone, and background illustration now move at different speeds as you scroll past the hero (not just on mouse movement), the kind of tied-to-scroll depth Apple and Stripe product pages use.
- **SEO structured data** — added JSON-LD (`SoftwareApplication` schema) so search engines can understand pricing and ratings, closing out the "SEO optimized" requirement from the original brief.
- **Accessibility pass** — a skip-to-content link, and the custom cursor / cursor spotlight / intro loader now all check `prefers-reduced-motion` and stand down or shorten for people who've asked their OS for less motion (previously only CSS transitions respected this, not the JS-driven effects).

## What's new in the previous pass (v4)

- **Real dark mode, restored** — the original brief listed "dark mode support" as a requirement; it quietly dropped out of the from-scratch redesign. It's back: a toggle in the nav (persisted in `localStorage`, respects system preference on first visit), with dark surfaces threaded through every section, card, and text color — not just an inverted body background.
- **Custom cursor** (`CustomCursor.tsx`) — a small dot with a trailing ring that morphs into a larger outline over links, buttons, and anything tagged `data-cursor-hover`. Desktop only; untouched on touch devices.

## What's new in the previous pass (v3)

- **Custom line-art illustration** (`SignatureIllustration.tsx`) — a bespoke SVG that draws itself in: a voice waveform resolving into flat document lines, visually encoding the product's core value. Used as a subtle hero backdrop and as a divider before the final CTA.
- **Cursor spotlight** (`CursorSpotlight.tsx`) — a soft brand-colored glow that follows the cursor across the whole page (desktop only, disabled on touch devices) — the Linear/Vercel signature touch.
- **Scroll progress bar** (`ScrollProgress.tsx`) — a thin gradient line at the very top tracking scroll position.
- **Cursor-tracked card glow** — Feature and Pricing cards now reveal a soft radial highlight that follows your cursor as you hover, layered under the existing 3D tilt.
- **Hand-drawn underline** under "Therapist" in the hero headline — a gradient squiggle that draws itself in right after the kinetic headline lands.
- **Bolder hero type** — tighter tracking and a larger fluid scale for more editorial confidence.

## What's new in the previous pass (v2)

- **Intro reveal** (`IntroLoader.tsx`) — a branded 1.1s unveil before the hero animates in, so the page opens with a deliberate moment instead of popping in.
- **Kinetic headline** — the hero H1 reveals word by word with a blur-to-sharp motion, timed to land right as the intro dissolves.
- **Signature depth stack** (`PhoneMockup.tsx`) — two floating glass layers behind the phone plus three independently-floating proof chips ("Data encrypted", "98% accuracy", "30 seconds") for a tactile, expensive feel.
- **Ambient mesh background** (`AmbientMesh.tsx`) — slow-drifting soft-focus blobs + a near-invisible grain layer, fixed behind the whole page, kept subtle so the base stays white per the brief.
- **Trust strip** (`LogosMarquee.tsx`) — infinite auto-scrolling row of practice names under the hero.
- **Stats bar** (`StatsBar.tsx`) — count-up numbers on scroll into view (reports generated, minutes saved, recommend rate).
- **Scroll-linked connecting line** in How It Works — the gradient line between the three steps draws itself in as you scroll.
- **Bento-grid Features** — two large hero cards (live waveform, dark AI-notes card) plus a wide card and a supporting grid, all with subtle 3D tilt on hover (`useTilt.ts`).
- **Tilt testimonial cards** with initials avatars instead of generic icons.
- **Pricing**: monthly/annual toggle with animated switch and a gradient-sheen border on the featured tier.
- **Final CTA** — a dark, gradient-lit closing section before the footer, dedicated purely to conversion.
- **Magnetic buttons** (`MagneticButton.tsx`) — primary CTAs pull slightly toward the cursor and sweep with a shimmer on hover.
- Footer kept intentionally minimal, as specified.

## Structure

```
app/
  layout.tsx        — fonts, metadata, SEO
  page.tsx           — assembles the full experience
  globals.css        — glass, grain, shimmer, focus-visible utilities
components/
  IntroLoader.tsx     — branded opening reveal
  AmbientMesh.tsx      — fixed background blobs + grain
  Navbar.tsx           — hide-on-scroll-down glass nav
  Hero.tsx             — kinetic headline, CTAs, scroll cue
  PhoneMockup.tsx      — signature voice → report animation + depth stack
  LogosMarquee.tsx     — infinite trust strip
  StatsBar.tsx         — count-up stats
  HowItWorks.tsx       — 3-step cards with animated connecting line
  Features.tsx         — bento grid, tilt-on-hover
  InteractiveDemo.tsx  — clickable mic demo
  Testimonials.tsx     — tilt cards with initials avatars
  Pricing.tsx          — tiers + billing toggle
  FinalCTA.tsx         — closing conversion moment
  Footer.tsx           — minimal footer
  MagneticButton.tsx, useTilt.ts — shared interaction primitives
```

## Notes before shipping

- Practice names in the trust strip are placeholders — swap in real customer names (with permission) once you have them.
- Stats in `StatsBar.tsx` are illustrative placeholders — replace with real numbers before launch.
- The mic demo and hero phone animation are simulated with timers — wire up real recording/AI calls when the backend is ready.
- I couldn't run `npm install` or a production build in this sandbox (no network access) — please run a local build before deploying.
