import { useEffect, useRef } from 'react';
import { subscribeScroll, type ScrollSnapshot } from '../lib/scroll';

/** Подписка на скролл без перерисовок: колбэк пишет прямо в DOM. */
export function useScrollProgress(callback: (s: ScrollSnapshot) => void): void {
  const ref = useRef(callback);
  ref.current = callback;
  useEffect(() => subscribeScroll((s) => ref.current(s)), []);
}
