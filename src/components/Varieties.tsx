import { useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ru, type Variety } from '../content/ru';
import { MQ } from '../lib/constants';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { BerryCluster } from './ui/BerryCluster';
import { MagneticButton } from './ui/MagneticButton';
import { ArrowRight } from './ui/Icons';
import { RevealText } from './ui/RevealText';

const EASE = [0.16, 1, 0.3, 1] as const;

function Dots({ value }: { value: number }) {
  return (
    <span className="flex gap-1" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`h-1.5 w-4 rounded-full ${i < value ? 'bg-emerald/80' : 'bg-emerald/12'}`} />
      ))}
    </span>
  );
}

function VarietyCard({ v, index }: { v: Variety; index: number }) {
  const [base, light] = v.colors;
  return (
    <motion.article
      data-cursor="card"
      className="glass-strong group relative flex w-[82vw] max-w-[360px] shrink-0 snap-center flex-col overflow-hidden rounded-[30px] p-6 sm:w-[340px] lg:h-[min(600px,74vh)] lg:w-[350px]"
      whileHover={{ y: -10 }}
      transition={{ duration: 0.5, ease: EASE }}
      aria-labelledby={`variety-${v.id}`}
    >
      <div
        className="relative -mx-6 -mt-6 mb-5 flex h-56 items-center justify-center lg:h-[40%]"
        style={{ background: `radial-gradient(80% 90% at 50% 30%, ${light} 0%, ${base}44 55%, transparent 100%)` }}
      >
        <span className="absolute left-5 top-5 font-display text-lg text-emerald/60">0{index + 1}</span>
        <div className="transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:-translate-y-2 group-hover:rotate-[-6deg] group-hover:scale-105">
          <div style={{ animation: `float-soft ${5 + index * 0.6}s ease-in-out infinite` }}>
            <BerryCluster colors={v.colors} size={150} />
          </div>
        </div>
      </div>
      <p className="eyebrow !text-[0.66rem] !tracking-[0.14em]">{v.kind}</p>
      <h3 id={`variety-${v.id}`} className="mt-2 font-display text-[2.1rem] leading-[1] text-emerald">
        {v.name}
      </h3>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-emerald/80">{v.text}</p>
      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Вкусовые ноты">
        {v.notes.map((n) => (
          <li key={n} className="chip !py-1 !text-[0.74rem]" style={{ background: `${light}` }}>
            {n}
          </li>
        ))}
      </ul>
      <dl className="mt-auto grid gap-2 pt-5">
        {v.stats.map((s) => (
          <div key={s.label} className="flex items-center justify-between text-[0.78rem] font-semibold text-emerald/80">
            <dt>{s.label}</dt>
            <dd className="flex items-center gap-2">
              <span className="sr-only">{s.value} из 5</span>
              <Dots value={s.value} />
            </dd>
          </div>
        ))}
      </dl>
    </motion.article>
  );
}

/** Горизонтальная галерея внутри вертикального скролла (pin + translateX) на десктопе. */
export function Varieties() {
  const section = useRef<HTMLElement>(null);
  const pinEl = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const desktop = useMediaQuery(MQ.desktop);
  const reduced = useReducedMotion();
  const pinned = desktop && !reduced;
  const v = ru.varieties;

  useLayoutEffect(() => {
    if (!pinned || !section.current) return;
    const ctx = gsap.context(() => {
      const distance = () => Math.max(0, (track.current?.scrollWidth ?? 0) - window.innerWidth);
      gsap.to(track.current, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: pinEl.current,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.7,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (bar.current) bar.current.style.transform = `scaleX(${self.progress})`;
          },
        },
      });
    }, section.current);
    return () => ctx.revert();
  }, [pinned]);

  const intro = (
    <div className="flex shrink-0 flex-col justify-center lg:w-[min(520px,38vw)] lg:pr-8">
      <p className="eyebrow mb-5 flex items-center gap-3">
        <span className="inline-block h-px w-8 bg-leaf" aria-hidden="true" />
        {v.eyebrow}
      </p>
      <RevealText as="h2" id="varieties-title" text={v.title} className="section-title text-emerald" />
      <p className="lead mt-6 max-w-md">{v.text}</p>
      {pinned && (
        <p className="mt-10 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald/70">
          Листайте
          <ArrowRight size={16} />
        </p>
      )}
    </div>
  );

  const end = (
    <div className="flex w-[82vw] max-w-[360px] shrink-0 snap-center flex-col justify-center rounded-[30px] border border-dashed border-emerald/25 p-8 sm:w-[340px] lg:h-[min(600px,74vh)]">
      <p className="font-display text-[2.2rem] leading-[1.05] text-emerald">{v.endTitle}</p>
      <div className="mt-8">
        <MagneticButton href="#pricing">
          {v.endCta}
          <ArrowRight size={16} />
        </MagneticButton>
      </div>
    </div>
  );

  return (
    <section ref={section} id="varieties" data-scene="varieties" aria-labelledby="varieties-title" className="relative">
      {pinned ? (
        <div ref={pinEl} className="relative flex h-[100svh] flex-col justify-center overflow-hidden">
          <div ref={track} className="flex w-max items-center gap-6 pl-12 pr-[8vw] pt-16 will-change-transform">
            {intro}
            {v.items.map((item, i) => (
              <VarietyCard key={item.id} v={item} index={i} />
            ))}
            {end}
          </div>
          <div className="absolute inset-x-12 bottom-8 h-px bg-emerald/15" aria-hidden="true">
            <span ref={bar} className="block h-full origin-left bg-grape" style={{ transform: 'scaleX(0)' }} />
          </div>
        </div>
      ) : (
        <div className="py-28">
          <div className="px-5 sm:px-8">{intro}</div>
          <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-6 sm:px-8 [scrollbar-width:none]">
            {v.items.map((item, i) => (
              <VarietyCard key={item.id} v={item} index={i} />
            ))}
            {end}
          </div>
        </div>
      )}
    </section>
  );
}
