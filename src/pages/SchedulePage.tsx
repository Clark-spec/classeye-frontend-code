import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, CalendarPlus, Plus, SearchX, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getApiErrorMessage, getApiFieldErrors } from '../api/client';
import { fetchRooms } from '../api/rooms';
import {
  createSchedule,
  deleteSchedule,
  fetchInstructors,
  fetchSchedules,
  updateSchedule,
} from '../api/schedules';
import { ConfirmModal } from '../components/ConfirmModal';
import { EmptyState } from '../components/EmptyState';
import { FilterChips, type FilterOption } from '../components/FilterChips';
import { ScheduleCard } from '../components/ScheduleCard';
import { ScheduleFormModal } from '../components/ScheduleFormModal';
import { SearchInput } from '../components/SearchInput';
import { Skeleton } from '../components/Skeleton';
import { staggerContainer, staggerItem } from '../components/Stagger';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Room, Schedule, ScheduleDay, SchedulePayload, User } from '../types';
import { SCHEDULE_DAYS } from '../types';
import { DAY_LABELS, toSchedulePayload } from '../utils/schedule';

const dayOptions: FilterOption[] = [
  { value: 'all', label: 'All days' },
  ...SCHEDULE_DAYS.map((day) => ({ value: day, label: DAY_LABELS[day] })),
];

const selectClass =
  'rounded-xl border border-brand-light bg-white px-3 py-2.5 text-sm text-ink transition-shadow focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 focus:shadow-[0_0_0_4px_rgba(11,111,107,0.12)] lg:w-52';

