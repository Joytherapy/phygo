'use client'

import { MotionConfig } from 'framer-motion'
import type { ReactNode } from 'react'

// Dashboard-wide motion preference: when the OS asks for reduced motion,
// framer-motion skips transform/layout animations (slides, lifts, scale) and
// jumps to the final state. The global CSS rule in app/globals.css already
// covers CSS transitions; this covers the JS-driven ones. Same approach as the
// public site's MotionProvider.
export default function DashboardMotion({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
