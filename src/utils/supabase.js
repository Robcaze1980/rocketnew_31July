import { createClient } from '@supabase/supabase-js';
import { requireEnv } from './env';

const env = requireEnv(['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']);
export const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

export default supabase;
