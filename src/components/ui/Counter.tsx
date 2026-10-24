import { useEffect, useRef } from 'react';
import { animate, useInView } from 'framer-motion';
import { formatNumber } from '../../lib/typography';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface Props {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
  /** Анимировать от предыдущего значения (для переключателя тарифов), а не от нуля. */
  fromPrevious?: boolean;
}

/** Число, которое «набегает», когда попадает в экран. Пишет в DOM напрямую — без перерисовок. */
export function Counter({ value, decimals = 0, duration = 1.8, className, fromPrevious }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const reduced = useReducedMotion();
  const current = useRef(fromPrevious ? value : 0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      el.textContent = formatNumber(value, decimals);
      current.current = value;
      return;
    }
    if (!inView) return;
    const controls = animate(current.current, value, {
      duration: fromPrevious ? 0.7 : duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        current.current = v;
        el.textContent = formatNumber(v, decimals);
      },
    });
    return () => controls.stop();
  }, [inView, value, decimals, duration, reduced, fromPrevious]);

  return (
    <span ref={ref} className={`tabular-nums ${className ?? ''}`}>
      {formatNumber(fromPrevious ? value : 0, decimals)}
    </span>
  );
}
