import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BUD_COLOR, RIPENESS_STOPS } from '../lib/constants';
import { clamp, easeOutCubic, lerp, mulberry32, smoothstep } from '../lib/math';
import type { Tier } from '../lib/sceneStore';
import { sampleNumber, sampleVec3 } from './keyframes';
import { frame } from './frameState';
import { createLeafGeometry, createLeafMaterial } from './leafMaterial';

interface Berry {
  x: number;
  y: number;
  z: number;
  size: number;
  phase: number;
  /** 0 — верх грозди, 1 — кончик: верхние ягоды растут и зреют раньше. */
  order: number;
  jitter: number;
  rx: number;
  ry: number;
}

/** Высота от точки крепления до центра грозди. */
const CENTER_OFFSET = 1.22;

function buildBerries(count: number): Berry[] {
  const rand = mulberry32(7);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const height = 2.25;
  const berries: Berry[] = [];
  for (let i = 0; i < count; i++) {
    const h = (i + 0.5) / count;
    const shoulder = Math.min(1, (h + 0.03) / 0.17);
    const r = 0.86 * Math.pow(1 - h, 0.85) * (0.35 + 0.65 * shoulder);
    const theta = i * golden;
    const radial = r * (0.72 + 0.28 * rand());
    berries.push({
      x: Math.cos(theta) * radial,
      y: -0.12 - h * height + (rand() - 0.5) * 0.05,
      z: Math.sin(theta) * radial,
      size: (0.168 - 0.05 * h) * (0.88 + rand() * 0.24),
      phase: rand() * Math.PI * 2,
      order: h * 0.85 + rand() * 0.15,
      jitter: rand() * 2 - 1,
      rx: rand() * Math.PI,
      ry: rand() * Math.PI,
    });
  }
  return berries;
}

function makeTube(points: [number, number, number][], radius: number, segments = 32) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return new THREE.TubeGeometry(curve, segments, radius, 8, false);
}

const stops = RIPENESS_STOPS.map(([at, c]) => ({ at, color: new THREE.Color(c) }));
const bud = new THREE.Color(BUD_COLOR);
const tmpColor = new THREE.Color();

function ripenessColor(r: number, out: THREE.Color): THREE.Color {
  const x = clamp(r, 0, 2);
  let i = 0;
  while (i < stops.length - 2 && x > stops[i + 1].at) i++;
  const a = stops[i];
  const b = stops[i + 1];
  return out.copy(a.color).lerp(b.color, clamp((x - a.at) / (b.at - a.at)));
}

const pollenVertex = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vSeed;
  void main() {
    vec3 p = position;
    p.y += sin(uTime * 0.8 + aSeed * 6.28) * 0.08;
    p.x += cos(uTime * 0.6 + aSeed * 12.0) * 0.06;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (36.0 + aSeed * 50.0) * uPixelRatio / -mv.z;
    vSeed = aSeed;
  }
`;

const pollenFragment = /* glsl */ `
  uniform float uOpacity;
  uniform float uTime;
  varying float vSeed;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = (1.0 - smoothstep(0.0, 0.5, d));
    float tw = 0.6 + 0.4 * sin(uTime * 3.0 + vSeed * 20.0);
    gl_FragColor = vec4(vec3(1.0, 0.88, 0.6) * 1.15, a * a * uOpacity * tw);
    #include <colorspace_fragment>
  }
