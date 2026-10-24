import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Контур виноградного листа — используется в логотипе и прелоадере. */
export const LEAF_PATH =
  'M32 58c-1.6-6-2-10-2-14-6 3-13 3-18-1 3-1 6-3 7-6-6 0-11-4-13-10 4 1 8 0 11-2-4-4-5-10-3-15 4 3 8 4 12 3 0-5 3-9 8-11 3 4 3 8 1 12 4 1 8 0 11-3 2 5 1 11-3 15 3 2 7 3 11 2-2 6-7 10-13 10 1 3 4 5 7 6-5 4-12 4-18 1 0 4-.4 8-2 14z';
export const LEAF_VEINS = 'M32 56V20M32 40l-12-9M32 40l12-9M32 30l-9-11M32 30l9-11';

export const ArrowRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);
export const ArrowDown = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </Svg>
);
export const ArrowUp = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Svg>
);
export const Check = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12.5l4.2 4.2L19 7" />
  </Svg>
);
export const Plus = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const Close = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);
export const Menu = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8h16M4 16h10" />
  </Svg>
);
export const Drop = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5s6 6.4 6 10.6a6 6 0 1 1-12 0C6 9.9 12 3.5 12 3.5z" />
    <path d="M9.5 14.5a2.6 2.6 0 0 0 2.5 2.4" />
  </Svg>
);
export const Sun = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" />
  </Svg>
);
export const Sugar = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3l7.5 4.3v9.4L12 21l-7.5-4.3V7.3z" />
    <path d="M12 12l7.5-4.7M12 12L4.5 7.3M12 12v9" />
  </Svg>
);
export const Basket = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 10h17l-1.6 8.2a2 2 0 0 1-2 1.6H7.1a2 2 0 0 1-2-1.6z" />
    <path d="M8 10l3-5.5M16 10l-3-5.5M9 14v2.5M15 14v2.5M12 14v2.5" />
  </Svg>
);
export const Rain = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 15a4.5 4.5 0 1 1 1.3-8.8A5.5 5.5 0 0 1 18.8 9 3.5 3.5 0 0 1 18 15H7z" />
    <path d="M9 18l-1 2.5M13 18l-1 2.5M17 18l-1 2.5" />
  </Svg>
);
export const Grape = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3v3M12 6c1.5-2 4-2.4 5.5-1.6" />
    <circle cx="9" cy="9.5" r="2.2" />
    <circle cx="14" cy="9.5" r="2.2" />
    <circle cx="11.5" cy="13.6" r="2.2" />
    <circle cx="7.4" cy="13.6" r="2" />
    <circle cx="15.6" cy="13.6" r="2" />
    <circle cx="9.6" cy="17.6" r="2" />
    <circle cx="13.4" cy="17.6" r="2" />
  </Svg>
);
export const Gift = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="9" width="16" height="11" rx="2" />
    <path d="M3 9h18M12 9v11M12 9c-2.5 0-5-1-5-3s2.4-2.4 5 3c2.6-5.4 5-5 5-3s-2.5 3-5 3" />
  </Svg>
);
export const LeafIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z" />
    <path d="M5 19c3-4 6-7 10-10" />
  </Svg>
);
export const Pin = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Svg>
);
export const Telegram = (p: IconProps) => (
  <Svg {...p}>
    <path d="M21 4.5L3 11.6l5.8 2 2 6 3.2-3.7 4.6 3.4z" />
    <path d="M8.8 13.6L18 7.5l-7.3 8" />
  </Svg>
);
export const Vk = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <path d="M7 8.5c.3 4.2 2.4 7 5.7 7v-2.4c1.2.1 2.2 1.1 2.6 2.4H17c-.5-1.9-1.8-3.1-2.7-3.6.9-.5 2.1-1.7 2.4-3.4h-1.7c-.4 1.4-1.4 2.5-2.3 2.6V8.5h-1.7v4.7C9.9 12.9 9 11.4 8.9 8.5z" />
  </Svg>
);
export const Video = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
    <path d="M10.2 9.3v5.4l4.6-2.7z" />
  </Svg>
);
export const Mail = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M4 7l8 6 8-6" />
  </Svg>
);
export const Sparkle = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3c.6 4.4 1.6 5.4 6 6-4.4.6-5.4 1.6-6 6-.6-4.4-1.6-5.4-6-6 4.4-.6 5.4-1.6 6-6z" />
    <path d="M18.5 15.5c.3 1.6.7 2 2.3 2.3-1.6.3-2 .7-2.3 2.3-.3-1.6-.7-2-2.3-2.3 1.6-.3 2-.7 2.3-2.3z" />
  </Svg>
);
