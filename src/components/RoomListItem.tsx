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
      className="group flex items-center gap-3 rounded-xl border border-white/70 bg-white/55 p-3 transition hover:-translate-y-0.5 hover:border-brand/30 hover:bg-white/80 hover:shadow-[0_8px_20px_rgba(11,111,107,0.12)] sm:gap-4 sm:p-4"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-light text-sm font-bold text-brand-dark">
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
          className="hidden text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-brand sm:block"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
