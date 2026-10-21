import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { resetPasswordRequest } from '../api/auth';
import { getApiErrorMessage, getApiFieldErrors } from '../api/client';
import { ConfirmModal } from '../components/ConfirmModal';
import { LogoIcon } from '../components/LogoIcon';
import { PasswordInput } from '../components/PasswordInput';
import { useToast } from '../context/ToastContext';

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) {
    return null;
  }

  return (
    <p className="mt-1 flex items-center gap-1 text-sm text-danger">
      <AlertCircle size={14} aria-hidden="true" />
      {messages[0]}
    </p>
  );
}

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const reducedMotion = useReducedMotion() ?? false;
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setErrors({});

    if (!name.trim()) {
      setErrors({ name: ['Full name is required.'] });
      return;
    }

    if (password.length < 8) {
      setErrors({ password: ['Password must be at least 8 characters.'] });
      return;
    }

    if (password !== passwordConfirmation) {
      setErrors({ password_confirmation: ['Passwords do not match.'] });
      return;
    }

    setConfirming(true);
  }

  async function confirmReset() {
    setSubmitting(true);
    setError(null);
    setErrors({});

    try {
      await resetPasswordRequest({
        name: name.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });
      showToast('Password reset successfully. Sign in with your new password.', 'success');
      navigate('/login', { replace: true });
    } catch (requestError) {
      setErrors(getApiFieldErrors(requestError));
      setError(getApiErrorMessage(requestError, 'Unable to reset your password.'));
      setConfirming(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          to="/login"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-brand"
        >
          <ArrowLeft size={16} />
          Back to sign in
        </Link>

        <motion.div
          initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 140, damping: 18 }}
        >
          <div className="glass-strong p-6 sm:p-8">
            <div className="flex flex-col items-center text-center">
              <LogoIcon
                size={80}
                track
                className="h-20 w-20 drop-shadow-[0_12px_20px_rgba(11,111,107,0.22)]"
              />
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">Reset password</h1>
              <p className="mt-1 text-sm text-ink-muted">
                Enter your full name and choose a new password.
              </p>
            </div>

            <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="full-name" className="mb-1.5 block text-sm font-medium text-ink">
                  Full name
                </label>
                <input
                  id="full-name"
                  type="text"
                  required
                  autoFocus
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Ms. Reyes"
                  className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-ink transition-shadow placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 ${
                    errors.name
                      ? 'border-danger focus:border-danger focus:ring-danger/20 focus:shadow-[0_0_0_4px_rgba(180,35,24,0.1)]'
                      : 'border-brand-light focus:border-brand focus:ring-brand/20 focus:shadow-[0_0_0_4px_rgba(11,111,107,0.12)]'
                  }`}
                />
                <FieldError messages={errors.name} />
              </div>

              <div>
                <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-ink">
                  New password
                </label>
                <PasswordInput
                  id="new-password"
                  value={password}
                  onChange={setPassword}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  hasError={Boolean(errors.password)}
                />
                <p className="mt-1 text-xs text-ink-muted">Use at least 8 characters.</p>
                <FieldError messages={errors.password} />
              </div>

              <div>
                <label
                  htmlFor="confirm-new-password"
                  className="mb-1.5 block text-sm font-medium text-ink"
                >
                  Confirm new password
                </label>
                <PasswordInput
                  id="confirm-new-password"
                  value={passwordConfirmation}
                  onChange={setPasswordConfirmation}
                  placeholder="Re-enter the new password"
                  autoComplete="new-password"
                  hasError={Boolean(errors.password_confirmation)}
                />
                <FieldError messages={errors.password_confirmation} />
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
                <KeyRound size={16} />
                Continue
              </motion.button>
            </form>

            <p className="mt-5 text-center text-xs text-ink-muted">
              This form is for teacher accounts. Admins should contact the system administrator.
            </p>
          </div>
        </motion.div>

        <ConfirmModal
          open={confirming}
          title="Reset password?"
          message={`Reset the password for ${name.trim() || 'this teacher'}? All active sessions for this account will be signed out.`}
          confirmLabel="Reset password"
          loading={submitting}
          danger={false}
          onConfirm={() => void confirmReset()}
          onCancel={() => {
            if (!submitting) {
              setConfirming(false);
            }
          }}
        />
      </div>
    </div>
  );
}
