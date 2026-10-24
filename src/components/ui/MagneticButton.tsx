import { useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { scrollToTarget } from '../../lib/scroll';

type Variant = 'primary' | 'glass' | 'dark' | 'light';

interface Props {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: Variant;
  size?: 'md' | 'lg';
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
  strength?: number;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'text-white bg-[linear-gradient(120deg,#7B3FA0_0%,#9A3C8F_55%,#B8336A_100%)] shadow-[0_14px_36px_-12px_rgba(123,63,160,0.65)]',
  glass: 'glass text-emerald',
  dark: 'bg-emerald text-cream shadow-[0_14px_36px_-14px_rgba(20,56,43,0.6)]',
  light: 'bg-white text-emerald shadow-[0_10px_30px_-12px_rgba(20,56,43,0.35)]',
};

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

/** Кнопка, которая тянется к курсору, с волной от клика. Якоря прокручиваются плавно через Lenis. */
export function MagneticButton({
  children,
  href,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  ariaLabel,
  disabled,
  strength = 0.35,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.35 });
  const lx = useSpring(useMotionValue(0), { stiffness: 260, damping: 18, mass: 0.35 });
  const ly = useSpring(useMotionValue(0), { stiffness: 260, damping: 18, mass: 0.35 });
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (reduced || e.pointerType !== 'mouse' || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    x.set(dx * strength);
    y.set(dy * strength);
    lx.set(dx * strength * 0.35);
    ly.set(dy * strength * 0.35);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
    lx.set(0);
    ly.set(0);
  };
  const onDown = (e: PointerEvent<HTMLElement>) => {
    if (!ref.current || reduced) return;
    const r = ref.current.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2.2;
    const ripple = { id: performance.now(), x: e.clientX - r.left, y: e.clientY - r.top, size };
    setRipples((list) => [...list, ripple]);
    window.setTimeout(() => setRipples((list) => list.filter((it) => it.id !== ripple.id)), 750);
  };
  const handleClick = (e: MouseEvent<HTMLElement>) => {
    if (href?.startsWith('#')) {
      e.preventDefault();
      scrollToTarget(href);
    }
    onClick?.();
  };

  const sizing = size === 'lg' ? 'h-14 px-8 text-[0.98rem]' : 'h-12 px-6 text-[0.92rem]';
  const classes = `group relative inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-full font-semibold tracking-[-0.01em] transition-[filter,opacity] duration-300 hover:brightness-[1.06] disabled:opacity-60 ${sizing} ${VARIANTS[variant]} ${className}`;

  const inner = (
    <>
      <motion.span className="relative z-10 inline-flex items-center gap-2" style={{ x: lx, y: ly }}>
        {children}
      </motion.span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(100deg,transparent_20%,rgba(255,255,255,0.35)_50%,transparent_80%)] transition-transform duration-700 ease-out group-hover:translate-x-full"
      />
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full bg-white/40"
            style={{ left: r.x - r.size / 2, top: r.y - r.size / 2, width: r.size, height: r.size }}
            initial={{ scale: 0, opacity: 0.55 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </AnimatePresence>
    </>
  );

  const shared = {
    className: classes,
    style: { x: sx, y: sy },
    onPointerMove: onMove,
    onPointerLeave: onLeave,
    onPointerDown: onDown,
    'aria-label': ariaLabel,
    'data-cursor': 'link',
  };

  if (href) {
    return (
      <motion.a
        ref={(el: HTMLAnchorElement | null) => {
          ref.current = el;
        }}
        href={href}
        onClick={handleClick}
        {...shared}
      >
        {inner}
      </motion.a>
    );
  }
  return (
    <motion.button
      ref={(el: HTMLButtonElement | null) => {
        ref.current = el;
      }}
      type={type}
      disabled={disabled}
      onClick={handleClick}
      {...shared}
    >
      {inner}
    </motion.button>
  );
}
