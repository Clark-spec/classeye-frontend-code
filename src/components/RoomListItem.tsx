import { AlertTriangle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Room } from '../types';
import { StatusBadge } from './StatusBadge';

function roomNumber(name: string): string {
  const match = name.match(/\d+/);
  return match ? match[0] : name;
}

export function RoomListItem({ room }: { room: Room }) {
  const peopleLabel = room.people_count === 1 ? 'person' : 'people';

  return (
    <Link
      to={`/rooms/${room.id}`}
      className={`group row-interactive flex items-center gap-3 rounded-xl p-3 sm:gap-4 sm:p-4 ${
        room.is_over_capacity
          ? 'row-interactive-danger border-2 border-danger bg-danger-light'
          : 'glass-subtle'
      }`}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-light text-sm font-bold text-brand-dark transition-colors duration-200 ease-soft group-hover:bg-white">
        {roomNumber(room.name)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{room.name}</p>
        <p className="mt-0.5 line-clamp-2 leading-snug text-sm text-ink-muted">
          Floor {room.floor} · {room.people_count} {peopleLabel} · {room.building}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {room.is_over_capacity && (
          <span className="text-danger" title="Over capacity">
            <AlertTriangle size={18} aria-hidden="true" />
          </span>
        )}
        <StatusBadge status={room.status} overCapacity={room.is_over_capacity} />
        <ChevronRight
          size={18}
          className="hidden text-ink-muted transition-[transform,color] duration-200 ease-soft group-hover:translate-x-1 group-hover:text-brand group-focus-visible:translate-x-1 group-focus-visible:text-brand sm:block"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
