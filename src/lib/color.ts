/** Смешивание hex-цветов для CSS-переменных (sRGB, без управления цветом). */
function parse(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function mixHex(a: string, b: string, t: number): string {
  const ca = parse(a);
  const cb = parse(b);
  const out = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** Цвет из массива палитр по непрерывному индексу (например, 1.4 — между летом и осенью). */
export function sampleHex(stops: readonly string[], x: number): string {
  const i = Math.max(0, Math.min(stops.length - 1, Math.floor(x)));
  const j = Math.min(stops.length - 1, i + 1);
  return mixHex(stops[i], stops[j], Math.max(0, Math.min(1, x - i)));
}
