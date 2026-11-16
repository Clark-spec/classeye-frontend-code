import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiErrorMessage, getApiFieldErrors } from '../api/client';
import { createRoom } from '../api/rooms';
import { ConfirmModal } from '../components/ConfirmModal';
import { Reveal } from '../components/Reveal';
import { RoomForm } from '../components/RoomForm';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { RoomPayload } from '../types';

export function RoomCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [pendingValues, setPendingValues] = useState<RoomPayload | null>(null);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      showToast('Only administrators can add new rooms.', 'error');
      navigate('/rooms', { replace: true });
    }
  }, [user, navigate, showToast]);

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
      <Reveal>
        <Link
          to="/rooms"
          className="group inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-ink-muted transition-colors duration-150 ease-soft hover:text-brand"
        >
          <ArrowLeft
            size={16}
            className="transition-transform duration-150 ease-soft group-hover:-translate-x-0.5"
          />
          Back to Rooms
        </Link>
        <h1 className="mt-3 text-xl font-bold text-ink sm:text-2xl">Add Room</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Status is calculated automatically from the people count and the maintenance switch.
        </p>
      </Reveal>

      <Reveal>
      <section className="glass p-5 sm:p-6">
        <RoomForm
          errors={errors}
          submitting={submitting}
          submitLabel="Add room"
          onSubmit={handleSubmit}
          onCancel={() => navigate('/rooms')}
        />
      </section>
      </Reveal>

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
