import type { Transition } from 'framer-motion';

/**
 * Shared motion tokens. Keeping duration and easing in one place is what makes
 * the whole interface feel like one system instead of a set of one-off effects.
 */
export const EASE_SOFT: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const EASE_SNAP: [number, number, number, number] = [0.4, 0, 0.2, 1];

export const DUR = {
  fast: 0.12,
  base: 0.18,
  slow: 0.28,
} as const;

export function soft(duration: number = DUR.base): Transition {
  return { duration, ease: EASE_SOFT };
}

export const springPanel: Transition = { type: 'spring', stiffness: 260, damping: 30 };
export const springSnap: Transition = { type: 'spring', stiffness: 420, damping: 34 };
