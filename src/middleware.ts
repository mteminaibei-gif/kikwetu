import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/** Routes that require an authenticated session */
const PROTECTED_PREFIXES = [
  '/feed',
  '/admin',
  '/chat',
  '/settings',
  '/profile',
  '/onboarding',
  '/professionals',
  '/students',
  '/parent',
  '/nyumba-kumi',
  '/mtaa',
  '/live',
  '/quizzes',
  '/thread',
  '/search',
  '/radio',
];

/** Public routes always allowed */
const PUBLIC_EXACT = new Set(['/', '/about', '/contact', '/faq', '/privacy', '/terms', '/advertise']);

function isProtected(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return false;
  if (pathname.startsWith('/auth/')) return false;
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env missing, skip auth gate (build / misconfig) rather than crash every request
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: request.headers } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session (required for Server Components + keep cookies fresh)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (isProtected(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/onboarding';
    url.searchParams.set('next', `${pathname}${search}`);
    url.searchParams.set('auth', 'required');
    return NextResponse.redirect(url);
  }

  // Admin gate: require session; role checked client-side (profile) + RLS
  if (pathname.startsWith('/admin') && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/onboarding';
    url.searchParams.set('next', '/admin');
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and Next internals.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|manifest.json|sw.js).*)',
  ],
};
