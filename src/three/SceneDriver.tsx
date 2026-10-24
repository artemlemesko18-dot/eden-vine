import { useFrame } from '@react-three/fiber';
import { damp, smoothstep, clamp } from '../lib/math';
import { getHowProgress, getSeason, sceneStore } from '../lib/sceneStore';
import { DESKTOP_KEYS, MOBILE_KEYS, directedTime } from './keyframes';
import { frame } from './frameState';

interface Props {
  mobile: boolean;
  reducedMotion: boolean;
}

/** Первый подписчик useFrame: сглаживает входы и раздаёт их объектам через frame. */
export function SceneDriver({ mobile, reducedMotion }: Props) {
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    frame.mobile = mobile;
    frame.keys = mobile ? MOBILE_KEYS : DESKTOP_KEYS;
    frame.motion = reducedMotion ? 0 : 1;
    frame.time += dt * frame.motion;

    // Инерция камеры: при reduced motion скролл отражается почти мгновенно.
    frame.t = damp(frame.t, sceneStore.t, reducedMotion ? 30 : 3.4, dt);
    frame.sT = directedTime(frame.keys, frame.t);

    const px = reducedMotion ? 0 : sceneStore.pointer.x;
    const py = reducedMotion ? 0 : sceneStore.pointer.y;
    frame.pointer.x = damp(frame.pointer.x, px, 2.6, dt);
    frame.pointer.y = damp(frame.pointer.y, py, 2.6, dt);
    frame.velocity = damp(frame.velocity, clamp(sceneStore.velocity, -80, 80), 5, dt);

    // Рост: в манифесте гроздь «отматывается» к ростку, в шагах снова вырастает.
    const t = frame.t;
    let growth = 1;
    if (t > 1.2 && t < 2) growth = 1 - smoothstep(1.2, 1.9, t);
    else if (t >= 2 && t < 3.6) growth = clamp(getHowProgress() * 1.08);
    frame.growth = damp(frame.growth, growth, 4, dt);

    frame.season = damp(frame.season, getSeason(), 3, dt);
    frame.intro = sceneStore.intro;
  });
  return null;
}
