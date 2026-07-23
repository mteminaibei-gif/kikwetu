'use client';

import { useEffect, useState } from 'react';
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

  const sb = createClient();

  useEffect(() => {
    const load = async () => {
      const [tRes, rRes] = await Promise.all([
        sb.from('threads').select('*, author:profiles(full_name, avatar_url, verified, county), space:spaces(name)').eq('id', threadId).single(),
        sb.from('replies').select('*, author:profiles(full_name, avatar_url, verified)').eq('thread_id', threadId).order('created_at', { ascending: true }),
      ]);
      if (tRes.data) setThread(tRes.data as Thread);
      if (rRes.data) setReplies(rRes.data as Reply[]);
      setLoading(false);
    };
    load();
  }, [threadId, sb]);

  const handleVote = async (entityId: string, entityType: 'thread' | 'reply') => {
    if (!user) { show('Please login to vote.'); return; }
    await sb.rpc('toggle_vote', { p_user_id: user.id, p_entity_id: entityId, p_entity_type: entityType, p_vote_type: 'up' });
    if (entityType === 'thread') {
      const { data } = await sb.from('threads').select('upvotes_count').eq('id', entityId).single();
      if (data) setThread(prev => prev ? { ...prev, upvotes_count: data.upvotes_count } : prev);
    } else {
      const { data } = await sb.from('replies').select('upvotes_count').eq('id', entityId).single();
      if (data) setReplies(prev => prev.map(r => r.id === entityId ? { ...r, upvotes_count: data.upvotes_count } : r));
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
  if (!thread) return <div className="text-center py-12 text-gray-400">Thread not found.</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
            {thread.type === 'question' ? 'Q&A' : thread.type}
          </span>
          {(thread.space as unknown as { name?: string })?.name && (
            <span className="text-[10px] text-gray-400">{(thread.space as unknown as { name: string }).name}</span>
          )}
        </div>
        <h1 className="text-lg font-black mb-3">{thread.title}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{thread.content}</p>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${getAvatarColor(thread.author?.full_name)}`}>
              {getInitials(thread.author?.full_name)}
            </div>
            <span className="font-medium text-gray-700 dark:text-gray-300">{thread.author?.full_name || 'Anonymous'}</span>
            <span>· {timeAgo(thread.created_at)}</span>
          </div>
          <button onClick={() => handleVote(thread.id, 'thread')}
            className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-orange-500 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            {formatNumber(thread.upvotes_count)}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-sm">{replies.length} {replies.length === 1 ? 'Answer' : 'Answers'}</h3>
        {replies.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No answers yet. Be the first to respond!</p>
        )}
        {replies.map(reply => (
          <div key={reply.id} className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${getAvatarColor(reply.author?.full_name)}`}>
                {getInitials(reply.author?.full_name)}
              </div>
              <span className="font-medium text-gray-700 dark:text-gray-300">{reply.author?.full_name || 'Anonymous'}</span>
              <span>· {timeAgo(reply.created_at)}</span>
              {reply.is_accepted && (
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Accepted
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{reply.content}</p>
            <div className="flex items-center gap-3 mt-3">
              <button onClick={() => handleVote(reply.id, 'reply')}
                className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-orange-500 transition-colors">
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
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${getAvatarColor(user.full_name)}`}>
              {getInitials(user.full_name)}
            </div>
            {user.full_name}
          </div>
          <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)}
            rows={3} placeholder="Write your answer... (Andika jibu lako)"
            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none" />
          <div className="flex justify-end">
            <button onClick={handleReply} disabled={replying || !replyContent.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-full text-xs font-bold shadow-md transition-all disabled:opacity-50">
              {replying ? 'Posting...' : 'Post Answer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
