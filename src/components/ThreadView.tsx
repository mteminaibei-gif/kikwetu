'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase';
import { timeAgo, formatNumber, getInitials, getAvatarColor } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { Thread, Reply } from '@/types';

interface Props {
  threadId: string;
}

export default function ThreadView({ threadId }: Props) {
  const { user } = useAuth();
  const { show } = useToast();
  const [thread, setThread] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);

  const sbRef = useRef(createClient());
  const sb = sbRef.current;

  useEffect(() => {
    const load = async () => {
      try {
        const [tRes, rRes] = await Promise.all([
          sb.from('threads').select('*, author:profiles(full_name, avatar_url, verified, county), space:spaces(name)').eq('id', threadId).single(),
          sb.from('replies').select('*, author:profiles(full_name, avatar_url, verified)').eq('thread_id', threadId).order('created_at', { ascending: true }),
        ]);
        if (tRes.data) setThread(tRes.data as Thread);
        if (rRes.data) setReplies(rRes.data as Reply[]);
      } catch (e) {
        console.error('[ThreadView] load error:', e);
      }
      setLoading(false);
    };
    load();
  }, [threadId, sb]);

  const handleVote = async (entityId: string, entityType: 'thread' | 'reply') => {
    if (!user) { show('Please login to vote.'); return; }
    await sb.rpc('toggle_vote', { p_user_id: user.id, p_entity_id: entityId, p_entity_type: entityType, p_vote_type: 'up' });
    try {
      if (entityType === 'thread') {
        const { data } = await sb.from('threads').select('upvotes_count').eq('id', entityId).single();
        if (data) setThread(prev => prev ? { ...prev, upvotes_count: data.upvotes_count } : prev);
      } else {
        const { data } = await sb.from('replies').select('upvotes_count').eq('id', entityId).single();
        if (data) setReplies(prev => prev.map(r => r.id === entityId ? { ...r, upvotes_count: data.upvotes_count } : r));
      }
    } catch (e) {
      console.error('[ThreadView] vote refresh error:', e);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    if (!user) { show('Please login to reply.'); return; }
    setReplying(true);
    const { error } = await sb.from('replies').insert({
      thread_id: threadId, author_id: user.id, content: replyContent.trim(),
    }).select('*, author:profiles(full_name, avatar_url, verified)').single();
    setReplying(false);
    if (error) { show(error.message); return; }
    const { data } = await sb.from('replies').select('*, author:profiles(full_name, avatar_url, verified)').eq('thread_id', threadId).order('created_at', { ascending: true });
    if (data) setReplies(data as Reply[]);
    setReplyContent('');
    show('Answer posted!');
  };

  if (loading) return <LoadingSpinner />;
  if (!thread) return <div className="text-center py-12 text-gray-400 px-4">Thread not found.</div>;

  return (
    <div className="page-shell max-w-3xl py-3 sm:py-6 space-y-4 sm:space-y-6 pb-28 md:pb-8">
      <div className="sun-card p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
            {thread.type === 'question' ? 'Q&A' : thread.type}
          </span>
          {(thread.space as unknown as { name?: string })?.name && (
            <span className="text-[10px] text-gray-400 bg-brand-terracotta/5 px-2 py-0.5 rounded-full">{(thread.space as unknown as { name: string }).name}</span>
          )}
        </div>
        <h1 className="text-lg sm:text-xl font-black leading-snug">{thread.title}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed break-words">{thread.content}</p>
        <div className="flex items-center justify-between gap-2 pt-4 border-t border-gray-100 dark:border-gray-800 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-gray-400 min-w-0">
            <Link href={`/profile/${thread.author_id}`} className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0 ${getAvatarColor(thread.author?.full_name)}`}>
              {getInitials(thread.author?.full_name)}
            </Link>
            <Link href={`/profile/${thread.author_id}`} className="font-medium text-gray-700 dark:text-gray-300 hover:text-brand-red transition-colors truncate">{thread.author?.full_name || 'Anonymous'}</Link>
            <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">·</span>
            <span className="shrink-0">{timeAgo(thread.created_at)}</span>
          </div>
          <button onClick={() => handleVote(thread.id, 'thread')}
            className="flex items-center gap-1.5 text-xs font-bold bg-gray-100 dark:bg-gray-800 active:bg-brand-terracotta active:text-white px-3 py-2.5 rounded-full transition-all min-h-[44px] touch-manipulation shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            {formatNumber(thread.upvotes_count)}
          </button>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2 px-0.5">
          <svg className="w-4 h-4 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          {replies.length} {replies.length === 1 ? 'Answer' : 'Answers'}
        </h3>
        {replies.length === 0 && (
          <div className="text-center py-10 text-sm text-gray-400">
            <svg className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            No answers yet. Be the first to respond!
          </div>
        )}
        {replies.map(reply => (
          <div key={reply.id} className="sun-card p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
              <Link href={`/profile/${reply.author_id}`} className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0 ${getAvatarColor(reply.author?.full_name)}`}>
                {getInitials(reply.author?.full_name)}
              </Link>
              <Link href={`/profile/${reply.author_id}`} className="font-medium text-gray-700 dark:text-gray-300 hover:text-brand-red transition-colors">{reply.author?.full_name || 'Anonymous'}</Link>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span>{timeAgo(reply.created_at)}</span>
              {reply.is_accepted && (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full text-[10px]">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Accepted
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed break-words">{reply.content}</p>
            <div className="flex items-center gap-3 pt-1">
              <button onClick={() => handleVote(reply.id, 'reply')}
                className="flex items-center gap-1.5 text-xs font-bold bg-gray-100 dark:bg-gray-800 active:bg-brand-terracotta active:text-white px-3 py-2.5 rounded-full transition-all min-h-[44px] touch-manipulation">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                {formatNumber(reply.upvotes_count)}
              </button>
            </div>
          </div>
        ))}
      </div>

      {user && (
        <div className="sun-card p-3 sm:p-5 space-y-3 mobile-composer shadow-lg border border-brand-terracotta/15">
          <div className="flex items-center gap-2.5 text-xs font-bold text-gray-500 dark:text-gray-400">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${getAvatarColor(user.full_name)}`}>
              {getInitials(user.full_name)}
            </div>
            <span className="truncate">{user.full_name}</span>
          </div>
          <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)}
            rows={3} placeholder="Write your answer... (Andika jibu lako)"
            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 resize-none transition-shadow" />
          <div className="flex justify-end">
            <button onClick={handleReply} disabled={replying || !replyContent.trim()}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-3 rounded-full text-xs font-bold shadow-md disabled:opacity-50 active:scale-95 min-h-[44px] touch-manipulation">
              {replying ? 'Posting...' : 'Post Answer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
