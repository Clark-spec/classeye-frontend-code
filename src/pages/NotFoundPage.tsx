import { Link } from 'react-router-dom';
import { LogoIcon } from '../components/LogoIcon';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <LogoIcon size={56} className="h-14 w-14" />
      <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-brand">404</p>
      <h1 className="mt-1 text-2xl font-bold text-ink">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
