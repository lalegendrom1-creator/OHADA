import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

// Fallback to a dummy placeholder so createClient never throws and crashes
// the whole app with a blank white screen when the env vars are missing
// (e.g. forgotten in Netlify's dashboard). Any real call will simply fail
// gracefully instead, and main.tsx shows a clear message to the user.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  {
    auth: { persistSession: false },
  }
);
