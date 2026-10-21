import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, HelpCircle, Loader2, X } from 'lucide-react';
import { useEffect } from 'react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, loading, onCancel]);

  const Icon = danger ? AlertTriangle : HelpCircle;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !loading) {
              onCancel();
            }
          }}
        >
          <motion.div
            className="glass-strong w-full max-w-md p-5 sm:p-6"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  danger ? 'bg-danger-light text-danger' : 'bg-brand-light text-brand-dark'
                }`}
              >
                <Icon size={22} />
              </div>
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="rounded-lg p-1 text-ink-muted transition hover:bg-white/60 hover:text-ink disabled:cursor-not-allowed"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <h2 className="mt-4 text-lg font-semibold text-ink">{title}</h2>
            <p className="mt-2 text-sm text-ink-muted">{message}</p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <motion.button
                type="button"
                onClick={onCancel}
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="rounded-xl border border-white/70 bg-white/70 px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelLabel}
              </motion.button>
              <motion.button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  danger ? 'bg-danger hover:bg-danger/90' : 'bg-brand hover:bg-brand-dark'
                }`}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {confirmLabel}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
