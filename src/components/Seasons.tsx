import { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ru } from '../content/ru';
import { SEASONS } from '../lib/constants';
import { sampleHex } from '../lib/color';
import { sceneStore } from '../lib/sceneStore';
import { Petals } from './ui/Petals';

const EASE = [0.16, 1, 0.3, 1] as const;
const PETALS = SEASONS.map((s) => s.petal);

/**
 * Весна → лето → осень. Пока блок «прилип», скролл плавно смешивает палитры:
 * CSS-переменные страницы и небо 3D-сцены (через sceneStore.seasonTrigger).
 */
export function Seasons() {
  const section = useRef<HTMLElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const s = ru.seasons;

  useLayoutEffect(() => {
    const el = section.current;
    if (!el) return;
    const root = document.documentElement;
    const ctx = gsap.context(() => {
      const st = ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const x = self.progress * 2;
          root.style.setProperty('--season-petal', sampleHex(PETALS, x));
          const idx = Math.min(2, Math.floor(self.progress * 3));
          if (idx !== activeRef.current) {
            activeRef.current = idx;
            setActive(idx);
          }
          if (indicator.current) indicator.current.style.transform = `scaleX(${self.progress})`;
        },
      });
      sceneStore.seasonTrigger = st;
    }, el);
    return () => {
      sceneStore.seasonTrigger = null;
      ctx.revert();
    };
  }, []);

  const item = s.items[active];

  return (
    <section ref={section} id="seasons" data-scene="seasons" aria-labelledby="seasons-title" className="relative h-[300vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <Petals count={26} />
        <div className="relative mx-auto flex h-full max-w-[1360px] flex-col justify-end px-5 pb-14 pt-28 sm:px-8 lg:justify-center lg:px-12 lg:pb-0">
          <p className="eyebrow mb-4 flex items-center gap-3">
            <span className="inline-block h-px w-8 bg-leaf" aria-hidden="true" />
            {s.eyebrow}
          </p>
          <h2 id="seasons-title" className="font-display text-[clamp(1.6rem,2.6vw,2.4rem)] text-emerald/80">
            {s.title}
          </h2>

          <div className="veil relative mt-3 min-h-[19rem] max-w-xl sm:min-h-[21rem]" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 50, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -40, filter: 'blur(8px)' }}
                transition={{ duration: 0.7, ease: EASE }}
              >
                <p
                  className="font-display text-[clamp(4.5rem,13vw,11rem)] italic leading-[0.85] tracking-[-0.04em]"
                  style={{ color: SEASONS[active].accent }}
                >
                  {item.name}
                </p>
                <p className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="font-display text-[2rem] leading-none text-emerald">{item.title}</span>
                  <span className="text-sm font-semibold text-emerald/70">{item.months}</span>
                </p>
                <p className="lead mt-4 max-w-md">{item.text}</p>
                <p className="mt-5 inline-flex items-baseline gap-2 rounded-2xl bg-white/70 px-4 py-2.5 backdrop-blur">
                  <span className="font-display text-2xl text-emerald">{item.stat.value}</span>
                  <span className="text-[0.8rem] font-semibold text-emerald/75">{item.stat.label}</span>
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 max-w-xl lg:mt-14" aria-hidden="true">
            <div className="flex justify-between text-xs font-bold uppercase tracking-[0.16em]">
              {s.items.map((it, i) => (
                <span key={it.id} className={`transition-colors duration-500 ${i === active ? 'text-emerald' : 'text-emerald/45'}`}>
                  {it.name}
                </span>
              ))}
            </div>
            <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-emerald/10">
              <span
                ref={indicator}
                className="block h-full origin-left rounded-full bg-[linear-gradient(90deg,#F4A6C0,#B7E26B,#FFC978,#EE9158)]"
                style={{ transform: 'scaleX(0)' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
