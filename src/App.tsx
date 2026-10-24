import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ru } from './content/ru';
import { initScroll, lockScroll, measureSections } from './lib/scroll';
import { initPointerTracking, sceneStore } from './lib/sceneStore';
import { hasWebGL } from './lib/webgl';
import { useReducedMotion } from './hooks/useReducedMotion';
import { Preloader } from './components/Preloader';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Manifesto } from './components/Manifesto';
import { HowItWorks } from './components/HowItWorks';
import { Dashboard } from './components/Dashboard';
import { Terroir } from './components/Terroir';
import { Varieties } from './components/Varieties';
import { Seasons } from './components/Seasons';
import { Testimonials } from './components/Testimonials';
import { Pricing } from './components/Pricing';
import { Faq } from './components/Faq';
import { FinalCta } from './components/FinalCta';
import { Footer } from './components/Footer';
import { SceneFallback } from './components/SceneFallback';
import { Cursor } from './components/ui/Cursor';
import { ScrollProgress } from './components/ui/ScrollProgress';

// Three.js и вся 3D-сцена — отдельный чанк, грузится параллельно с прелоадером
const Scene = lazy(() => import('./three/Scene'));

export default function App() {
  const reduced = useReducedMotion();
  const [webgl] = useState(hasWebGL);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => initScroll(reduced), [reduced]);
  useEffect(() => initPointerTracking(), []);

  useEffect(() => {
    lockScroll(loading);
  }, [loading]);

  const onReveal = useCallback(() => {
    setRevealed(true);
    if (reduced) sceneStore.intro = 1;
    else gsap.to(sceneStore, { intro: 1, duration: 2.8, ease: 'power2.inOut' });
  }, [reduced]);

  const onFinished = useCallback(() => {
    setLoading(false);
    // Шрифты и пины готовы — пересчитываем позиции всех триггеров и секций сцены
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      measureSections();
    });
  }, []);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-full focus:bg-emerald focus:px-5 focus:py-3 focus:text-cream"
      >
        {ru.a11y.skip}
      </a>

      {webgl ? (
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      ) : (
        <SceneFallback />
      )}

      {loading && <Preloader waitForScene={webgl} onReveal={onReveal} onFinished={onFinished} />}

      <Nav visible={revealed} />
      <ScrollProgress />
      <Cursor />

      <main id="main" className="relative z-10">
        <Hero play={revealed} />
        <Manifesto />
        <HowItWorks />
        <Dashboard />
        <Terroir />
        <Varieties />
        <Seasons />
        <Testimonials />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </>
  );
}
