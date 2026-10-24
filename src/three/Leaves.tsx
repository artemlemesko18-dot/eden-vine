import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mulberry32, smoothstep } from '../lib/math';
import { frame } from './frameState';
import { createLeafGeometry, createLeafMaterial } from './leafMaterial';

interface Floater {
  radius: number;
  height: number;
  speed: number;
  phase: number;
  scale: number;
  tumble: number;
}

/** Листья, парящие по орбите вокруг грозди в первых секциях. */
export function Leaves({ count }: { count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => createLeafGeometry(), []);
  const material = useMemo(() => createLeafMaterial(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const floaters = useMemo<Floater[]>(() => {
    const rand = mulberry32(5);
    return Array.from({ length: count }, (_, i) => ({
      radius: 1.6 + rand() * 1.1,
      height: (rand() - 0.5) * 2.6,
      speed: (0.08 + rand() * 0.08) * (i % 2 === 0 ? 1 : -1),
      phase: (i / Math.max(1, count)) * Math.PI * 2,
      scale: 0.3 + rand() * 0.2,
      tumble: rand() * Math.PI * 2,
    }));
  }, [count]);

  useFrame(() => {
    const u = material.uniforms;
    u.uTime.value = frame.time;
    u.uWind.value = 1.4;
    u.uAutumnMix.value = smoothstep(1, 2, frame.season) * 0.85;
    if (!mesh.current) return;

    const c = frame.cluster;
    // Видны в первых секциях, потом «улетают»
    const presence = (1 - smoothstep(1.6, 2.6, frame.t)) * frame.intro;
    floaters.forEach((f, i) => {
      const a = f.phase + frame.time * f.speed;
      dummy.position.set(
        c.x + Math.cos(a) * f.radius,
        c.y + f.height + Math.sin(frame.time * 0.5 + f.phase) * 0.18,
        c.z + Math.sin(a) * f.radius * 0.7,
      );
      dummy.rotation.set(f.tumble + frame.time * 0.3, a + Math.PI / 2, Math.sin(frame.time * 0.6 + f.phase) * 0.6);
      dummy.scale.setScalar(Math.max(1e-4, f.scale * presence));
      dummy.updateMatrix();
      mesh.current?.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={mesh} args={[geometry, material, count]} frustumCulled={false} />;
}
