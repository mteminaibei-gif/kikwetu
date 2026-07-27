// Lightweight analytics tracking for KikwetuConnect
// Tracks page views, interactions, and feature usage
// Data is stored locally and optionally synced to Supabase

import { supabase } from './supabase';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: string;
  user_id?: string;
  session_id: string;
}

// Generate a session ID for this browser session
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sessionId = sessionStorage.getItem('kikwetu-analytics-session');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem('kikwetu-analytics-session', sessionId);
  }
  return sessionId;
}

// Queue for batching events
let eventQueue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let analyticsTableMissing = false;

// Track an event
export function track(event: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return;

  const analyticsEvent: AnalyticsEvent = {
    event,
    properties: {
      ...properties,
      url: window.location.pathname,
      referrer: document.referrer || 'direct',
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      user_agent: navigator.userAgent,
    },
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
  };

  eventQueue.push(analyticsEvent);

  // Flush after 10 events or 30 seconds
  if (eventQueue.length >= 10) {
    flush();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flush, 30000);
  }

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${event}`, properties);
  }
}

// Flush events to Supabase
async function flush() {
  if (eventQueue.length === 0) return;
  if (analyticsTableMissing) {
    eventQueue = [];
    return;
  }

  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  const events = [...eventQueue];
  eventQueue = [];

  try {
    const { data: { user } } = await supabase.auth.getUser();

    const records = events.map(e => ({
      event: e.event,
      properties: e.properties || {},
      timestamp: e.timestamp,
      session_id: e.session_id,
      user_id: user?.id || null,
    }));

    const { error } = await supabase.from('analytics_events').insert(records);
    // PGRST205 / 42P01 = table not found; stop retrying for this session
    if (error && (error.code === 'PGRST205' || error.code === '42P01' || error.message?.includes('analytics_events'))) {
      analyticsTableMissing = true;
    }
  } catch {
    // Silently fail - analytics should never break the app
  }
}

// Convenience tracking functions
export const analytics = {
  pageView: (page: string) => track('page_view', { page }),
  login: (method: string) => track('auth_login', { method }),
  signup: (method: string) => track('auth_signup', { method }),
  logout: () => track('auth_logout'),
  createPost: (type: string) => track('content_create', { type }),
  vote: (targetType: string, value: number) => track('content_vote', { targetType, value }),
  reply: () => track('content_reply'),
  share: (targetType: string) => track('content_share', { targetType }),
  follow: (targetUserId: string) => track('social_follow', { targetUserId }),
  unfollow: (targetUserId: string) => track('social_unfollow', { targetUserId }),
  joinSpace: (spaceId: string) => track('social_join_space', { spaceId }),
  sendTip: (amount: number, toUserId: string) => track('commerce_tip', { amount, toUserId }),
  createListing: (category: string, price: number) => track('commerce_listing', { category, price }),
  takeQuiz: (quizId: string, score: number) => track('feature_quiz', { quizId, score }),
  uploadAvatar: () => track('feature_avatar_upload'),
  sendAlert: (type: string) => track('feature_safety_alert', { type }),
  search: (query: string, resultCount: number) => track('search', { query, resultCount }),
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flush);
}
