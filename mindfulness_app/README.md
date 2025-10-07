# Breath Tempo Ionic

A minimal Ionic React build of the breath tempo trainer UI, ready for mobile-focused sessions and quick browser simulation.

## Scripts

Install dependencies first:

```bash
npm install
```

Available commands:

- `npm run dev` – Launch Vite dev server and preview in a browser (ideal for quick simulation).
- `npm run build` – Production build for `dist/`.
- `npm run preview` – Serve the built app locally.
- `npm run ionic:serve` – Run through the Ionic CLI (if installed globally or via `npx`).
- `npm run ionic:build` – Build using the Ionic CLI pipeline.

You can also use Capacitor to target native shells once you add the desired platforms with `npx cap add ios` or `npx cap add android`.

## Project structure

- `src/App.tsx` – Main Ionic UI, including timer logic.
- `src/components/ProgressRing.tsx` – SVG progress ring component.
- `src/App.css` – Mobile-first styling.
- `src/theme/variables.css` – Ionic theme overrides.
- `vite.config.ts` – Vite configuration for development and production builds.
