import { useId, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ru } from '../content/ru';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { RevealText } from './ui/RevealText';
import { MagneticButton } from './ui/MagneticButton';
import { Confetti } from './ui/Confetti';
import { ArrowRight, Check } from './ui/Icons';

const EASE = [0.16, 1, 0.3, 1] as const;
// Допускает кириллические домены (почта.рф)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u;

type Status = 'idle' | 'sending' | 'success';
type ErrorKey = keyof typeof ru.cta.errors;

export function FinalCta() {
  const c = ru.cta;
  const reduced = useReducedMotion();
  const id = useId();
  const [email, setEmail] = useState('');
  const [adult, setAdult] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<'email' | 'age', ErrorKey>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [burst, setBurst] = useState(0);

  const validate = () => {
    const next: Partial<Record<'email' | 'age', ErrorKey>> = {};
    const value = email.trim();
    if (!value) next.email = 'empty';
    else if (!EMAIL_RE.test(value)) next.email = 'invalid';
    if (!adult) next.age = 'age';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (status === 'sending' || !validate()) return;
    setStatus('sending');
    window.setTimeout(() => {
      setStatus('success');
      if (!reduced) setBurst((b) => b + 1);
    }, 900);
  };

  const reset = () => {
    setEmail('');
    setAdult(false);
    setErrors({});
    setStatus('idle');
  };

  const emailError = errors.email ? c.errors[errors.email] : null;
  const ageError = errors.age ? c.errors[errors.age] : null;

  return (
    <section
      id="cta"
      data-scene="cta"
      aria-labelledby="cta-title"
      className="relative flex min-h-[100svh] items-start px-4 pb-[52vh] pt-28 sm:px-8 lg:items-center lg:px-12 lg:pb-28"
    >
      <Confetti burst={burst} />
      <div className="mx-auto grid w-full max-w-[1360px] lg:grid-cols-12">
        <div className="veil lg:col-span-6">
          <p className="eyebrow mb-5 flex items-center gap-3">
            <span className="inline-block h-px w-8 bg-leaf" aria-hidden="true" />
            {c.eyebrow}
          </p>
          <RevealText
            as="h2"
            id="cta-title"
            text={c.title}
            split="chars"
            stagger={0.025}
            className="font-display text-[clamp(3.1rem,7.4vw,7.6rem)] font-medium leading-[0.88] tracking-[-0.035em] text-emerald"
          />
          <p className="lead mt-6 max-w-md">{c.text}</p>

          <div className="glass-strong mt-9 max-w-xl rounded-[28px] p-5 sm:p-6">
            <AnimatePresence mode="wait">
              {status !== 'success' ? (
                <motion.form
                  key="form"
                  noValidate
                  onSubmit={onSubmit}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
                  transition={{ duration: 0.45, ease: EASE }}
                >
                  <label htmlFor={`${id}-email`} className="mb-2 block text-sm font-bold text-emerald">
                    {c.emailLabel}
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      id={`${id}-email`}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((er) => ({ ...er, email: undefined }));
                      }}
                      placeholder={c.placeholder}
                      aria-invalid={Boolean(emailError)}
                      aria-describedby={emailError ? `${id}-email-error` : undefined}
                      className={`h-14 w-full min-w-0 rounded-full border sm:flex-1 bg-white/90 px-6 text-base text-emerald outline-none transition-[border-color,box-shadow] placeholder:text-emerald/55 focus:border-grape focus:shadow-[0_0_0_4px_rgba(201,167,232,0.45)] ${
                        emailError ? 'border-berry-deep' : 'border-emerald/15'
                      }`}
                    />
                    <MagneticButton type="submit" size="lg" disabled={status === 'sending'} strength={0.2}>
                      {status === 'sending' ? c.sending : c.submit}
                      {status !== 'sending' && <ArrowRight size={18} />}
                    </MagneticButton>
                  </div>
                  <AnimatePresence>
                    {emailError && (
                      <motion.p
                        id={`${id}-email-error`}
                        role="alert"
                        className="mt-2 pl-4 text-sm font-semibold text-berry-deep"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        {emailError}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-emerald/85">
                    <input
                      type="checkbox"
                      checked={adult}
                      onChange={(e) => {
                        setAdult(e.target.checked);
                        if (errors.age) setErrors((er) => ({ ...er, age: undefined }));
                      }}
                      aria-invalid={Boolean(ageError)}
                      aria-describedby={ageError ? `${id}-age-error` : undefined}
                      className="peer sr-only"
                    />
                    <span
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-grape ${
                        adult ? 'border-grape bg-grape text-white' : ageError ? 'border-berry-deep bg-white' : 'border-emerald/30 bg-white'
                      }`}
                      aria-hidden="true"
                    >
                      {adult && <Check size={13} strokeWidth={3} />}
                    </span>
                    {c.consent}
                  </label>
                  <AnimatePresence>
                    {ageError && (
                      <motion.p
                        id={`${id}-age-error`}
                        role="alert"
                        className="mt-2 pl-8 text-sm font-semibold text-berry-deep"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        {ageError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <p className="mt-4 text-[0.78rem] text-emerald/65">{c.privacy}</p>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  role="status"
                  className="flex flex-col items-start gap-4 py-2"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: EASE }}
                >
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-[linear-gradient(135deg,#B7E26B,#3FA66B)] text-white shadow-[0_12px_30px_-10px_rgba(63,166,107,0.7)]">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <motion.path
                        d="M5 12.5l4.2 4.2L19 7"
                        stroke="currentColor"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
                      />
                    </svg>
                  </span>
                  <p className="font-display text-[2.2rem] leading-none text-emerald">{c.successTitle}</p>
                  <p className="text-[0.98rem] leading-relaxed text-emerald/80">{c.successText}</p>
                  <button type="button" onClick={reset} data-cursor="link" className="draw-link text-sm font-bold text-grape">
                    {c.again}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
