import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sceneStore } from './sceneStore';

gsap.registerPlugin(ScrollTrigger);

export interface ScrollSnapshot {
  y: number;
  /** Прогресс всей страницы 0…1. */
  progress: number;
  velocity: number;
  direction: 1 | -1;
}

type ScrollListener = (s: ScrollSnapshot) => void;

const snapshot: ScrollSnapshot = { y: 0, progress: 0, velocity: 0, direction: 1 };
const listeners = new Set<ScrollListener>();

let lenis: Lenis | null = null;
/** Позиции скролла, на которых начинается «сцена» каждой секции. */
let breakpoints: number[] = [0];
let lastY = 0;

/**
 * Секция i «наступает», когда её верх доходит до середины экрана.
 * Пересчитывается после каждого ScrollTrigger.refresh, потому что пины меняют высоту страницы.
 */
export function measureSections(): void {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'));
  const vh = window.innerHeight;
  const y = window.scrollY;
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
  let prev = -Infinity;
  breakpoints = els.map((el, i) => {
    const top = el.getBoundingClientRect().top + y;
    let b = i === 0 ? 0 : Math.min(top - vh * 0.5, maxScroll);
    if (b <= prev) b = prev + 1;
    prev = b;
    return b;
  });
  update();
}

function sectionFloat(y: number): number {
  const b = breakpoints;
  const n = b.length;
  if (n < 2 || y <= b[0]) return 0;
  for (let i = 0; i < n - 1; i++) {
    if (y < b[i + 1]) return i + (y - b[i]) / (b[i + 1] - b[i]);
  }
  return n - 1;
}

function update(): void {
  const y = window.scrollY;
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const velocity = lenis ? lenis.velocity : y - lastY;
  if (y !== lastY) snapshot.direction = y > lastY ? 1 : -1;
  lastY = y;
  snapshot.y = y;
  snapshot.progress = Math.min(1, Math.max(0, y / maxScroll));
  snapshot.velocity = velocity;
  sceneStore.t = sectionFloat(y);
  sceneStore.velocity = velocity;
  listeners.forEach((l) => l(snapshot));
}

export function initScroll(reducedMotion: boolean): () => void {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  let tick: ((time: number) => void) | null = null;
  if (!reducedMotion) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, touchMultiplier: 1.3, autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    const instance = lenis;
    tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
  }

  window.addEventListener('scroll', update, { passive: true });
  ScrollTrigger.addEventListener('refresh', measureSections);
  measureSections();

  return () => {
    window.removeEventListener('scroll', update);
    ScrollTrigger.removeEventListener('refresh', measureSections);
    if (tick) gsap.ticker.remove(tick);
    lenis?.destroy();
    lenis = null;
  };
}

export function subscribeScroll(listener: ScrollListener): () => void {
  listeners.add(listener);
  listener(snapshot);
  return () => listeners.delete(listener);
}

export const getScrollSnapshot = (): ScrollSnapshot => snapshot;

const easeInOutExpo = (t: number): number =>
  t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;

/** Плавная прокрутка к якорю/элементу/позиции. */
export function scrollToTarget(target: string | HTMLElement | number): void {
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.8, easing: easeInOutExpo });
    return;
  }
  if (typeof target === 'number') {
    window.scrollTo({ top: target });
    return;
  }
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  el?.scrollIntoView();
}

export function lockScroll(locked: boolean): void {
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
  }
  document.documentElement.style.overflow = locked ? 'hidden' : '';
}
