import { motion, useReducedMotion } from 'framer-motion';
import { Inbox, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }: EmptyStateProps) {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <div className="glass flex flex-col items-center justify-center px-6 py-12 text-center">
      <motion.div
        animate={reducedMotion ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand-dark"
      >
        <Icon size={24} />
      </motion.div>
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.3 }}
        className="w-full"
      >
        <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
        {message && <p className="mt-1 max-w-sm text-sm text-ink-muted">{message}</p>}
      </motion.div>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
