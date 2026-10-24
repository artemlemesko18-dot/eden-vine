import * as THREE from 'three';

/** Углы главных жилок (от черешка вверх) — у виноградного листа их пять. */
const LOBES = [0, 0.95, -0.95, 1.95, -1.95] as const;
const LOBE_SIZE = [0.46, 0.36, 0.36, 0.2, 0.2] as const;

/** Пятилопастной зубчатый лист в полярных координатах; черешок в начале координат. */
export function createLeafGeometry(samples = 160): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  const sigma = 0.3;
  for (let i = 0; i <= samples; i++) {
    const theta = -Math.PI + 0.12 + (i / samples) * (Math.PI * 2 - 0.24);
    let r = 0.5;
    LOBES.forEach((lobe, k) => {
      const d = theta - lobe;
      r += LOBE_SIZE[k] * Math.exp(-(d * d) / (2 * sigma * sigma));
    });
    // Глубокая выемка у черешка
    const notch = Math.min(1, Math.max(0, (Math.PI - Math.abs(theta)) / 0.55));
    r *= 0.18 + 0.82 * notch * notch * (3 - 2 * notch);
    // Зубчики по краю
    r += 0.022 * Math.sin(theta * 34) * notch;
    const x = Math.sin(theta) * r * 0.62;
    const y = Math.cos(theta) * r * 0.62 + 0.42;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape, 1);
}

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uWind;
  varying vec2 vLeaf;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying float vSeed;

  void main() {
    vec3 p = position;
    vLeaf = p.xy;
    vec2 c = p.xy - vec2(0.0, 0.42);
    float r = length(c);

    // Лист слегка «чашечкой»
    p.z += r * r * 0.35;

    #ifdef USE_INSTANCING
      vec3 origin = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    #else
      vec3 origin = vec3(0.0);
    #endif
    float phase = origin.x * 1.7 + origin.z * 1.3 + origin.y * 0.7;
    vSeed = fract(sin(phase * 12.9898) * 43758.5453);

    // Ветер: медленное покачивание + мелкая дрожь кончиков
    float sway = sin(uTime * 1.25 + phase) * 0.6 + sin(uTime * 2.9 + phase * 1.7) * 0.25;
    float tip = smoothstep(0.0, 1.0, p.y);
    p.z += sway * uWind * 0.16 * tip;
    p.x += sin(uTime * 0.9 + phase) * uWind * 0.04 * tip;
    p.z += sin(uTime * 7.0 + p.x * 9.0 + phase) * 0.008 * uWind * r;

    vec4 local = vec4(p, 1.0);
    vec3 n = vec3(0.0, 0.0, 1.0);
    #ifdef USE_INSTANCING
      local = instanceMatrix * local;
      n = mat3(instanceMatrix) * n;
    #endif
    vec4 world = modelMatrix * local;
    vNormalW = normalize(mat3(modelMatrix) * n + vec3(0.0, 0.0, 1e-5));
    vViewDir = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uLight;
  uniform vec3 uDeep;
  uniform vec3 uAutumn;
  uniform vec3 uSun;
  uniform vec3 uSunDir;
  uniform float uAutumnMix;
  varying vec2 vLeaf;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying float vSeed;

  void main() {
    vec2 c = vLeaf - vec2(0.0, 0.42);
    float r = length(c);
    float a = atan(c.x, c.y);

    // Пять главных жилок от черешка
    float vein = 0.0;
    float L[5];
    L[0] = 0.0; L[1] = 0.95; L[2] = -0.95; L[3] = 1.95; L[4] = -1.95;
    for (int i = 0; i < 5; i++) {
      float d = abs(sin(a - L[i])) * r;
      float w = mix(0.012, 0.004, smoothstep(0.0, 0.6, r));
      float line = 1.0 - smoothstep(w, w + 0.012, d);
      vein = max(vein, line * step(0.0, cos(a - L[i])));
    }

    vec3 col = mix(uLight, uBase, smoothstep(0.05, 0.55, r));
    col = mix(col, uDeep, smoothstep(0.45, 0.75, r) * 0.55);
    col = mix(col, uLight * 1.08, vein * 0.55);
    col = mix(col, uAutumn, uAutumnMix * (0.55 + 0.45 * vSeed) * smoothstep(0.1, 0.7, r + vSeed * 0.3));

    vec3 n = normalize(vNormalW);
    if (!gl_FrontFacing) n = -n;
    vec3 l = normalize(uSunDir);
    float diff = max(dot(n, l), 0.0) * 0.55 + 0.6;
    // Просвечивание листа на солнце (тёплая подсветка сзади)
    float trans = pow(max(dot(-vViewDir, l), 0.0), 2.0) * 0.35;
    float rim = pow(clamp(1.0 - abs(dot(n, normalize(vViewDir))), 0.0, 1.0), 2.5) * 0.25;
    col = col * diff + uSun * (trans + rim) * 0.6;

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

export function createLeafMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uWind: { value: 1 },
      uBase: { value: new THREE.Color('#3FA66B') },
      uLight: { value: new THREE.Color('#B7E26B') },
      uDeep: { value: new THREE.Color('#237A4A') },
      uAutumn: { value: new THREE.Color('#E9A04A') },
      uSun: { value: new THREE.Color('#FFC978') },
      uSunDir: { value: new THREE.Vector3(-0.5, 0.7, 0.5) },
      uAutumnMix: { value: 0 },
    },
  });
}
