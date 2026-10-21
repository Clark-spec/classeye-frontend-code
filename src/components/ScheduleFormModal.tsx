import { motion } from 'framer-motion';
import { AlertCircle, CalendarPlus, Loader2, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import type { Room, ScheduleDay, SchedulePayload, User } from '../types';
import { SCHEDULE_DAYS } from '../types';
import { DAY_FULL_LABELS } from '../utils/schedule';

interface ScheduleFormModalProps {
  mode: 'create' | 'edit';
  initialValues: SchedulePayload;
  instructors: User[];
  rooms: Room[];
  errors: Record<string, string[]>;
  submitting: boolean;
  locked?: boolean;
  onClose: () => void;
  onSubmit: (values: SchedulePayload) => void;
}

const inputClass =
  'w-full rounded-xl border border-brand-light bg-white px-3 py-2.5 text-sm text-ink transition-shadow placeholder:text-ink-muted/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 focus:shadow-[0_0_0_4px_rgba(11,111,107,0.12)]';
const errorInputClass = 'border-danger focus:border-danger focus:ring-danger/20';

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) {
    return null;
  }

  return (
    <p className="mt-1 flex items-center gap-1 text-sm text-danger">
      <AlertCircle size={14} aria-hidden="true" />
      {messages[0]}
    </p>
  );
}

