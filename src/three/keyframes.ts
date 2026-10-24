import { clamp, lerp } from '../lib/math';

export type Vec3 = readonly [number, number, number];

/** Состояние сцены в момент, когда секция «наступила». Порядок совпадает с SECTION_IDS. */
export interface SceneKey {
  cam: Vec3;
  look: Vec3;
  cluster: Vec3;
  clusterScale: number;
  /** Спелость 0…2 (зелёный → лиловый → тёмно-фиолетовый). */
  ripe: number;
  /** Появление бокала 0…1. */
  glass: number;
  glassPos: Vec3;
  glassScale: number;
  /** Интенсивность солнечных лучей. */
  rays: number;
  /** Видимость лоз 0…1: в плотных секциях лозы расходятся к краям кадра. */
  vine: number;
  /** Доля секции, в течение которой сцена «держит кадр» (для пин-секций). */
  hold: number;
}

const GLASS_HIDDEN: Pick<SceneKey, 'glass' | 'glassPos' | 'glassScale'> = {
  glass: 0,
  glassPos: [2.2, -1.6, 0],
  glassScale: 0.6,
};

export const DESKTOP_KEYS: readonly SceneKey[] = [
  // 0 hero
  { cam: [0, 0.15, 6.4], look: [0, 0, 0], cluster: [0, 0.05, 0], clusterScale: 1, ripe: 0.05, rays: 1, vine: 1, hold: 0, ...GLASS_HIDDEN },
  // 1 манифест
  { cam: [0.2, -0.5, 6.2], look: [0.4, -0.55, 0], cluster: [2.45, -0.1, -0.3], clusterScale: 0.62, ripe: 0.3, rays: 0.8, vine: 1, hold: 0.35, ...GLASS_HIDDEN },
  // 2 как это работает (пин)
  { cam: [0.4, -0.3, 5.6], look: [0.95, -0.35, 0], cluster: [2.05, -0.3, 0.4], clusterScale: 0.82, ripe: 0, rays: 0.9, vine: 1, hold: 0.86, ...GLASS_HIDDEN },
  // 3 кабинет
  { cam: [-0.6, 0.9, 7.6], look: [0, 0.2, 0], cluster: [-3.5, 1.05, -1.2], clusterScale: 0.55, ripe: 1, rays: 0.7, vine: 0.2, hold: 0.4, ...GLASS_HIDDEN },
  // 4 терруар
  { cam: [2.6, -0.7, 5.2], look: [1.4, -1.1, -1.4], cluster: [4.3, 0.55, -1.2], clusterScale: 0.5, ripe: 1.15, rays: 1, vine: 0.85, hold: 0.2, ...GLASS_HIDDEN },
  // 5 сорта (горизонтальный пин)
  { cam: [-2.6, -0.2, 5.6], look: [-2.4, -0.5, -0.5], cluster: [-4.6, 0.75, -1.4], clusterScale: 0.5, ripe: 1.35, rays: 0.8, vine: 0.55, hold: 0.3, ...GLASS_HIDDEN },
  // 6 времена года
  { cam: [0.2, 0.25, 6.4], look: [0.6, 0.1, 0], cluster: [2.1, 0, 0.2], clusterScale: 0.85, ripe: 1.55, rays: 1.1, vine: 1, hold: 0.6, ...GLASS_HIDDEN },
  // 7 отзывы
  { cam: [0, 1, 7.4], look: [0, 0.6, 0], cluster: [0, 2.1, -1.4], clusterScale: 0.55, ripe: 1.75, rays: 0.9, vine: 0.3, hold: 0, ...GLASS_HIDDEN },
  // 8 тарифы
  { cam: [0, 0.4, 7.6], look: [0, 0.3, 0], cluster: [-3.3, 1.5, -1.6], clusterScale: 0.45, ripe: 1.9, rays: 0.8, vine: 0.2, hold: 0, ...GLASS_HIDDEN },
  // 9 вопросы
  { cam: [0.8, 0, 6.6], look: [0.9, 0, 0], cluster: [3.4, 0.95, -1], clusterScale: 0.5, ripe: 2, rays: 0.9, vine: 0.4, hold: 0, glass: 0.35, glassPos: [2.4, -0.7, 0], glassScale: 0.75 },
  // 10 финальный CTA
  { cam: [0.5, 0.05, 5.8], look: [1.1, 0.05, 0], cluster: [3.4, 1.3, -0.8], clusterScale: 0.42, ripe: 2, rays: 1.1, vine: 0.9, hold: 0, glass: 1, glassPos: [1.95, -1.05, 0.6], glassScale: 1 },
  // 11 футер
  { cam: [0.3, 2, 7.2], look: [0.6, 1.8, 0], cluster: [3.4, 1.3, -0.8], clusterScale: 0.42, ripe: 2, rays: 1.3, vine: 1, hold: 0, glass: 1, glassPos: [1.95, -1.05, 0.6], glassScale: 1 },
];

