/** Цвета 3D-сцены. Синхронизированы с токенами в styles/index.css. */
export const PALETTE = {
  cream: '#FBF8F1',
  mint: '#EAF6EE',
  leaf: '#3FA66B',
  lime: '#B7E26B',
  emerald: '#14382B',
  grape: '#7B3FA0',
  lilac: '#C9A7E8',
  berry: '#E86A92',
  sun: '#FFC978',
} as const;

/** Шкала созревания ягод: 0 — зелёные, 1 — лиловые, 2 — тёмно-фиолетовые (через «румянец» véraison). */
export const RIPENESS_STOPS: readonly (readonly [number, string])[] = [
  [0, '#9FD552'],
  [0.4, '#D2C77A'],
  [0.62, '#D696C2'],
  [1, '#9C55D3'],
  [1.5, '#7434AE'],
  [2, '#4A1872'],
];
export const BUD_COLOR = '#F1F3CF';

export interface SeasonPalette {
  top: string;
  mid: string;
  bottom: string;
  warm: string;
  cool: string;
  petal: string;
  accent: string;
  leafTint: number;
}

/** Палитры неба по временам года: весна → лето → осень. */
export const SEASONS: readonly SeasonPalette[] = [
  {
    top: '#EDF2FB',
    mid: '#FBF8F1',
    bottom: '#E2F4E7',
    warm: '#FFE2D2',
    cool: '#EADCF7',
    petal: '#F4A6C0',
    accent: '#E86A92',
    leafTint: 0,
  },
  {
    top: '#E6F6EE',
    mid: '#FCF9EA',
    bottom: '#E5F5CE',
    warm: '#FFE0AC',
    cool: '#DDF1E4',
    petal: '#F5CF62',
    accent: '#2B8A55',
    leafTint: 0.15,
  },
  {
    top: '#F2E6F6',
    mid: '#FDF3E6',
    bottom: '#F6E6D0',
    warm: '#FFCFA0',
    cool: '#E2D0F3',
    petal: '#EE9158',
    accent: '#B8336A',
    leafTint: 0.85,
  },
];

export const SECTION_IDS = [
  'hero',
  'manifest',
  'how',
  'cabinet',
  'terroir',
  'varieties',
  'seasons',
  'reviews',
  'pricing',
  'faq',
  'cta',
  'footer',
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export const MQ = {
  mobile: '(max-width: 767px)',
  desktop: '(min-width: 1024px)',
  finePointer: '(hover: hover) and (pointer: fine)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
} as const;
