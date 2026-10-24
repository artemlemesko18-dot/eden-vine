import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SEASONS } from '../lib/constants';
import { frame } from './frameState';

const vertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = p.xyww;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uMid;
  uniform vec3 uBottom;
  uniform vec3 uWarm;
  uniform vec3 uCool;
  uniform vec3 uSun;
  uniform vec3 uSunDir;
  uniform float uTime;
  varying vec3 vDir;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    vec3 col = mix(uBottom, uMid, smoothstep(-0.45, 0.02, h));
    col = mix(col, uTop, smoothstep(0.04, 0.7, h));

    // «Рассветный» перелив по горизонтали: тёплый у солнца, сиреневый напротив
    float side = d.x * 0.5 + 0.5;
    col = mix(col, uWarm, 0.5 * (1.0 - smoothstep(0.0, 0.55, side)) * smoothstep(-0.3, 0.35, h));
    col = mix(col, uCool, 0.45 * smoothstep(0.45, 1.0, side) * smoothstep(-0.2, 0.55, h));

    // Мягкие облачные разводы
    vec2 q = vec2(atan(d.z, d.x) * 1.4, h * 3.0);
    float n = noise(q * 2.2 + vec2(uTime * 0.012, 0.0)) * 0.6 + noise(q * 5.0 - vec2(uTime * 0.02, 0.0)) * 0.4;
    col = mix(col, vec3(1.0), smoothstep(0.55, 0.9, n) * 0.22 * smoothstep(-0.1, 0.4, h));

    // Солнце: широкое свечение и тёплое ядро
    float s = max(dot(d, normalize(uSunDir)), 0.0);
    col += uSun * (pow(s, 6.0) * 0.22 + pow(s, 48.0) * 0.45);

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

const tmpA = new THREE.Color();
const tmpB = new THREE.Color();

function seasonColor(key: 'top' | 'mid' | 'bottom' | 'warm' | 'cool', s: number, out: THREE.Color) {
  const i = Math.min(SEASONS.length - 2, Math.floor(s));
  const f = Math.min(1, Math.max(0, s - i));
  tmpA.set(SEASONS[i][key]);
  tmpB.set(SEASONS[i + 1][key]);
  return out.copy(tmpA).lerp(tmpB, f);
}

/** Небо-сфера, всегда центрированная на камере. Переливается между палитрами времён года. */
export function Sky() {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uTop: { value: new THREE.Color() },
          uMid: { value: new THREE.Color() },
          uBottom: { value: new THREE.Color() },
          uWarm: { value: new THREE.Color() },
          uCool: { value: new THREE.Color() },
          uSun: { value: new THREE.Color('#FFC978') },
          uSunDir: { value: new THREE.Vector3(-0.55, 0.62, -0.55) },
          uTime: { value: 0 },
        },
      }),
    [],
  );

  useFrame(({ camera }) => {
    const u = material.uniforms;
    const s = frame.season;
    seasonColor('top', s, u.uTop.value as THREE.Color);
    seasonColor('mid', s, u.uMid.value as THREE.Color);
    seasonColor('bottom', s, u.uBottom.value as THREE.Color);
    seasonColor('warm', s, u.uWarm.value as THREE.Color);
    seasonColor('cool', s, u.uCool.value as THREE.Color);
    u.uTime.value = frame.time;
    mesh.current?.position.copy(camera.position);
  });

  return (
    <mesh ref={mesh} material={material} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[60, 48, 32]} />
    </mesh>
  );
}
