import { useCountUp } from '../hooks/useCountUp';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
}

export function AnimatedNumber({ value, duration = 800, className = '' }: AnimatedNumberProps) {
  const current = useCountUp(value, duration);

  return <span className={`tabular-nums ${className}`}>{Math.round(current)}</span>;
}
