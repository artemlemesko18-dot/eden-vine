import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { damp, easeOutCubic } from '../lib/math';
import type { Tier } from '../lib/sceneStore';
import { sampleNumber, sampleVec3 } from './keyframes';
import { frame } from './frameState';

/** Профиль бокала: снаружи вверх, затем по внутренней стенке вниз — замкнутая оболочка. */
const GLASS_PROFILE: [number, number][] = [
  [0, 0],
  [0.56, 0],
  [0.57, 0.025],
  [0.5, 0.045],
  [0.12, 0.08],
  [0.05, 0.16],
  [0.036, 0.3],
  [0.036, 0.82],
  [0.06, 0.92],
  [0.2, 1.0],
  [0.4, 1.12],
  [0.56, 1.32],
  [0.63, 1.58],
  [0.61, 1.86],
  [0.54, 2.16],
  [0.5, 2.36],
  [0.485, 2.37],
  [0.522, 2.16],
  [0.592, 1.86],
  [0.612, 1.58],
  [0.542, 1.33],
  [0.385, 1.14],
  [0.19, 1.035],
  [0, 1.01],
];

const LIQUID_PROFILE: [number, number][] = [
  [0, 1.03],
  [0.18, 1.05],
  [0.37, 1.15],
  [0.525, 1.34],
  [0.596, 1.58],
  [0.58, 1.86],
  [0.5, 2.1],
];

const liquidVertex = /* glsl */ `
  varying vec3 vLocal;
  varying vec3 vNormalV;
  varying vec3 vViewPos;
  void main() {
    vLocal = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPos = mv.xyz;
    vNormalV = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`;

