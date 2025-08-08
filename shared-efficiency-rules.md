# Shared Efficiency Rules (React + Vite + Supabase + Netlify)

These rules apply to ALL AI coding tasks in this repo.

## Token & Output Controls
- PLAN ≤120 tokens.
- Output **unified diffs only** for modified files; include full content only for brand-new files.
- Use **only provided snippets**; reference by file:line; do NOT restate unchanged context.
- If patch >80 changed lines OR output >150 lines, STOP and ask before continuing.
- Tests: 1–2 minimal tests proving the change; avoid boilerplate.
- If confidence <0.7, ask 1–2 targeted questions before coding.

## Context Handling
- Do not invent APIs, functions, routes, or files.
- Cite exact paths/lines from provided context.
- Prefer narrow snippet windows (±25 lines) around relevant code.
- Keep changes small and focused; avoid rewrites unless requested.

## Code Quality & DX
- Match ESLint/Prettier formatting. Respect existing project conventions.
- If TypeScript is present, maintain/increase strictness; avoid `any` unless justified.
- If JavaScript only, add JSDoc typedefs where useful and safe.

## Security & Data
- **Supabase:** Avoid leaking service keys. Client uses `VITE_SUPABASE_ANON_KEY` only.
- Validate/sanitize user inputs; guard against over-broad RLS assumptions.
- Never log secrets or PII. Scrub sensitive data from console/error paths.

## Performance
- For heavy UI (e.g., **Recharts**): prefer dynamic imports for large routes.
- Memoize expensive computations; avoid unnecessary re-renders.
- Use React Router code-splitting for large pages; lazy-load non-critical modules.
- For PDFs (**jsPDF**), load on demand.

## Accessibility
- Semantic roles/labels; keyboard nav; focus management; color contrast.
- Charts: provide text alternatives or aria-labels describing key metrics.

## Netlify Build/Env
- Keep build command `npm run build`, output `build/` (Vite default is `dist/`; if this repo uses `build/`, preserve it).
- Confirm environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_OPENAI_API_KEY` (optional).

## Stop Conditions
- If instructions are ambiguous or required context is missing, pause and ask.
- If change risks breaking routes or auth, propose a safer phased patch.
