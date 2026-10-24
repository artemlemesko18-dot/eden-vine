import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SEASONS } from '../lib/constants';
import { damp, mulberry32 } from '../lib/math';
import { frame } from './frameState';

const vertex = /* glsl */ `
  attribute vec4 aData; // размер, скорость, фаза, тип (0 пыльца, 1 светлячок, 2 лепесток)
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uBoost;
  varying float vType;
  varying float vAlpha;
  varying float vRot;

  void main() {
    vec3 p = position;
    float speed = aData.y;
    float ph = aData.z;
    // Пыльца и светлячки поднимаются, лепестки падают; всё бесконечно «заворачивается»
    p.y = mod(p.y + uTime * speed * 0.22 + uBoost * speed + 4.5, 10.0) - 4.5;
    p.x += sin(uTime * 0.35 + ph) * 0.45 + sin(uTime * 0.9 + ph * 2.0) * 0.08;
    p.z += cos(uTime * 0.28 + ph) * 0.35;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aData.x * uPixelRatio / -mv.z;

    vType = aData.w;
    vRot = ph + uTime * 0.7 * abs(speed) * 3.0;
    float edge = smoothstep(-4.5, -3.2, p.y) * (1.0 - smoothstep(4.0, 5.5, p.y));
    float twinkle = vType > 0.5 && vType < 1.5 ? 0.45 + 0.55 * sin(uTime * 2.2 + ph * 5.0) : 0.8 + 0.2 * sin(uTime + ph);
    vAlpha = edge * twinkle;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uPollen;
  uniform vec3 uFirefly;
  uniform vec3 uPetal;
  uniform float uOpacity;
  varying float vType;
  varying float vAlpha;
  varying float vRot;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    vec3 col;
    float a;
    if (vType < 0.5) {
      float d = length(c);
      a = (1.0 - smoothstep(0.0, 0.5, d));
      a *= a;
      col = uPollen;
    } else if (vType < 1.5) {
      float d = length(c);
      float halo = (1.0 - smoothstep(0.0, 0.5, d));
      float core = (1.0 - smoothstep(0.0, 0.14, d));
      a = halo * halo * 0.7 + core;
      col = uFirefly * (1.0 + core * 1.6);
    } else {
      float cs = cos(vRot);
      float sn = sin(vRot);
      vec2 r = vec2(c.x * cs - c.y * sn, c.x * sn + c.y * cs);
      float d = length(r * vec2(1.0, 2.1));
      a = (1.0 - smoothstep(0.3, 0.44, d));
      col = mix(uPetal, vec3(1.0), 0.4 * (1.0 - d * 2.2));
    }
    a *= vAlpha * uOpacity;
    if (a < 0.01) discard;
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
  }
`;

interface Props {
  count: number;
}

export function Particles({ count }: Props) {
  const points = useRef<THREE.Points>(null);
  const boost = useRef(0);

  const geometry = useMemo(() => {
    const rand = mulberry32(11);
    const pos = new Float32Array(count * 3);
    const data = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      const type = i % 10 < 6 ? 0 : i % 10 < 8 ? 1 : 2;
      pos[i * 3] = (rand() - 0.5) * 20;
      pos[i * 3 + 1] = (rand() - 0.5) * 10;
      pos[i * 3 + 2] = -7 + rand() * 10;
      const size = type === 0 ? 30 + rand() * 50 : type === 1 ? 70 + rand() * 80 : 90 + rand() * 90;
      const speed = type === 2 ? -(0.35 + rand() * 0.5) : 0.2 + rand() * 0.45;
      data.set([size, speed, rand() * Math.PI * 2, type], i * 4);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aData', new THREE.BufferAttribute(data, 4));
    return g;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uBoost: { value: 0 },
          uOpacity: { value: 0 },
          uPollen: { value: new THREE.Color('#FFC978') },
          uFirefly: { value: new THREE.Color('#E9F7A8').multiplyScalar(1.25) },
          uPetal: { value: new THREE.Color(SEASONS[0].petal) },
        },
      }),
    [],
  );

  const petalA = useMemo(() => new THREE.Color(), []);
  const petalB = useMemo(() => new THREE.Color(), []);

  useFrame((state, dt) => {
    const u = material.uniforms;
    u.uTime.value = frame.time;
    u.uPixelRatio.value = state.viewport.dpr;
    // Скролл «вздымает» частицы
    boost.current += Math.abs(frame.velocity) * dt * 0.012 * frame.motion;
    u.uBoost.value = boost.current;
    u.uOpacity.value = damp(u.uOpacity.value as number, frame.intro, 2, dt);

    const s = frame.season;
    const i = Math.min(SEASONS.length - 2, Math.floor(s));
    petalA.set(SEASONS[i].petal);
    petalB.set(SEASONS[i + 1].petal);
    (u.uPetal.value as THREE.Color).copy(petalA).lerp(petalB, Math.min(1, s - i));

    if (points.current) {
      points.current.position.x = damp(points.current.position.x, frame.pointer.x * 0.5, 2, dt);
      points.current.position.y = damp(points.current.position.y, frame.pointer.y * 0.3, 2, dt);
    }
  });

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />;
}
