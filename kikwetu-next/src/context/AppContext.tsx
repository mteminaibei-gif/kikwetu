'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { createClient } from '@/lib/supabase';
import { Offline } from '@/lib/offline';
import type { Thread, Reply, Space, Notification } from '@/types';

interface AppState {
  threads: Thread[];
  replies: Reply[];
  spaces: Space[];
  notifications: Notification[];
  unreadCount: number;
  selectedThread: Thread | null;
  loading: boolean;
  pendingSyncCount: number;
}

interface AppContextType extends AppState {
  loadThreads: (params?: { spaceId?: string; type?: string }) => Promise<void>;
  loadThread: (id: string) => Promise<void>;
  loadReplies: (threadId: string) => Promise<void>;
  loadSpaces: () => Promise<void>;
  loadNotifications: () => Promise<void>;
  createThread: (data: Partial<Thread>) => Promise<{ error?: string }>;
  createReply: (threadId: string, content: string) => Promise<{ error?: string }>;
  vote: (entityId: string, entityType: 'thread' | 'reply', voteType: 'up' | 'down') => Promise<void>;
  subscribeToFeed: () => () => void;
  setSelectedThread: (thread: Thread | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>({
    threads: [], replies: [], spaces: [], notifications: [],
    unreadCount: 0, selectedThread: null, loading: true, pendingSyncCount: 0,
  });

  const update = useCallback((partial: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...partial }));
  }, []);

  const loadThreads = useCallback(async (params?: { spaceId?: string; type?: string }) => {
    const sb = createClient();
    let q = sb.from('threads').select('*, author:profiles(full_name, avatar_url, verified, county), space:spaces(name)').order('created_at', { ascending: false }).limit(30);
    if (params?.spaceId) q = q.eq('space_id', params.spaceId);
    if (params?.type) q = q.eq('type', params.type);
    const { data } = await q;
    if (data) {
      setState(prev => ({ ...prev, threads: data as Thread[], loading: false }));
      // Cache offline
      if (navigator.onLine) {
        const d = Offline;
        data.forEach(t => d.cacheThread(t as Thread));
      }
    } else {
      // Load from offline cache
      const cached = await Offline.getCachedThreads();
      if (cached.length > 0) {
        setState(prev => ({ ...prev, threads: cached, loading: false }));
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    }
  }, []);

  const loadThread = useCallback(async (id: string) => {
    const sb = createClient();
    const { data } = await sb.from('threads').select('*, author:profiles(full_name, avatar_url, verified, county), space:spaces(name)').eq('id', id).single();
    if (data) {
      update({ selectedThread: data as Thread });
      await Offline.cacheThread(data as Thread);
    }
  }, [update]);

  const loadReplies = useCallback(async (threadId: string) => {
    const sb = createClient();
    const { data } = await sb.from('replies').select('*, author:profiles(full_name, avatar_url, verified)').eq('thread_id', threadId).order('created_at', { ascending: true });
    if (data) {
      update({ replies: data as Reply[] });
      await Offline.cacheReplies(threadId, data as Reply[]);
    }
  }, [update]);

  const loadSpaces = useCallback(async () => {
    const sb = createClient();
    const { data } = await sb.from('spaces').select('*').order('name');
    if (data) update({ spaces: data as Space[] });
  }, [update]);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    const sb = createClient();
    const { data } = await sb.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
    if (data) {
      const notifs = data as Notification[];
      update({ notifications: notifs, unreadCount: notifs.filter(n => !n.is_read).length });
    }
  }, [user, update]);

  const createThreadFn = useCallback(async (data: Partial<Thread>): Promise<{ error?: string }> => {
    const sb = createClient();
    const { error } = await sb.from('threads').insert({
      author_id: data.author_id,
      space_id: data.space_id || null,
      type: data.type || 'question',
      title: data.title,
      content: data.content,
      language: data.language || 'en',
      tags: data.tags || [],
      county: data.county || '',
    }).select().single();
    if (error) {
      // Queue for offline
      if (!navigator.onLine) {
        await Offline.queueAction({ type: 'createThread', userId: data.author_id!, payload: data });
        return {};
      }
      return { error: error.message };
    }
    return {};
  }, []);

  const createReply = useCallback(async (threadId: string, content: string): Promise<{ error?: string }> => {
    if (!user) return { error: 'Not logged in' };
    const sb = createClient();
    const { error } = await sb.from('replies').insert({
      thread_id: threadId,
      author_id: user.id,
      content,
    }).select().single();
    if (error) {
      if (!navigator.onLine) {
        await Offline.queueAction({ type: 'createReply', userId: user.id, payload: { thread_id: threadId, content } });
        return {};
      }
      return { error: error.message };
    }
    await loadReplies(threadId);
    return {};
  }, [user, loadReplies]);

  const vote = useCallback(async (entityId: string, entityType: 'thread' | 'reply', voteType: 'up' | 'down') => {
    if (!user) return;
    const sb = createClient();
    const { error } = await sb.rpc('toggle_vote', {
      p_user_id: user.id,
      p_entity_id: entityId,
      p_entity_type: entityType,
      p_vote_type: voteType,
    });
    if (error) {
      if (!navigator.onLine) {
        await Offline.queueAction({ type: 'vote', userId: user.id, payload: { entityId, entityType, voteType } });
      }
    }
  }, [user]);

  const subscribeToFeed = useCallback(() => {
    const sb = createClient();
    const channel = sb.channel('feed-live').on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'threads' },
      (p) => {
        const newThread = p.new as Thread;
        setState(prev => {
          if (prev.threads.find(t => t.id === newThread.id)) return prev;
          return { ...prev, threads: [{ ...newThread, author: { full_name: 'New', avatar_url: '', verified: false, county: '' } }, ...prev.threads] };
        });
      }
    ).subscribe();
    return () => { sb.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (user) {
      loadNotifications();
      (async () => {
        const pending = await Offline.getPendingCount();
        update({ pendingSyncCount: pending });
      })();
    }
  }, [user, loadNotifications, update]);

  return (
    <AppContext.Provider value={{
      ...state, loadThreads, loadThread, loadReplies, loadSpaces, loadNotifications,
      createThread: createThreadFn, createReply, vote, subscribeToFeed, setSelectedThread: (t) => update({ selectedThread: t }),
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
