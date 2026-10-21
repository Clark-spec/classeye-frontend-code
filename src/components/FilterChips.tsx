import { motion } from 'framer-motion';

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
            className={`relative rounded-full px-3.5 py-2 text-sm font-medium transition ${
              active
                ? 'text-white'
                : 'bg-white text-ink-muted ring-1 ring-brand-light hover:text-ink'
            }`}
          >
            {active && (
              <motion.span
                layoutId="chip-active"
                className="absolute inset-0 rounded-full bg-brand shadow-sm"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
