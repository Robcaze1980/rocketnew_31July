/**
 * Simple environment variable helper for Vite/Renovation runtime.
 * Validates that required environment variables are present at runtime
 * and returns a dictionary of their string values.
 *
 * Usage:
 *   const env = requireEnv(['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']);
 *   // env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY are guaranteed to be non-empty
 *
 * Note: This file uses dynamic access to import.meta.env which is provided by Vite.
 * It should be safe for both JS and TS projects in this repo.
 */

/**
 * Retrieve and validate a set of environment variable keys from import.meta.env.
 * Throws a descriptive error if any key is missing or empty.
 * @param {string[]} keys - list of environment variable names (e.g., ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'])
 * @returns {{[key: string]: string}} - map of key to value
 */
export function requireEnv(keys) {
  const result = {};
  for (const key of keys) {
    // Access dynamic env vars at runtime without referencing the `import.meta` token
    // directly so TypeScript configs that don't support `import.meta` won't error.
    // We try to read Vite's `import.meta.env` via eval at runtime, and fall back to
    // `process.env` for Node/test environments.
    let val = '';
    try {
      // eslint-disable-next-line no-eval
      const meta = (0, eval)('import.meta');
      val = (meta && meta.env && meta.env[key]) || '';
    } catch {
      // Fallback for Node or test runners
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      val = (typeof process !== 'undefined' && (process.env && (process.env as any)[key])) || '';
    }
    if (!val) {
      throw new Error(`Missing environment variable: ${key}`);
    }
    result[key] = val;
  }
  return result;
}