export function ScheduleFormModal({
  mode,
  initialValues,
  instructors,
  rooms,
  errors,
  submitting,
  locked = false,
  onClose,
  onSubmit,
}: ScheduleFormModalProps) {
  const [values, setValues] = useState<SchedulePayload>(initialValues);
  const [dayError, setDayError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting && !locked) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [submitting, locked, onClose]);

  function update<K extends keyof SchedulePayload>(key: K, value: SchedulePayload[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function toggleDay(day: ScheduleDay) {
    setDayError(null);
    setValues((current) => {
      const active = current.days.includes(day);
      const days = active
        ? current.days.filter((item) => item !== day)
        : [...current.days, day].sort(
            (left, right) => SCHEDULE_DAYS.indexOf(left) - SCHEDULE_DAYS.indexOf(right)
          );

      return { ...current, days };
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (values.days.length === 0) {
      setDayError('Choose at least one day.');
      return;
    }

    if (values.end_time <= values.start_time) {
      setTimeError('End time must be after the start time.');
      return;
    }

    onSubmit({
      ...values,
      subject_code: values.subject_code.trim().toUpperCase(),
      descriptive_title: values.descriptive_title.trim(),
    });
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting && !locked) {
          onClose();
        }
      }}
    >
      <motion.div
        className="glass-strong max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-b-none p-5 sm:rounded-2xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-form-title"
        aria-hidden={locked || undefined}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 26 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand-dark">
              <CalendarPlus size={22} />
            </div>
            <div>
              <h2 id="schedule-form-title" className="text-lg font-semibold text-ink">
                {mode === 'create' ? 'Add Schedule' : 'Edit Schedule'}
              </h2>
              <p className="mt-0.5 text-sm text-ink-muted">
                Set the instructor, room, meeting days, and class time.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting || locked}
            className="rounded-lg p-1 text-ink-muted transition hover:bg-white/60 hover:text-ink disabled:cursor-not-allowed"
            aria-label="Close schedule form"
          >
            <X size={18} />
          </button>
        </div>

        {instructors.length === 0 || rooms.length === 0 ? (
          <p className="mt-5 rounded-xl border border-occupied-bg bg-occupied-bg/60 px-4 py-3 text-sm text-occupied-text">
            Add at least one instructor and one room before creating a schedule.
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="schedule-subject-code"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Subject code
              </label>
              <input
                id="schedule-subject-code"
                type="text"
                required
                maxLength={30}
                value={values.subject_code}
                onChange={(event) => update('subject_code', event.target.value)}
                placeholder="e.g. APPSDEV"
                className={`${inputClass} ${errors.subject_code ? errorInputClass : ''}`}
              />
              <FieldError messages={errors.subject_code} />
            </div>

            <div>
              <label
                htmlFor="schedule-units"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Units
              </label>
              <input
                id="schedule-units"
                type="number"
                required
                min={1}
                max={6}
                value={values.units}
                onChange={(event) => update('units', Number(event.target.value))}
                className={`${inputClass} ${errors.units ? errorInputClass : ''}`}
              />
              <FieldError messages={errors.units} />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="schedule-title"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Descriptive title
              </label>
              <input
                id="schedule-title"
                type="text"
                required
                maxLength={120}
                value={values.descriptive_title}
                onChange={(event) => update('descriptive_title', event.target.value)}
                placeholder="e.g. Application Development"
                className={`${inputClass} ${errors.descriptive_title ? errorInputClass : ''}`}
              />
              <FieldError messages={errors.descriptive_title} />
            </div>

            <div>
              <label
                htmlFor="schedule-instructor"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Instructor
              </label>
              <select
                id="schedule-instructor"
                required
                value={values.instructor_id || ''}
                onChange={(event) => update('instructor_id', Number(event.target.value))}
                className={`${inputClass} ${errors.instructor_id ? errorInputClass : ''}`}
              >
                <option value="">Select instructor</option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name} ({instructor.staff_id})
                  </option>
                ))}
              </select>
              <FieldError messages={errors.instructor_id} />
            </div>

            <div>
              <label
                htmlFor="schedule-room"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Room
              </label>
              <select
                id="schedule-room"
                required
                value={values.room_id || ''}
                onChange={(event) => update('room_id', Number(event.target.value))}
                className={`${inputClass} ${errors.room_id ? errorInputClass : ''}`}
              >
                <option value="">Select room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} · Floor {room.floor}
                  </option>
                ))}
              </select>
              <FieldError messages={errors.room_id} />
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-ink">Meeting days</legend>
            <div className="flex flex-wrap gap-2">
              {SCHEDULE_DAYS.map((day) => {
                const active = values.days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleDay(day)}
                    className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                      active
                        ? 'bg-brand text-white shadow-sm'
                        : 'border border-brand-light bg-white text-ink-muted hover:text-ink'
                    }`}
                  >
                    {DAY_FULL_LABELS[day]}
                  </button>
                );
              })}
            </div>
            <FieldError messages={dayError ? [dayError] : errors.days} />
          </fieldset>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label
                htmlFor="schedule-start"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Start time
              </label>
              <input
                id="schedule-start"
                type="time"
                required
                value={values.start_time}
                onChange={(event) => {
                  setTimeError(null);
                  update('start_time', event.target.value);
                }}
                className={`${inputClass} ${errors.start_time ? errorInputClass : ''}`}
              />
              <FieldError messages={errors.start_time} />
            </div>

            <div>
              <label
                htmlFor="schedule-end"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                End time
              </label>
              <input
                id="schedule-end"
                type="time"
                required
                value={values.end_time}
                onChange={(event) => {
                  setTimeError(null);
                  update('end_time', event.target.value);
                }}
                className={`${inputClass} ${errors.end_time || timeError ? errorInputClass : ''}`}
              />
              <FieldError messages={timeError ? [timeError] : errors.end_time} />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <span className="mb-1.5 block text-sm font-medium text-ink">Weekly load</span>
              <div className="rounded-xl border border-brand-light bg-brand-surface px-3 py-2.5 text-sm text-ink-muted">
                {values.days.length} {values.days.length === 1 ? 'day' : 'days'} ·{' '}
                {values.units} {values.units === 1 ? 'unit' : 'units'}
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-brand-light/70 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting || locked}
              className="rounded-xl border border-brand-light px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-brand-surface disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || locked || instructors.length === 0 || rooms.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? 'Saving...' : mode === 'create' ? 'Add schedule' : 'Save changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
