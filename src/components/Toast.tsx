import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: ToastItem;
  onClose: (id: number) => void;
  duration?: number;
}

export const TOAST_DURATION = 4200;

const tones: Record<ToastType, { container: string; icon: string; bar: string }> = {
  success: { container: 'border-empty-text/25', icon: 'text-empty-text', bar: 'bg-empty-text' },
  error: { container: 'border-danger/25', icon: 'text-danger', bar: 'bg-danger' },
  info: { container: 'border-brand/25', icon: 'text-brand', bar: 'bg-brand' },
};

export function Toast({ toast, onClose, duration = TOAST_DURATION }: ToastProps) {
  const tone = tones[toast.type];
  const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertCircle : Info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24, y: -10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 24, y: -6 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className={`glass-strong pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden px-4 py-3 ${tone.container}`}
      role="status"
      aria-live="polite"
    >
      <Icon size={20} className={`mt-0.5 shrink-0 ${tone.icon}`} />
      <p className="flex-1 text-sm font-medium text-ink">{toast.message}</p>
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        className="rounded-lg p-0.5 text-ink-muted transition hover:bg-white/60 hover:text-ink"
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
      <motion.span
        className={`absolute inset-x-0 bottom-0 h-0.5 origin-left ${tone.bar}`}
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        aria-hidden="true"
      />
    </motion.div>
  );
}
