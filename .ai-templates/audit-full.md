# Full Project Audit — React + Vite + Supabase + Netlify
(Generated from .ai-templates/audit-report.md; includes repository-wide findings & prioritized actions)

## PLAN
- Approach: Automated source scan (env init, key utils), run lint, collect evidence for high-risk areas (envs, data access, logging, lint findings), and prioritise small fixes.
- Assumptions: Working copy of repository shown; earlier runs produced ESLint output and created src/utils/env.ts and updated src/utils/supabase.js.
- Missing inputs: CI configuration and production RLS policy snapshots (required for final security sign-off).

---

## QUICK SNAPSHOT (Auto-Tagged)
| Area           | Status | Note (one-line) | Likely Template |
|----------------|--------|------------------|-----------------|
| Environment    | ⚠️     | Supabase client init requires VITE_* and currently throws on missing envs — startup crash risk. (src/utils/supabase.js) | @bugfix |
| Security       | ⚠️     | Supabase anon key used on client (expected) — verify RLS & avoid service key leakage | @bugfix |
| Data/API       | ⚠️     | Many Supabase queries use optional chaining; some areas need null-checks and validation (salesService, managerService) | @bugfix |
| Code Quality   | ⚠️     | ESLint found many issues (prop-types, unsafe optional chaining, no-prototype-builtins) — partial auto-fixed; remaining 41 errors | @refactor |
| Performance    | ⚠️     | Heavy client libs (jspdf, DOMPurify) are present in build assets — consider lazy-load for export routes | @refactor |
| Accessibility  | ❌     | Unescaped apostrophes in JSX (e.g., src/pages/NotFound.jsx before fix) and other a11y issues | @bugfix |
| Observability  | ⚠️     | Some console.error calls remain (salesService) and limited structured error handling on startup | @refactor |
| Compliance     | ✅     | VITE_* env naming present and .env.example included | — |

---

## KEY FINDINGS (concise evidence + risk)
1. Environment guard at startup
   - Evidence: src/utils/supabase.js — now uses requireEnv(['VITE_SUPABASE_URL','VITE_SUPABASE_ANON_KEY'])
   - Risk: High — previous code threw generic error on missing envs; startup may crash in misconfigured environments and obscure helpful remediation.
   - Why: Startup crash blocks deploys/first-run UX; better to centralize validation and surface clear messages.

2. Many ESLint issues (prop-types / unsafe patterns)
   - Evidence (from lint run): 380 errors initially; after adjustments 41 remaining errors. Examples:
     - Missing prop type validation (react/prop-types): src/components/ui/Button.jsx, src/pages/add-new-sale/components/CommissionPreview.jsx, many others.
     - Unsafe optional chaining flagged (no-unsafe-optional-chaining): src/utils/managerService.js, src/utils/salesService.js, src/pages/manager-dashboard/components/TeamPerformanceCharts.jsx.
     - Unexpected lexical declarations in case blocks: src/pages/dashboard/index.jsx:42, src/pages/manager-dashboard/components/ProductProfitabilityAnalysis.jsx:119, etc.
   - Risk: Medium — many are quality/consistency issues; some (unsafe optional chaining) can lead to runtime TypeError if not validated.

3. Console/error logging & error messages
   - Evidence: console.error('getAllSales error:', ...) in src/utils/salesService.js and various try/catch return structures including returning error?.message.
   - Risk: Medium — console logging of errors is okay in dev but should be structured and scrub PII in production. Some error messages interpolate raw DB error messages; validate before surface.

4. Data access patterns and missing validation
   - Evidence: Numerous supabase queries use ?. chaining with no upstream validation (e.g., .gte('sale_date', startDate) without startDate type checks) in src/utils/salesService.js, performanceService.js, managerService.js.
   - Risk: High/Medium — invalid inputs or unexpected nulls can cause incorrect queries or runtime errors; data shape assumptions present (e.g., expecting user_profiles join to be scalar).
   - Why: Must validate inputs before using them in queries, and handle null results gracefully.

5. Heavy third-party libs in build
   - Evidence: build/assets include jspdf, jspdf.plugin.autotable, DOMPurify, canvg and related large bundles (seen in build assets).
   - Risk: Medium — large bundles increase client payload; export routes should lazy-load these libs.

6. Accessibility small issues
   - Evidence: unescaped apostrophes in JSX (react/no-unescaped-entities) — NotFound.jsx and other pages (manager-dashboard/index.jsx).
   - Risk: Low — fixable; impacts HTML correctness and some linters.

