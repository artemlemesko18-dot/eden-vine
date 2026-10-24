import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ru, type MapMarker } from '../content/ru';
import { MQ } from '../lib/constants';
import { useGsap } from '../hooks/useGsap';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { SectionHeading } from './ui/SectionHeading';
import { Grape, Pin } from './ui/Icons';

const EASE = [0.16, 1, 0.3, 1] as const;

/** Ряды лозы — пунктирные кривые по контурам склона. */
const ROWS = Array.from({ length: 10 }, (_, k) => {
  const y0 = 262 + k * 30;
  return `M30 ${y0} C 260 ${y0 - 22 + k * 3}, 520 ${y0 + 34 + k * 4}, ${860 - k * 18} ${y0 + 118 + k * 9}`;
});

function SlopeMap() {
  return (
    <svg viewBox="0 0 1200 700" className="h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="t-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF4E2" />
          <stop offset="1" stopColor="#F3F8EC" />
        </linearGradient>
        <radialGradient id="t-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFE2A8" />
          <stop offset="0.45" stopColor="#FFC978" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFC978" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="t-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E3D3F3" />
          <stop offset="1" stopColor="#EFE6F8" />
        </linearGradient>
        <linearGradient id="t-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#CDEBD3" />
          <stop offset="1" stopColor="#E2F4E4" />
        </linearGradient>
        <linearGradient id="t-slope" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#DCF0B4" />
          <stop offset="0.6" stopColor="#B9DE8F" />
          <stop offset="1" stopColor="#9FD083" />
        </linearGradient>
        <linearGradient id="t-sea" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#CBEDE6" />
          <stop offset="1" stopColor="#94D2CB" />
        </linearGradient>
        <clipPath id="t-slope-clip">
          <path d="M0 250 C 250 222, 520 292, 760 372 S 1080 520, 1200 560 L1200 700 L0 700 Z" />
        </clipPath>
      </defs>

      <rect width="1200" height="700" fill="url(#t-sky)" />
      <g data-depth="0.2">
        <circle cx="1000" cy="120" r="150" fill="url(#t-sun)" />
        <circle cx="1000" cy="120" r="44" fill="#FFE2A8" />
      </g>
      <g data-depth="0.35">
        <path d="M0 300 C 200 228, 380 280, 560 220 S 900 180, 1200 240 L1200 700 L0 700 Z" fill="url(#t-far)" />
      </g>
      <g data-depth="0.55">
        <path d="M0 360 C 180 300, 380 340, 600 300 S 1000 270, 1200 330 L1200 700 L0 700 Z" fill="url(#t-mid)" />
      </g>
      <g data-depth="0.8">
        <path d="M0 250 C 250 222, 520 292, 760 372 S 1080 520, 1200 560 L1200 700 L0 700 Z" fill="url(#t-slope)" />
        <g clipPath="url(#t-slope-clip)">
          {ROWS.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#3FA66B" strokeWidth="6" strokeLinecap="round" strokeDasharray="0.1 15" opacity={0.75 - i * 0.03} />
          ))}
        </g>
        {/* Терраса */}
        <g transform="translate(905 190)">
          <rect x="-26" y="0" width="56" height="28" rx="4" fill="#FBF8F1" stroke="#14382B" strokeOpacity="0.25" />
          <path d="M-34 2 L2 -20 L38 2 Z" fill="#E86A92" opacity="0.85" />
          <rect x="-6" y="10" width="12" height="18" rx="2" fill="#C9A7E8" />
        </g>
        {/* Метеостанция */}
        <g transform="translate(156 362)">
          <path d="M0 0 V -48" stroke="#14382B" strokeOpacity="0.5" strokeWidth="3" />
          <path d="M0 -48 L22 -42 L0 -36" fill="#FFC978" />
          <circle cx="0" cy="-52" r="5" fill="#7B3FA0" />
        </g>
      </g>
      <g data-depth="1">
        <path d="M480 640 C 760 600, 1000 560, 1200 548 L1200 700 L480 700 Z" fill="url(#t-sea)" />
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M${640 + i * 120} ${640 - i * 18} q 16 -8 32 0 t 32 0`}
            fill="none"
            stroke="#fff"
            strokeWidth="2.4"
            strokeLinecap="round"
            opacity="0.8"
          />
        ))}
      </g>
    </svg>
  );
}

function Tooltip({ marker }: { marker: MapMarker }) {
  const alignRight = marker.x > 65;
  const alignLeft = marker.x < 30;
  const below = marker.y < 32;
  return (
    <motion.div
      id={`marker-${marker.id}`}
      role="tooltip"
      className={`glass-strong pointer-events-none absolute z-20 w-[min(300px,76vw)] rounded-2xl p-4 text-left ${
        alignRight ? 'right-0' : alignLeft ? 'left-0' : 'left-1/2 -translate-x-1/2'
      } ${below ? 'top-12' : 'bottom-12'}`}
      initial={{ opacity: 0, y: below ? -8 : 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: below ? -8 : 8, scale: 0.96 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <p className="font-display text-[1.45rem] leading-tight text-emerald">{marker.name}</p>
      <p className="mt-1.5 text-[0.84rem] leading-snug text-emerald/80">{marker.text}</p>
      <p className="mt-2.5 text-[0.72rem] font-bold uppercase tracking-[0.12em] text-grape">{marker.meta}</p>
    </motion.div>
  );
}

export function Terroir() {
  const section = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  // На десктопе сразу показываем первый сорт, на телефоне тултип открывается по нажатию
  const [active, setActive] = useState<string | null>(() =>
    window.matchMedia(MQ.desktop).matches ? 'muscat' : null,
  );
  const t = ru.terroir;

  useGsap(
    () => {
      if (reduced) return;
      gsap.utils.toArray<SVGGElement>('[data-depth]').forEach((layer) => {
        const depth = Number(layer.dataset.depth ?? 0.5);
        gsap.fromTo(
          layer,
          { y: 70 * depth },
          {
            y: -50 * depth,
            ease: 'none',
            scrollTrigger: { trigger: '[data-map]', start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      });
    },
    section,
    [reduced],
  );

  return (
    <section
      ref={section}
      id="terroir"
      data-scene="terroir"
      aria-labelledby="terroir-title"
      className="relative px-4 py-28 sm:px-8 lg:px-12 lg:py-36"
    >
      <div className="mx-auto max-w-[1360px]">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <SectionHeading id="terroir-title" eyebrow={t.eyebrow} title={t.title} text={t.text} className="lg:col-span-7" />
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 lg:col-span-5 lg:pb-2">
            {t.facts.map((f, i) => (
              <motion.div
                key={f.label}
                className="border-t border-emerald/15 pt-3"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: EASE }}
              >
                <dt className="sr-only">{f.label}</dt>
                <dd className="font-display text-[2.4rem] leading-none text-emerald">{f.value}</dd>
                <dd className="mt-1 text-[0.82rem] text-emerald/75">{f.label}</dd>
              </motion.div>
            ))}
          </dl>
        </div>

        <motion.div
          data-map
          className="glass relative mt-12 overflow-visible rounded-[32px] p-2 sm:p-3"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 1, ease: EASE }}
        >
          <div className="relative aspect-[12/7] overflow-hidden rounded-[20px] sm:rounded-[26px]">
            <SlopeMap />
          </div>
          <div className="pointer-events-none absolute inset-2 sm:inset-3">
            {t.markers.map((m) => {
              const isActive = active === m.id;
              const isVariety = m.kind === 'variety';
              return (
                <div key={m.id} className="pointer-events-auto absolute" style={{ left: `${m.x}%`, top: `${m.y}%` }}>
                  <button
                    type="button"
                    data-cursor="link"
                    aria-expanded={isActive}
                    aria-describedby={isActive ? `marker-${m.id}` : undefined}
                    aria-label={m.name}
                    onClick={() => setActive(isActive ? null : m.id)}
                    onMouseEnter={() => setActive(m.id)}
                    onFocus={() => setActive(m.id)}
                    className="group relative -ml-[22px] -mt-[22px] grid h-11 w-11 place-items-center"
                  >
                    <span
                      className={`absolute inset-0 rounded-full ${isVariety ? 'bg-grape/25' : 'bg-leaf/25'}`}
                      style={{ animation: reduced ? undefined : 'pulse-dot 2.4s infinite' }}
                    />
                    <span
                      className={`relative grid h-8 w-8 place-items-center rounded-full border-2 border-white text-white shadow-lg transition-transform duration-300 group-hover:scale-110 ${
                        isActive ? 'scale-110' : ''
                      } ${isVariety ? 'bg-grape' : 'bg-leaf-deep'}`}
                    >
                      {isVariety ? <Grape size={15} /> : <Pin size={15} />}
                    </span>
                  </button>
                  <AnimatePresence>{isActive && <Tooltip marker={m} />}</AnimatePresence>
                </div>
              );
            })}
          </div>
          <p className="absolute bottom-6 left-6 hidden rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-emerald/80 sm:block">
            {t.hint}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
