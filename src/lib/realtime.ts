/**
 * Realtime connection helper with WebSocket fallback strategies.
 *
 * Strategy ladder:
 * 1. Prefer Supabase Realtime (WebSocket)
 * 2. On CHANNEL_ERROR / TIMED_OUT / CLOSED → start HTTP polling
 * 3. Exponential backoff reconnect of the channel
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
  /** Max reconnect backoff (ms) */
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
    maxBackoffMs = 30000,
  } = options;

  let channel: RealtimeChannel | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let backoff = 1000;
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
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (!disposed) connect();
    }, backoff);
    backoff = Math.min(backoff * 2, maxBackoffMs);
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
        backoff = 1000;
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
      backoff = 1000;
      connect();
    }
  };

  const onOnline = () => {
    if (!disposed) {
      backoff = 1000;
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