`;

interface Props {
  tier: Tier;
  count: number;
}

export function Grapes({ tier, count }: Props) {
  const outer = useRef<THREE.Group>(null);
  const pivot = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const berriesRef = useRef<THREE.InstancedMesh>(null);
  const leavesRef = useRef<THREE.InstancedMesh>(null);

  const berries = useMemo(() => buildBerries(count), [count]);
  const lowPoly = tier === 'low';
  const berryGeometry = useMemo(
    () => new THREE.SphereGeometry(1, lowPoly ? 20 : 32, lowPoly ? 14 : 24),
    [lowPoly],
  );

  // Базовая прозрачность для уровня качества; спелость дальше «уплотняет» ягоды
  const baseTransmission = useRef(0.92);
  const attenuation = useMemo(() => new THREE.Color(), []);

  const berryMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        roughness: 0.16,
        metalness: 0,
        transmission: 0.92,
        thickness: 0.75,
        ior: 1.38,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        sheen: 0.5,
        sheenRoughness: 0.4,
        sheenColor: new THREE.Color('#ffffff'),
        envMapIntensity: 1.35,
        specularIntensity: 1,
      }),
    [],
  );

  useLayoutEffect(() => {
    baseTransmission.current = lowPoly ? 0 : tier === 'medium' ? 0.86 : 0.92;
    berryMaterial.transmission = baseTransmission.current;
    berryMaterial.roughness = lowPoly ? 0.24 : 0.16;
    berryMaterial.sheen = lowPoly ? 0.9 : 0.5;
    berryMaterial.needsUpdate = true;
  }, [tier, lowPoly, berryMaterial]);

  const stem = useMemo(() => {
    const main = makeTube(
      [
        [0, 0.42, 0],
        [0.03, 0.2, 0.02],
        [0, -0.05, 0],
        [-0.02, -0.55, 0.01],
      ],
      0.034,
    );
    const twig = makeTube(
      [
        [0.01, 0.3, 0],
        [-0.2, 0.42, -0.06],
        [-0.42, 0.44, -0.14],
      ],
      0.02,
      24,
    );
    const tendrilPts: [number, number, number][] = [];
    for (let i = 0; i <= 28; i++) {
      const k = i / 28;
      const r = 0.12 * (1 - k * 0.7);
      tendrilPts.push([
        0.05 + k * 0.42 + Math.cos(k * 14) * r * 0.6,
        0.34 + Math.sin(k * 14) * r,
        Math.sin(k * 9) * 0.05,
      ]);
    }
    const tendril = makeTube(tendrilPts, 0.009, 64);
    return { main, twig, tendril };
  }, []);

  const stemMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#7C8F3E', roughness: 0.6, metalness: 0 }),
    [],
  );
  const tendrilMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#9BCB55', roughness: 0.5 }),
    [],
  );

  const leafGeometry = useMemo(() => createLeafGeometry(), []);
  const leafMaterial = useMemo(() => createLeafMaterial(), []);

  const pollen = useMemo(() => {
    const rand = mulberry32(19);
    const n = 70;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const h = rand();
      const r = 1.1 * (1 - h * 0.7) * (0.6 + rand() * 0.6);
      const a = rand() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = -0.1 - h * 2.3;
      pos[i * 3 + 2] = Math.sin(a) * r;
      seed[i] = rand();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const material = new THREE.ShaderMaterial({
      vertexShader: pollenVertex,
      fragmentShader: pollenFragment,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uPixelRatio: { value: 1 },
      },
    });
    return { geometry, material };
  }, []);

  // Начальные матрицы и цвета: instanceColor должен существовать до первой компиляции шейдера
  useLayoutEffect(() => {
    const mesh = berriesRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    berries.forEach((b, i) => {
      dummy.position.set(b.x, b.y, b.z);
      dummy.scale.setScalar(b.size);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, stops[0].color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    const leaves = leavesRef.current;
    if (leaves) {
      type V3 = [number, number, number];
      const placements: { p: V3; r: V3; s: number }[] = [
        { p: [-0.42, 0.42, -0.16], r: [-0.35, 0.25, 1.15], s: 1.35 },
        { p: [0.36, 0.38, -0.28], r: [-0.5, -0.4, -0.95], s: 0.95 },
      ];
      placements.forEach((pl, i) => {
        dummy.position.set(pl.p[0], pl.p[1], pl.p[2]);
        dummy.rotation.set(pl.r[0], pl.r[1], pl.r[2]);
        dummy.scale.setScalar(pl.s);
        dummy.updateMatrix();
        leaves.setMatrixAt(i, dummy.matrix);
      });
      leaves.instanceMatrix.needsUpdate = true;
    }
  }, [berries, berryGeometry]);

  const tmp = useMemo(
    () => ({ dummy: new THREE.Object3D(), pos: [0, 0, 0] as [number, number, number] }),
    [],
  );

  useFrame((state, dt) => {
    const mesh = berriesRef.current;
    if (!mesh || !outer.current || !pivot.current || !spin.current) return;
    const keys = frame.keys;
    const t = frame.t;

    // Положение и масштаб из ключевых кадров + «влёт» после прелоадера
    sampleVec3(keys, frame.sT, (k) => k.cluster, tmp.pos);
    const introScale = lerp(0.35, 1, easeOutCubic(frame.intro));
    const scale = sampleNumber(keys, frame.sT, (k) => k.clusterScale) * introScale;
    outer.current.position.set(tmp.pos[0], tmp.pos[1] - (1 - frame.intro) * 0.6, tmp.pos[2]);
    outer.current.scale.setScalar(scale);
    frame.cluster.x = tmp.pos[0];
    frame.cluster.y = tmp.pos[1];
    frame.cluster.z = tmp.pos[2];
    frame.cluster.scale = scale;

    // Вращение ускоряется от скорости скролла; гроздь раскачивается на черешке
    const m = frame.motion;
    if (m === 0) spin.current.rotation.y = 0.5;
    else spin.current.rotation.y += dt * (0.16 + Math.abs(frame.velocity) * 0.012);
    pivot.current.rotation.z = Math.sin(frame.time * 0.7) * 0.05 + frame.velocity * 0.0016;
    pivot.current.rotation.x =
      Math.sin(frame.time * 0.5 + 1) * 0.03 - frame.pointer.y * 0.1 + frame.velocity * 0.0022;
    outer.current.rotation.y = frame.pointer.x * 0.25;

    // Рост и созревание
    const howWeight = smoothstep(1.2, 1.9, t) * (1 - smoothstep(3, 3.6, t));
    frame.howWeight = howWeight;
    const g = frame.growth;
    const keyRipe = sampleNumber(keys, frame.sT, (k) => k.ripe);
    const ripe = lerp(keyRipe, smoothstep(0.72, 1, g), howWeight);

    // Спелые ягоды плотнее и насыщеннее: меньше пропускают свет, глубже окрашивают его
    const density = smoothstep(0.5, 1.8, ripe);
    if (baseTransmission.current > 0) {
      berryMaterial.transmission = baseTransmission.current * (1 - density * 0.42);
      ripenessColor(ripe, attenuation).multiplyScalar(0.85);
      berryMaterial.attenuationColor.copy(attenuation);
      berryMaterial.attenuationDistance = lerp(6, 0.45, density);
    }

    const { dummy } = tmp;
    for (let i = 0; i < berries.length; i++) {
      const b = berries[i];
      const gi = clamp((g - b.order * 0.12) / 0.88);
      const growthScale =
        smoothstep(0.16, 0.4, gi) * 0.34 +
        smoothstep(0.46, 0.7, gi) * 0.42 +
        smoothstep(0.74, 0.96, gi) * 0.24;
      const breathe = 1 + Math.sin(frame.time * 1.6 + b.phase) * 0.028 * m;
      const s = b.size * growthScale * breathe;
      dummy.position.set(b.x, b.y, b.z);
      dummy.rotation.set(b.rx, b.ry, 0);
      dummy.scale.set(s, s * 1.07, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const ri = ripe + b.jitter * 0.26 * (1 - Math.abs(ripe - 1) * 0.4);
      ripenessColor(ri, tmpColor);
      tmpColor.lerp(bud, 1 - smoothstep(0.4, 0.6, gi));
      mesh.setColorAt(i, tmpColor);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    leafMaterial.uniforms.uTime.value = frame.time;
    leafMaterial.uniforms.uAutumnMix.value = smoothstep(1, 2, frame.season) * 0.7;

    // Пыльца видна только на шаге «Цветение»
    const bloom = smoothstep(0.12, 0.3, g) * (1 - smoothstep(0.5, 0.66, g)) * howWeight;
    pollen.material.uniforms.uOpacity.value = bloom;
    pollen.material.uniforms.uTime.value = frame.time;
    pollen.material.uniforms.uPixelRatio.value = state.viewport.dpr;
  });

  return (
    <group ref={outer}>
      <group ref={pivot} position={[0, CENTER_OFFSET, 0]}>
        <group ref={spin}>
          <instancedMesh
            ref={berriesRef}
            args={[berryGeometry, berryMaterial, berries.length]}
            frustumCulled={false}
          />
          <mesh geometry={stem.main} material={stemMaterial} />
          <mesh geometry={stem.twig} material={stemMaterial} />
          <mesh geometry={stem.tendril} material={tendrilMaterial} />
          <instancedMesh
            ref={leavesRef}
            args={[leafGeometry, leafMaterial, 2]}
            frustumCulled={false}
          />
          <points geometry={pollen.geometry} material={pollen.material} frustumCulled={false} />
        </group>
      </group>
    </group>
  );
}
