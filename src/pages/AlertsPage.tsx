import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAlerts } from '../api/dashboard';
import { getApiErrorMessage } from '../api/client';
import { CapacityBar } from '../components/CapacityBar';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { Stagger, StaggerItem } from '../components/Stagger';
import type { Alert } from '../types';

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setAlerts(await fetchAlerts());
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load alerts.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-ink sm:text-2xl">Alerts</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Rooms that currently have more people than their capacity.
        </p>
      </div>

      {loading && (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1].map((item) => (
            <Skeleton key={item} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="glass px-5 py-8 text-center">
          <p className="text-sm text-danger">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-4 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && alerts.length === 0 && (
        <EmptyState
          icon={ShieldCheck}
          title="No alerts"
          message="No alerts. All rooms are within capacity."
        />
      )}

      {!loading && !error && alerts.length > 0 && (
        <Stagger className="grid gap-4 lg:grid-cols-2">
          {alerts.map((alert) => (
            <StaggerItem key={alert.id}>
              <article className="glass p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-danger-light text-danger">
                      <AlertTriangle size={22} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-ink">{alert.name}</h2>
                      <p className="mt-0.5 text-sm text-ink-muted">{alert.message}</p>
                      <p className="mt-1 text-sm text-ink-muted">
                        Floor {alert.floor} · {alert.building}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    <span className="rounded-full bg-danger-light px-2.5 py-1 text-xs font-semibold text-danger">
                      {alert.people_count} / {alert.capacity}
                    </span>
                    <Link
                      to={`/rooms/${alert.id}`}
                      className="rounded-xl border border-brand px-3 py-2 text-sm font-semibold text-brand transition hover:bg-brand-light"
                    >
                      View room
                    </Link>
                  </div>
                </div>

                <div className="mt-4">
                  <CapacityBar
                    people={alert.people_count}
                    capacity={alert.capacity}
                    showLabel={false}
                  />
                </div>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
