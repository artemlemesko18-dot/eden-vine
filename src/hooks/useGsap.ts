import { useLayoutEffect, type DependencyList, type RefObject } from 'react';
import { gsap } from 'gsap';

/** gsap.context с автоматическим revert — безопасно для StrictMode и смены брейкпоинтов. */
export function useGsap(
  setup: () => void,
  scope: RefObject<HTMLElement | null>,
  deps: DependencyList = [],
): void {
  useLayoutEffect(() => {
    const ctx = gsap.context(setup, scope.current ?? undefined);
    return () => ctx.revert();
  }, deps);
}