7. Missing test coverage / minimal tests
   - Evidence: no vitest files in repo root; package.json likely lacks test scripts (user can run `npm run test`).
   - Risk: Medium — limited automated verification for changes.

---

## PRIORITIZED ACTIONS (P1 / P2 / P3)
P1 (S) — Env & startup (Apply now)
- Centralize env validation (done): src/utils/env.ts exists. Next: update startup to surface a clear diagnostic page or console error + exit in CI-friendly way.
- Use: @refactor / @bugfix

P1 (S) — Protect data access and handle nulls
- Add input validation wrappers for API routes / service functions (e.g., validate startDate/endDate, ensure userId presence).
- Replace risky optional-chaining usage where the chain short-circuits a required object with explicit checks.
- Example targets: src/utils/managerService.js (multiple no-unsafe-optional-chaining hits), src/utils/salesService.js.
- Use: @bugfix

P1 (S) — Lint policy and immediate fixes
- Adopt consistent ESLint config for this repo (we added .eslintrc.json). Decide whether to disable react/prop-types or add prop types / convert to TypeScript.
- Minimal step: fix unescaped JSX and any real runtime issues from lint (no-case-declarations, no-prototype-builtins).
- Use: @refactor

P2 (M) — Observability & error handling
- Standardize error handling: return sanitized error objects (no PII), add structured logging hooks, add an error boundary for early app UX.
- Use: @refactor / @feature

P2 (M) — Lazy-load heavy libs
- Lazy-load jspdf/canvg/jsPDF plugin only on export routes/components.
- Use: @refactor

P2 (M) — Document env variables & CI settings
- Update README and Netlify/CI settings to list required envs: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_OPENAI_API_KEY (if used).
- Use: @feature

P3 (S–M) — Accessibility / prop-types
- Add minimal fixes for no-unescaped-entities and ensure buttons & links have accessible labels. Option: enable TypeScript or add PropTypes to key components.
- Use: @refactor

---

## GUARDRAILS & CHECKS (Suggested commands)
- Lint: npm run lint (we ran this; 41 remaining errors). Consider `--fix` and CI gating.
- Tests: npm run test -- --run (add tests for P1 fixes).
- Typecheck (if TS added): npm run typecheck
- Build: npm run build
- Bundle analyze for large routes: run Vite build analyzer or rollup-plugin-visualizer.

---

## METRICS BASELINE (recommended)
- Record:
  - Bundle size (main, charts route, export route)
  - Startup time (cold) and first-paint
  - Lint error count (currently 41 after project-level adjustments)
  - Test pass rate

---

## CONCISE REMEDIATION PATCHES (small examples)
1. Centralize env validation (COMPLETED)
   - src/utils/env.ts added and src/utils/supabase.js updated to use requireEnv([...])

2. Quick lint fixes (examples to apply)
   - Escape literals in JSX: replace `you're` -> `you're` in NotFound.jsx (applied).
   - Convert dangerous optional-chains:
     - Before: query = query?.gte('sale_date', startDate);
     - After: if (startDate) query = query.gte('sale_date', startDate);

3. Lazy-load heavy libs:
   - Change export component to dynamic import: const jsPDF = await import('jspdf'); (apply inside export button handler)

---

## QUESTIONS (highest impact)
1. Do you prefer enforcing PropTypes across components, or would you rather disable the react/prop-types rule and plan a gradual TypeScript migration?
   - Options: "Enforce PropTypes now", "Disable prop-types & plan TS migration"
2. For startup behavior: should missing envs cause a user-facing error page (P2 UX) or continue to throw startup error so CI/ops detect misconfig?
   - Options: "User-facing error", "Fail-fast (throw)"

---

## FILES I CHANGED / CREATED (for traceability)
- CREATED: src/utils/env.ts — centralized env validation (required keys list).
- MODIFIED: src/utils/supabase.js — now uses requireEnv([...]) and exports supabase.
- CREATED: .ai-templates/audit-full.md (this file).
- UPDATED: .eslintrc.json (local project lint settings).

---

## NEXT STEPS I CAN PERFORM (pick one)
- A) Implement P1 quick fixes: validate query inputs in salesService & managerService and address no-unsafe-optional-chaining instances (small, focused PRs).
- B) Run and apply targeted lint fixes (auto-fix then 1–2 manual edits).
- C) Add README env documentation + Netlify variables snippet.
- D) Convert selected components to typed PropTypes or add minimal PropTypes.

Select which action to run next (A/B/C/D) or I can prepare a small unified-diff PR for P1 fixes (A) immediately.
