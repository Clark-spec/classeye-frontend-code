import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatedNumber } from './AnimatedNumber';
import { Skeleton } from './Skeleton';

type StatTone = 'teal' | 'amber' | 'green' | 'red';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  to: string;
  tone: StatTone;
  loading?: boolean;
  wiggle?: boolean;
}

const tones: Record<StatTone, string> = {
  teal: 'bg-brand-light text-brand-dark',
  amber: 'bg-occupied-bg text-occupied-text',
  green: 'bg-empty-bg text-empty-text',
  red: 'bg-danger-light text-danger',
};

export function StatCard({
  label,
  value,
  icon: Icon,
  to,
  tone,
  loading,
  wiggle = false,
}: StatCardProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const iconControls = useAnimationControls();

  useEffect(() => {
    if (!wiggle || reducedMotion || loading) {
      return;
    }

    void iconControls.start({
      rotate: [0, -8, 8, -4, 4, 0],
      transition: { duration: 0.6, ease: 'easeInOut' },
    });
  }, [wiggle, reducedMotion, loading, iconControls]);

  return (
    <motion.div
      whileHover={reducedMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="h-full"
    >
      <Link
        to={to}
        className="glass group flex h-full flex-col p-4 transition-shadow hover:shadow-[0_16px_40px_rgba(11,111,107,0.18)] sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <motion.div
            animate={iconControls}
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}
          >
            <Icon size={20} />
          </motion.div>
          <ArrowUpRight
            size={18}
            className="text-ink-muted transition group-hover:text-brand"
            aria-hidden="true"
          />
        </div>
        <div className="mt-4">
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-2xl font-bold leading-none text-ink">
              <AnimatedNumber value={value} />
            </p>
          )}
          <p className="mt-2 text-sm font-medium text-ink-muted">{label}</p>
        </div>
      </Link>
    </motion.div>
  );
}
