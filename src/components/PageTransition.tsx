import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { EASE_SOFT } from '../lib/motion';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={
        reducedMotion
          ? { opacity: 0 }
          : { opacity: 0, y: -4, transition: { duration: 0.12, ease: EASE_SOFT } }
      }
      transition={{ duration: reducedMotion ? 0 : 0.2, ease: EASE_SOFT }}
    >
      {children}
    </motion.div>
  );
}
