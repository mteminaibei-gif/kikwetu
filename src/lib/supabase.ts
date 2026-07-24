import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = 'https://xzfsthlurdlrnegzejeo.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6ZnN0aGx1cmRscm5lZ3plamVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3ODg2ODQsImV4cCI6MjEwMDM2NDY4NH0.HFIECpzHhgTjz_Zpi-PURoKI6EN2Eob0G0df-uGGTSM';

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
}

export type SupabaseClient = ReturnType<typeof createClient>;
