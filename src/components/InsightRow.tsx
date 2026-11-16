import { Activity, ArrowUpRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RoomInsight } from '../types';
import { RiskBadge } from './RiskBadge';

export function InsightRow({ insight }: { insight: RoomInsight }) {
  const percent = Math.round(insight.utilization * 100);
  const trend = insight.growth_per_hour;
  const trendLabel = trend > 0 ? `+${trend}` : `${trend}`;

  return (
    <Link
      to={`/rooms/${insight.room_id}`}
      className="group row-interactive glass-subtle flex flex-col gap-3 rounded-xl p-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-ink">{insight.name}</p>
          <RiskBadge risk={insight.risk_level} />
          {insight.anomaly.detected && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-light px-2 py-0.5 text-xs font-semibold text-brand-dark">
              <Activity size={12} aria-hidden="true" />
              Unusual change
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-muted">{insight.reason}</p>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:text-right">
        <div>
          <p className="inline-flex items-center gap-1 text-sm font-semibold text-ink">
            <TrendingUp size={14} aria-hidden="true" />
            {percent}% used
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">
            {trendLabel}/hr · {insight.forecast_people_count} expected in{' '}
            {insight.forecast_minutes} min
          </p>
        </div>
        <ArrowUpRight
          size={18}
          className="hidden text-ink-muted transition-[transform,color] duration-200 ease-soft group-hover:-translate-y-0.5 group-hover:translate-x-1 group-hover:text-brand group-focus-visible:translate-x-1 group-focus-visible:text-brand sm:block"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
