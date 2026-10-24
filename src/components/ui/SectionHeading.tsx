import { motion } from 'framer-motion';
import { RevealText } from './RevealText';

interface Props {
  eyebrow: string;
  title: string;
  text?: string;
  align?: 'left' | 'center';
  className?: string;
  id?: string;
}

/** Общий заголовок секции: надзаголовок, заголовок с маской и вводный абзац. */
export function SectionHeading({ eyebrow, title, text, align = 'left', className = '', id }: Props) {
  const center = align === 'center';
  return (
    <div className={`veil ${center ? 'mx-auto text-center' : ''} max-w-3xl ${className}`}>
      <motion.p
        className={`eyebrow mb-5 flex items-center gap-3 ${center ? 'justify-center' : ''}`}
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="inline-block h-px w-8 bg-leaf" aria-hidden="true" />
        {eyebrow}
      </motion.p>
      <RevealText as="h2" id={id} text={title} className="section-title text-emerald" />
      {text && (
        <motion.p
          className={`lead mt-6 ${center ? 'mx-auto' : ''} max-w-xl`}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}
