import { useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { ru, type Plan } from '../content/ru';
import { MQ } from '../lib/constants';
import { formatNumber, typo } from '../lib/typography';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { SectionHeading } from './ui/SectionHeading';
import { Counter } from './ui/Counter';
import { MagneticButton } from './ui/MagneticButton';
import { ArrowRight, Check } from './ui/Icons';

type Period = 'month' | 'year';
const EASE = [0.16, 1, 0.3, 1] as const;

/** Карточка, наклоняющаяся за курсором. */
function Tilt({ children, className = '' }: { children: ReactNode; className?: string }) {
  const fine = useMediaQuery(MQ.finePointer);
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const rx = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });
  const enabled = fine && !reduced;

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!enabled || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 10);
    rx.set(-py * 10);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1100 }}
      onPointerMove={onMove}
      onPointerLeave={reset}
    >
      {children}
    </motion.div>
  );
}

function PlanCard({ plan, period, index }: { plan: Plan; period: Period; index: number }) {
  const p = ru.pricing;
  const price = period === 'year' ? plan.yearly : plan.monthly;
  const popular = Boolean(plan.popular);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.9, delay: index * 0.1, ease: EASE }}
      className={popular ? 'md:-my-4' : ''}
    >
      <Tilt className="h-full">
        <div className={`h-full rounded-[30px] ${popular ? 'glow-border' : ''}`}>
          <article
            className={`relative flex h-full flex-col rounded-[30px] p-7 lg:p-8 ${
              popular ? 'bg-white/90 shadow-[0_30px_80px_-30px_rgba(123,63,160,0.55)]' : 'glass'
            }`}
            aria-labelledby={`plan-${plan.id}`}
          >
            {popular && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[linear-gradient(120deg,#7B3FA0,#B8336A)] px-4 py-1.5 text-[0.72rem] font-bold uppercase tracking-[0.12em] text-white shadow-lg">
                {p.popular}
              </span>
            )}
            <h3 id={`plan-${plan.id}`} className="font-display text-[2.5rem] leading-none text-emerald">
              {plan.name}
            </h3>
            <p className="mt-2 text-[0.9rem] text-emerald/75">{plan.tagline}</p>
            <p className="mt-7 flex items-baseline gap-2">
              <Counter
                value={price}
                fromPrevious
                className={`font-display text-[3.6rem] font-medium leading-none ${popular ? 'text-grape' : 'text-emerald'}`}
              />
              <span className="text-sm font-semibold text-emerald/70">{p.perMonth}</span>
            </p>
            <p className="mt-2 h-5 text-[0.8rem] font-medium text-emerald/70">
              {period === 'year' ? typo(p.billedYearly(formatNumber(plan.yearly * 12))) : p.billedMonthly}
            </p>
            <ul className="mt-7 flex flex-1 flex-col gap-3">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-3 text-[0.92rem] leading-snug text-emerald/90">
                  <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${popular ? 'bg-grape text-white' : 'bg-mint text-leaf-deep'}`}>
                    <Check size={13} strokeWidth={2.4} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <MagneticButton href="#cta" variant={popular ? 'primary' : 'dark'} className="w-full" strength={0.18}>
                {plan.cta}
                <ArrowRight size={16} />
              </MagneticButton>
            </div>
          </article>
        </div>
      </Tilt>
    </motion.div>
  );
}

export function Pricing() {
  const [period, setPeriod] = useState<Period>('month');
  const p = ru.pricing;
  const options: { id: Period; label: string }[] = [
    { id: 'month', label: p.periods.month },
    { id: 'year', label: p.periods.year },
  ];

  return (
    <section id="pricing" data-scene="pricing" aria-labelledby="pricing-title" className="relative px-4 py-28 sm:px-8 lg:px-12 lg:py-36">
      <div className="mx-auto max-w-[1240px]">
        <SectionHeading id="pricing-title" eyebrow={p.eyebrow} title={p.title} text={p.text} align="center" />

        <div className="mt-10 flex justify-center">
          <div role="radiogroup" aria-label={p.periodsLabel} className="glass-strong relative flex rounded-full p-1.5">
            {options.map((o) => {
              const checked = period === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  data-cursor="link"
                  onClick={() => setPeriod(o.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                      e.preventDefault();
                      setPeriod(o.id === 'month' ? 'year' : 'month');
                    }
                  }}
                  tabIndex={checked ? 0 : -1}
                  className={`relative flex h-11 min-w-[7.5rem] items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition-colors duration-300 ${
                    checked ? 'text-cream' : 'text-emerald/80 hover:text-emerald'
                  }`}
                >
                  {checked && (
                    <motion.span
                      layoutId="period-pill"
                      className="absolute inset-0 rounded-full bg-emerald"
                      transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                    />
                  )}
                  <span className="relative">{o.label}</span>
                  {o.id === 'year' && (
                    <span className={`relative rounded-full px-2 py-0.5 text-[0.68rem] ${checked ? 'bg-lime text-emerald' : 'bg-[#FDE4EC] text-berry-deep'}`}>
                      {p.yearBadge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3 md:items-stretch lg:gap-7">
          {p.plans.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} period={period} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
