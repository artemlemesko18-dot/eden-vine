# Project guidance

## Commands

- `npm run dev` starts the Vite development server.
- `npm run typecheck` runs the strict TypeScript check.
- `npm run build` runs the TypeScript check and production build.
- `npm run preview` serves the production build locally.

## Project conventions

- This is a React 19 + TypeScript + Vite single-page site. Keep changes compatible with the strict settings in `tsconfig.json`.
- Keep user-facing copy and site data in `src/content/ru.ts`; the site is Russian-language.
- Follow the existing Tailwind CSS v4 and component conventions. Global styles and theme tokens live in `src/styles/index.css`.
- Keep scroll choreography in `src/lib/scroll.ts` and `src/three/keyframes.ts`; the 3D scene implementation lives in `src/three/`.
- Preserve reduced-motion and no-WebGL fallbacks when changing animation or scene behavior.
- Prefer focused changes and reuse existing components, hooks, and utilities.

See `README.md` for the architecture overview and pointers to the main content and visual configuration.