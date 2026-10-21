import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiErrorMessage, getApiFieldErrors } from '../api/client';
import { createRoom } from '../api/rooms';
import { ConfirmModal } from '../components/ConfirmModal';
import { RoomForm } from '../components/RoomForm';
import { useToast } from '../context/ToastContext';
import type { RoomPayload } from '../types';

export function RoomCreatePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [pendingValues, setPendingValues] = useState<RoomPayload | null>(null);

  function handleSubmit(values: RoomPayload) {
    setPendingValues(values);
  }

  async function confirmCreate() {
    if (!pendingValues) {
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const room = await createRoom(pendingValues);
      showToast('Room added', 'success');
      navigate(`/rooms/${room.id}`);
    } catch (requestError) {
      setErrors(getApiFieldErrors(requestError));
      showToast(getApiErrorMessage(requestError, 'Could not add the room.'), 'error');
    } finally {
      setSubmitting(false);
      setPendingValues(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link
          to="/rooms"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-brand"
        >
          <ArrowLeft size={16} />
          Back to Rooms
        </Link>
        <h1 className="mt-3 text-xl font-bold text-ink sm:text-2xl">Add Room</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Status is calculated automatically from the people count and the maintenance switch.
        </p>
      </div>

      <section className="glass p-5 sm:p-6">
        <RoomForm
          errors={errors}
          submitting={submitting}
          submitLabel="Add room"
          onSubmit={handleSubmit}
          onCancel={() => navigate('/rooms')}
        />
      </section>

      <ConfirmModal
        open={pendingValues !== null}
        title="Add room"
        message={`Add ${pendingValues?.name.trim() || 'this room'}? It will be saved to the room list and recorded in the activity log.`}
        confirmLabel="Add room"
        loading={submitting}
        danger={false}
        onConfirm={() => void confirmCreate()}
        onCancel={() => {
          if (!submitting) {
            setPendingValues(null);
          }
        }}
      />
    </div>
  );
}
