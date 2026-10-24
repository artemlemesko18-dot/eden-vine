import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';

/** Мягкий блум только по HDR-бликам (порог выше 1) и едва заметная виньетка. */
export function Effects() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.75} luminanceThreshold={0.98} luminanceSmoothing={0.25} radius={0.72} />
      <Vignette offset={0.38} darkness={0.22} />
    </EffectComposer>
  );
}
