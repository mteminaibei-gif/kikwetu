/**
 * Realtime connection helper with WebSocket fallback strategies.
 *
 * Strategy ladder:
 * 1. Prefer Supabase Realtime (WebSocket)
 * 2. On CHANNEL_ERROR / TIMED_OUT / CLOSED → start HTTP polling
 * 3. Exponential backoff + equal jitter reconnect of the channel
 * 4. Resume WS when tab becomes visible or network comes online
 * 5. Stop polling once WS is healthy again
 */

import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

export type RealtimeStatus = 'connecting' | 'connected' | 'polling' | 'offline' | 'error';

export type StatusListener = (status: RealtimeStatus) => void;

const listeners = new Set<StatusListener>();
let globalStatus: RealtimeStatus = 'connecting';

export function getRealtimeStatus(): RealtimeStatus {
  return globalStatus;
}

export function onRealtimeStatus(fn: StatusListener): () => void {
  listeners.add(fn);
  fn(globalStatus);
  return () => listeners.delete(fn);
}

function setStatus(s: RealtimeStatus) {
  if (globalStatus === s) return;
  globalStatus = s;
  listeners.forEach(fn => {
    try { fn(s); } catch { /* ignore */ }
  });
}

/**
 * Equal jitter: delay = base/2 + random(0, base/2).
 * Spreads reconnects across [base/2, base] so clients don't all
 * hit the server at the same instant after an outage.
 */
export function computeBackoffDelay(baseMs: number, maxMs: number): number {
  const capped = Math.min(Math.max(baseMs, 0), maxMs);
  if (capped <= 0) return 0;
  const half = capped / 2;
  return Math.floor(half + Math.random() * half);
}

/** Next exponential base (no jitter), capped at max. */
export function nextBackoffBase(currentMs: number, maxMs: number, factor = 2): number {
  return Math.min(currentMs * factor, maxMs);
}

// Reflect browser online/offline
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (globalStatus === 'offline') setStatus('connecting');
  });
  window.addEventListener('offline', () => setStatus('offline'));
}

export interface ChannelFallbackOptions {
  /** Unique channel name */
  name: string;
  /** Build and attach handlers to a channel (before subscribe) */
  setup: (channel: RealtimeChannel) => RealtimeChannel;
  /** Called on a polling tick when WebSocket is unhealthy */
  onPoll: () => void | Promise<void>;
  /** Polling interval while in fallback mode (ms) */
  pollIntervalMs?: number;
  /** Initial backoff base before first reconnect (ms) */
  initialBackoffMs?: number;
  /** Max reconnect backoff base (ms) — jitter is applied within this */
  maxBackoffMs?: number;
}

/**
 * Subscribe to a Realtime channel with automatic polling fallback.
 * Returns an unsubscribe function.
 */
export function subscribeWithFallback(
  sb: SupabaseClient,
  options: ChannelFallbackOptions,
): () => void {
  const {
    name,
    setup,
    onPoll,
    pollIntervalMs = 8000,
    initialBackoffMs = 1000,
    maxBackoffMs = 30000,
  } = options;

  let channel: RealtimeChannel | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let backoffBase = initialBackoffMs;
  let disposed = false;
  let wsHealthy = false;

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };

  const startPolling = () => {
    if (disposed || pollTimer) return;
    setStatus(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'polling');
    // Immediate poll so UI catches up
    void Promise.resolve(onPoll()).catch(() => {});
    pollTimer = setInterval(() => {
      if (disposed) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setStatus('offline');
        return;
      }
      void Promise.resolve(onPoll()).catch(() => {});
    }, pollIntervalMs);
  };

  const cleanupChannel = () => {
    if (channel) {
      try { sb.removeChannel(channel); } catch { /* ignore */ }
      channel = null;
    }
  };

  const scheduleReconnect = () => {
    if (disposed || reconnectTimer) return;

    const delay = computeBackoffDelay(backoffBase, maxBackoffMs);
    backoffBase = nextBackoffBase(backoffBase, maxBackoffMs);

    if (typeof console !== 'undefined' && console.debug) {
      console.debug(`[Realtime] ${name}: reconnect in ${delay}ms (next base ${backoffBase}ms)`);
    }

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (!disposed) connect();
    }, delay);
  };

  const connect = () => {
    if (disposed) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setStatus('offline');
      startPolling();
      return;
    }

    cleanupChannel();
    setStatus(wsHealthy ? 'connected' : 'connecting');

    const ch = setup(sb.channel(name));
    channel = ch;

    ch.subscribe((status, err) => {
      if (disposed) return;

      if (status === 'SUBSCRIBED') {
        wsHealthy = true;
        backoffBase = initialBackoffMs;
        stopPolling();
        setStatus('connected');
        return;
      }

      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        wsHealthy = false;
        if (err) console.warn(`[Realtime] ${name}:`, status, err.message || err);
        startPolling();
        scheduleReconnect();
        return;
      }
    });
  };

  const onVisibility = () => {
    if (document.visibilityState === 'visible' && !wsHealthy && !disposed) {
      backoffBase = initialBackoffMs;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      connect();
    }
  };

  const onOnline = () => {
    if (!disposed) {
      backoffBase = initialBackoffMs;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      connect();
    }
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibility);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('online', onOnline);
  }

  connect();

  return () => {
    disposed = true;
    stopPolling();
    if (reconnectTimer) clearTimeout(reconnectTimer);
    cleanupChannel();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibility);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', onOnline);
    }
  };
}
