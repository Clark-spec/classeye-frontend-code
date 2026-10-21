import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client';
import { LogoIcon } from '../components/LogoIcon';
import { PasswordInput } from '../components/PasswordInput';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion() ?? false;
  const shakeControls = useAnimationControls();
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(staffId.trim(), password);
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to sign in.'));

      if (!reducedMotion) {
        void shakeControls.start({
          x: [0, -10, 10, -6, 6, 0],
          transition: { duration: 0.4, ease: 'easeInOut' },
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={28} className="animate-spin text-brand" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 140, damping: 18 }}
        >
          <motion.div animate={shakeControls} className="glass-strong p-6 sm:p-8">
            <div className="flex flex-col items-center text-center">
              <LogoIcon
                size={96}
                track
                className="h-24 w-24 drop-shadow-[0_12px_20px_rgba(11,111,107,0.22)]"
              />
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">Class Eye</h1>
              <p className="mt-1 text-sm text-ink-muted">
                Classroom monitoring for school spaces
              </p>
            </div>

            <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="staff-id" className="mb-1.5 block text-sm font-medium text-ink">
                  Staff ID
                </label>
                <input
                  id="staff-id"
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  value={staffId}
                  onChange={(event) => setStaffId(event.target.value)}
                  placeholder="e.g. T-20418"
                  className="w-full rounded-xl border border-brand-light bg-white px-3 py-2.5 text-sm text-ink transition-shadow placeholder:text-ink-muted/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 focus:shadow-[0_0_0_4px_rgba(11,111,107,0.12)]"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
                  Password
                </label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={setPassword}
                  autoComplete="current-password"
                />
              </div>

              <AnimatePresence initial={false}>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-xl bg-danger-light px-3 py-2.5 text-sm text-danger"
                    role="alert"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={reducedMotion ? undefined : { y: -1 }}
                whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(11,111,107,0.22)] transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting ? 'Signing in...' : 'Sign in'}
              </motion.button>
            </form>

            <p className="mt-5 text-center text-sm text-ink-muted">
              <Link
                to="/forgot-password"
                className="font-semibold text-brand transition hover:text-brand-dark"
              >
                Forgot password?
              </Link>
            </p>
          </motion.div>
        </motion.div>

        <div className="mt-4 rounded-xl bg-brand-light/70 px-4 py-3 text-center text-sm text-brand-dark">
          Demo: <span className="font-semibold">T-20418</span> /{' '}
          <span className="font-semibold">password</span>
        </div>
      </div>
    </div>
  );
}
