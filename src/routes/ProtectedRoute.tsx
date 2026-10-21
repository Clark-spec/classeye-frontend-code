import { Loader2 } from 'lucide-react';
import { Navigate, Outlet } from 'react-router-dom';
import { LogoIcon } from '../components/LogoIcon';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <LogoIcon size={56} className="h-14 w-14" />
        <Loader2 size={24} className="animate-spin text-brand" />
        <p className="text-sm text-ink-muted">Checking your session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
