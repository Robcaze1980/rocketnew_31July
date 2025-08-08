# Refactor — Vite + React + Supabase (Token-Efficient)

(Include @shared-efficiency-rules)

Role: Senior engineer refactoring for clarity/maintainability **without behavior change**.

## Goals (priority)
1) Preserve identical behavior (same inputs → same outputs)
2) Maintainability (deduplicate, extract small utilities/hooks)
3) Perf neutrality or improvement
4) Type safety (TS or JSDoc)

## Output Format
1) ## PLAN
   - Restate target & intent (no behavior change)
   - Smallest steps (e.g., extract hook, rename prop, split component)
   - Edge cases & test plan to verify unchanged behavior
2) ## FINAL CODE (unified diff)
3) ## TESTS (reuse existing; add 1 focused check if useful)
4) ## NOTES (short; follow-ups/tech debt)

## Constraints
- Do not change public component props or API route shapes.
- Keep file structure/naming conventions consistent.
- For **Recharts**, prefer memoized selectors and minimal prop reshaping.
- For **jsPDF**, isolate PDF code into a lazy-loaded util when possible.
- For **React Router**, avoid breaking lazy routes/suspense boundaries.

## Suggested Refactor Targets (examples)
- Extract `useSupabaseQuery` / `useCommissionTotals` hooks from repetitive code.
- Consolidate date/number formatting utils.
- Replace inline lambdas with memoized callbacks where render loops are hot.
- Convert large components into smaller presentational + container pairs.
