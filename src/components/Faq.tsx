import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ru, type FaqItem } from '../content/ru';
import { SectionHeading } from './ui/SectionHeading';
import { MagneticButton } from './ui/MagneticButton';
import { Mail, Plus } from './ui/Icons';

const EASE = [0.16, 1, 0.3, 1] as const;

function Item({ item, open, onToggle, index }: { item: FaqItem; open: boolean; onToggle: () => void; index: number }) {
  const id = useId();
  const buttonId = `${id}-q`;
  const panelId = `${id}-a`;
  return (
    <motion.li
      className={`rounded-[24px] border transition-colors duration-500 ${open ? 'border-white bg-white/80 shadow-[0_20px_50px_-30px_rgba(78,31,110,0.45)]' : 'border-white/70 bg-white/65'} backdrop-blur-md`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-5% 0px' }}
      transition={{ duration: 0.7, delay: index * 0.06, ease: EASE }}
    >
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          data-cursor="link"
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left font-display text-[1.35rem] leading-tight text-emerald sm:text-[1.55rem]"
        >
          {item.q}
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition-all duration-500 ${
              open ? 'rotate-45 bg-grape text-white' : 'bg-mint text-emerald'
            }`}
            aria-hidden="true"
          >
            <Plus size={18} />
          </span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="max-w-2xl px-6 pb-6 text-[0.98rem] leading-relaxed text-emerald/80">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const f = ru.faq;
  return (
    <section id="faq" data-scene="faq" aria-labelledby="faq-title" className="relative px-4 py-28 sm:px-8 lg:px-12 lg:py-36">
      <div className="mx-auto grid max-w-[1360px] gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <SectionHeading id="faq-title" eyebrow={f.eyebrow} title={f.title} text={f.text} />
            <div className="mt-8">
              <MagneticButton href="#cta" variant="glass">
                <Mail size={18} />
                {ru.cta.submit}
              </MagneticButton>
            </div>
          </div>
        </div>
        <ul className="flex flex-col gap-3 lg:col-span-7">
          {f.items.map((item, i) => (
            <Item key={item.q} item={item} index={i} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />
          ))}
        </ul>
      </div>
    </section>
  );
}
