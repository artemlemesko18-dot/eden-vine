import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei';
import { MQ } from '../lib/constants';
import { markSceneReady, setTier, stepTier, type Tier } from '../lib/sceneStore';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTier } from '../hooks/useTier';
import { SceneDriver } from './SceneDriver';
import { CameraRig } from './CameraRig';
import { Sky } from './Sky';
import { Grapes } from './Grapes';
import { Vine } from './Vine';
import { Leaves } from './Leaves';
import { Particles } from './Particles';
import { Glass } from './Glass';
import { GodRays } from './GodRays';
import { Shadows } from './Shadows';
import { Effects } from './Effects';

/** Разрешение буфера преломления: на слабых уровнях — вдвое меньше. */
function TransmissionQuality({ tier }: { tier: Tier }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.transmissionResolutionScale = tier === 'high' ? 1 : 0.5;
  }, [gl, tier]);
  return null;
}

/** Сообщает прелоадеру, что шейдеры скомпилированы и первые кадры отрисованы. */
function ReadySignal() {
  const frames = useRef(0);
  useFrame(() => {
    frames.current += 1;
    if (frames.current === 4) markSceneReady();
  });
  return null;
}

/** Процедурное «закатное» окружение для отражений — без внешних HDRI-файлов. */
function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={['#F3ECE2']} />
      <Lightformer form="rect" intensity={2.6} color="#FFF3DD" position={[0, 7, 0]} scale={[14, 8, 1]} />
      <Lightformer form="circle" intensity={6} color="#FFC978" position={[-6, 4, 3]} scale={3.5} />
      <Lightformer form="rect" intensity={2.2} color="#EAF6EE" position={[7, 1, 2]} scale={[10, 3, 1]} />
      <Lightformer form="rect" intensity={1.8} color="#E9D9FA" position={[-6, 0, -5]} scale={[9, 3, 1]} />
      <Lightformer form="ring" intensity={3.5} color="#ffffff" position={[2, 3, 7]} scale={1.8} />
      <Lightformer form="rect" intensity={1.2} color="#D9F0C0" position={[0, -6, 2]} scale={[12, 12, 1]} />
    </Environment>
  );
}

export default function Scene() {
  const tier = useTier();
  const mobile = useMediaQuery(MQ.mobile);
  const reducedMotion = useReducedMotion();
  const ratio = window.devicePixelRatio || 1;
  const dprCap = tier === 'high' ? Math.min(ratio, 2) : tier === 'medium' ? Math.min(ratio, 1.5) : 1;

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        flat
        dpr={[1, dprCap]}
        camera={{ fov: 35, near: 0.1, far: 120, position: [0, 2.6, 15] }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', stencil: false }}
        onCreated={({ gl }) => {
          gl.setClearColor('#FBF8F1');
          // Шейдеры проверены; без проверки нет синхронных запросов к GPU и шумных предупреждений драйвера.
          // Включить диагностику: добавить ?debug к адресу.
          gl.debug.checkShaderErrors = new URLSearchParams(window.location.search).has('debug');
        }}
      >
        <PerformanceMonitor
          ms={300}
          iterations={8}
          threshold={0.75}
          flipflops={4}
          bounds={(refresh) => (refresh > 90 ? [50, 80] : [42, 55])}
          onIncline={() => stepTier(1)}
          onDecline={() => stepTier(-1)}
          onFallback={() => setTier('low', true)}
        />
        <SceneDriver mobile={mobile} reducedMotion={reducedMotion} />
        <CameraRig />
        <TransmissionQuality tier={tier} />
        <ReadySignal />

        <Sky />
        <hemisphereLight args={['#FFF6E5', '#CDEBD3', 0.85]} />
        <directionalLight position={[-4, 6, 4]} intensity={1.7} color="#FFE2B8" />
        <directionalLight position={[5, 2, -3]} intensity={0.7} color="#E7D6FA" />
        <StudioEnvironment />

        <Vine leaves={mobile ? 12 : 18} />
        <Leaves count={mobile ? 3 : 6} />
        <Grapes tier={tier} count={mobile ? 72 : 110} />
        <Glass tier={tier} />
        <Particles count={mobile ? 260 : tier === 'high' ? 700 : 450} />
        <GodRays />
        {tier === 'high' && <Shadows />}
        {tier === 'high' && <Effects />}
      </Canvas>
    </div>
  );
}
