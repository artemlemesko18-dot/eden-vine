import { Fragment, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { ru } from '../content/ru';
import { useGsap } from '../hooks/useGsap';
import { useReducedMotion } from '../hooks/useReducedMotion';

/** Манифест: слова проявляются по мере скролла (scrub), пока блок «прилип» к экрану. */
export function Manifesto() {
  const section = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const m = ru.manifest;

  const words = useMemo(() => {
    const out: { w: string; em: boolean }[] = [];
    m.text.split('*').forEach((chunk, i) =>
      chunk
        .split(' ')
        .filter(Boolean)
        .forEach((w) => out.push({ w, em: i % 2 === 1 })),
    );
    return out;
  }, [m.text]);

  useGsap(
    () => {
      if (reduced) return;
      const els = gsap.utils.toArray<HTMLElement>('[data-word]');
      gsap.fromTo(
        els,
        { opacity: 0.14 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.5,
          scrollTrigger: { trigger: section.current, start: 'top 55%', end: 'bottom 90%', scrub: 0.6 },
        },
      );
      gsap.fromTo(
        '[data-manifest-sign]',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          scrollTrigger: { trigger: section.current, start: '62% 70%', end: '70% 70%', scrub: true },
        },
      );
    },
    section,
    [reduced],
  );

  return (
    <section
      ref={section}
      id="manifest"
      data-scene="manifest"
      aria-labelledby="manifest-label"
      className="relative h-[200vh] lg:h-[230vh]"
    >
      <div className="sticky top-0 flex h-[100svh] items-center px-5 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-[1360px]">
          <div className="veil inline-block">
            <p id="manifest-label" className="eyebrow mb-8 flex items-center gap-3">
              <span className="inline-block h-px w-8 bg-leaf" aria-hidden="true" />
              {m.eyebrow}
            </p>
            <p className="max-w-[19ch] font-display text-[clamp(1.75rem,3.5vw,3.7rem)] font-medium leading-[1.1] tracking-[-0.02em] text-emerald [text-shadow:0_2px_30px_rgba(251,248,241,0.85)] lg:max-w-[25ch]">
              {words.map((t, i) => (
                <Fragment key={i}>
                  <span data-word className={t.em ? 'italic text-grape' : undefined}>
                    {t.w}
                  </span>
                  {i < words.length - 1 ? ' ' : null}
                </Fragment>
              ))}
            </p>
            <p data-manifest-sign className="mt-10 flex items-center gap-4 text-sm font-semibold text-emerald/80">
              <svg width="44" height="20" viewBox="0 0 44 20" aria-hidden="true">
                <path d="M2 14 C 10 2, 16 2, 18 10 S 26 18, 30 8 S 40 4, 42 10" fill="none" stroke="#7B3FA0" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              {m.signature}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
