import { useMemo, useRef, useState, type ComponentType } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ru, type FeedEvent, type Metric } from '../content/ru';
import { formatNumber } from '../lib/typography';
import { useGsap } from '../hooks/useGsap';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { SectionHeading } from './ui/SectionHeading';
import { Counter } from './ui/Counter';
import { Basket, Drop, Grape, LeafIcon, Rain, Sparkle, Sugar, Sun } from './ui/Icons';

const EASE = [0.16, 1, 0.3, 1] as const;
type IconType = ComponentType<{ size?: number; className?: string }>;

const METRIC_STYLE: Record<Metric['id'], { icon: IconType; tint: string; stroke: string }> = {
  moisture: { icon: Drop, tint: 'bg-[#DDF1F4] text-[#1F6F7A]', stroke: '#3BA3B0' },
  sun: { icon: Sun, tint: 'bg-[#FFF0D6] text-[#9A5B00]', stroke: '#F0A93C' },
  sugar: { icon: Sugar, tint: 'bg-[#F1E6FA] text-grape', stroke: '#7B3FA0' },
  harvest: { icon: Basket, tint: 'bg-[#E6F5DC] text-leaf-deep', stroke: '#3FA66B' },
};

const FEED_ICON: Record<FeedEvent['tone'], { icon: IconType; tint: string }> = {
  sun: { icon: Sun, tint: 'bg-[#FFF0D6] text-[#9A5B00]' },
  leaf: { icon: LeafIcon, tint: 'bg-[#E6F5DC] text-leaf-deep' },
  rain: { icon: Rain, tint: 'bg-[#DDF1F4] text-[#1F6F7A]' },
  grape: { icon: Grape, tint: 'bg-[#F1E6FA] text-grape' },
  berry: { icon: Sparkle, tint: 'bg-[#FDE4EC] text-berry-deep' },
};

