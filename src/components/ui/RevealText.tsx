import { Fragment, useLayoutEffect, useMemo, useRef, type ElementType } from 'react';
import { gsap } from 'gsap';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface Token {
  word: string;
  emphasis: boolean;
}

/** Разбивает текст на слова; фрагменты в *звёздочках* помечаются как акцентные. */
function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  text.split('*').forEach((chunk, i) => {
    chunk
      .split(' ')
      .filter(Boolean)
      .forEach((word) => tokens.push({ word, emphasis: i % 2 === 1 }));
  });
  return tokens;
}

interface Props {
  text: string;
  id?: string;
  as?: ElementType;
  className?: string;
  emphasisClassName?: string;
  split?: 'words' | 'chars';
  /** scroll — появляется при входе в экран; manual — по флагу play. */
  trigger?: 'scroll' | 'manual';
  play?: boolean;
  delay?: number;
  stagger?: number;
  duration?: number;
}

/** Заголовок, который «выезжает» снизу из-под маски по словам или буквам. */
export function RevealText({
  text,
  id,
  as: Tag = 'span',
  className,
  emphasisClassName = 'italic text-gradient-grape',
  split = 'words',
  trigger = 'scroll',
  play = true,
  delay = 0,
  stagger,
  duration = 1.1,
}: Props) {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const tokens = useMemo(() => tokenize(text), [text]);
  const plain = text.replace(/\*/g, '');

  // Прячем до первой отрисовки, чтобы не было вспышки текста
  useLayoutEffect(() => {
    if (reduced || !root.current) return;
    const inners = root.current.querySelectorAll('[data-reveal]');
    gsap.set(inners, { yPercent: 115, rotate: 3 });
  }, [reduced, tokens]);

  useLayoutEffect(() => {
    if (reduced || !root.current) return;
    if (trigger === 'manual' && !play) return;
    const el = root.current;
    const ctx = gsap.context(() => {
      const inners = el.querySelectorAll('[data-reveal]');
      gsap.to(inners, {
        yPercent: 0,
        rotate: 0,
        duration,
        delay,
        ease: 'expo.out',
        stagger: stagger ?? (split === 'chars' ? 0.028 : 0.06),
        scrollTrigger: trigger === 'scroll' ? { trigger: el, start: 'top 88%', once: true } : undefined,
      });
    }, el);
    return () => ctx.revert();
  }, [reduced, trigger, play, delay, stagger, duration, split, tokens]);

  return (
    <Tag ref={root} id={id} className={className} aria-label={plain}>
      {tokens.map((t, i) => (
        <Fragment key={i}>
          <span className="reveal-mask" aria-hidden="true">
            {split === 'chars' ? (
              Array.from(t.word).map((c, j) => (
                <span key={j} data-reveal className={`reveal-inner ${t.emphasis ? emphasisClassName : ''}`}>
                  {c}
                </span>
              ))
            ) : (
              <span data-reveal className={`reveal-inner ${t.emphasis ? emphasisClassName : ''}`}>
                {t.word}
              </span>
            )}
          </span>
          {i < tokens.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </Tag>
  );
}
