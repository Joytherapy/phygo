"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

// reducedMotion="user": when the OS asks for reduced motion, framer-motion
// skips transform/layout animations and jumps to the final state. Doing it
// here (instead of branching on useReducedMotion in each component) keeps the
// server-rendered and client markup identical, so content can never get stuck
// in its hidden "initial" state after hydration.
export default function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
