import type { CSSProperties } from 'react';

interface Props {
  colors: readonly [string, string, string];
  size?: number;
  className?: string;
}

/** Ряды ягод сверху вниз: гроздь сужается к кончику. */
const ROWS = [4, 3, 3, 2, 1] as const;

/** «3D»-гроздь на чистом CSS: радиальные градиенты дают объём, блик и рефлекс. */
export function BerryCluster({ colors, size = 168, className = '' }: Props) {
  const [base, light, dark] = colors;
  const berry = size / 5.2;
  const berryStyle = (i: number): CSSProperties => ({
    width: berry,
    height: berry * 1.06,
    marginInline: -berry * 0.06,
    marginBlock: -berry * 0.1,
    borderRadius: '50%',
    background: `radial-gradient(circle at 32% 26%, rgba(255,255,255,0.95) 0 6%, rgba(255,255,255,0.4) 11%, transparent 22%),
      radial-gradient(circle at 70% 80%, ${light}AA 0%, transparent 38%),
      radial-gradient(circle at 42% 38%, ${light} 0%, ${base} 46%, ${dark} 100%)`,
    boxShadow: `inset -${berry * 0.08}px -${berry * 0.1}px ${berry * 0.22}px ${dark}88, 0 ${berry * 0.12}px ${berry * 0.3}px -${berry * 0.1}px ${dark}66`,
    transform: `rotate(${(i * 37) % 30}deg)`,
  });

  let index = 0;
  return (
    <div className={`relative flex flex-col items-center ${className}`} style={{ width: size }} aria-hidden="true">
      <svg width={size * 0.5} height={size * 0.26} viewBox="0 0 80 42" className="relative z-10 -mb-1">
        <path d="M40 42 C 40 30, 42 20, 48 8" stroke="#6E7F3A" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path
          d="M46 12 C 56 -2, 76 0, 78 10 C 70 10, 66 18, 58 20 C 52 21, 48 17, 46 12 Z"
          fill="#3FA66B"
        />
        <path d="M47 12 C 58 10, 66 11, 76 9" stroke="#B7E26B" strokeWidth="1.2" fill="none" opacity="0.8" />
        <path d="M40 30 C 30 26, 26 18, 30 10 C 33 16, 36 18, 39 22" stroke="#9ACB57" strokeWidth="1.5" fill="none" />
      </svg>
      {ROWS.map((count, r) => (
        <div key={r} className="relative flex justify-center" style={{ zIndex: ROWS.length - r }}>
          {Array.from({ length: count }, () => {
            const i = index++;
            return <span key={i} style={berryStyle(i)} />;
          })}
        </div>
      ))}
    </div>
  );
}
