'use client'

import Navbar from '@/components/Navbar'
import WorkspaceSidebar from './WorkspaceSidebar'

// The calmer, "study environment" shell for every /dashboard/workspace/*
// page — same PHYGO chrome (Navbar, color tokens) as the rest of the
// dashboard, per the implementation brief's "still clearly PHYGO" design
// direction, just with a quieter background than the clinical dashboard.
//
// FULLSCREEN READING MODE: opening an actual document or notebook page used
// to sit inside this same Navbar + folder-sidebar + max-w-6xl column as
// every other Workspace page — fine on a laptop, but on an iPad or phone
// that chrome (navbar, sidebar, page padding) eats a real chunk of the
// screen the person doesn't need while actually reading/writing, leaving
// the document itself noticeably smaller than it could be. `fullscreen`
// drops all of it: no Navbar, no sidebar, no max-width column — the caller
// gets the entire viewport, edge to edge. This is a plain CSS/layout
// fullscreen, not the browser's Fullscreen API (PdfViewer/NotebookPageView
// separately still offer their own optional "true" OS-level fullscreen
// toggle, mainly useful on desktop) — deliberately, since Safari on iOS
// does not support requesting fullscreen on an arbitrary element at all, so
// relying on that API alone would leave a person on an iPhone with no
// bigger view. This one works identically on phone, tablet and computer.
// Workspace-only forced dark theme (26/9): the rest of the dashboard keeps
// its light/dark handled the normal way (Tailwind's `dark:` variant, driven
// by a `dark` class that nothing in this app currently ever toggles onto
// <html> — so in practice every `dark:` class already written across the
// Workspace components has simply never fired). Rather than wiring up a
// site-wide light/dark toggle nobody asked for, this puts the `dark` class
// directly on WorkspaceShell's own root element instead: Tailwind's
// `dark:` selector is just `.dark &` under the hood, so nesting it here
// scopes the effect to this subtree only (Navbar included, since it renders
// as a child of this div while inside Workspace) — Library/Quiz/the rest of
// the dashboard are completely unaffected. No portals are used anywhere in
// the Workspace component tree (menus/dialogs all render inline, verified
// via grep), so every dropdown, color picker and dialog inherits this too.
export default function WorkspaceShell({
  children,
  fullscreen = false,
}: {
  children: React.ReactNode
  fullscreen?: boolean
}) {
  if (fullscreen) {
    return (
      <div className="dark fixed inset-0 z-40 flex flex-col bg-white dark:bg-[#08090b] transition-colors">{children}</div>
    )
  }

  return (
    <div className="dark relative min-h-screen bg-white dark:bg-[#08090b] overflow-hidden transition-colors">
      <Navbar />

      {/* Role-aware ambient glow: reads var(--brand-from)/var(--brand-to) from
          app/globals.css, which RoleThemeProvider switches from the default
          PHYGO blue→green to a Student cyan→violet via html[data-role] — the
          main visible "stacco" between Student and Professional, since this
          shell is the Student home surface. color-mix reproduces the exact
          original rgba(79,124,255,0.5)/rgba(50,214,160,0.4) look for
          Professional (unchanged), just parameterized by the CSS vars.
          A second, smaller and more saturated orb layers underneath for a
          richer, less flat "premium" depth than a single soft blur. */}
      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-10 dark:opacity-15 blur-[160px]"
        style={{
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--brand-from) 50%, transparent) 0%, color-mix(in srgb, var(--brand-to) 40%, transparent) 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute top-24 right-[8%] w-[380px] h-[380px] rounded-full opacity-[0.14] dark:opacity-20 blur-[100px]"
        style={{
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--brand-to) 65%, transparent) 0%, transparent 75%)',
        }}
      />

      {/* Widened from max-w-6xl (1152px) to max-w-[1600px) — user feedback:
          "la zona delle cartelle piu larga di come è adesso.. troppo stretta".
          The cover-tile grids below now actually use the extra room (more
          columns at wide viewports) instead of sitting capped at 2 columns. */}
      <div className="relative max-w-[1600px] mx-auto pt-32 md:pt-36 pb-24 px-4 sm:px-6 lg:px-10">
        <div className="flex gap-8">
          <WorkspaceSidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
