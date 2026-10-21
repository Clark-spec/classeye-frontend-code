import { useAnimationControls, useReducedMotion } from 'framer-motion';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useId, useState } from 'react';

interface LogoIconProps {
  size?: number;
  track?: boolean;
  blinkOnHover?: boolean;
  className?: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function LogoIcon({
  size = 48,
  track = false,
  blinkOnHover = false,
  className = '',
}: LogoIconProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const gradientId = `ce-bg-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const blinkControls = useAnimationControls();
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const blink = useCallback(() => {
    if (reducedMotion) {
      return;
    }

    void blinkControls.start({
      scaleY: [1, 0.1, 1],
      transition: { duration: 0.16, ease: 'easeInOut' },
    });
  }, [blinkControls, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    let timer = 0;

    const schedule = () => {
      timer = window.setTimeout(() => {
        blink();
        schedule();
      }, 4000 + Math.random() * 3000);
    };

    schedule();

    return () => window.clearTimeout(timer);
  }, [blink, reducedMotion]);

  useEffect(() => {
    if (!track || reducedMotion) {
      setOffset({ x: 0, y: 0 });
      return;
    }

    const update = (clientX: number, clientY: number) => {
      const normalizedX = (clientX / window.innerWidth - 0.5) * 2;
      const normalizedY = (clientY / window.innerHeight - 0.5) * 2;

      setOffset({
        x: clamp(normalizedX * 40, -40, 40),
        y: clamp(normalizedY * 10, -10, 10),
      });
    };

    const handleMouseMove = (event: MouseEvent) => update(event.clientX, event.clientY);
    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) {
        update(touch.clientX, touch.clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [track, reducedMotion]);

  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      role="img"
      aria-label="Class Eye"
      className={className}
      onMouseEnter={() => {
        if (blinkOnHover && !track) {
          blink();
        }
      }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#14908A" />
          <stop offset="1" stopColor="#07524F" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill={`url(#${gradientId})`} />
      <g
        fill="none"
        stroke="#fff"
        strokeOpacity=".55"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M92 156V116Q92 92 116 92H156" />
        <path d="M356 92H396Q420 92 420 116V156" />
        <path d="M420 356V396Q420 420 396 420H356" />
        <path d="M156 420H116Q92 420 92 396V356" />
      </g>

      <motion.g
        animate={blinkControls}
        style={{ transformOrigin: '256px 256px', transformBox: 'view-box' }}
      >
        <path d="M110 256Q256 118 402 256Q256 394 110 256Z" fill="#fff" />
        <g
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px)`,
            transition: reducedMotion ? undefined : 'transform 0.15s ease-out',
          }}
        >
          <circle cx="256" cy="256" r="60" fill="#0B6F6B" />
          <g fill="#D9EBE8">
            <rect x="222" y="222" width="30" height="30" rx="7" />
            <rect x="222" y="260" width="30" height="30" rx="7" />
            <rect x="260" y="260" width="30" height="30" rx="7" />
          </g>
          <rect x="260" y="222" width="30" height="30" rx="7" fill="#F5B93A" />
        </g>
      </motion.g>
    </svg>
  );
}
