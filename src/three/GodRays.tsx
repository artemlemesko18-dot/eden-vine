import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { damp } from '../lib/math';
import { sampleNumber } from './keyframes';
import { frame } from './frameState';

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uSeed;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float across = clamp(1.0 - abs(vUv.x * 2.0 - 1.0), 0.0, 1.0);
    float beam = pow(across, 2.4);
    float along = smoothstep(0.0, 0.75, vUv.y) * (1.0 - smoothstep(0.86, 1.0, vUv.y));
    float flicker = 0.65 + 0.35 * sin(uTime * 0.45 + uSeed * 6.28) * sin(uTime * 0.23 + uSeed * 3.1);
    float a = beam * along * flicker * uIntensity;
    gl_FragColor = vec4(uColor, a);
    #include <colorspace_fragment>
  }
`;

const RAYS = [
  { x: -0.6, w: 1.5, seed: 0.1, a: 0.32 },
  { x: 0.7, w: 0.7, seed: 0.37, a: 0.4 },
  { x: 1.6, w: 1.9, seed: 0.58, a: 0.24 },
  { x: 2.9, w: 0.9, seed: 0.81, a: 0.34 },
  { x: 4.1, w: 1.4, seed: 0.23, a: 0.22 },
  { x: 5.4, w: 0.6, seed: 0.66, a: 0.3 },
] as const;

/** Мягкие лучи солнца, падающие слева сверху. Полупрозрачные плоскости с шейдером. */
export function GodRays() {
  const group = useRef<THREE.Group>(null);
  const intensity = useRef(0);
  const materials = useMemo(
    () =>
      RAYS.map(
        (r) =>
          new THREE.ShaderMaterial({
            vertexShader: vertex,
            fragmentShader: fragment,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            uniforms: {
              uTime: { value: 0 },
              uIntensity: { value: 0 },
              uSeed: { value: r.seed },
              uColor: { value: new THREE.Color('#FFD9A0') },
            },
          }),
      ),
    [],
  );

  useFrame(({ camera }, dt) => {
    const target = sampleNumber(frame.keys, frame.sT, (k) => k.rays) * frame.intro;
    intensity.current = damp(intensity.current, target, 2, dt);
    materials.forEach((m, i) => {
      m.uniforms.uTime.value = frame.time;
      m.uniforms.uIntensity.value = intensity.current * RAYS[i].a;
    });
    if (group.current) {
      // Лучи живут в пространстве, привязанном к камере, но с лёгким отставанием по X
      group.current.position.set(camera.position.x * 0.6 - 3.2, camera.position.y * 0.5 + 3.2, -4.5);
      group.current.rotation.z = -0.62 + Math.sin(frame.time * 0.1) * 0.03;
    }
  });

  return (
    <group ref={group}>
      {RAYS.map((r, i) => (
        <mesh key={i} position={[r.x, -4, 0]} material={materials[i]} renderOrder={5}>
          <planeGeometry args={[r.w, 16]} />
        </mesh>
      ))}
    </group>
  );
}
