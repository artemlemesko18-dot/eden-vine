import { useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ru } from '../content/ru';
import { scrollToTarget } from '../lib/scroll';
import { useGsap } from '../hooks/useGsap';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { RevealText } from './ui/RevealText';
import { MagneticButton } from './ui/MagneticButton';
import { ArrowDown, ArrowRight, Sparkle } from './ui/Icons';

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero({ play }: { play: boolean }) {
  const section = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const h = ru.hero;

  // Лёгкий параллакс: заголовки разъезжаются при уходе секции
  useGsap(
    () => {
      if (reduced) return;
      const st = { trigger: section.current, start: 'top top', end: 'bottom top', scrub: true };
      gsap.to('[data-hero-top]', { yPercent: -60, opacity: 0.2, ease: 'none', scrollTrigger: st });
      gsap.to('[data-hero-bottom]', { yPercent: 40, xPercent: 6, opacity: 0.2, ease: 'none', scrollTrigger: st });
      gsap.to('[data-hero-fade]', { y: -60, opacity: 0, ease: 'none', scrollTrigger: { ...st, end: '60% top' } });
    },
    section,
    [reduced],
  );

  const appear = (delay: number) => ({
    initial: { opacity: 0, y: 24 },
    animate: play ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 },
    transition: { duration: 1, delay: reduced ? 0 : delay, ease: EASE },
  });

  const titleClass =
    'font-display font-medium leading-[0.86] tracking-[-0.035em] text-emerald [text-shadow:0_2px_40px_rgba(251,248,241,0.9)] text-[clamp(3.3rem,10.4vw,11.5rem)]';

  return (
    <section
      ref={section}
      id="top"
      data-scene="hero"
      aria-labelledby="hero-title"
      className="relative flex min-h-[100svh] flex-col overflow-hidden px-5 pb-10 pt-28 sm:px-8 lg:h-[100svh] lg:min-h-[640px] lg:px-12 lg:pt-32"
    >
      <motion.p {...appear(0.1)} className="chip self-start backdrop-blur-sm">
        <Sparkle size={14} className="text-grape" />
        {h.eyebrow}
      </motion.p>

      <h1 id="hero-title" className="sr-only">
        {h.titleTop} {h.titleBottomA} {h.titleBottomB}
      </h1>

      <div className="relative mt-auto flex flex-col lg:mt-6 lg:flex-1" aria-hidden="true">
        <div data-hero-top>
          <RevealText
            text={h.titleTop}
            split="chars"
            trigger="manual"
            play={play}
            delay={0.05}
            className={`${titleClass} block`}
          />
        </div>
        <div data-hero-bottom className="lg:mt-auto lg:self-end lg:pb-[13vh] lg:text-right">
          <RevealText
            text={`${h.titleBottomA} *${h.titleBottomB}*`}
            split="chars"
            trigger="manual"
            play={play}
            delay={0.35}
            className={`${titleClass} block`}
            emphasisClassName="italic text-gradient-grape pr-[0.06em]"
          />
        </div>
      </div>

      <div
        data-hero-fade
        className="relative z-10 mt-7 flex flex-col gap-8 lg:absolute lg:inset-x-12 lg:bottom-10 lg:mt-0 lg:flex-row lg:items-end lg:justify-between"
      >
        <div className="veil max-w-[30rem]">
          <motion.p {...appear(0.7)} className="lead text-emerald/80 [text-shadow:0_1px_20px_rgba(251,248,241,0.95)]">
            {h.text}
          </motion.p>
          <motion.div {...appear(0.85)} className="mt-7 flex flex-wrap items-center gap-3">
            <MagneticButton href="#pricing" size="lg">
              {h.primary}
              <ArrowRight size={18} />
            </MagneticButton>
            <MagneticButton href="#how" variant="glass" size="lg">
              {h.secondary}
            </MagneticButton>
          </motion.div>
        </div>

        <motion.dl {...appear(1)} className="hidden gap-8 xl:flex">
          {h.stats.map((s) => (
            <div key={s.label} className="max-w-[9rem]">
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-display text-[2.6rem] leading-none text-emerald">{s.value}</dd>
              <dd className="mt-2 text-[0.8rem] leading-snug text-emerald/75">{s.label}</dd>
            </div>
          ))}
        </motion.dl>
      </div>

      <motion.a
        href="#manifest"
        {...appear(1.2)}
        data-cursor="link"
        onClick={(e) => {
          e.preventDefault();
          scrollToTarget('#manifest');
        }}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-[0.7rem] font-bold uppercase tracking-[0.3em] text-emerald/75 lg:flex"
      >
        {h.scroll}
        <span className="relative block h-12 w-px overflow-hidden bg-emerald/15" aria-hidden="true">
          <span className="absolute inset-x-0 top-0 block h-1/2 bg-grape" style={{ animation: 'scroll-cue 2.2s cubic-bezier(0.65,0,0.35,1) infinite' }} />
        </span>
        <ArrowDown size={14} />
      </motion.a>
    </section>
  );
}