export const MOBILE_KEYS: readonly SceneKey[] = [
  { cam: [0, 0, 7.4], look: [0, 0.3, 0], cluster: [0, 1.55, 0], clusterScale: 0.68, ripe: 0.05, rays: 1, vine: 1, hold: 0, ...GLASS_HIDDEN },
  { cam: [0, -0.4, 7.4], look: [0, -0.3, 0], cluster: [0.95, 2, -1], clusterScale: 0.45, ripe: 0.3, rays: 0.8, vine: 1, hold: 0.35, ...GLASS_HIDDEN },
  { cam: [0, 0, 7.2], look: [0, 0.2, 0], cluster: [0, 1.6, -0.2], clusterScale: 0.62, ripe: 0, rays: 0.9, vine: 1, hold: 0.7, ...GLASS_HIDDEN },
  { cam: [0, 0.6, 8], look: [0, 0.4, 0], cluster: [-1.05, 2.5, -1.5], clusterScale: 0.4, ripe: 1, rays: 0.7, vine: 0.2, hold: 0.3, ...GLASS_HIDDEN },
  { cam: [1, -0.5, 6.5], look: [0.6, -0.8, -1], cluster: [1.15, 2.05, -1.2], clusterScale: 0.4, ripe: 1.15, rays: 1, vine: 0.85, hold: 0, ...GLASS_HIDDEN },
  { cam: [-1.2, -0.2, 7], look: [-1.2, -0.3, 0], cluster: [-1.65, 2.25, -1.5], clusterScale: 0.4, ripe: 1.35, rays: 0.8, vine: 0.55, hold: 0, ...GLASS_HIDDEN },
  { cam: [0, 0.3, 7.4], look: [0, 0.3, 0], cluster: [0, 1.65, -0.5], clusterScale: 0.6, ripe: 1.55, rays: 1.1, vine: 1, hold: 0.5, ...GLASS_HIDDEN },
  { cam: [0, 0.8, 8], look: [0, 0.6, 0], cluster: [0.95, 2.6, -1.6], clusterScale: 0.45, ripe: 1.75, rays: 0.9, vine: 0.3, hold: 0, ...GLASS_HIDDEN },
  { cam: [0, 0.4, 8.2], look: [0, 0.3, 0], cluster: [-1.05, 2.7, -1.8], clusterScale: 0.4, ripe: 1.9, rays: 0.8, vine: 0.2, hold: 0, ...GLASS_HIDDEN },
  { cam: [0, 0, 7.4], look: [0, 0, 0], cluster: [1.2, 2.35, -1.4], clusterScale: 0.4, ripe: 2, rays: 0.9, vine: 0.4, hold: 0, glass: 0.3, glassPos: [0.8, -2, -0.5], glassScale: 0.55 },
  { cam: [0, 0, 7], look: [0, 0, 0], cluster: [1.1, 2.25, -1.2], clusterScale: 0.38, ripe: 2, rays: 1.1, vine: 0.9, hold: 0, glass: 1, glassPos: [0, -2.15, 0], glassScale: 0.85 },
  { cam: [0, 1.8, 8], look: [0, 1.6, 0], cluster: [1.1, 2.25, -1.2], clusterScale: 0.38, ripe: 2, rays: 1.3, vine: 1, hold: 0, glass: 1, glassPos: [0, -2.15, 0], glassScale: 0.85 },
];

/** Стартовая точка «влёта» камеры после прелоадера. */
export const INTRO_CAM: Vec3 = [0, 2.6, 15];

/**
 * Переводит сырое секционное время в «режиссёрское»: внутри секции кадр держится
 * до доли hold, затем плавно (с лёгким ease) перетекает в следующий ключ.
 */
export function directedTime(keys: readonly SceneKey[], t: number): number {
  const n = keys.length;
  const tc = clamp(t, 0, n - 1);
  const i = Math.min(n - 2, Math.floor(tc));
  const f = tc - i;
  const hold = keys[i].hold;
  const g = clamp((f - hold) / (1 - hold));
  const eased = g * g * (3 - 2 * g);
  return i + lerp(g, eased, 0.7);
}

export function sampleNumber(
  keys: readonly SceneKey[],
  t: number,
  pick: (k: SceneKey) => number,
): number {
  const n = keys.length;
  const tc = clamp(t, 0, n - 1);
  const i = Math.min(n - 2, Math.floor(tc));
  return lerp(pick(keys[i]), pick(keys[i + 1]), tc - i);
}

export function sampleVec3(
  keys: readonly SceneKey[],
  t: number,
  pick: (k: SceneKey) => Vec3,
  out: [number, number, number],
): [number, number, number] {
  const n = keys.length;
  const tc = clamp(t, 0, n - 1);
  const i = Math.min(n - 2, Math.floor(tc));
  const f = tc - i;
  const a = pick(keys[i]);
  const b = pick(keys[i + 1]);
  out[0] = lerp(a[0], b[0], f);
  out[1] = lerp(a[1], b[1], f);
  out[2] = lerp(a[2], b[2], f);
  return out;
}
