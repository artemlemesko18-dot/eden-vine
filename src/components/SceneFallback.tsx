import { ru } from '../content/ru';

/** Если WebGL недоступен: статичная CSS/SVG-сцена — небо, лучи и гроздь с бликами. */
export function SceneFallback() {
  const berries = [
    [0, 0], [1, 0], [2, 0], [3, 0],
    [0.5, 1], [1.5, 1], [2.5, 1],
    [1, 2], [2, 2],
    [1.5, 3],
  ];
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      role="img"
      aria-label={ru.a11y.sceneFallback}
      style={{
        background:
          'radial-gradient(60% 50% at 18% 12%, rgba(255,201,120,0.55) 0%, transparent 60%), radial-gradient(60% 60% at 90% 30%, rgba(201,167,232,0.45) 0%, transparent 65%), linear-gradient(180deg, #EDF2FB 0%, #FBF8F1 45%, #E2F4E7 100%)',
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="absolute -top-1/4 block h-[150%] origin-top"
          style={{
            left: `${8 + i * 14}%`,
            width: `${60 + i * 30}px`,
            background: 'linear-gradient(180deg, rgba(255,233,190,0.65), transparent 80%)',
            filter: 'blur(14px)',
            animation: `fallback-rays ${7 + i}s ease-in-out ${i * 0.8}s infinite`,
          }}
        />
      ))}
      <svg
        className="absolute left-1/2 top-1/2 h-[56vh] w-auto -translate-x-1/2 -translate-y-1/2"
        viewBox="0 0 220 300"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="fb-berry" cx="0.38" cy="0.32" r="0.7">
            <stop offset="0" stopColor="#F2FAD0" />
            <stop offset="0.45" stopColor="#B9E07A" />
            <stop offset="1" stopColor="#6FA844" />
          </radialGradient>
        </defs>
        <path d="M110 70 C 110 40, 116 22, 128 8" stroke="#7C8F3E" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M118 30 C 140 0, 196 6, 204 30 C 182 30, 172 46, 152 50 C 136 52, 124 44, 118 30 Z" fill="#3FA66B" />
        {berries.map(([x, y], i) => (
          <g key={i} transform={`translate(${40 + x * 46} ${92 + y * 48})`}>
            <circle r="27" fill="url(#fb-berry)" />
            <ellipse cx="-9" cy="-10" rx="7" ry="5" fill="#fff" opacity="0.75" />
          </g>
        ))}
      </svg>
    </div>
  );
}
