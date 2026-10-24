import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ru } from '../content/ru';
import { onSceneReady } from '../lib/sceneStore';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { LEAF_PATH, LEAF_VEINS } from './ui/Icons';

interface Props {
  /** Ждать ли готовности WebGL-сцены (без WebGL — только шрифты). */
  waitForScene: boolean;
  onReveal: () => void;
  onFinished: () => void;
}

/** Прелоадер: лист прорисовывается линией, растёт процент, затем шторка уходит вверх. */
export function Preloader({ waitForScene, onReveal, onFinished }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const outline = useRef<SVGPathElement>(null);
  const veins = useRef<SVGPathElement>(null);
  const fill = useRef<SVGPathElement>(null);
  const percent = useRef<HTMLSpanElement>(null);
  const line = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const callbacks = useRef({ onReveal, onFinished });
  callbacks.current = { onReveal, onFinished };

  useEffect(() => {
    const ready = { fonts: false, scene: !waitForScene, time: false };
    document.fonts.ready.then(() => {
      ready.fonts = true;
    });
    const offScene = waitForScene ? onSceneReady(() => (ready.scene = true)) : () => undefined;
    // Если что-то пошло не так, не держим посетителя дольше 8 секунд
    const failSafe = window.setTimeout(() => {
      ready.fonts = true;
      ready.scene = true;
    }, 8000);
    const minTimer = window.setTimeout(() => (ready.time = true), reduced ? 300 : 1500);

    const outlineLen = outline.current?.getTotalLength() ?? 1;
    const veinsLen = veins.current?.getTotalLength() ?? 1;
    outline.current?.style.setProperty('stroke-dasharray', `${outlineLen}`);
    veins.current?.style.setProperty('stroke-dasharray', `${veinsLen}`);

    let shown = 0;
    let raf = 0;
    let finished = false;
    const tick = () => {
      const target =
        0.12 + (ready.fonts ? 0.23 : 0) + (ready.scene ? 0.45 : 0) + (ready.time ? 0.2 : 0.08);
      shown += (Math.min(1, target) - shown) * 0.07 + 0.0008;
      shown = Math.min(shown, Math.min(1, target));
      const p = Math.min(1, shown);
      if (percent.current) percent.current.textContent = `${Math.round(p * 100)}%`;
      if (line.current) line.current.style.transform = `scaleX(${p})`;
      outline.current?.style.setProperty('stroke-dashoffset', `${outlineLen * (1 - p)}`);
      veins.current?.style.setProperty('stroke-dashoffset', `${veinsLen * (1 - Math.max(0, p * 1.4 - 0.4))}`);
      if (p > 0.995 && ready.fonts && ready.scene && ready.time && !finished) {
        finished = true;
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const finish = () => {
      const tl = gsap.timeline({ onComplete: () => callbacks.current.onFinished() });
      if (reduced) {
        tl.call(() => callbacks.current.onReveal()).to(root.current, { autoAlpha: 0, duration: 0.3 });
        return;
      }
      tl.to(fill.current, { opacity: 1, duration: 0.5, ease: 'power2.out' })
        .to('[data-preloader-content]', { y: -40, opacity: 0, duration: 0.6, ease: 'power3.in' }, '+=0.15')
        .call(() => callbacks.current.onReveal())
        .to(root.current, { yPercent: -100, duration: 1.25, ease: 'expo.inOut' }, '-=0.1')
        .to('[data-preloader-edge]', { scaleY: 1, duration: 1.25, ease: 'expo.inOut' }, '<');
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(failSafe);
      window.clearTimeout(minTimer);
      offScene();
    };
  }, [waitForScene, reduced]);

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-cream"
      style={{ background: 'radial-gradient(120% 90% at 50% 40%, #FBF8F1 0%, #EAF6EE 60%, #E4F2DC 100%)' }}
      role="status"
      aria-live="polite"
    >
      <div data-preloader-content className="flex flex-col items-center">
        <svg width="132" height="132" viewBox="0 0 64 64" aria-hidden="true">
          <defs>
            <linearGradient id="pre-leaf" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#B7E26B" />
              <stop offset="1" stopColor="#3FA66B" />
            </linearGradient>
          </defs>
          <path ref={fill} d={LEAF_PATH} fill="url(#pre-leaf)" opacity="0" />
          <path ref={outline} d={LEAF_PATH} fill="none" stroke="#3FA66B" strokeWidth="0.9" strokeLinejoin="round" />
          <path ref={veins} d={LEAF_VEINS} fill="none" stroke="#14382B" strokeOpacity="0.55" strokeWidth="1" strokeLinecap="round" />
        </svg>
        <p className="mt-8 font-display text-2xl text-emerald">
          {ru.preloader.label} <span ref={percent} className="tabular-nums">0%</span>
        </p>
        <span className="mt-4 block h-px w-44 overflow-hidden bg-emerald/10" aria-hidden="true">
          <span ref={line} className="block h-full origin-left bg-[linear-gradient(90deg,#B7E26B,#3FA66B,#7B3FA0)]" style={{ transform: 'scaleX(0)' }} />
        </span>
        <span className="mt-6 text-[0.65rem] font-bold uppercase tracking-[0.4em] text-leaf-deep">{ru.brand.caption}</span>
      </div>
      {/* Нижний «лепестковый» край шторки */}
      <span
        data-preloader-edge
        aria-hidden="true"
        className="absolute inset-x-0 top-full block h-[18vh] origin-top bg-[#E4F2DC]"
        style={{ transform: 'scaleY(0)', borderRadius: '0 0 50% 50% / 0 0 100% 100%' }}
      />
    </div>
  );
}