const liquidFragment = /* glsl */ `
  uniform float uTime;
  uniform float uFill;
  uniform float uSlosh;
  uniform vec3 uDeep;
  uniform vec3 uMid;
  uniform vec3 uLight;
  varying vec3 vLocal;
  varying vec3 vNormalV;
  varying vec3 vViewPos;

  void main() {
    // Поверхность с бегущей волной и раскачиванием от скролла
    float wave = sin(vLocal.x * 5.0 + uTime * 1.8) * 0.022 + sin(vLocal.z * 6.5 - uTime * 1.3) * 0.018;
    float level = uFill + wave + vLocal.x * uSlosh;
    if (vLocal.y > level) discard;

    float depth = clamp((level - vLocal.y) / 0.55, 0.0, 1.0);
    vec3 col = mix(uLight, uDeep, smoothstep(0.0, 1.0, depth));
    float ang = atan(vLocal.z, vLocal.x);
    float shimmer = sin(vLocal.y * 26.0 - uTime * 2.1 + ang * 3.0) * 0.5 + 0.5;
    col = mix(col, uMid, shimmer * 0.22);

    vec3 n = normalize(vNormalV);
    vec3 v = normalize(-vViewPos);
    float fres = pow(clamp(1.0 - abs(dot(n, v)), 0.0, 1.0), 3.0);
    col += fres * 0.35 * uLight;

    if (!gl_FrontFacing) {
      // Задние грани видны через срез — это и есть зеркало жидкости
      float r = length(vLocal.xz);
      float ripple = sin(r * 30.0 - uTime * 2.6) * 0.5 + 0.5;
      col = mix(uMid, uLight, 0.5 + ripple * 0.3);
      col += vec3(1.0, 0.85, 0.9) * smoothstep(0.82, 1.0, ripple) * 0.5;
    }
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

/** Сплайн через опорные точки профиля — без граней на силуэте чаши. */
function smoothLathe(profile: [number, number][], samples: number, radial: number) {
  const curve = new THREE.SplineCurve(profile.map(([x, y]) => new THREE.Vector2(x, y)));
  const points = curve.getPoints(samples).map((p) => new THREE.Vector2(Math.max(0, p.x), p.y));
  return new THREE.LatheGeometry(points, radial);
}

interface Props {
  tier: Tier;
}

export function Glass({ tier }: Props) {
  const group = useRef<THREE.Group>(null);
  const appear = useRef(0);
  const slosh = useRef(0);
  const warmup = useRef(0);

  const glassGeometry = useMemo(() => smoothLathe(GLASS_PROFILE, 220, 96), []);
  const liquidGeometry = useMemo(() => smoothLathe(LIQUID_PROFILE, 80, 72), []);

  const glassMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        roughness: 0.04,
        metalness: 0,
        transmission: 1,
        thickness: 0.35,
        ior: 1.5,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        envMapIntensity: 2.2,
        specularIntensity: 1,
        attenuationColor: new THREE.Color('#EADCF7'),
        attenuationDistance: 1.2,
      }),
    [],
  );

  // Контур по Френелю: на светлом фоне чистое стекло иначе «растворяется»
  const rimMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uColor: { value: new THREE.Color('#6F4E96') } },
        vertexShader: /* glsl */ `
          varying vec3 vN;
          varying vec3 vV;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vN = normalize(normalMatrix * normal);
            vV = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          varying vec3 vN;
          varying vec3 vV;
          void main() {
            float f = pow(clamp(1.0 - abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), 2.2);
            gl_FragColor = vec4(uColor, f * 0.42 + 0.02);
            #include <colorspace_fragment>
          }
        `,
      }),
    [],
  );

  useLayoutEffect(() => {
    const low = tier === 'low';
    glassMaterial.transmission = low ? 0 : 1;
    glassMaterial.transparent = low;
    glassMaterial.opacity = low ? 0.28 : 1;
    glassMaterial.depthWrite = !low;
    glassMaterial.needsUpdate = true;
  }, [tier, glassMaterial]);

  const liquidMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: liquidVertex,
        fragmentShader: liquidFragment,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uFill: { value: 1.62 },
          uSlosh: { value: 0 },
          uDeep: { value: new THREE.Color('#4E1F6E') },
          uMid: { value: new THREE.Color('#B8336A') },
          uLight: { value: new THREE.Color('#E86A92') },
        },
      }),
    [],
  );

  const tmp = useMemo<[number, number, number]>(() => [0, 0, 0], []);

  useFrame((_, dt) => {
    if (!group.current) return;
    const target = sampleNumber(frame.keys, frame.sT, (k) => k.glass);
    appear.current = damp(appear.current, target, 3, dt);
    const a = appear.current;
    // Первые кадры рисуем бокал крошечным, чтобы шейдеры скомпилировались под прелоадером
    warmup.current += 1;
    if (warmup.current < 6) {
      group.current.visible = true;
      group.current.scale.setScalar(0.0001);
      return;
    }
    group.current.visible = a > 0.004;
    frame.glass.appear = a;
    if (!group.current.visible) return;

    sampleVec3(frame.keys, frame.sT, (k) => k.glassPos, tmp);
    const s = sampleNumber(frame.keys, frame.sT, (k) => k.glassScale) * easeOutCubic(Math.min(1, a));
    group.current.position.set(tmp[0], tmp[1] - (1 - a) * 0.8, tmp[2]);
    frame.glass.x = tmp[0];
    frame.glass.y = tmp[1] - (1 - a) * 0.8;
    frame.glass.z = tmp[2];
    frame.glass.scale = s;
    group.current.scale.setScalar(s);
    group.current.rotation.y += dt * 0.25 * frame.motion;
    group.current.rotation.z = Math.sin(frame.time * 0.6) * 0.03 - frame.pointer.x * 0.06;
    group.current.rotation.x = frame.pointer.y * 0.05;

    slosh.current = damp(slosh.current, frame.velocity * 0.004 - frame.pointer.x * 0.05, 3, dt);
    liquidMaterial.uniforms.uTime.value = frame.time;
    liquidMaterial.uniforms.uSlosh.value = slosh.current;
  });

  return (
    <group ref={group} visible={false}>
      <mesh geometry={liquidGeometry} material={liquidMaterial} />
      <mesh geometry={glassGeometry} material={glassMaterial} renderOrder={2} />
      <mesh geometry={glassGeometry} material={rimMaterial} renderOrder={3} />
    </group>
  );
}
