/**
 * Next.js instrumentation hook — loads Sentry only when DSN is configured.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
  if (!dsn) return;

  // Optional dependency: install with `npm i @sentry/nextjs` and set DSN.
  try {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      const Sentry = await import('@sentry/nextjs').catch(() => null);
      if (Sentry) {
        Sentry.init({
          dsn,
          tracesSampleRate: 0.1,
          environment: process.env.NODE_ENV,
        });
        (globalThis as unknown as { Sentry: typeof Sentry }).Sentry = Sentry;
      }
    }
  } catch (e) {
    console.warn('[instrumentation] Sentry init skipped:', e);
  }
}
