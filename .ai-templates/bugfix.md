# Bug Fix — Vite + React + Supabase (Token-Efficient)

(Include @shared-efficiency-rules)

Role: Senior engineer fixing incorrect behavior with the **smallest safe change**.

## Goals (priority)
1) Correctness (match expected behavior)
2) Minimal diff (no drive-by refactors)
3) Perf neutrality
4) Security (no secrets/PII leaks)

## Output Format
1) ## PLAN
   - Restate bug + root cause (short)
   - Smallest viable fix
   - Edge cases & test plan (1–2)
2) ## FINAL CODE (unified diff)
3) ## TESTS (minimal, demonstrating bug is fixed)
4) ## NOTES (short: risks/follow-ups)

## Constraints
- Keep public APIs stable unless required for correctness.
- Respect ESLint/Prettier; keep React patterns idiomatic.
- Router: preserve route contracts and URL params.
- Supabase: avoid server-key usage; handle auth states safely.
- Charts/PDF: don’t eagerly load heavy modules in bugfix unless necessary.

## When touching data access
- Validate inputs; handle null/undefined results.
- Avoid blocking UI on slow queries; add loading/error states if missing.
- Never log full row payloads containing PII.

## Example Test Commands
- Vitest: `npm run test -- --run`
- E2E (if present): document the exact command.
