import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { easeInOutCubic, lerp } from '../lib/math';
import { DESKTOP_KEYS, INTRO_CAM, MOBILE_KEYS, type SceneKey } from './keyframes';
import { frame } from './frameState';

function buildCurves(keys: readonly SceneKey[]) {
  const toV = (v: readonly number[]) => new THREE.Vector3(v[0], v[1], v[2]);
  return {
    cam: new THREE.CatmullRomCurve3(keys.map((k) => toV(k.cam)), false, 'centripetal'),
    look: new THREE.CatmullRomCurve3(keys.map((k) => toV(k.look)), false, 'centripetal'),
  };
}

/** Камера летит по сплайну через ключевые точки секций; курсор слегка её наклоняет. */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const curves = useMemo(
    () => ({ desktop: buildCurves(DESKTOP_KEYS), mobile: buildCurves(MOBILE_KEYS) }),
    [],
  );
  const tmp = useMemo(
    () => ({ pos: new THREE.Vector3(), look: new THREE.Vector3(), intro: new THREE.Vector3(...INTRO_CAM) }),
    [],
  );

  useFrame(() => {
    const aspect = size.width / Math.max(1, size.height);
    const fov = aspect < 0.75 ? 50 : aspect < 1.1 ? 42 : 35;
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    const set = frame.mobile ? curves.mobile : curves.desktop;
    const u = frame.sT / (frame.keys.length - 1);
    set.cam.getPoint(u, tmp.pos);
    set.look.getPoint(u, tmp.look);

    const k = easeInOutCubic(frame.intro);
    tmp.pos.lerpVectors(tmp.intro, tmp.pos, k);

    // Параллакс курсора и лёгкое «дыхание» камеры
    tmp.pos.x += frame.pointer.x * 0.38 + Math.sin(frame.time * 0.21) * 0.05;
    tmp.pos.y += frame.pointer.y * 0.22 + Math.sin(frame.time * 0.17) * 0.04;
    tmp.look.y = lerp(tmp.look.y + 0.9, tmp.look.y, k);

    camera.position.copy(tmp.pos);
    camera.lookAt(tmp.look);
  });

  return null;
}
