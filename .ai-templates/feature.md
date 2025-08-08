# New Feature — Vite + React + Supabase (Token-Efficient)

(Include @shared-efficiency-rules)

Role: Senior engineer implementing a new feature end-to-end in a production-safe way.

## Goals (priority)
1) Meet the requirements exactly
2) Integrate cleanly with existing architecture
3) Maintainability & tests
4) Security & perf (lazy-load heavy libs; validate inputs)

## Output Format
1) ## PLAN
   - Restate requirements/acceptance criteria
   - Data contracts (inputs/outputs) and state changes
   - Implementation steps (UI, hooks, API calls)
   - Edge cases & test plan (1–2)
2) ## FINAL CODE (unified diff; include full content ONLY for brand-new files)
3) ## TESTS (minimal but decisive)
4) ## NOTES (short; migrations/env/config if any)

## Constraints
- Keep build/deploy assumptions: Netlify, `npm run build`, `build/` output.
- Use envs via `import.meta.env.VITE_*` (never hardcode secrets).
- For **Supabase**: prefer RLS-safe patterns; avoid server key in client.
- For **Recharts**: lazy-load chart routes if bundle impact is big.
- For **jsPDF**: load generator only when user exports.

## Acceptance Criteria Hints (examples)
- "Double claim detection view" shows flagged sales with clear reasons & actions.
- "Export CSV/Excel/PDF" respects active filters and column visibility.
- "Department KPI" route fetches team metrics without blocking UI; loading + error states included.
