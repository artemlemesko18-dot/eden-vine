import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { damp, mulberry32, smoothstep } from '../lib/math';
import { sampleNumber } from './keyframes';
import { frame } from './frameState';
import { createLeafGeometry, createLeafMaterial } from './leafMaterial';

/** Две лозы: нижняя «шпалера» и верхняя, как над перголой. */
const VINE_PATHS: readonly (readonly [number, number, number])[][] = [
  [
    [-9, -0.4, -3.2],
    [-6, -1.3, -2],
    [-3.4, -0.8, -1.3],
    [-1, -1.55, -1.6],
    [1.4, -1, -1],
    [3.6, -1.6, -1.5],
    [6, -0.9, -2],
    [9, -1.4, -3],
  ],
  [
    [-10, 2.7, -5.2],
    [-5.5, 2, -4.4],
    [-1.5, 2.85, -4.8],
    [2.5, 2.15, -4.2],
    [6, 2.9, -4.9],
    [10, 2.3, -5.6],
  ],
];

/** Куда уезжает каждая лоза, когда секции нужен чистый кадр. */
const VINE_HIDE_OFFSET = [-2.6, 2.4] as const;

/** Труба с «живой» толщиной: утолщения-узлы и плавные сужения. */
function createVineGeometry(curve: THREE.CatmullRomCurve3, radius: number, seed: number) {
  const segments = 320;
  const radial = 9;
  const geometry = new THREE.TubeGeometry(curve, segments, radius, radial, false);
  const pos = geometry.attributes.position as THREE.BufferAttribute;
  const center = new THREE.Vector3();
  const v = new THREE.Vector3();
  const rand = mulberry32(seed);
  const knots = Array.from({ length: 9 }, () => rand());
  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    curve.getPointAt(u, center);
    let s = 0.82 + 0.22 * Math.sin(u * 37 + seed) + 0.1 * Math.sin(u * 91);
    knots.forEach((k) => {
      const d = (u - k) * 60;
      s += 0.35 * Math.exp(-d * d);
    });
    for (let j = 0; j <= radial; j++) {
      const idx = i * (radial + 1) + j;
      v.fromBufferAttribute(pos, idx).sub(center).multiplyScalar(s).add(center);
      pos.setXYZ(idx, v.x, v.y, v.z);
    }
  }
  pos.needsUpdate = true;
  return geometry;
}

function createTendril(base: THREE.Vector3, dir: number, seed: number) {
  const rand = mulberry32(seed);
  const pts: THREE.Vector3[] = [];
  const turns = 2.5 + rand() * 1.5;
  const len = 0.7 + rand() * 0.4;
  for (let i = 0; i <= 40; i++) {
    const k = i / 40;
    const a = k * turns * Math.PI * 2;
    const r = 0.11 * (1 - k * 0.8) * Math.min(1, k * 4);
    pts.push(
      new THREE.Vector3(
        base.x + dir * k * len * 0.6 + Math.cos(a) * r,
        base.y + k * len + Math.sin(a) * r,
        base.z + Math.sin(a * 0.5) * 0.08,
      ),
    );
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.011, 6, false);
}

interface BranchProps {
  index: number;
  leafCount: number;
  bark: THREE.Material;
  tendrilMaterial: THREE.Material;
  leafGeometry: THREE.BufferGeometry;
  leafMaterial: THREE.ShaderMaterial;
}

function VineBranch({ index, leafCount, bark, tendrilMaterial, leafGeometry, leafMaterial }: BranchProps) {
  const group = useRef<THREE.Group>(null);
  const leaves = useRef<THREE.InstancedMesh>(null);
  const shift = useRef(0);
  const upper = index === 1;

  const { curve, tube, tendrils } = useMemo(() => {
    const c = new THREE.CatmullRomCurve3(
      VINE_PATHS[index].map((p) => new THREE.Vector3(...p)),
      false,
      'catmullrom',
      0.4,
    );
    const p = new THREE.Vector3();
    const spots = upper ? [0.2, 0.55, 0.82] : [0.14, 0.31, 0.47, 0.6, 0.78, 0.9];
    return {
      curve: c,
      tube: createVineGeometry(c, upper ? 0.055 : 0.075, index * 13 + 3),
      tendrils: spots.map((u, i) => {
        c.getPointAt(u, p);
        return createTendril(p.clone(), (i % 2 === 0) !== upper ? 1 : -1, 100 * (index + 1) + i);
      }),
    };
  }, [index, upper]);

  useLayoutEffect(() => {
    const mesh = leaves.current;
    if (!mesh) return;
    const rand = mulberry32(42 + index);
    const dummy = new THREE.Object3D();
    const p = new THREE.Vector3();
    for (let i = 0; i < leafCount; i++) {
      curve.getPointAt((i + 0.3 + rand() * 0.4) / leafCount, p);
      dummy.position.copy(p);
      // Нижняя лоза — листья вверх, верхняя — свисают вниз
      dummy.rotation.set(
        (rand() - 0.5) * 0.9 + (upper ? 0.3 : -0.25),
        (rand() - 0.5) * 1.1,
        (upper ? Math.PI : 0) + (rand() - 0.5) * 1.3,
      );
      dummy.scale.setScalar((upper ? 0.62 : 0.46) + rand() * 0.3);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [curve, leafCount, index, upper]);

  useFrame((_, dt) => {
    if (!group.current) return;
    const visible = sampleNumber(frame.keys, frame.sT, (k) => k.vine);
    shift.current = damp(shift.current, (1 - smoothstep(0, 1, visible)) * VINE_HIDE_OFFSET[index], 2.5, dt);
    group.current.position.y = shift.current;
    // Лёгкое покачивание от ветра и скорости скролла
    group.current.rotation.z = Math.sin(frame.time * 0.3 + index) * 0.006 + frame.velocity * 0.0004;
  });

  return (
    <group ref={group}>
      <mesh geometry={tube} material={bark} />
      {tendrils.map((g, i) => (
        <mesh key={i} geometry={g} material={tendrilMaterial} />
      ))}
      <instancedMesh ref={leaves} args={[leafGeometry, leafMaterial, leafCount]} frustumCulled={false} />
    </group>
  );
}

export function Vine({ leaves }: { leaves: number }) {
  const bark = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#7A6B42', roughness: 0.78, metalness: 0 }),
    [],
  );
  const tendrilMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#9ACB57', roughness: 0.5 }),
    [],
  );
  const leafGeometry = useMemo(() => createLeafGeometry(), []);
  const leafMaterial = useMemo(() => createLeafMaterial(), []);
  const lower = Math.round(leaves * 0.6);

  useFrame(() => {
    const u = leafMaterial.uniforms;
    u.uTime.value = frame.time;
    u.uWind.value = 1 + Math.min(2.5, Math.abs(frame.velocity) * 0.05);
    u.uAutumnMix.value = smoothstep(1, 2, frame.season) * 0.85;
  });

  const shared = { bark, tendrilMaterial, leafGeometry, leafMaterial };
  return (
    <>
      <VineBranch index={0} leafCount={lower} {...shared} />
      <VineBranch index={1} leafCount={leaves - lower} {...shared} />
    </>
  );
}
