interface AppBackgroundProps {
  className?: string;
}

export function AppBackground({ className = '' }: AppBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-brand-bg ${className}`}
    >
      <div
        className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-teal-400/30 blur-3xl animate-float will-change-transform sm:-left-32 sm:-top-32 sm:h-96 sm:w-96"
        style={{ animationDelay: '0s' }}
      />
      <div
        className="absolute -right-20 top-1/3 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl animate-float will-change-transform sm:-right-32 sm:h-96 sm:w-96"
        style={{ animationDelay: '-6s' }}
      />
      <div
        className="absolute -bottom-24 left-1/2 -ml-36 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl animate-float will-change-transform sm:-bottom-32 sm:-ml-48 sm:h-96 sm:w-96"
        style={{ animationDelay: '-12s' }}
      />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: 'radial-gradient(rgba(11, 111, 107, 0.9) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
}
