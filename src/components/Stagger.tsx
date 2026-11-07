import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

interface StaggerProps {
  children: ReactNode;
  className?: string;
}

interface StaggerItemProps extends StaggerProps {
  inView?: boolean;
}

export function Stagger({ children, className = '' }: StaggerProps) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.12 }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '', inView = false }: StaggerItemProps) {
  if (inView) {
    return (
      <motion.div
        className={className}
        variants={staggerItem}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.18, margin: '0px 0px -40px 0px' }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  );
}
