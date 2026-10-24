import { useEffect, useRef } from 'react';
import { ru } from '../../content/ru';
import { useScrollProgress } from '../../hooks/useScrollProgress';

const VINE_PATH =
  'M20 0 C 34 50, 6 100, 20 150 S 34 250, 20 300 S 6 400, 20 450 S 34 550, 20 600';
const LEAVES = [
  { at: 0.12, side: 1 },
  { at: 0.3, side: -1 },
  { at: 0.48, side: 1 },
  { at: 0.66, side: -1 },
  { at: 0.84, side: 1 },
] as const;

/** Прогресс скролла: лоза прорастает вдоль левого края, листья распускаются по пути. */
export function ScrollProgress() {
  const path = useRef<SVGPathElement>(null);
  const leaves = useRef<(SVGGElement | null)[]>([]);
  const tip = useRef<SVGGElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const meter = useRef<HTMLDivElement>(null);
  const length = useRef(0);
  const leafPoints = useRef<{ x: number; y: number }[]>([]);

  useEffect(() => {
    const p = path.current;
    if (!p) return;
    length.current = p.getTotalLength();
    p.style.strokeDasharray = `${length.current}`;
    p.style.strokeDashoffset = `${length.current}`;
    leafPoints.current = LEAVES.map((l) => {
      const pt = p.getPointAtLength(length.current * l.at);
      return { x: pt.x, y: pt.y };
    });
    leaves.current.forEach((g, i) => {
      const pt = leafPoints.current[i];
      if (g && pt) g.setAttribute('transform', `translate(${pt.x} ${pt.y}) scale(0)`);
    });
  }, []);

  useScrollProgress(({ progress }) => {
    const p = path.current;
    if (bar.current) bar.current.style.transform = `scaleX(${progress})`;
    meter.current?.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
    if (!p || !length.current) return;
    p.style.strokeDashoffset = `${length.current * (1 - progress)}`;
    leaves.current.forEach((g, i) => {
      const pt = leafPoints.current[i];
      if (!g || !pt) return;
      const s = Math.min(1, Math.max(0, (progress - LEAVES[i].at) * 12));
      g.setAttribute('transform', `translate(${pt.x} ${pt.y}) rotate(${LEAVES[i].side * 40}) scale(${s})`);
    });
    const tipPt = p.getPointAtLength(length.current * progress);
    tip.current?.setAttribute('transform', `translate(${tipPt.x} ${tipPt.y})`);
  });

  return (
    <div
      ref={meter}
      role="progressbar"
      aria-label={ru.a11y.progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
    >
      {/* Мобильная версия — тонкая полоса сверху */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] lg:hidden" aria-hidden="true">
        <div
          ref={bar}
          className="h-full origin-left bg-[linear-gradient(90deg,#B7E26B,#3FA66B,#C9A7E8,#7B3FA0)]"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>
      <svg
        className="pointer-events-none fixed left-1.5 top-1/2 z-40 hidden h-[54vh] w-7 -translate-y-1/2 lg:block xl:left-3"
        viewBox="-10 -10 60 620"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="vine-progress" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#B7E26B" />
            <stop offset="0.5" stopColor="#3FA66B" />
            <stop offset="1" stopColor="#7B3FA0" />
          </linearGradient>
        </defs>
        <path d={VINE_PATH} fill="none" stroke="rgba(20,56,43,0.1)" strokeWidth="2" strokeLinecap="round" />
        <path ref={path} d={VINE_PATH} fill="none" stroke="url(#vine-progress)" strokeWidth="3" strokeLinecap="round" />
        {LEAVES.map((l, i) => (
          <g
            key={l.at}
            ref={(el) => {
              leaves.current[i] = el;
            }}
          >
            <path
              d="M0 0 C 6 -4, 16 -4, 20 0 C 16 4, 6 4, 0 0 Z"
              fill={i % 2 === 0 ? '#3FA66B' : '#B7E26B'}
              transform={`scale(${l.side} 1)`}
            />
          </g>
        ))}
        <g ref={tip}>
          <circle r="5" cx="-2" cy="4" fill="#7B3FA0" />
          <circle r="5" cx="5" cy="5" fill="#9B5CC4" />
          <circle r="4.5" cx="1.5" cy="11" fill="#7B3FA0" />
          <circle r="1.5" cx="-3.5" cy="2.5" fill="#fff" opacity="0.7" />
        </g>
      </svg>
    </div>
  );
}
