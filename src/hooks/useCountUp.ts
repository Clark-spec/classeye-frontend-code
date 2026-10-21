import { useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export function useCountUp(target: number, duration = 800): number {
  const reducedMotion = useReducedMotion() ?? false;
  const [value, setValue] = useState(0);
  const currentRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (reducedMotion) {
      currentRef.current = target;
      setValue(target);
      return;
    }

    const from = currentRef.current;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = from + (target - from) * eased;

      currentRef.current = next;
      setValue(next);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        currentRef.current = target;
        setValue(target);
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [target, duration, reducedMotion]);

  return value;
}
