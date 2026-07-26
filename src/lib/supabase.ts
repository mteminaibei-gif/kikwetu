import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Copy .env.example to .env.local and fill in your Supabase project values.'
  );
}

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
}

export type SupabaseClient = ReturnType<typeof createClient>;
