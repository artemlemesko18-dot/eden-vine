import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import type * as THREE from 'three';
import { frame } from './frameState';

/** Мягкая контактная тень под бокалом — «ставит» его на невидимую поверхность. */
export function Shadows() {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    const g = frame.glass;
    group.current.visible = g.appear > 0.05;
    group.current.position.set(g.x, g.y + 0.002, g.z);
    group.current.scale.setScalar(Math.max(0.01, g.scale));
  });
  return (
    <group ref={group} visible={false}>
      <ContactShadows opacity={0.38} scale={3.2} blur={2.4} far={2.6} resolution={256} color="#4E1F6E" />
    </group>
  );
}
