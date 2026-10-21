import { motion, useReducedMotion } from 'framer-motion';

interface CapacityBarProps {
  people: number;
  capacity: number;
  showLabel?: boolean;
}

export function CapacityBar({ people, capacity, showLabel = true }: CapacityBarProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const over = people > capacity;
  const percent = capacity > 0 ? Math.min(100, Math.round((people / capacity) * 100)) : 100;

  return (
    <div>
      {showLabel && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-ink-muted">Occupancy</span>
          <span className={`text-sm font-semibold ${over ? 'text-danger' : 'text-ink'}`}>
            {people} / {capacity}
          </span>
        </div>
      )}
      <div
        className={`h-2.5 overflow-hidden rounded-full bg-brand-light ${showLabel ? 'mt-2' : ''}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={people}
        aria-label="Room occupancy"
      >
        <motion.div
          className={`h-full rounded-full ${over ? 'animate-pulse bg-danger' : 'bg-brand'}`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: reducedMotion ? 0 : 0.8, ease: 'easeOut' }}
        />
      </div>
      {over && (
        <motion.p
          initial={reducedMotion ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm font-medium text-danger"
        >
          Over capacity by {people - capacity} {people - capacity === 1 ? 'person' : 'people'}
        </motion.p>
      )}
    </div>
  );
}