/** Сглаженная кривая через точки (Catmull-Rom → кубические Безье). Одинаковое число команд — можно морфить. */
function smoothPath(points: [number, number][]): string {
  let d = `M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

function toPoints(values: number[], w: number, h: number, pad = 18): [number, number][] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values.map((v, i) => [
    (i / (values.length - 1)) * w,
    pad + (1 - (v - min) / span) * (h - pad * 2),
  ]);
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const d = useMemo(() => smoothPath(toPoints(values, 100, 32, 4)), [values]);
  return (
    <svg viewBox="0 0 100 32" className="h-8 w-24" aria-hidden="true" preserveAspectRatio="none">
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, ease: EASE, delay: 0.3 }}
      />
    </svg>
  );
}

function MetricCard({ metric, index }: { metric: Metric; index: number }) {
  const style = METRIC_STYLE[metric.id];
  const Icon = style.icon;
  return (
    <motion.div
      className="rounded-[22px] border border-white/80 bg-white/70 p-5 shadow-[0_8px_30px_-18px_rgba(20,56,43,0.35)]"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-5% 0px' }}
      transition={{ duration: 0.8, delay: index * 0.08, ease: EASE }}
      whileHover={{ y: -4 }}
    >
      <div className="flex items-center justify-between">
        <span className={`grid h-10 w-10 place-items-center rounded-2xl ${style.tint}`}>
          <Icon size={20} />
        </span>
        <Sparkline values={metric.spark} color={style.stroke} />
      </div>
      <p className="mt-5 text-[0.82rem] font-semibold text-emerald/75">{metric.label}</p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <Counter value={metric.value} decimals={metric.decimals} className="font-display text-[2.7rem] font-medium leading-none text-emerald" />
        <span className="text-sm font-semibold text-emerald/70">{metric.unit}</span>
      </p>
      <p className="mt-3 inline-flex rounded-full bg-mint px-2.5 py-1 text-[0.72rem] font-bold text-leaf-deep">{metric.delta}</p>
    </motion.div>
  );
}

function ChartCard() {
  const d = ru.dashboard;
  const [active, setActive] = useState(0);
  const W = 600;
  const H = 210;
  const series = d.series[active];
  const points = useMemo(() => toPoints(series.points, W, H), [series]);
  const line = useMemo(() => smoothPath(points), [points]);
  const area = `${line} L${W},${H} L0,${H} Z`;
  const last = points[points.length - 1];
  const lastValue = series.points[series.points.length - 1];

  return (
    <div className="rounded-[22px] border border-white/80 bg-white/70 p-5 lg:col-span-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-2xl text-emerald">{d.chartTitle}</h3>
        <div className="flex rounded-full bg-mint p-1" role="group" aria-label="Показатель на графике">
          {d.series.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={i === active}
              data-cursor="link"
              onClick={() => setActive(i)}
              className={`relative rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                i === active ? 'text-cream' : 'text-emerald/75 hover:text-emerald'
              }`}
            >
              {i === active && (
                <motion.span
                  layoutId="chart-pill"
                  className="absolute inset-0 rounded-full bg-emerald"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="relative mt-4">
        <svg viewBox={`0 0 ${W} ${H + 8}`} className="h-auto w-full overflow-visible" role="img" aria-label={`${series.label}: сейчас ${formatNumber(lastValue, 1)} ${series.unit}`}>
          <defs>
            <linearGradient id="chart-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#C9A7E8" stopOpacity="0.55" />
              <stop offset="1" stopColor="#B7E26B" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="chart-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#3FA66B" />
              <stop offset="0.6" stopColor="#7B3FA0" />
              <stop offset="1" stopColor="#E86A92" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} stroke="#14382B" strokeOpacity="0.07" strokeDasharray="4 6" />
          ))}
          <motion.path d={area} fill="url(#chart-area)" animate={{ d: area }} transition={{ duration: 0.8, ease: EASE }} />
          <motion.path
            d={line}
            fill="none"
            stroke="url(#chart-line)"
            strokeWidth="3.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            animate={{ d: line }}
            transition={{ pathLength: { duration: 2, ease: EASE }, d: { duration: 0.8, ease: EASE } }}
          />
          <motion.g animate={{ x: last[0], y: last[1] }} transition={{ duration: 0.8, ease: EASE }}>
            <circle r="13" fill="#7B3FA0" opacity="0.15" />
            <circle r="6" fill="#fff" stroke="#7B3FA0" strokeWidth="3" />
          </motion.g>
        </svg>
        <motion.div
          className="absolute right-0 top-0 rounded-xl bg-emerald px-3 py-1.5 text-xs font-bold text-cream"
          key={series.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          {formatNumber(lastValue, 1)} {series.unit}
        </motion.div>
        <div className="mt-2 flex justify-between text-[0.72rem] font-semibold text-emerald/65">
          {d.chartMonths.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function HealthCard() {
  const { health, harvestBar } = ru.dashboard;
  const R = 52;
  const C = 2 * Math.PI * R;
  return (
    <div className="flex flex-col rounded-[22px] border border-white/80 bg-white/70 p-5 lg:col-span-3">
      <h3 className="font-display text-2xl text-emerald">{health.label}</h3>
      <div className="relative mx-auto my-5 h-40 w-40">
        <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden="true">
          <defs>
            <linearGradient id="health-ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#B7E26B" />
              <stop offset="1" stopColor="#3FA66B" />
            </linearGradient>
          </defs>
          <circle cx="64" cy="64" r={R} fill="none" stroke="#14382B" strokeOpacity="0.08" strokeWidth="11" />
          <motion.circle
            cx="64"
            cy="64"
            r={R}
            fill="none"
            stroke="url(#health-ring)"
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            whileInView={{ strokeDashoffset: C * (1 - health.value / 100) }}
            viewport={{ once: true }}
            transition={{ duration: 2, ease: EASE, delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-display text-[2.6rem] leading-none text-emerald">
            <Counter value={health.value} />%
          </p>
          <p className="mt-1 text-xs font-bold text-leaf-deep">{health.status}</p>
        </div>
      </div>
      <p className="text-center text-[0.82rem] leading-snug text-emerald/75">{health.note}</p>
      <div className="mt-auto pt-5">
        <div className="flex justify-between text-[0.78rem] font-semibold text-emerald/80">
          <span>{harvestBar.label}</span>
          <span className="text-grape">{harvestBar.caption}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald/10">
          <motion.div
            className="h-full rounded-full bg-[linear-gradient(90deg,#B7E26B,#3FA66B,#7B3FA0)]"
            initial={{ width: '0%' }}
            whileInView={{ width: `${harvestBar.value * 100}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.8, ease: EASE, delay: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
}

