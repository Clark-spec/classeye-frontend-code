import { CalendarDays, Clock3, MapPin, Pencil, Trash2, UserRound } from 'lucide-react';
import type { Schedule } from '../types';
import {
  DAY_LABELS,
  formatDayList,
  formatTimeRange,
  formatUnits,
} from '../utils/schedule';

interface ScheduleCardProps {
  schedule: Schedule;
  canManage: boolean;
  onEdit: (schedule: Schedule) => void;
  onDelete: (schedule: Schedule) => void;
}

export function ScheduleCard({ schedule, canManage, onEdit, onDelete }: ScheduleCardProps) {
  return (
    <article className="glass h-full p-4 transition-shadow hover:shadow-[0_14px_40px_rgba(11,111,107,0.16)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-brand px-2.5 py-1 text-xs font-bold tracking-wide text-white">
              {schedule.subject_code}
            </span>
            <span className="rounded-full bg-brand-surface px-2.5 py-1 text-xs font-semibold text-ink-muted">
              {formatUnits(schedule.units)}
            </span>
          </div>
          <h3 className="mt-2.5 text-base font-semibold leading-snug text-ink">
            {schedule.descriptive_title}
          </h3>
        </div>

        {canManage && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(schedule)}
              className="rounded-lg p-2 text-ink-muted transition hover:bg-brand-light hover:text-brand-dark"
              aria-label={`Edit ${schedule.subject_code}`}
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(schedule)}
              className="rounded-lg p-2 text-ink-muted transition hover:bg-danger-light hover:text-danger"
              aria-label={`Delete ${schedule.subject_code}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-surface text-brand-dark">
            <UserRound size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Instructor</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-ink">
              {schedule.instructor.name}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-surface text-brand-dark">
            <MapPin size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Room</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-ink">{schedule.room.name}</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 sm:col-span-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-surface text-brand-dark">
            <Clock3 size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Class time</p>
            <p className="mt-0.5 text-sm font-semibold text-ink">
              {formatTimeRange(schedule.start_time, schedule.end_time)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-brand-light/70 pt-3">
        <CalendarDays size={15} className="mr-1 text-ink-muted" aria-hidden="true" />
        <div className="flex flex-wrap gap-1.5" aria-label={`Days: ${formatDayList(schedule.days)}`}>
          {schedule.days.map((day) => (
            <span
              key={day}
              title={DAY_LABELS[day]}
              className="rounded-md bg-brand-light px-2 py-1 text-xs font-bold text-brand-dark"
            >
              {day}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
