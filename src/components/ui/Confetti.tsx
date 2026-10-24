import { useEffect, useRef } from 'react';
import { mulberry32 } from '../../lib/math';

const COLORS = ['#F4A6C0', '#E86A92', '#C9A7E8', '#B7E26B', '#FFC978', '#3FA66B', '#FFFFFF'];

interface Props {
  /** Меняйте ключ, чтобы запустить новый залп. */
  burst: number;
}

interface Petal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  w: number;
  h: number;
  color: string;
  flip: number;
}

/** Конфетти из лепестков на canvas 2D: залп из центра экрана, плавное кружение вниз. */
export function Confetti({ burst }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!burst) return;
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const resize = () => {
      el.width = window.innerWidth * dpr;
      el.height = window.innerHeight * dpr;
    };
    resize();
    const rand = mulberry32(burst);
    const cx = window.innerWidth * 0.5;
    const cy = window.innerHeight * 0.55;
    const petals: Petal[] = Array.from({ length: 150 }, () => {
      const angle = -Math.PI / 2 + (rand() - 0.5) * Math.PI * 1.1;
      const speed = 7 + rand() * 11;
      return {
        x: cx + (rand() - 0.5) * 80,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: rand() * Math.PI * 2,
        vr: (rand() - 0.5) * 0.3,
        w: 8 + rand() * 9,
        h: 4 + rand() * 5,
        color: COLORS[Math.floor(rand() * COLORS.length)],
        flip: rand() * Math.PI * 2,
      };
    });

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const fade = Math.min(1, Math.max(0, 4.2 - t));
      petals.forEach((p) => {
        p.vx *= 0.985;
        p.vy = p.vy * 0.985 + 0.22;
        p.x += p.vx + Math.sin(t * 3 + p.flip) * 0.6;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.abs(Math.cos(t * 4 + p.flip)) * 0.8 + 0.2);
        ctx.globalAlpha = fade;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.w, p.h, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      if (t < 4.3) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [burst]);

  return <canvas ref={canvas} className="pointer-events-none fixed inset-0 z-[90] h-full w-full" aria-hidden="true" />;
}
