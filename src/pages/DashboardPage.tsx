import { AlertTriangle, Building2, DoorOpen, Users } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchDashboard } from '../api/dashboard';
import { getApiErrorMessage } from '../api/client';
import { RoomListItem } from '../components/RoomListItem';
import { SearchInput } from '../components/SearchInput';
import { Skeleton } from '../components/Skeleton';
import { Stagger, StaggerItem } from '../components/Stagger';
import { StatCard } from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import type { DashboardData } from '../types';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setData(await fetchDashboard());
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load the dashboard.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = search.trim();
    navigate(term ? `/rooms?search=${encodeURIComponent(term)}` : '/rooms');
  }

  const today = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-5">
      <section className="glass p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-brand">{today}</p>
            <h1 className="mt-1 text-xl font-bold text-ink sm:text-2xl">
              Welcome back, {user?.name ?? 'Staff'}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
              <span>Staff ID: {user?.staff_id}</span>
              <span className="inline-flex items-center gap-1.5">
                <Building2 size={15} aria-hidden="true" />
                Main Building
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-brand-light/70 px-4 py-3 text-sm text-brand-dark">
            <p className="font-semibold">Classroom monitoring</p>
            <p className="mt-0.5">Check room occupancy and alerts at a glance.</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mt-5 flex flex-col gap-2 sm:flex-row">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search rooms by name or building"
            className="flex-1"
          />
          <button
            type="submit"
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Search
          </button>
        </form>
      </section>

      <Stagger className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StaggerItem className="h-full">
          <StatCard
            label="Rooms total"
            value={data?.stats.total ?? 0}
            icon={Building2}
            to="/rooms"
            tone="teal"
            loading={loading}
          />
        </StaggerItem>
        <StaggerItem className="h-full">
          <StatCard
            label="Occupied"
            value={data?.stats.occupied ?? 0}
            icon={Users}
            to="/rooms?status=occupied"
            tone="amber"
            loading={loading}
          />
        </StaggerItem>
        <StaggerItem className="h-full">
          <StatCard
            label="Empty"
            value={data?.stats.empty ?? 0}
            icon={DoorOpen}
            to="/rooms?status=empty"
            tone="green"
            loading={loading}
          />
        </StaggerItem>
        <StaggerItem className="h-full">
          <StatCard
            label="Alerts"
            value={data?.stats.alerts ?? 0}
            icon={AlertTriangle}
            to="/alerts"
            tone="red"
            loading={loading}
            wiggle={!loading && (data?.stats.alerts ?? 0) > 0}
          />
        </StaggerItem>
      </Stagger>

      <section className="glass p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-ink">Room Status</h2>
            <p className="mt-0.5 text-sm text-ink-muted">A quick look at the latest rooms</p>
          </div>
          <Link
            to="/rooms"
            className="text-sm font-semibold text-brand transition hover:text-brand-dark"
          >
            View all
          </Link>
        </div>

        <div className="mt-4">
          {loading && (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-[4.25rem] w-full rounded-xl" />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl bg-danger-light px-4 py-4 text-center">
              <p className="flex items-center justify-center gap-2 text-sm text-danger">
                <AlertTriangle size={16} aria-hidden="true" />
                {error}
              </p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-3 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && data && data.recent_rooms.length > 0 && (
            <Stagger className="space-y-2">
              {data.recent_rooms.map((room) => (
                <StaggerItem key={room.id}>
                  <RoomListItem room={room} />
                </StaggerItem>
              ))}
            </Stagger>
          )}

          {!loading && !error && data && data.recent_rooms.length === 0 && (
            <p className="rounded-xl bg-white/50 px-4 py-6 text-center text-sm text-ink-muted">
              No rooms have been added yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
