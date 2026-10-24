import { useMemo, type CSSProperties } from 'react';
import { mulberry32 } from '../../lib/math';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface Props {
  count?: number;
  className?: string;
}

/** Падающие лепестки; цвет берётся из CSS-переменной --season-petal, форма меняется вместе с ней. */
export function Petals({ count = 22, className = '' }: Props) {
  const reduced = useReducedMotion();
  const petals = useMemo(() => {
    const rand = mulberry32(31);
    return Array.from({ length: count }, (_, i) => ({
      left: rand() * 100,
      size: 10 + rand() * 16,
      duration: 9 + rand() * 9,
      delay: -rand() * 18,
      drift: (rand() - 0.5) * 220,
      rot: 360 + rand() * 540,
      sway: 3 + rand() * 3,
      shape: i % 3,
      opacity: 0.55 + rand() * 0.45,
    }));
  }, [count]);

  if (reduced) return null;

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {petals.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 block"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.size * (p.shape === 2 ? 1 : 0.62),
              opacity: p.opacity,
              animation: `petal-fall ${p.duration}s linear ${p.delay}s infinite, petal-sway ${p.sway}s ease-in-out ${p.delay}s infinite`,
              '--petal-drift': `${p.drift}px`,
              '--petal-rot': `${p.rot}deg`,
            } as CSSProperties
          }
        >
          <svg viewBox="0 0 20 14" width="100%" height="100%" style={{ overflow: 'visible' }}>
            {p.shape === 2 ? (
              <path
                d="M10 0 C 13 3, 18 3, 20 7 C 16 8, 15 12, 10 14 C 5 12, 4 8, 0 7 C 2 3, 7 3, 10 0 Z"
                fill="var(--season-petal)"
              />
            ) : (
              <path
                d="M0 7 C 4 0, 14 -1, 20 7 C 14 15, 4 14, 0 7 Z"
                fill="var(--season-petal)"
                style={{ filter: 'brightness(1.08)' }}
              />
            )}
            <path d="M2 7 C 8 6, 13 6.5, 18 7" stroke="#fff" strokeOpacity="0.5" strokeWidth="0.8" fill="none" />
          </svg>
        </span>
      ))}
    </div>
  );
}
