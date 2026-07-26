import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * OAuth + email confirmation callback.
 * Supabase redirects here with ?code=... after Google OAuth or email verify.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type'); // signup | recovery | email_change | magiclink
  const next = searchParams.get('next') ?? '/feed';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(`${origin}/onboarding?auth_error=config`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a context where cookies cannot be set — middleware will refresh.
        }
      },
    },
  });

  // PKCE / OAuth code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const safeNext = next.startsWith('/') ? next : '/feed';
      return NextResponse.redirect(`${origin}${safeNext}?welcome=true`);
    }
    console.error('[auth/callback] exchangeCodeForSession', error.message);
    return NextResponse.redirect(`${origin}/onboarding?auth_error=exchange`);
  }

  // Email confirmation / magic link token hash flow
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'signup' | 'recovery' | 'email_change' | 'magiclink' | 'email',
    });
    if (!error) {
      return NextResponse.redirect(`${origin}/feed?verified=true`);
    }
    console.error('[auth/callback] verifyOtp', error.message);
    return NextResponse.redirect(`${origin}/auth/verify-email?error=invalid`);
  }

  return NextResponse.redirect(`${origin}/onboarding?auth_error=missing_code`);
}
