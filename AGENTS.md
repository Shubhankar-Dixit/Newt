# Repository Guidelines

## Project Structure & Module Organization
- Root: minimal Node manifest (`package.json`). Primary app lives in `ai-wiki/`.
- App: `ai-wiki/src/app` (App Router). Pages: `page.tsx`, layout: `layout.tsx`.
- API: `ai-wiki/src/app/api/generate/route.ts` (Edge runtime; streams Groq output).
- Styles: `ai-wiki/src/app/globals.css` (Tailwind v4 + CSS variables).
- Config: `ai-wiki/eslint.config.mjs`, `ai-wiki/tsconfig.json`, `ai-wiki/next.config.ts`.
- Build output: `ai-wiki/.next/` (ignored). Local env: `ai-wiki/.env.local`.

## Build, Test, and Development Commands
Run all commands inside `ai-wiki/`.
- `npm install`: install dependencies.
- `npm run dev`: start Next.js dev server (Turbopack) at `http://localhost:3000`.
- `npm run build`: production build (Turbopack).
- `npm start`: run the production server.
- `npm run lint`: run ESLint; add `-- --fix` to auto‑fix where possible.

## Coding Style & Naming Conventions
- Language: TypeScript (strict, no emit). Indent with 2 spaces.
- ESLint: extends `next/core-web-vitals` and `next/typescript`. Keep zero warnings in PRs.
- Files: route segments/folders lowercase; Next files `page.tsx`, `layout.tsx`, `route.ts`.
- Components: PascalCase filenames; camelCase for variables/functions; avoid unused exports.
- Styling: prefer Tailwind utilities; keep custom CSS in `globals.css` minimal.

## Testing Guidelines
- No test framework is configured yet. If adding tests:
  - Unit/UI: suggest Vitest + React Testing Library; name files `*.test.ts(x)` colocated.
  - E2E: suggest Playwright; place under `ai-wiki/e2e/`.
  - Aim for smoke coverage over critical routes and the API endpoint.

## Commit & Pull Request Guidelines
- Commits: use Conventional Commits (e.g., `feat:`, `fix:`, `chore:`, `docs:`). Keep messages imperative and scoped (e.g., `feat(ui): add generate button states`).
- PRs: include a concise summary, screenshots for UI changes, and linked issues (e.g., `Closes #123`). Ensure `npm run lint` passes and builds locally.

## Security & Configuration
- Secret: set `GROQ_API_KEY` in `ai-wiki/.env.local` (see `.env.local.example`). Do not commit real keys.
- Runtime: `api/generate` runs on the Edge; avoid Node‑only APIs there.
- Inputs: trim and validate request payloads; prefer `zod` for schema validation when expanding API.

