/**
 * Client-side rate limiter (UX + light abuse prevention).
 * Server-side enforcement lives in Supabase RPCs / triggers.
 */

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Sliding fixed window: max `limit` actions per `windowMs` for a given key.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart >= windowMs) {
    bucket = { count: 0, windowStart: now };
    buckets.set(key, bucket);
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, windowMs - (now - bucket.windowStart)),
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: limit - bucket.count,
    retryAfterMs: 0,
  };
}

/** Presets for common actions */
export const RateLimits = {
  vote: (userId: string) => checkRateLimit(`vote:${userId}`, 30, 60_000),
  createThread: (userId: string) => checkRateLimit(`thread:${userId}`, 5, 60_000),
  createReply: (userId: string) => checkRateLimit(`reply:${userId}`, 20, 60_000),
  createListing: (userId: string) => checkRateLimit(`listing:${userId}`, 5, 60_000),
  notification: (userId: string) => checkRateLimit(`notif:${userId}`, 40, 60_000),
} as const;
