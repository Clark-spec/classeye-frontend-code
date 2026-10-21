import type { RoomStatus } from '../types';

const styles: Record<RoomStatus, string> = {
  occupied: 'bg-occupied-bg text-occupied-text',
  empty: 'bg-empty-bg text-empty-text',
  maintenance: 'bg-maint-bg text-maint-text',
};

const dotStyles: Record<RoomStatus, string> = {
  occupied: 'bg-occupied-text',
  empty: 'bg-empty-text',
  maintenance: 'bg-maint-text',
};

const labels: Record<RoomStatus, string> = {
  occupied: 'Occupied',
  empty: 'Empty',
  maintenance: 'Maintenance',
};

interface StatusBadgeProps {
  status: RoomStatus;
  overCapacity?: boolean;
}

export function StatusBadge({ status, overCapacity = false }: StatusBadgeProps) {
  const shouldPulse = overCapacity || status === 'occupied';
  const dotColor = overCapacity ? 'bg-danger' : dotStyles[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      <span className="relative flex h-1.5 w-1.5 items-center justify-center">
        {shouldPulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-pulse-dot rounded-full ${dotColor}`}
            aria-hidden="true"
          />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dotColor}`} />
      </span>
      {labels[status]}
    </span>
  );
}