function FeedCard() {
  const { feed, feedTitle } = ru.dashboard;
  return (
    <div className="rounded-[22px] border border-white/80 bg-white/70 p-5 lg:col-span-3">
      <h3 className="font-display text-2xl text-emerald">{feedTitle}</h3>
      <ul className="mt-4 flex flex-col gap-3.5">
        {feed.map((e, i) => {
          const { icon: Icon, tint } = FEED_ICON[e.tone];
          return (
            <motion.li
              key={e.text}
              className="flex gap-3"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.1, ease: EASE }}
            >
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${tint}`}>
                <Icon size={16} />
              </span>
              <span className="text-[0.82rem] leading-snug text-emerald/85">
                {e.text}
                <span className="mt-0.5 block text-[0.7rem] font-semibold text-emerald/60">{e.time}</span>
              </span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

/** Личный кабинет: стеклянная панель въезжает с 3D-наклоном и выравнивается по мере скролла. */
export function Dashboard() {
  const section = useRef<HTMLElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const d = ru.dashboard;

  useGsap(
    () => {
      if (reduced) return;
      gsap.fromTo(
        panel.current,
        { rotateX: 26, y: 120, scale: 0.92, opacity: 0.4, transformPerspective: 1600 },
        {
          rotateX: 0,
          y: 0,
          scale: 1,
          opacity: 1,
          ease: 'none',
          scrollTrigger: { trigger: panel.current, start: 'top bottom', end: 'top 22%', scrub: 0.8 },
        },
      );
    },
    section,
    [reduced],
  );

  return (
    <section
      ref={section}
      id="cabinet"
      data-scene="cabinet"
      aria-labelledby="cabinet-title"
      className="relative px-4 py-28 sm:px-8 lg:px-12 lg:py-36"
    >
      <div className="mx-auto max-w-[1360px]">
        <SectionHeading id="cabinet-title" eyebrow={d.eyebrow} title={d.title} text={d.text} align="center" />
        <figure className="mt-14 [perspective:1600px]" aria-label="Пример личного кабинета опекуна">
          <div ref={panel} className="glass-strong origin-top rounded-[32px] p-3 sm:p-5 lg:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4 px-2 pb-5 pt-1 sm:px-1">
              <div className="flex items-center gap-3.5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[linear-gradient(135deg,#C9A7E8,#7B3FA0)] font-display text-2xl text-white">
                  А
                </span>
                <div>
                  <p className="font-display text-2xl leading-tight text-emerald">{d.greeting}</p>
                  <p className="text-[0.8rem] text-emerald/70">{d.bush}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-mint px-3 py-1.5 text-xs font-bold text-leaf-deep">
                  <span className="h-2 w-2 rounded-full bg-leaf" style={{ animation: 'pulse-dot 2s infinite' }} />
                  {d.online}
                </span>
                <div className="hidden rounded-full bg-white/70 p-1 md:flex" aria-hidden="true">
                  {d.tabs.map((t, i) => (
                    <span
                      key={t}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${i === 0 ? 'bg-emerald text-cream' : 'text-emerald/70'}`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
              {d.metrics.map((m, i) => (
                <MetricCard key={m.id} metric={m} index={i} />
              ))}
            </div>
            <div className="mt-3 grid gap-3 lg:mt-4 lg:grid-cols-12 lg:gap-4">
              <ChartCard />
              <HealthCard />
              <FeedCard />
            </div>
          </div>
        </figure>
      </div>
    </section>
  );
}
