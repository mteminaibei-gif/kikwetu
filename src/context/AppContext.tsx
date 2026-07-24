'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { createClient } from '@/lib/supabase';
import { Offline } from '@/lib/offline';
import type {
  Thread, Reply, Space, Notification, Professional, ProfessionalRequest,
  TeachingSession, ChatMessage, ServiceRating, Tip,
} from '@/types';

interface AppState {
  threads: Thread[];
  replies: Reply[];
  spaces: Space[];
  notifications: Notification[];
  unreadCount: number;
  selectedThread: Thread | null;
  loading: boolean;
  pendingSyncCount: number;
  professionals: Professional[];
  professionalRequests: ProfessionalRequest[];
  sessions: TeachingSession[];
  messages: ChatMessage[];
  ratings: ServiceRating[];
  tips: Tip[];
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
  loadProfessionals: () => Promise<void>;
  loadProfessionalRequests: () => Promise<void>;
  requestProfessional: (data: Partial<ProfessionalRequest>) => Promise<{ error?: string }>;
  reviewProfessionalRequest: (id: string, status: 'approved' | 'rejected', reason?: string) => Promise<{ error?: string }>;
  loadSessions: (userId: string) => Promise<void>;
  createSession: (data: Partial<TeachingSession>) => Promise<{ error?: string; data?: TeachingSession }>;
  updateSessionStatus: (id: string, status: TeachingSession['status']) => Promise<void>;
  loadMessages: (sessionId: string) => Promise<void>;
  sendMessage: (sessionId: string, content: string) => Promise<{ error?: string }>;
  subscribeToMessages: (sessionId: string, onMessage: (msg: ChatMessage) => void) => () => void;
  submitRating: (data: Partial<ServiceRating>) => Promise<{ error?: string }>;
  loadRatings: (professionalId: string) => Promise<void>;
  submitTip: (data: Partial<Tip>) => Promise<{ error?: string }>;
  loadTips: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>({
    threads: [], replies: [], spaces: [], notifications: [],
    unreadCount: 0, selectedThread: null, loading: true, pendingSyncCount: 0,
    professionals: [], professionalRequests: [], sessions: [], messages: [],
    ratings: [], tips: [],
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
      if (navigator.onLine) { data.forEach(t => Offline.cacheThread(t as Thread)); }
    } else {
      const cached = await Offline.getCachedThreads();
      setState(prev => ({ ...prev, threads: cached.length > 0 ? cached : prev.threads, loading: false }));
    }
  }, []);

  const loadThread = useCallback(async (id: string) => {
    const sb = createClient();
    const { data } = await sb.from('threads').select('*, author:profiles(full_name, avatar_url, verified, county), space:spaces(name)').eq('id', id).single();
    if (data) { update({ selectedThread: data as Thread }); await Offline.cacheThread(data as Thread); }
  }, [update]);

  const loadReplies = useCallback(async (threadId: string) => {
    const sb = createClient();
    const { data } = await sb.from('replies').select('*, author:profiles(full_name, avatar_url, verified)').eq('thread_id', threadId).order('created_at', { ascending: true });
    if (data) { update({ replies: data as Reply[] }); await Offline.cacheReplies(threadId, data as Reply[]); }
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
    if (!data.author_id) return { error: 'Missing author_id' };
    const sb = createClient();
    const { error } = await sb.from('threads').insert({
      author_id: data.author_id, space_id: data.space_id || null, type: data.type || 'question',
      title: data.title, content: data.content, language: data.language || 'en',
      tags: data.tags || [], county: data.county || '',
    }).select().single();
    if (error) {
      if (!navigator.onLine) { await Offline.queueAction({ type: 'createThread', userId: data.author_id, payload: data }); return {}; }
      return { error: error.message };
    }
    return {};
  }, []);

  const createReply = useCallback(async (threadId: string, content: string): Promise<{ error?: string }> => {
    if (!user) return { error: 'Not logged in' };
    const sb = createClient();
    const { error } = await sb.from('replies').insert({ thread_id: threadId, author_id: user.id, content }).select().single();
    if (error) {
      if (!navigator.onLine) { await Offline.queueAction({ type: 'createReply', userId: user.id, payload: { thread_id: threadId, content } }); return {}; }
      return { error: error.message };
    }
    await loadReplies(threadId);
    return {};
  }, [user, loadReplies]);

  const vote = useCallback(async (entityId: string, entityType: 'thread' | 'reply', voteType: 'up' | 'down') => {
    if (!user) return;
    const sb = createClient();
    const { error } = await sb.rpc('toggle_vote', { p_user_id: user.id, p_entity_id: entityId, p_entity_type: entityType, p_vote_type: voteType });
    if (error && !navigator.onLine) { await Offline.queueAction({ type: 'vote', userId: user.id, payload: { entityId, entityType, voteType } }); }
  }, [user]);

  const subscribeToFeed = useCallback(() => {
    const sb = createClient();
    const channel = sb.channel('feed-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'threads' }, async (p) => {
        const newThread = p.new as Thread;
        setState(prev => {
          if (prev.threads.find(t => t.id === newThread.id)) return prev;
          return prev;
        });
        const { data: authorProfile } = await sb.from('profiles').select('full_name, avatar_url, verified, county').eq('id', newThread.author_id).single();
        setState(prev => {
          if (prev.threads.find(t => t.id === newThread.id)) return prev;
          return { ...prev, threads: [{ ...newThread, author: authorProfile || { full_name: 'New', avatar_url: '', verified: false, county: '' } }, ...prev.threads] };
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'threads', filter: `upvotes_count=neq.${-1}` }, (p) => {
        const updated = p.new as Thread;
        setState(prev => ({ ...prev, threads: prev.threads.map(t => t.id === updated.id ? { ...t, upvotes_count: updated.upvotes_count, reply_count: updated.reply_count, title: updated.title, content: updated.content } : t) }));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'replies' }, (p) => {
        const newReply = p.new as Reply;
        setState(prev => ({ ...prev, replies: [...prev.replies, newReply], threads: prev.threads.map(t => t.id === newReply.thread_id ? { ...t, reply_count: (t.reply_count || 0) + 1 } : t) }));
      })
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, []);

  const loadProfessionals = useCallback(async () => {
    const sb = createClient();
    const { data } = await sb.from('professionals').select('*, profile:profiles(full_name, avatar_url, county, verified, heshima_score, role)').eq('verification_status', 'approved').order('avg_rating', { ascending: false });
    if (data) update({ professionals: data as Professional[] });
  }, [update]);

  const loadProfessionalRequests = useCallback(async () => {
    const sb = createClient();
    const { data } = await sb.from('professional_requests').select('*, profile:profiles(full_name, avatar_url, county, email)').eq('status', 'pending').order('created_at', { ascending: false });
    if (data) update({ professionalRequests: data as ProfessionalRequest[] });
  }, [update]);

  const requestProfessional = useCallback(async (reqData: Partial<ProfessionalRequest>): Promise<{ error?: string }> => {
    if (!user) return { error: 'Not logged in' };
    const sb = createClient();
    const { error } = await sb.from('professional_requests').insert({
      profile_id: user.id, title: reqData.title, bio: reqData.bio,
      qualifications: reqData.qualifications, qualifications_doc_url: reqData.qualifications_doc_url,
      expertise: reqData.expertise || [],
    }).select().single();
    if (error) return { error: error.message };
    return {};
  }, [user]);

  const reviewProfessionalRequest = useCallback(async (id: string, status: 'approved' | 'rejected', reason?: string): Promise<{ error?: string }> => {
    if (!user) return { error: 'Not logged in' };
    const sb = createClient();
    const { error } = await sb.from('professional_requests').update({
      status, reviewed_by: user.id, reviewed_at: new Date().toISOString(), rejection_reason: reason || null,
    }).eq('id', id);
    if (error) return { error: error.message };
    if (status === 'approved') {
      const req = state.professionalRequests.find(r => r.id === id);
      if (req) {
        await sb.from('professionals').upsert({
          profile_id: req.profile_id, title: req.title, bio: req.bio,
          qualifications: req.qualifications, qualifications_doc_url: req.qualifications_doc_url,
          expertise: req.expertise, verification_status: 'approved', verified_by: user.id, verified_at: new Date().toISOString(),
        }).select().single();
        await sb.from('profiles').update({ role: 'expert' }).eq('id', req.profile_id);
      }
    }
    loadProfessionalRequests();
    loadProfessionals();
    return {};
  }, [user, state.professionalRequests, loadProfessionalRequests, loadProfessionals]);

  const loadSessions = useCallback(async (userId: string) => {
    const sb = createClient();
    const { data } = await sb.from('teaching_sessions')
      .select('*, student:profiles!teaching_sessions_student_id_fkey(full_name, avatar_url, county), professional:profiles!teaching_sessions_professional_id_fkey(full_name, avatar_url, county)')
      .or(`student_id.eq.${userId},professional_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (data) update({ sessions: data as TeachingSession[] });
  }, [update]);

  const createSession = useCallback(async (sData: Partial<TeachingSession>): Promise<{ error?: string; data?: TeachingSession }> => {
    if (!user) return { error: 'Not logged in' };
    const sb = createClient();
    const { data, error } = await sb.from('teaching_sessions').insert({
      student_id: user.id, professional_id: sData.professional_id,
      topic: sData.topic, description: sData.description, status: 'requested',
    }).select().single();
    if (error) return { error: error.message };
    return { data: data as TeachingSession };
  }, [user]);

  const updateSessionStatus = useCallback(async (id: string, status: TeachingSession['status']) => {
    const sb = createClient();
    await sb.from('teaching_sessions').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (user) loadSessions(user.id);
  }, [user, loadSessions]);

  const loadMessages = useCallback(async (sessionId: string) => {
    const sb = createClient();
    const { data } = await sb.from('chat_messages').select('*, sender:profiles(full_name, avatar_url)').eq('session_id', sessionId).order('created_at', { ascending: true });
    if (data) update({ messages: data as ChatMessage[] });
  }, [update]);

  const sendMessage = useCallback(async (sessionId: string, content: string): Promise<{ error?: string }> => {
    if (!user) return { error: 'Not logged in' };
    const sb = createClient();
    const { error } = await sb.from('chat_messages').insert({ session_id: sessionId, sender_id: user.id, content }).select().single();
    if (error) return { error: error.message };
    await loadMessages(sessionId);
    return {};
  }, [user, loadMessages]);

  const subscribeToMessages = useCallback((sessionId: string, onMessage: (msg: ChatMessage) => void) => {
    const sb = createClient();
    const channel = sb.channel(`session-${sessionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${sessionId}` }, (p) => {
        onMessage(p.new as ChatMessage);
      })
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, []);

  const submitRating = useCallback(async (rData: Partial<ServiceRating>): Promise<{ error?: string }> => {
    if (!user) return { error: 'Not logged in' };
    const sb = createClient();
    const { error } = await sb.from('service_ratings').insert({
      session_id: rData.session_id, student_id: user.id,
      professional_id: rData.professional_id, score: rData.score, review: rData.review || null,
    }).select().single();
    if (error) return { error: error.message };
    const { error: rpcError } = await sb.rpc('update_professional_rating', { p_professional_id: rData.professional_id });
    if (rpcError) console.error('[Rating] RPC error:', rpcError);
    return {};
  }, [user]);

  const loadRatings = useCallback(async (professionalId: string) => {
    const sb = createClient();
    const { data } = await sb.from('service_ratings').select('*, student:profiles(full_name, avatar_url)').eq('professional_id', professionalId).order('created_at', { ascending: false });
    if (data) update({ ratings: data as ServiceRating[] });
  }, [update]);

  const submitTip = useCallback(async (tData: Partial<Tip>): Promise<{ error?: string }> => {
    if (!user) return { error: 'Not logged in' };
    const amt = tData.amount || 0;
    const professionalAmount = Math.round(amt * 0.7);
    const platformAmount = amt - professionalAmount;
    const sb = createClient();
    const { error } = await sb.from('tips').insert({
      session_id: tData.session_id, student_id: user.id,
      professional_id: tData.professional_id, amount: amt,
      platform_amount: platformAmount, professional_amount: professionalAmount,
      mpesa_ref: tData.mpesa_ref, status: 'pending',
    }).select().single();
    if (error) return { error: error.message };
    return {};
  }, [user]);

  const loadTips = useCallback(async () => {
    if (!user) return;
    const sb = createClient();
    const { data } = await sb.from('tips').select('*, student:profiles!tips_student_id_fkey(full_name), professional:profiles!tips_professional_id_fkey(full_name)').or(`student_id.eq.${user.id},professional_id.eq.${user.id}`).order('created_at', { ascending: false }).limit(20);
    if (data) update({ tips: data as Tip[] });
  }, [user, update]);

  useEffect(() => {
    if (user) {
      loadNotifications();
      (async () => { const pending = await Offline.getPendingCount(); update({ pendingSyncCount: pending }); })();
    }
  }, [user, loadNotifications, update]);

  useEffect(() => {
    const handleOnline = async () => {
      if (!user) return;
      const sb = createClient();
      const drained = await Offline.drainSyncQueue(sb);
      if (drained > 0) { const pending = await Offline.getPendingCount(); update({ pendingSyncCount: pending }); loadThreads(); }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user, update, loadThreads]);

  useEffect(() => {
    if (user && navigator.onLine) {
      (async () => {
        const sb = createClient();
        const drained = await Offline.drainSyncQueue(sb);
        if (drained > 0) { const pending = await Offline.getPendingCount(); update({ pendingSyncCount: pending }); loadThreads(); }
      })();
    }
  }, [user, update, loadThreads]);

  return (
    <AppContext.Provider value={{
      ...state, loadThreads, loadThread, loadReplies, loadSpaces, loadNotifications,
      createThread: createThreadFn, createReply, vote, subscribeToFeed,
      setSelectedThread: (t) => update({ selectedThread: t }),
      loadProfessionals, loadProfessionalRequests, requestProfessional, reviewProfessionalRequest,
      loadSessions, createSession, updateSessionStatus,
      loadMessages, sendMessage, subscribeToMessages,
      submitRating, loadRatings, submitTip, loadTips,
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
