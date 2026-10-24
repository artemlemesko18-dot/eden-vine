import { motion } from 'framer-motion';
import { ru } from '../content/ru';
import { scrollToTarget } from '../lib/scroll';
import { LogoMark } from './ui/Logo';
import { ArrowUp, Mail, Telegram, Video, Vk } from './ui/Icons';

const SOCIAL_ICONS = { telegram: Telegram, vk: Vk, video: Video, mail: Mail } as const;
const EASE = [0.16, 1, 0.3, 1] as const;

export function Footer() {
  const f = ru.footer;
  return (
    <footer data-scene="footer" className="relative overflow-hidden px-4 pb-8 pt-20 sm:px-8 lg:px-12">
      <div className="glass-strong mx-auto max-w-[1360px] rounded-[36px] px-6 pb-8 pt-12 sm:px-10 lg:px-14">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3">
              <LogoMark size={44} />
              <span className="font-display text-3xl font-semibold text-emerald">{ru.brand.name}</span>
            </div>
            <p className="mt-4 max-w-xs text-[0.95rem] leading-relaxed text-emerald/75">{f.tagline}</p>
            <ul className="mt-6 flex gap-2.5">
              {f.socials.map((s) => {
                const Icon = SOCIAL_ICONS[s.id];
                return (
                  <li key={s.id}>
                    <a
                      href="#cta"
                      aria-label={s.label}
                      title={s.label}
                      data-cursor="link"
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToTarget('#cta');
                      }}
                      className="grid h-11 w-11 place-items-center rounded-full bg-white/80 text-emerald transition-all duration-300 hover:-translate-y-1 hover:bg-grape hover:text-white"
                    >
                      <Icon size={19} />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
          <nav aria-label="Ссылки в подвале" className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8">
            {f.columns.map((col) => (
              <div key={col.title}>
                <p className="eyebrow !text-[0.68rem]">{col.title}</p>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        data-cursor="link"
                        className="draw-link text-[0.95rem] text-emerald/85 hover:text-emerald"
                        onClick={(e) => {
                          e.preventDefault();
                          scrollToTarget(l.href);
                        }}
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <motion.p
          aria-hidden="true"
          className="mt-16 select-none whitespace-nowrap text-center font-display text-[clamp(3.6rem,15.5vw,15rem)] font-semibold leading-[0.8] tracking-[-0.05em] text-gradient-grape"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: EASE }}
        >
          {ru.brand.name}
        </motion.p>

        <div className="mt-10 flex flex-col gap-4 border-t border-emerald/10 pt-6 text-[0.8rem] text-emerald/70 md:flex-row md:items-center md:justify-between">
          <p>{f.copyright}</p>
          <p className="font-bold text-emerald">{f.warning}</p>
          <button
            type="button"
            data-cursor="link"
            onClick={() => scrollToTarget(0)}
            className="inline-flex items-center gap-2 self-start font-bold text-emerald md:self-auto"
          >
            {f.toTop}
            <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald text-cream">
              <ArrowUp size={16} />
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
}
