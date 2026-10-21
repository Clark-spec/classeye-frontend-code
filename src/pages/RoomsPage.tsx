import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchRooms } from '../api/rooms';
import { getApiErrorMessage } from '../api/client';
import { EmptyState } from '../components/EmptyState';
import { FilterChips, type FilterOption } from '../components/FilterChips';
import { RoomListItem } from '../components/RoomListItem';
import { SearchInput } from '../components/SearchInput';
import { Skeleton } from '../components/Skeleton';
import { staggerContainer, staggerItem } from '../components/Stagger';
import type { Room, RoomStatus } from '../types';

const statusOptions: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'empty', label: 'Empty' },
  { value: 'maintenance', label: 'Maintenance' },
];

const floorOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function RoomsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = searchParams.get('search') ?? '';

  const statusParam = searchParams.get('status');
  const status: RoomStatus | 'all' =
    statusParam === 'occupied' || statusParam === 'empty' || statusParam === 'maintenance'
      ? statusParam
      : 'all';

  const floorValue = Number(searchParams.get('floor'));
  const floor = Number.isInteger(floorValue) && floorValue > 0 ? floorValue : undefined;
  const floorParam = floor ? String(floor) : '';

  const [search, setSearch] = useState(searchParam);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setSearch((current) => (current === searchParam ? current : searchParam));
  }, [searchParam]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = search.trim();
      if (trimmed === searchParam) {
        return;
      }

      const next = new URLSearchParams(searchParams);
      if (trimmed) {
        next.set('search', trimmed);
      } else {
        next.delete('search');
      }
      setSearchParams(next, { replace: true });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search, searchParam, searchParams, setSearchParams]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetchRooms({ search: searchParam || undefined, status, floor })
      .then((result) => {
        if (active) {
          setRooms(result);
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(getApiErrorMessage(requestError, 'Unable to load rooms.'));
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
  }, [searchParam, status, floor, reloadKey]);

  function updateParam(key: 'status' | 'floor', value: string) {
    const next = new URLSearchParams(searchParams);

    if (value && value !== 'all') {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    const trimmed = search.trim();
    if (trimmed) {
      next.set('search', trimmed);
    } else {
      next.delete('search');
    }

    setSearchParams(next, { replace: true });
  }

  const roomLabel = rooms.length === 1 ? 'room' : 'rooms';

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink sm:text-2xl">Rooms</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {loading ? 'Loading rooms...' : `${rooms.length} ${roomLabel} found`}
          </p>
        </div>
        <Link
          to="/rooms/new"
          className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-dark"
        >
          <span
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
            aria-hidden="true"
          />
          <Plus size={18} className="relative" />
          <span className="relative">Add Room</span>
        </Link>
      </div>

      <section className="glass p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search rooms by name or building"
            className="lg:flex-1"
          />
          <select
            value={floorParam}
            onChange={(event) => updateParam('floor', event.target.value)}
            aria-label="Filter by floor"
            className="rounded-xl border border-brand-light bg-white px-3 py-2.5 text-sm text-ink transition-shadow focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 focus:shadow-[0_0_0_4px_rgba(11,111,107,0.12)] lg:w-44"
          >
            <option value="">All floors</option>
            {floorOptions.map((option) => (
              <option key={option} value={option}>
                Floor {option}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <FilterChips
            options={statusOptions}
            value={status}
            onChange={(value) => updateParam('status', value)}
          />
        </div>
      </section>

      {loading && (
        <div className="grid gap-2 lg:grid-cols-2">
          {[0, 1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-[4.25rem] w-full rounded-xl" />
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

      {!loading && !error && rooms.length === 0 && (
        <EmptyState
          icon={Building2}
          title="No rooms found"
          message="Try a different search or filter, or add a new room to get started."
          action={
            <Link
              to="/rooms/new"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              <Plus size={18} />
              Add Room
            </Link>
          }
        />
      )}

      {!loading && !error && rooms.length > 0 && (
        <motion.div
          className="grid gap-2 lg:grid-cols-2"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence initial={false}>
            {rooms.map((room) => (
              <motion.div
                key={room.id}
                layout
                variants={staggerItem}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.2 } }}
              >
                <RoomListItem room={room} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
