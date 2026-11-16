import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { EASE_SOFT } from '../lib/motion';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function Reveal({ children, className = '', delay = 0 }: RevealProps) {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: '0px 0px -40px 0px' }}
      transition={{ duration: reducedMotion ? 0 : 0.4, ease: EASE_SOFT, delay }}
    >
      {children}
    </motion.div>
  );
}
