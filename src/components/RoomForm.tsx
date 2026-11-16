import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { RoomPayload } from '../types';

interface RoomFormProps {
  initialValues?: RoomPayload;
  errors?: Record<string, string[]>;
  submitting?: boolean;
  success?: boolean;
  submitLabel?: string;
  onSubmit: (values: RoomPayload) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
}

const defaultValues: RoomPayload = {
  name: '',
  floor: 1,
  building: 'Main Building',
  capacity: 40,
  people_count: 0,
  is_maintenance: false,
};

const inputClass = 'field';
const errorInputClass = 'field-error';

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

export function RoomForm({
  initialValues,
  errors = {},
  submitting = false,
  success = false,
  submitLabel = 'Save room',
  onSubmit,
  onCancel,
  onDelete,
  showDelete = false,
}: RoomFormProps) {
  const [values, setValues] = useState<RoomPayload>(initialValues ?? defaultValues);

  function update<K extends keyof RoomPayload>(key: K, value: RoomPayload[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      ...values,
      name: values.name.trim(),
      building: values.building.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="room-name" className="mb-1.5 block text-sm font-medium text-ink">
            Room name
          </label>
          <input
            id="room-name"
            type="text"
            required
            maxLength={50}
            value={values.name}
            onChange={(event) => update('name', event.target.value)}
            placeholder="e.g. Room 206"
            className={`${inputClass} ${errors.name ? errorInputClass : ''}`}
          />
          <FieldError messages={errors.name} />
        </div>

        <div>
          <label htmlFor="room-floor" className="mb-1.5 block text-sm font-medium text-ink">
            Floor
          </label>
          <input
            id="room-floor"
            type="number"
            required
            min={1}
            max={10}
            value={values.floor}
            onChange={(event) => update('floor', Number(event.target.value))}
            className={`${inputClass} ${errors.floor ? errorInputClass : ''}`}
          />
          <FieldError messages={errors.floor} />
        </div>

        <div>
          <label htmlFor="room-building" className="mb-1.5 block text-sm font-medium text-ink">
            Building
          </label>
          <input
            id="room-building"
            type="text"
            maxLength={50}
            value={values.building}
            onChange={(event) => update('building', event.target.value)}
            placeholder="Main Building"
            className={`${inputClass} ${errors.building ? errorInputClass : ''}`}
          />
          <FieldError messages={errors.building} />
        </div>

        <div>
          <label htmlFor="room-capacity" className="mb-1.5 block text-sm font-medium text-ink">
            Capacity
          </label>
          <input
            id="room-capacity"
            type="number"
            required
            min={1}
            max={500}
            value={values.capacity}
            onChange={(event) => update('capacity', Number(event.target.value))}
            className={`${inputClass} ${errors.capacity ? errorInputClass : ''}`}
          />
          <FieldError messages={errors.capacity} />
        </div>

        <div>
          <label htmlFor="room-people" className="mb-1.5 block text-sm font-medium text-ink">
            People inside
          </label>
          <input
            id="room-people"
            type="number"
            required
            min={0}
            max={1000}
            value={values.people_count}
            onChange={(event) => update('people_count', Number(event.target.value))}
            className={`${inputClass} ${errors.people_count ? errorInputClass : ''}`}
          />
          <FieldError messages={errors.people_count} />
        </div>
      </div>

      <div className="rounded-xl border border-white/70 bg-white/60 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ink">Under maintenance</p>
            <p className="mt-0.5 text-sm text-ink-muted">
              Maintenance rooms are marked separately and are not counted as occupied.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={values.is_maintenance}
            onClick={() => update('is_maintenance', !values.is_maintenance)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-[background-color,box-shadow] duration-200 ease-soft hover:ring-2 hover:ring-brand/20 ${
              values.is_maintenance ? 'bg-brand' : 'bg-brand-light'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ease-soft ${
                values.is_maintenance ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
        <FieldError messages={errors.is_maintenance} />
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-brand-light/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {showDelete && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-danger px-4 py-2.5 text-sm font-semibold text-danger transition-[transform,background-color,box-shadow] duration-180 ease-soft hover:-translate-y-0.5 hover:bg-danger-light hover:shadow-sm sm:w-auto"
            >
              <Trash2 size={16} />
              Delete room
            </button>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="btn-secondary"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || success}
            className={
              success
                ? 'inline-flex items-center justify-center gap-2 rounded-xl bg-empty-text px-5 py-2.5 text-sm font-semibold text-white'
                : `btn-primary px-5 ${submitting ? 'opacity-60' : ''}`
            }
          >
            <AnimatePresence mode="wait" initial={false}>
              {submitting && (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="inline-flex"
                >
                  <Loader2 size={16} className="animate-spin" />
                </motion.span>
              )}
              {!submitting && success && (
                <motion.span
                  key="success"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  className="inline-flex"
                >
                  <CheckCircle2 size={16} />
                </motion.span>
              )}
            </AnimatePresence>
            {success ? 'Saved' : submitting ? 'Saving...' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
