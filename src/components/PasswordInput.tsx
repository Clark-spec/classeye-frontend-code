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
        className={`field pr-11 ${hasError ? 'field-error' : ''}`}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-muted transition-colors duration-150 ease-soft hover:bg-brand-light/70 hover:text-brand-dark"
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
