import type { InsightRisk } from '../types';

const styles: Record<InsightRisk, string> = {
  critical: 'bg-danger text-white',
  high: 'bg-danger-light text-danger',
  medium: 'bg-occupied-bg text-occupied-text',
  low: 'bg-empty-bg text-empty-text',
};

const labels: Record<InsightRisk, string> = {
  critical: 'Critical',
  high: 'High risk',
  medium: 'Watch',
  low: 'Stable',
};

export function RiskBadge({ risk }: { risk: InsightRisk }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[risk]}`}
    >
      {labels[risk]}
    </span>
  );
}