export function SchedulePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'admin';

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [day, setDay] = useState<ScheduleDay | 'all'>('all');
  const [instructorId, setInstructorId] = useState(0);

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [instructors, setInstructors] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<SchedulePayload | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetchSchedules({
      search: debouncedSearch || undefined,
      day: day === 'all' ? undefined : day,
      instructorId: instructorId || undefined,
    })
      .then((result) => {
        if (active) {
          setSchedules(result);
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(getApiErrorMessage(requestError, 'Unable to load schedules.'));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [debouncedSearch, day, instructorId, reloadKey]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    let active = true;

    Promise.all([fetchInstructors(), fetchRooms()])
      .then(([instructorData, roomData]) => {
        if (active) {
          setInstructors(instructorData);
          setRooms(roomData);
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          showToast(
            getApiErrorMessage(requestError, 'Could not load instructors and rooms.'),
            'error'
          );
        }
      });

    return () => {
      active = false;
    };
  }, [isAdmin, showToast]);

  const hasFilters = search.trim().length > 0 || day !== 'all' || instructorId > 0;

  const formInitialValues = useMemo<SchedulePayload>(() => {
    if (editing) {
      return toSchedulePayload(editing);
    }

    return {
      instructor_id: instructors[0]?.id ?? 0,
      room_id: rooms[0]?.id ?? 0,
      subject_code: '',
      descriptive_title: '',
      days: ['M'],
      start_time: '08:00',
      end_time: '09:00',
      units: 3,
    };
  }, [editing, instructors, rooms]);

  const closeForm = useCallback(() => {
    if (submitting || pendingUpdate) {
      return;
    }

    setFormOpen(false);
    setEditing(null);
    setFormErrors({});
  }, [submitting, pendingUpdate]);

  function openCreate() {
    setEditing(null);
    setPendingUpdate(null);
    setFormErrors({});
    setFormOpen(true);
  }

  function openEdit(schedule: Schedule) {
    setEditing(schedule);
    setPendingUpdate(null);
    setFormErrors({});
    setFormOpen(true);
  }

  function handleSubmit(values: SchedulePayload) {
    if (editing) {
      setFormErrors({});
      setPendingUpdate(values);
      return;
    }

    void createNewSchedule(values);
  }

  async function createNewSchedule(values: SchedulePayload) {
    setSubmitting(true);
    setFormErrors({});

    try {
      await createSchedule(values);
      showToast('Schedule added', 'success');
      setFormOpen(false);
      setEditing(null);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setFormErrors(getApiFieldErrors(requestError));
      showToast(
        getApiErrorMessage(requestError, 'Could not save the schedule.'),
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmUpdate() {
    if (!editing || !pendingUpdate) {
      return;
    }

    setSubmitting(true);
    setFormErrors({});

    try {
      await updateSchedule(editing.id, pendingUpdate);
      showToast('Schedule updated', 'success');
      setPendingUpdate(null);
      setFormOpen(false);
      setEditing(null);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setPendingUpdate(null);
      setFormErrors(getApiFieldErrors(requestError));
      showToast(
        getApiErrorMessage(requestError, 'Could not save the schedule.'),
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      await deleteSchedule(deleteTarget.id);
      showToast('Schedule deleted', 'success');
      setDeleteTarget(null);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      showToast(
        getApiErrorMessage(requestError, 'Could not delete the schedule.'),
        'error'
      );
    } finally {
      setDeleting(false);
    }
  }

  function clearFilters() {
    setSearch('');
    setDebouncedSearch('');
    setDay('all');
    setInstructorId(0);
  }

  const scheduleLabel = schedules.length === 1 ? 'class' : 'classes';

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink sm:text-2xl">Schedule</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {loading
              ? 'Loading schedules...'
              : isAdmin
                ? `${schedules.length} ${scheduleLabel}${hasFilters ? ' matched' : ' across all instructors'}`
                : `${schedules.length} ${scheduleLabel} in your weekly load`}
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={openCreate}
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-dark"
          >
            <span
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
              aria-hidden="true"
            />
            <Plus size={18} className="relative" />
            <span className="relative">Add Schedule</span>
          </button>
        )}
      </div>

      <section className="glass p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search subject, instructor, or room"
            className="lg:flex-1"
          />

          {isAdmin && (
            <select
              value={instructorId || ''}
              onChange={(event) => setInstructorId(Number(event.target.value))}
              aria-label="Filter by instructor"
              className={selectClass}
            >
              <option value="">All instructors</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.name}
                </option>
              ))}
            </select>
          )}

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-brand-light bg-white px-3 py-2.5 text-sm font-semibold text-ink-muted transition hover:text-ink"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>

        <div className="mt-4">
          <FilterChips
            options={dayOptions}
            value={day}
            onChange={(value) => setDay(value as ScheduleDay | 'all')}
          />
        </div>
      </section>

      {loading && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <Skeleton key={item} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="glass px-5 py-8 text-center">
          <p className="text-sm text-danger">{error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
            className="mt-4 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && schedules.length === 0 && (
        <EmptyState
          icon={hasFilters ? SearchX : CalendarDays}
          title={hasFilters ? 'No schedules match' : 'No schedules yet'}
          message={
            hasFilters
              ? 'Try a different subject, instructor, room, or day.'
              : isAdmin
                ? 'Add the first class to start building the weekly schedule.'
                : 'Your teaching schedule has not been assigned yet.'
          }
          action={
            hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                Clear filters
              </button>
            ) : isAdmin ? (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                <CalendarPlus size={18} />
                Add Schedule
              </button>
            ) : undefined
          }
        />
      )}

      {!loading && !error && schedules.length > 0 && (
        <motion.div
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence initial={false}>
            {schedules.map((schedule) => (
              <motion.div
                key={schedule.id}
                layout
                variants={staggerItem}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.2 } }}
              >
                <ScheduleCard
                  schedule={schedule}
                  canManage={isAdmin}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {formOpen && (
        <ScheduleFormModal
          key={editing?.id ?? 'new'}
          mode={editing ? 'edit' : 'create'}
          initialValues={formInitialValues}
          instructors={instructors}
          rooms={rooms}
          errors={formErrors}
          submitting={submitting}
          locked={pendingUpdate !== null}
          onClose={closeForm}
          onSubmit={(values) => void handleSubmit(values)}
        />
      )}

      <ConfirmModal
        open={pendingUpdate !== null}
        title="Save schedule changes"
        message={
          editing
            ? `Save the changes to ${editing.subject_code} — ${editing.descriptive_title}?`
            : ''
        }
        confirmLabel="Save changes"
        loading={submitting}
        danger={false}
        onConfirm={() => void handleConfirmUpdate()}
        onCancel={() => {
          if (!submitting) {
            setPendingUpdate(null);
          }
        }}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete schedule"
        message={
          deleteTarget
            ? `Delete ${deleteTarget.subject_code} for ${deleteTarget.instructor.name}? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete schedule"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => {
          if (!deleting) {
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
