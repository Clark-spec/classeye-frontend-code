import { motion, useReducedMotion } from 'framer-motion';
import type { ActivityLog } from '../types';

const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function timeAgo(isoDate: string): string {
  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) {
    return '';
  }

  const diffSeconds = Math.round((timestamp - Date.now()) / 1000);
  const absolute = Math.abs(diffSeconds);

  if (absolute < 60) {
    return 'just now';
  }
  if (absolute < 3600) {
    return relativeTime.format(Math.round(diffSeconds / 60), 'minute');
  }
  if (absolute < 86400) {
    return relativeTime.format(Math.round(diffSeconds / 3600), 'hour');
  }
  if (absolute < 604800) {
    return relativeTime.format(Math.round(diffSeconds / 86400), 'day');
  }

  return new Date(isoDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface ActivityListProps {
  logs: ActivityLog[];
  emptyMessage?: string;
}

export function ActivityList({
  logs,
  emptyMessage = 'No activity has been recorded yet.',
}: ActivityListProps) {
  const reducedMotion = useReducedMotion() ?? false;

  if (logs.length === 0) {
    return <p className="text-sm text-ink-muted">{emptyMessage}</p>;
  }

  return (
    <ol className="space-y-4">
      {logs.map((log, index) => (
        <motion.li
          key={log.id}
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04, duration: 0.25, ease: 'easeOut' }}
          className="flex gap-3"
        >
          <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">{log.message}</p>
            <p className="mt-0.5 text-sm text-ink-muted">
              {log.user ?? 'System'} ·{' '}
              <span title={new Date(log.created_at).toLocaleString()}>
                {timeAgo(log.created_at)}
              </span>
            </p>
          </div>
        </motion.li>
      ))}
    </ol>
  );
}
