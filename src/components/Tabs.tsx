import { motion } from 'framer-motion';
import { springSnap } from '../lib/motion';

export interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div
      role="tablist"
      className="flex gap-1 overflow-x-auto rounded-xl bg-brand-surface/80 p-1"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-selected={isActive}
            role="tab"
            className={`relative whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 ease-soft ${
              isActive ? 'text-brand-dark' : 'text-ink-muted hover:bg-white/60 hover:text-ink'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="tab-indicator"
                className="absolute inset-0 rounded-lg bg-white shadow-sm ring-1 ring-white/70"
                transition={springSnap}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
