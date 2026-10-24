import { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ru } from '../content/ru';
import { MQ } from '../lib/constants';
import { sceneStore } from '../lib/sceneStore';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { SectionHeading } from './ui/SectionHeading';
import { Grape, LeafIcon, Sparkle, Sun } from './ui/Icons';

const EASE = [0.16, 1, 0.3, 1] as const;
const STEP_ICONS = [LeafIcon, Sparkle, Sun, Grape] as const;

/**
 * Четыре шага. На десктопе секция закрепляется (pin), шаги меняются скроллом,
 * а лоза в 3D проходит путь росток → цветение → завязь → созревание.
 */
export function HowItWorks() {
  const section = useRef<HTMLElement>(null);
  const pinEl = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLSpanElement>(null);
  const desktop = useMediaQuery(MQ.desktop);
  const reduced = useReducedMotion();
  const pinned = desktop && !reduced;
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const steps = ru.how.steps;

  useLayoutEffect(() => {
    const el = section.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const update = (self: ScrollTrigger) => {
        const p = self.progress;
        const idx = Math.min(steps.length - 1, Math.floor(p * steps.length * 0.999 + 0.0001));
        if (idx !== activeRef.current) {
          activeRef.current = idx;
          setActive(idx);
        }
        if (rail.current) rail.current.style.transform = `scaleY(${p})`;
      };
      const st = pinned
        ? ScrollTrigger.create({
            trigger: pinEl.current,
            start: 'top top',
            end: () => `+=${window.innerHeight * 3}`,
            pin: true,
            anticipatePin: 1,
            onUpdate: update,
          })
        : ScrollTrigger.create({ trigger: el, start: 'top 60%', end: 'bottom 60%', onUpdate: update });
      sceneStore.howTrigger = st;
    }, el);
    return () => {
      sceneStore.howTrigger = null;
      ctx.revert();
    };
  }, [pinned, steps.length]);

  const step = steps[active];
  const ActiveIcon = STEP_ICONS[active];

  return (
    <section ref={section} id="how" data-scene="how" aria-labelledby="how-title" className="relative">
      {pinned ? (
        <div ref={pinEl} className="relative h-[100svh] overflow-hidden px-12">
          <div className="mx-auto grid h-full max-w-[1360px] grid-cols-12 items-center gap-8 pt-16">
            <div className="veil col-span-6 xl:col-span-5">
              <p className="eyebrow mb-5 flex items-center gap-3">
                <span className="inline-block h-px w-8 bg-leaf" aria-hidden="true" />
                {ru.how.eyebrow}
              </p>
              <h2 id="how-title" className="section-title mb-10 !text-[clamp(2.4rem,4vw,4rem)]">
                {ru.how.title}
              </h2>

              <div className="flex gap-8">
                {/* Прогресс-линия */}
                <div className="relative flex w-6 shrink-0 flex-col items-center" aria-hidden="true">
                  <span className="absolute inset-y-2 w-px bg-emerald/15" />
                  <span
                    ref={rail}
                    className="absolute inset-x-0 top-2 mx-auto block h-[calc(100%-1rem)] w-[3px] origin-top rounded-full bg-[linear-gradient(180deg,#B7E26B,#3FA66B,#C9A7E8,#7B3FA0)]"
                    style={{ transform: 'scaleY(0)' }}
                  />
                  {steps.map((s, i) => (
                    <span
                      key={s.stage}
                      className={`relative z-10 my-auto block h-3.5 w-3.5 rounded-full border-2 transition-all duration-500 ${
                        i <= active ? 'scale-110 border-grape bg-white' : 'border-emerald/25 bg-cream'
                      }`}
                    />
                  ))}
                </div>

                <div className="min-h-[22rem] flex-1" aria-live="polite">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={active}
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -30 }}
                      transition={{ duration: 0.55, ease: EASE }}
                    >
                      <div className="flex items-end gap-5">
                        <span className="font-display text-[8.5rem] font-medium leading-[0.8] text-gradient-grape">
                          0{active + 1}
                        </span>
                        <span className="chip mb-3">
                          <ActiveIcon size={15} className="text-grape" />
                          {step.stage}
                        </span>
                      </div>
                      <h3 className="mt-6 font-display text-[2.6rem] leading-[1] text-emerald">{step.title}</h3>
                      <p className="lead mt-4 max-w-md">{step.text}</p>
                      <p className="mt-5 text-sm font-semibold text-leaf-deep">{step.note}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
            <div className="col-span-6 col-start-7 flex h-full flex-col justify-end pb-12 xl:col-span-6 xl:col-start-7">
              <ol className="ml-auto flex gap-2" aria-label="Этапы">
                {steps.map((s, i) => (
                  <li
                    key={s.stage}
                    className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-all duration-500 ${
                      i === active ? 'bg-emerald text-cream' : 'bg-white/60 text-emerald/70'
                    }`}
                  >
                    {s.stage}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-5 py-28 sm:px-8">
          <SectionHeading id="how-title" eyebrow={ru.how.eyebrow} title={ru.how.title} text={ru.how.text} />
          <ol className="relative mt-[48vh] flex flex-col gap-5 sm:mt-[40vh]">
            {steps.map((s, i) => {
              const Icon = STEP_ICONS[i];
              return (
              <motion.li
                key={s.stage}
                className="glass-strong rounded-[28px] p-6"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-15% 0px' }}
                transition={{ duration: 0.8, ease: EASE }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-6xl leading-none text-gradient-grape">0{i + 1}</span>
                  <span className="chip">
                    <Icon size={15} className="text-grape" />
                    {s.stage}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-3xl leading-tight text-emerald">{s.title}</h3>
                <p className="mt-3 text-[0.98rem] leading-relaxed text-emerald/80">{s.text}</p>
                <p className="mt-4 text-sm font-semibold text-leaf-deep">{s.note}</p>
              </motion.li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}
