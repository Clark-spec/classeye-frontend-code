import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, CheckCircle2, Wrench } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getApiErrorMessage, getApiFieldErrors } from '../api/client';
import { deleteRoom, fetchRoom, fetchRoomLogs, updateRoom } from '../api/rooms';
import { ActivityList } from '../components/ActivityList';
import { CapacityBar } from '../components/CapacityBar';
import { ConfirmModal } from '../components/ConfirmModal';
import { RoomForm } from '../components/RoomForm';
import { Skeleton } from '../components/Skeleton';
import { StatusBadge } from '../components/StatusBadge';
import { Tabs, type TabItem } from '../components/Tabs';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { ActivityLog, Room, RoomPayload } from '../types';

const tabs: TabItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'edit', label: 'Edit Room' },
  { id: 'activity', label: 'Activity' },
];

function roomNumber(name: string): string {
  const match = name.match(/\d+/);
  return match ? match[0] : name;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function InfoItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-white/50 px-3 py-2.5">
      <p className="text-sm text-ink-muted">{label}</p>
      <div className="mt-1 text-sm font-semibold text-ink">{children}</div>
    </div>
  );
}

export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const roomId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [room, setRoom] = useState<Room | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<RoomPayload | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const load = useCallback(async () => {
    if (!Number.isInteger(roomId) || roomId <= 0) {
      setLoading(false);
      setError('Room not found.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [roomData, logData] = await Promise.all([fetchRoom(roomId), fetchRoomLogs(roomId)]);
      setRoom(roomData);
      setLogs(logData);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load this room.'));
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleUpdate(values: RoomPayload) {
    setSaved(false);
    setPendingUpdate(values);
  }

  async function confirmUpdate() {
    if (!room || !pendingUpdate) {
      return;
    }

    setSaving(true);
    setFieldErrors({});

    try {
      const updated = await updateRoom(room.id, pendingUpdate);
      setRoom(updated);
      setSaved(true);
      showToast('Room updated', 'success');
      window.setTimeout(() => setSaved(false), 1800);

      try {
        setLogs(await fetchRoomLogs(room.id));
      } catch {
        // The room was updated successfully; keep the existing activity list.
      }
    } catch (requestError) {
      setFieldErrors(getApiFieldErrors(requestError));
      showToast(getApiErrorMessage(requestError, 'Could not update the room.'), 'error');
    } finally {
      setSaving(false);
      setPendingUpdate(null);
    }
  }

  async function handleDelete() {
    if (!room) {
      return;
    }

    setDeleting(true);

    try {
      await deleteRoom(room.id);
      showToast('Room deleted', 'success');
      navigate('/rooms');
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, 'Could not delete the room.'), 'error');
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-11 w-80" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link
          to="/rooms"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-brand"
        >
          <ArrowLeft size={16} />
          Back to Rooms
        </Link>
        <div className="mt-4 glass px-5 py-10 text-center">
          <p className="text-sm text-danger">{error ?? 'Room not found.'}</p>
          <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              Retry
            </button>
            <Link
              to="/rooms"
              className="rounded-xl border border-brand-light px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-brand-surface"
            >
              Back to rooms
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const SummaryIcon = room.is_maintenance
    ? Wrench
    : room.is_over_capacity
      ? AlertTriangle
      : CheckCircle2;
  const summaryTone = room.is_maintenance
    ? 'bg-maint-bg text-maint-text'
    : room.is_over_capacity
      ? 'bg-danger-light text-danger'
      : 'bg-empty-bg text-empty-text';
  const summary = room.is_maintenance
    ? 'This room is under maintenance and is not available for classes.'
    : room.is_over_capacity
      ? `This room is over capacity by ${room.people_count - room.capacity} people.`
      : room.people_count === 0
        ? 'This room is currently empty.'
        : `${room.people_count} of ${room.capacity} spaces are in use.`;

  return (
    <div className="space-y-5">
      <div>
        <Link
          to="/rooms"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-brand"
        >
          <ArrowLeft size={16} />
          Back to Rooms
        </Link>
      </div>

      <section className="glass p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-light text-lg font-bold text-brand-dark">
              {roomNumber(room.name)}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-ink sm:text-2xl">{room.name}</h1>
              <p className="mt-1 text-sm text-ink-muted">
                Floor {room.floor} · {room.building}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={room.status} overCapacity={room.is_over_capacity} />
                {room.is_over_capacity && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-danger-light px-2.5 py-1 text-xs font-semibold text-danger">
                    <AlertTriangle size={12} />
                    Over capacity
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <AnimatePresence mode="wait" initial={false}>
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="grid gap-4 lg:grid-cols-3"
          >
            <section className="glass p-5 lg:col-span-2">
              <h2 className="text-base font-semibold text-ink">Occupancy</h2>
              <div className="mt-5">
                <CapacityBar people={room.people_count} capacity={room.capacity} />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <InfoItem label="Status">
                  <StatusBadge status={room.status} overCapacity={room.is_over_capacity} />
                </InfoItem>
                <InfoItem label="Capacity">{room.capacity} people</InfoItem>
                <InfoItem label="People inside">{room.people_count}</InfoItem>
                <InfoItem label="Floor">Floor {room.floor}</InfoItem>
                <InfoItem label="Building">{room.building}</InfoItem>
                <InfoItem label="Last updated">{formatDateTime(room.updated_at)}</InfoItem>
              </div>
            </section>

            <section className="glass p-5">
              <h2 className="text-base font-semibold text-ink">Quick summary</h2>
              <div
                className={`mt-4 flex h-11 w-11 items-center justify-center rounded-xl ${summaryTone}`}
              >
                <SummaryIcon size={22} />
              </div>
              <p className="mt-3 text-sm text-ink-muted">{summary}</p>
              <p className="mt-3 text-sm text-ink-muted">
                Status is calculated automatically from the maintenance switch and the people
                count.
              </p>
            </section>
          </motion.div>
        )}

        {activeTab === 'edit' && (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="grid gap-4 lg:grid-cols-3"
          >
            <section className="glass p-5 lg:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-ink">Room Information</h2>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    Update the room details and save your changes.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-ink-muted">
                  Current status
                  <StatusBadge status={room.status} overCapacity={room.is_over_capacity} />
                </div>
              </div>

              <div className="mt-5">
                <RoomForm
                  key={room.updated_at}
                  initialValues={room}
                  errors={fieldErrors}
                  submitting={saving}
                  success={saved}
                  submitLabel="Save changes"
                  onSubmit={handleUpdate}
                  onCancel={() => {
                    setFieldErrors({});
                    setActiveTab('overview');
                  }}
                  showDelete={user?.role === 'admin'}
                  onDelete={() => setConfirmOpen(true)}
                />
              </div>
            </section>

            <section className="glass p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-ink">Recent Activity</h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('activity')}
                  className="text-sm font-semibold text-brand transition hover:text-brand-dark"
                >
                  View all
                </button>
              </div>
              <div className="mt-4">
                <ActivityList logs={logs.slice(0, 5)} emptyMessage="No activity yet." />
              </div>
            </section>
          </motion.div>
        )}

        {activeTab === 'activity' && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <section className="glass p-5">
              <h2 className="text-base font-semibold text-ink">Activity</h2>
              <p className="mt-0.5 text-sm text-ink-muted">
                Every room change is recorded with the staff member and time.
              </p>
              <div className="mt-5">
                <ActivityList
                  logs={logs}
                  emptyMessage="No activity has been recorded for this room yet."
                />
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={pendingUpdate !== null}
        title="Save changes"
        message={`Save the changes to ${room.name}? This update will be added to the activity log.`}
        confirmLabel="Save changes"
        loading={saving}
        danger={false}
        onConfirm={() => void confirmUpdate()}
        onCancel={() => {
          if (!saving) {
            setPendingUpdate(null);
          }
        }}
      />

      <ConfirmModal
        open={confirmOpen}
        title="Delete room"
        message={`Are you sure you want to delete ${room.name}? This cannot be undone.`}
        confirmLabel="Delete room"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => {
          if (!deleting) {
            setConfirmOpen(false);
          }
        }}
      />
    </div>
  );
}
