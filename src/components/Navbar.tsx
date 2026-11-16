import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, LogOut, Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { fetchAlerts } from '../api/dashboard';
import { useAuth } from '../context/AuthContext';
import { springPanel, springSnap } from '../lib/motion';
import { AnimatedNumber } from './AnimatedNumber';
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
      <span className="relative z-10">
        <AnimatedNumber value={count} duration={500} />
      </span>
    </span>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const reducedMotion = useReducedMotion() ?? false;
  const [alertCount, setAlertCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);

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
    function handleScroll() {
      setScrolled(window.scrollY > 8);
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }

      if (headerRef.current && !headerRef.current.contains(target)) {
        setMobileOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
        setMobileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
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
      <header
        ref={headerRef}
        className="sticky top-0 z-40 px-3 pt-3 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-5 before:bg-gradient-to-b before:from-brand-bg/80 before:to-transparent before:content-[''] sm:px-6 sm:pt-4 lg:px-8"
      >
        <div
          className={`glass-nav mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-3 transition-shadow duration-300 ease-soft sm:px-4 ${
            scrolled
              ? 'shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_1px_2px_rgba(11,111,107,0.06),0_22px_46px_-24px_rgba(11,111,107,0.55)]'
              : ''
          }`}
        >
          <Link
            to="/"
            className="group flex min-w-0 items-center gap-2.5 rounded-xl transition-opacity duration-200 ease-soft hover:opacity-90"
            aria-label="Class Eye home"
          >
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
                  `relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ease-soft ${
                    isActive
                      ? 'text-brand-dark'
                      : 'text-ink-muted hover:bg-brand-light/60 hover:text-brand-dark'
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
                        transition={springSnap}
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
                className="flex items-center gap-2 rounded-full border border-white/60 bg-white/80 py-1.5 pl-1.5 pr-3 transition-[background-color,border-color,box-shadow] duration-200 ease-soft hover:border-brand/20 hover:bg-white hover:shadow-sm"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                  {user?.name.charAt(0).toUpperCase() ?? '?'}
                </span>
                <span className="max-w-[9rem] truncate text-sm font-medium text-ink">
                  {user?.name ?? 'Staff'}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-ink-muted transition-transform duration-200 ease-soft ${
                    userMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {userMenuOpen && (
                <div className="glass-strong absolute right-0 mt-2 w-64 animate-fade-up p-2">
                  <div className="rounded-lg bg-brand-surface px-3 py-2.5">
                    <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
                    <p className="mt-0.5 text-sm text-ink-muted">Staff ID: {user?.staff_id}</p>
                    <p className="mt-0.5 text-sm text-ink-muted">{roleLabel}</p>
                  </div>
                  <button
                    type="button"
                    onClick={requestLogout}
                    className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-danger transition-colors duration-150 ease-soft hover:bg-danger-light"
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
              className="rounded-lg p-2 text-ink transition-colors duration-200 ease-soft hover:bg-brand-light/70 hover:text-brand-dark md:hidden"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls={mobileOpen ? 'mobile-nav' : undefined}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
            transition={reducedMotion ? { duration: 0 } : springPanel}
            className="absolute inset-x-3 top-full mt-2 origin-top sm:inset-x-6 lg:inset-x-8 md:hidden"
          >
            <div id="mobile-nav" className="glass-strong mx-auto max-w-7xl p-2">
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ease-soft ${
                        isActive
                          ? 'bg-brand-light text-brand-dark'
                          : 'text-ink-muted hover:bg-brand-light/60 hover:text-brand-dark'
                      }`
                    }
                  >
                    {link.label}
                    {link.to === '/alerts' && <AlertBadge count={alertCount} />}
                  </NavLink>
                ))}
              </nav>

              <div className="mt-2 rounded-xl bg-brand-surface px-3 py-3">
                <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
                <p className="mt-0.5 text-sm text-ink-muted">
                  Staff ID: {user?.staff_id} Â· {roleLabel}
                </p>
                <button
                  type="button"
                  onClick={requestLogout}
                  className="mt-2 inline-flex items-center gap-2 rounded-lg bg-danger-light px-3 py-2 text-sm font-semibold text-danger transition-colors duration-150 ease-soft hover:bg-danger/10"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
