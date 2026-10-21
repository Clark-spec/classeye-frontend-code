import { motion } from 'framer-motion';
import { ChevronDown, LogOut, Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { fetchAlerts } from '../api/dashboard';
import { useAuth } from '../context/AuthContext';
import { ConfirmModal } from './ConfirmModal';
import { LogoIcon } from './LogoIcon';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/rooms', label: 'Rooms' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/alerts', label: 'Alerts' },
];

function AlertBadge({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return (
    <span className="relative inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-danger px-1.5 py-0.5 text-xs font-bold leading-none text-white">
      <span className="absolute inset-0 animate-pulse-dot rounded-full bg-danger" aria-hidden="true" />
      <span className="relative z-10">{count}</span>
    </span>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [alertCount, setAlertCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;

    fetchAlerts()
      .then((alerts) => {
        if (active) {
          setAlertCount(alerts.length);
        }
      })
      .catch(() => {
        if (active) {
          setAlertCount(0);
        }
      });

    return () => {
      active = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function requestLogout() {
    setUserMenuOpen(false);
    setMobileOpen(false);
    setLogoutOpen(true);
  }

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await logout();
      setLogoutOpen(false);
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  const roleLabel = user?.role === 'admin' ? 'Administrator' : 'Teacher';

  return (
    <>
      <header className="glass-nav sticky top-0 z-40 transition-shadow">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="Class Eye home">
          <LogoIcon
            size={40}
            blinkOnHover
            className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
          />
          <span className="truncate text-lg font-bold tracking-tight text-ink">Class Eye</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'text-brand-dark'
                    : 'text-ink-muted hover:bg-white/40 hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {link.to === '/alerts' && <AlertBadge count={alertCount} />}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-brand"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="relative hidden md:block" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((current) => !current)}
              aria-expanded={userMenuOpen}
              className="flex items-center gap-2 rounded-full border border-white/60 bg-white/80 py-1.5 pl-1.5 pr-3 transition hover:bg-white"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                {user?.name.charAt(0).toUpperCase() ?? '?'}
              </span>
              <span className="max-w-[9rem] truncate text-sm font-medium text-ink">
                {user?.name ?? 'Staff'}
              </span>
              <ChevronDown size={16} className="text-ink-muted" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-brand-light bg-white p-2 shadow-card">
                <div className="rounded-lg bg-brand-surface px-3 py-2.5">
                  <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
                  <p className="mt-0.5 text-sm text-ink-muted">Staff ID: {user?.staff_id}</p>
                  <p className="mt-0.5 text-sm text-ink-muted">{roleLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={requestLogout}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-danger transition hover:bg-danger-light"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
            className="rounded-lg p-2 text-ink transition hover:bg-brand-surface md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-brand-light bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-light text-brand-dark'
                      : 'text-ink-muted hover:bg-brand-surface hover:text-ink'
                  }`
                }
              >
                {link.label}
                {link.to === '/alerts' && <AlertBadge count={alertCount} />}
              </NavLink>
            ))}
          </nav>

          <div className="mt-3 rounded-xl bg-brand-surface px-3 py-3">
            <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
            <p className="mt-0.5 text-sm text-ink-muted">
              Staff ID: {user?.staff_id} · {roleLabel}
            </p>
            <button
              type="button"
              onClick={requestLogout}
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-danger-light px-3 py-2 text-sm font-semibold text-danger"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      )}

      </header>

      <ConfirmModal
        open={logoutOpen}
        title="Log out"
        message="Are you sure you want to log out of Class Eye?"
        confirmLabel="Log out"
        loading={loggingOut}
        danger={false}
        onConfirm={() => void handleLogout()}
        onCancel={() => {
          if (!loggingOut) {
            setLogoutOpen(false);
          }
        }}
      />
    </>
  );
}
