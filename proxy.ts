import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js 16 renamed middleware → proxy.
 * Keep this layer thin: redirects, rewrites, headers only.
 * Auth checks belong in layouts / route handlers, not here.
 */
export function proxy(request: NextRequest) {
  return NextResponse.next({
    request: { headers: request.headers },
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
