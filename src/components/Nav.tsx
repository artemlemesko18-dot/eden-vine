import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ru } from '../content/ru';
import { lockScroll, scrollToTarget } from '../lib/scroll';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { Logo } from './ui/Logo';
import { MagneticButton } from './ui/MagneticButton';
import { ArrowRight, Close, Menu } from './ui/Icons';

const EASE = [0.16, 1, 0.3, 1] as const;

/** Стеклянная панель: прячется при скролле вниз, возвращается при скролле вверх. */
export function Nav({ visible }: { visible: boolean }) {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const state = useRef({ hidden: false, scrolled: false });
  const burger = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);

  useScrollProgress(({ y, direction }) => {
    const h = y > 160 && direction === 1;
    const s = y > 30;
    if (h !== state.current.hidden) {
      state.current.hidden = h;
      setHidden(h);
    }
    if (s !== state.current.scrolled) {
      state.current.scrolled = s;
      setScrolled(s);
    }
  });

  useEffect(() => {
    if (!open) return;
    lockScroll(true);
    firstLink.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      lockScroll(false);
      window.removeEventListener('keydown', onKey);
      burger.current?.focus();
    };
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    // Даём оверлею закрыться и разблокировать скролл
    window.setTimeout(() => scrollToTarget(href), open ? 350 : 0);
  };

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4"
        initial={false}
        animate={{ y: !visible || (hidden && !open) ? '-130%' : '0%' }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <nav
          aria-label="Основная навигация"
          className={`mx-auto flex h-16 max-w-[1360px] items-center 2xl:max-w-none justify-between gap-4 rounded-full pl-4 pr-2 transition-[background-color,box-shadow,border-color] duration-500 sm:pl-5 ${
            scrolled ? 'glass-strong' : 'border border-white/50 bg-white/30 backdrop-blur-md'
          }`}
        >
          <Logo />
          <ul className="hidden items-center gap-7 lg:flex">
            {ru.nav.links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  data-cursor="link"
                  className="draw-link text-[0.9rem] font-medium text-emerald/85 transition-colors hover:text-emerald"
                  onClick={(e) => {
                    e.preventDefault();
                    go(l.href);
                  }}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <a
              href="#pricing"
              data-cursor="link"
              className="draw-link hidden px-3 text-[0.9rem] font-semibold text-emerald sm:inline-block"
              onClick={(e) => {
                e.preventDefault();
                go('#pricing');
              }}
            >
              {ru.nav.login}
            </a>
            <MagneticButton href="#cta" variant="dark" className="!h-11 !px-5 max-[379px]:hidden" strength={0.25}>
              {ru.nav.start}
              <ArrowRight size={16} />
            </MagneticButton>
            <button
              ref={burger}
              type="button"
              className="grid h-11 w-11 place-items-center rounded-full bg-white/70 text-emerald lg:hidden"
              aria-label={open ? ru.a11y.menuClose : ru.a11y.menuOpen}
              aria-expanded={open}
              aria-controls="mobile-menu"
              data-cursor="link"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <Close size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label={ru.nav.menuTitle}
            className="fixed inset-0 z-40 flex flex-col overflow-y-auto px-6 pb-10 pt-28 lg:hidden"
            style={{ background: 'var(--gradient-dawn)' }}
            initial={{ clipPath: 'circle(0% at 92% 6%)' }}
            animate={{ clipPath: 'circle(150% at 92% 6%)' }}
            exit={{ clipPath: 'circle(0% at 92% 6%)' }}
            transition={{ duration: 0.75, ease: EASE }}
          >
            <ul className="flex flex-col gap-1">
              {ru.nav.links.map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 + i * 0.05, ease: EASE }}
                >
                  <a
                    ref={i === 0 ? firstLink : undefined}
                    href={l.href}
                    className="flex items-baseline gap-4 py-2 font-display text-[2.6rem] leading-tight text-emerald"
                    onClick={(e) => {
                      e.preventDefault();
                      go(l.href);
                    }}
                  >
                    <span className="font-sans text-sm font-semibold text-leaf-deep">0{i + 1}</span>
                    {l.label}
                  </a>
                </motion.li>
              ))}
            </ul>
            <motion.div
              className="mt-auto flex flex-wrap gap-3 pt-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
            >
              <MagneticButton variant="glass" onClick={() => go('#pricing')}>
                {ru.nav.login}
              </MagneticButton>
              <MagneticButton variant="primary" onClick={() => go('#cta')}>
                {ru.nav.start}
                <ArrowRight size={16} />
              </MagneticButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
