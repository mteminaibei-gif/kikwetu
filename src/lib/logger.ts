/**
 * Central error / event logger.
 * - Always logs to console in development
 * - Posts to Sentry when NEXT_PUBLIC_SENTRY_DSN is set (lazy load)
 * - Optionally posts to a custom endpoint (NEXT_PUBLIC_LOG_ENDPOINT)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const isBrowser = typeof window !== 'undefined';

function getSentryDsn(): string | undefined {
  return process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
}

async function sendToSentry(level: LogLevel, message: string, error?: unknown, context?: LogContext) {
  const dsn = getSentryDsn();
  if (!dsn) return;

  try {
    // Prefer global Sentry if the SDK is loaded via instrumentation
    const g = globalThis as unknown as { Sentry?: { captureException: (e: unknown, ctx?: object) => void; captureMessage: (m: string, l?: string) => void } };
    if (g.Sentry) {
      if (error) {
        g.Sentry.captureException(error, { extra: { message, ...context } });
      } else {
        g.Sentry.captureMessage(message, level === 'error' ? 'error' : 'info');
      }
      return;
    }

    // Minimal envelope-less fallback: storehouse via Sentry's store endpoint is complex;
    // rely on console + optional custom endpoint instead when SDK not present.
  } catch {
    // never throw from logger
  }
}

async function sendToEndpoint(level: LogLevel, message: string, error?: unknown, context?: LogContext) {
  const endpoint = process.env.NEXT_PUBLIC_LOG_ENDPOINT;
  if (!endpoint || !isBrowser) return;
  try {
    const payload = {
      level,
      message,
      error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
      context,
      url: isBrowser ? window.location.href : undefined,
      ts: new Date().toISOString(),
    };
    // fire-and-forget
    void fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // ignore
  }
}

function log(level: LogLevel, message: string, error?: unknown, context?: LogContext) {
  const payload = { message, error, context, ts: new Date().toISOString() };
  if (level === 'error') {
    console.error(`[Kikwetu] ${message}`, error ?? '', context ?? '');
  } else if (level === 'warn') {
    console.warn(`[Kikwetu] ${message}`, context ?? '');
  } else if (process.env.NODE_ENV !== 'production') {
    console[level === 'debug' ? 'debug' : 'info'](`[Kikwetu] ${message}`, payload);
  }

  void sendToSentry(level, message, error, context);
  void sendToEndpoint(level, message, error, context);
}

export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, undefined, context),
  info: (message: string, context?: LogContext) => log('info', message, undefined, context),
  warn: (message: string, context?: LogContext) => log('warn', message, undefined, context),
  error: (message: string, error?: unknown, context?: LogContext) => log('error', message, error, context),

  /** Capture a failed Supabase / mutation result */
  mutationError: (operation: string, error: unknown, context?: LogContext) => {
    const msg = error instanceof Error ? error.message : String(error);
    log('error', `Mutation failed: ${operation}`, error, { operation, detail: msg, ...context });
  },
};

export default logger;
