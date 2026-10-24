import { useId } from 'react';
import { ru } from '../../content/ru';
import { scrollToTarget } from '../../lib/scroll';
import { LEAF_PATH, LEAF_VEINS } from './Icons';

interface Props {
  compact?: boolean;
}

export function LogoMark({ size = 34 }: { size?: number }) {
  const id = `leaf${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B7E26B" />
          <stop offset="1" stopColor="#3FA66B" />
        </linearGradient>
      </defs>
      <path d={LEAF_PATH} fill={`url(#${id})`} />
      <path d={LEAF_VEINS} fill="none" stroke="#14382B" strokeOpacity="0.5" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ compact }: Props) {
  return (
    <a
      href="#top"
      aria-label={ru.brand.homeLabel}
      data-cursor="link"
      className="group inline-flex items-center gap-2.5"
      onClick={(e) => {
        e.preventDefault();
        scrollToTarget(0);
      }}
    >
      <span className="transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:rotate-[18deg] group-hover:scale-110">
        <LogoMark />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.45rem] font-semibold tracking-[-0.02em] text-emerald">
          {ru.brand.name}
        </span>
        {!compact && (
          <span className="mt-0.5 text-[0.62rem] font-bold uppercase tracking-[0.32em] text-leaf-deep">
            {ru.brand.caption}
          </span>
        )}
      </span>
    </a>
  );
}
