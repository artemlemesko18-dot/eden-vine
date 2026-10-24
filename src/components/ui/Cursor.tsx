import { useEffect, useRef } from 'react';
import { MQ } from '../../lib/constants';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useReducedMotion } from '../../hooks/useReducedMotion';

type CursorState = '' | 'link' | 'card' | 'text';

/** Кастомный курсор: точка + кольцо с инерцией. Только для устройств с мышью. */
export function Cursor() {
  const fine = useMediaQuery(MQ.finePointer);
  const reduced = useReducedMotion();
  const enabled = fine && !reduced;
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add('has-custom-cursor');
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { ...target };
    let visible = false;
    let raf = 0;

    const setVisible = (v: boolean) => {
      visible = v;
      ring.current?.style.setProperty('opacity', v ? '1' : '0');
      dot.current?.style.setProperty('opacity', v ? '1' : '0');
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      target.x = e.clientX;
      target.y = e.clientY;
      if (!visible) {
        pos.x = target.x;
        pos.y = target.y;
        setVisible(true);
      }
    };
    const onOver = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>('[data-cursor], input, textarea');
      let state: CursorState = '';
      if (el) {
        if (el.matches('input, textarea')) state = 'text';
        else state = (el.dataset.cursor as CursorState) ?? '';
      }
      if (ring.current) ring.current.dataset.state = state;
      if (dot.current) dot.current.dataset.state = state;
    };
    const onDown = () => ring.current?.classList.add('is-pressed');
    const onUp = () => ring.current?.classList.remove('is-pressed');
    const onLeave = () => setVisible(false);

    const loop = () => {
      pos.x += (target.x - pos.x) * 0.18;
      pos.y += (target.y - pos.y) * 0.18;
      if (ring.current) ring.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      if (dot.current) dot.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    document.documentElement.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove('has-custom-cursor');
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('mouseover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('mouseleave', onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden="true">
        <span className="cursor-ring__circle" />
        <span className="cursor-ring__label">→</span>
      </div>
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
