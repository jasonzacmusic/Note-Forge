# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

- **Dev server:** `npm run dev` (runs on port 5000 with Vite HMR)
- **Production build:** `npm run build` (Vite for client → `dist/public/`, esbuild for server → `dist/index.js`)
- **Production run:** `npm run start`
- **Type check:** `npm run check` (tsc)
- **Database migrations:** `npm run db:push` (drizzle-kit push to Neon PostgreSQL)

No test framework or linter is configured.

## Architecture

Full-stack music education app (Note Spew Machine) with Web Audio synthesis.

### Stack
- **Frontend:** React 18 + TypeScript, Vite, Tailwind CSS, Shadcn/ui (Radix primitives)
- **Backend:** Express.js on port 5000, Passport for auth, express-session with connect-pg-simple
- **Database:** PostgreSQL via Neon serverless, Drizzle ORM
- **Routing:** Wouter (single route: `/` → Home)

### Key Directories
- `client/src/` — React app. Entry: `main.tsx` → `App.tsx`
- `server/` — Express server. Entry: `index.ts`. `vite.ts` handles dev HMR and production static serving
- `shared/schema.ts` — Zod schemas shared between client and server, TypeScript types inferred from Zod

### Path Aliases
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`

### Core Application Modules
- `components/musical-note-generator.tsx` — Main app shell, mode switcher
- `components/audio-engine.ts` — Web Audio API engine with Web Worker scheduler (lookahead scheduling for precise timing)
- `components/music-theory.ts` — Music theory logic: scales, intervals, chord progressions, circle of fifths, MIDI/frequency conversion
- `components/mode-random.tsx`, `mode-progressions.tsx`, `mode-patterns.tsx`, `mode-glossary.tsx` — Four independent modes, each with own AudioEngine instance

### State Management
- App settings persisted to localStorage via custom `use-local-storage` hook (key: `musical-note-generator`)
- React Query (TanStack) for server state, configured with `staleTime: Infinity` and `retry: false`
- Settings schema defined in `shared/schema.ts` (`AppSettings` type)

### Theme System
- Dark/light mode via React context (`theme-provider.tsx`) + CSS variables in `index.css`
- Tailwind dark mode uses class strategy

### Deployment
- Configured for Replit autoscale deployment (see `.replit` config)
- Port 5000 internally, mapped to 80 externally
