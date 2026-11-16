import { motion } from 'framer-motion';
import { springSnap } from '../lib/motion';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterChipsProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export function FilterChips({ options, value, onChange }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`relative rounded-full px-3.5 py-2 text-sm font-medium transition-[background-color,color,box-shadow,transform] duration-200 ease-soft active:scale-[0.98] ${
              active
                ? 'text-white'
                : 'bg-white text-ink-muted ring-1 ring-brand-light hover:bg-brand-light/50 hover:text-brand-dark hover:shadow-sm hover:ring-brand/30'
            }`}
          >
            {active && (
              <motion.span
                layoutId="chip-active"
                className="absolute inset-0 rounded-full bg-brand shadow-[0_6px_14px_-8px_rgba(11,111,107,0.8)]"
                transition={springSnap}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
