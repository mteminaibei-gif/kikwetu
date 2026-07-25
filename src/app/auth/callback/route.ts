import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/feed';

  if (code) {
    const supabase = createServerClient(
      'https://xzfsthlurdlrnegzejeo.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6ZnN0aGx1cmRscm5lZ3plamVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3ODg2ODQsImV4cCI6MjEwMDM2NDY4NH0.HFIECpzHhgTjz_Zpi-PURoKI6EN2Eob0G0df-uGGTSM',
      {
        cookies: {
          getAll() {
            return request.headers.get('cookie')?.split(';').map(c => {
              const [name, ...value] = c.split('=');
              return { name: name.trim(), value: value.join('=').trim() };
            }) ?? [];
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, ...options }) => {
              request.headers.set('Set-Cookie', `${name}=${value}; Path=/; ${Object.entries(options).map(([k, v]) => `${k}=${v}`).join('; ')}`);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}?welcome=true`);
    }
  }

  return NextResponse.redirect(`${origin}/feed?auth_error=true`);
}
