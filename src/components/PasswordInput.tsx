import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface PasswordInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  hasError?: boolean;
}

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder = 'Enter your password',
  autoComplete = 'current-password',
  hasError = false,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full rounded-xl border bg-white px-3 py-2.5 pr-11 text-sm text-ink transition-shadow placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 ${
          hasError
            ? 'border-danger focus:border-danger focus:ring-danger/20 focus:shadow-[0_0_0_4px_rgba(180,35,24,0.1)]'
            : 'border-brand-light focus:border-brand focus:ring-brand/20 focus:shadow-[0_0_0_4px_rgba(11,111,107,0.12)]'
        }`}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-muted transition hover:bg-brand-surface hover:text-ink"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={visible ? 'hide' : 'show'}
            initial={{ opacity: 0, rotate: -20, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 20, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="block"
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  );
}
