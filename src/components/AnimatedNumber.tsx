import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { useCountUp } from '../hooks/useCountUp';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
}

export function AnimatedNumber({ value, duration = 650, className = '' }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const current = useCountUp(inView ? value : 0, duration);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {Math.round(current)}
    </span>
  );
}
