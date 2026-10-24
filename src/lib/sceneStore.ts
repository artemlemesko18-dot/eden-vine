import type { ScrollTrigger } from 'gsap/ScrollTrigger';

export type Tier = 'high' | 'medium' | 'low';

/**
 * Изменяемое состояние, которое DOM-слой пишет, а 3D-сцена читает каждый кадр.
 * Намеренно без React-состояния: никаких перерисовок на скролле.
 */
export const sceneStore = {
  /** «Секционное время» из скролла: 0 — hero, 1 — манифест, 2 — шаги… */
  t: 0,
  /** Скорость скролла (px/кадр), со знаком. */
  velocity: 0,
  /** Курсор в нормализованных координатах [-1, 1]. */
  pointer: { x: 0, y: 0 },
  /** Прогресс «влёта» камеры после прелоадера, 0…1. */
  intro: 0,
  /** Триггеры пин-секций, из которых сцена берёт локальный прогресс. */
  howTrigger: null as ScrollTrigger | null,
  seasonTrigger: null as ScrollTrigger | null,
};

export function getHowProgress(): number {
  return sceneStore.howTrigger?.progress ?? 0;
}

/** Время года 0…2: весна → лето → осень. */
export function getSeason(): number {
  return (sceneStore.seasonTrigger?.progress ?? 0) * 2;
}

/* ---------- Уровень качества ---------- */

type Listener = () => void;
const tierListeners = new Set<Listener>();

function initialTier(): Tier {
  if (typeof window === 'undefined') return 'high';
  const mobile = window.matchMedia('(max-width: 767px)').matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  if (mobile) return 'medium';
  if (cores <= 4) return 'medium';
  return 'high';
}

let tier: Tier = initialTier();
let tierLocked = false;

export const getTier = (): Tier => tier;

export function setTier(next: Tier, lock = false): void {
  if (tierLocked || next === tier) return;
  tier = next;
  if (lock) tierLocked = true;
  tierListeners.forEach((l) => l());
}

export function stepTier(direction: -1 | 1): void {
  const order: Tier[] = ['low', 'medium', 'high'];
  const i = order.indexOf(tier);
  setTier(order[Math.max(0, Math.min(order.length - 1, i + direction))]);
}

export function subscribeTier(listener: Listener): () => void {
  tierListeners.add(listener);
  return () => tierListeners.delete(listener);
}

/* ---------- Готовность сцены (для прелоадера) ---------- */

let sceneReady = false;
const readyListeners = new Set<Listener>();

export function markSceneReady(): void {
  if (sceneReady) return;
  sceneReady = true;
  readyListeners.forEach((l) => l());
  readyListeners.clear();
}

export function onSceneReady(listener: Listener): () => void {
  if (sceneReady) {
    listener();
    return () => undefined;
  }
  readyListeners.add(listener);
  return () => readyListeners.delete(listener);
}

/* ---------- Курсор ---------- */

export function initPointerTracking(): () => void {
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    sceneStore.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    sceneStore.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
  };
  const onLeave = () => {
    sceneStore.pointer.x = 0;
    sceneStore.pointer.y = 0;
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
  return () => {
    window.removeEventListener('pointermove', onMove);
    document.documentElement.removeEventListener('pointerleave', onLeave);
  };
}
