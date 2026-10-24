import type { CSSProperties } from 'react';
import { ru, type Review } from '../content/ru';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { SectionHeading } from './ui/SectionHeading';

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2);
}

function ReviewCard({ r }: { r: Review }) {
  return (
    <figure className="glass-strong flex w-[300px] shrink-0 flex-col rounded-[26px] p-6 transition-transform duration-500 hover:-translate-y-1.5 sm:w-[370px]">
      <div className="flex items-center justify-between">
        <span className="font-display text-6xl leading-[0.5] text-grape/40" aria-hidden="true">
          «
        </span>
        <span className="flex gap-0.5 text-[#E9A23B]" role="img" aria-label="Оценка 5 из 5">
          {'★★★★★'.split('').map((s, i) => (
            <span key={i} aria-hidden="true">
              {s}
            </span>
          ))}
        </span>
      </div>
      <blockquote className="mt-3 flex-1 text-[0.95rem] leading-relaxed text-emerald/90">{r.text}</blockquote>
      <figcaption className="mt-5 flex items-center gap-3 border-t border-emerald/10 pt-4">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-lg font-semibold text-emerald"
          style={{ background: `radial-gradient(circle at 30% 30%, #fff 0%, ${r.hue} 70%)` }}
          aria-hidden="true"
        >
          {initials(r.name)}
        </span>
        <span className="flex-1">
          <span className="block text-[0.92rem] font-bold text-emerald">{r.name}</span>
          <span className="block text-[0.78rem] text-emerald/70">{r.city}</span>
        </span>
        <span className="chip !text-[0.7rem]">«{r.plan}»</span>
      </figcaption>
    </figure>
  );
}

function Row({ items, reverse, duration }: { items: Review[]; reverse?: boolean; duration: number }) {
  const reduced = useReducedMotion();
  return (
    <div
      className={`marquee relative ${reduced ? 'overflow-x-auto' : 'overflow-hidden'} [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]`}
    >
      <div
        className="marquee-track flex w-max gap-5 py-3 pr-5"
        data-direction={reverse ? 'reverse' : undefined}
        style={{ '--marquee-duration': `${duration}s` } as CSSProperties}
      >
        {items.map((r) => (
          <ReviewCard key={r.name} r={r} />
        ))}
        {/* Копия для бесшовной петли — скрыта от скринридеров */}
        {!reduced && (
          <div className="flex gap-5" aria-hidden="true">
            {items.map((r) => (
              <ReviewCard key={`${r.name}-copy`} r={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Две бегущие строки отзывов навстречу друг другу; пауза при наведении. */
export function Testimonials() {
  const items = ru.reviews.items;
  const second = [...items.slice(4), ...items.slice(0, 4)].reverse();
  return (
    <section id="reviews" data-scene="reviews" aria-labelledby="reviews-title" className="relative py-28 lg:py-36">
      <div className="px-5 sm:px-8">
        <SectionHeading id="reviews-title" eyebrow={ru.reviews.eyebrow} title={ru.reviews.title} align="center" />
      </div>
      <div className="mt-14 flex flex-col gap-4">
        <Row items={items} duration={75} />
        <Row items={second} reverse duration={85} />
      </div>
    </section>
  );
}
