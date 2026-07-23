'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import Link from 'next/link';
import { timeAgo, formatNumber, cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase';
import LoadingSpinner from '@/components/LoadingSpinner';
import CreatePostModal from '@/components/CreatePostModal';
import type { Thread } from '@/types';

const TABS = [
  { id: 'all', label: 'Yote (All)' },
  { id: 'kilimo', label: '#KilimoSmart' },
  { id: 'tech', label: 'Tech & Biz' },
  { id: 'culture', label: 'Utamaduni' },
  { id: 'education', label: 'Elimu' },
  { id: 'health', label: 'Afya' },
];

const SPACE_MAP: Record<string, string | undefined> = {
  kilimo: 'kilimo', tech: 'tech', culture: 'culture',
  education: 'education', health: 'health',
};

export default function FeedView() {
  const { threads, loadThreads, loading, subscribeToFeed } = useApp();
  const { user } = useAuth();
  const { show } = useToast();
  const [tab, setTab] = useState('all');
  const [showCreate, setShowCreate] = useState(false);

  const filtered = tab === 'all' ? threads : threads.filter(t => {
    const slug = (t.space as unknown as { slug?: string })?.slug || '';
    return slug === SPACE_MAP[tab] || t.tags?.some(tg => tg.toLowerCase().includes(tab));
  });

  const handleVote = async (thread: Thread, e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { show('Please login to vote.'); return; }
    const sb = createClient();
    await sb.rpc('toggle_vote', {
      p_user_id: user.id, p_entity_id: thread.id,
      p_entity_type: 'thread', p_vote_type: 'up',
    });
    loadThreads();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black">Baraza</h1>
        <button onClick={() => setShowCreate(true)}
          className="bg-orange-500 hover:bg-orange-400 text-white px-4 py-2 rounded-full text-xs font-bold shadow-md transition-all">
          Post to Baraza
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all',
              tab === t.id ? 'bg-orange-500/10 text-orange-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-400">
          No posts yet. Be the first to share!
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(thread => (
            <Link key={thread.id} href={`/thread/${thread.id}`}
              className="block p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <button onClick={e => handleVote(thread, e)}
                  className="flex flex-col items-center gap-0.5 w-10 pt-1 text-gray-400 hover:text-orange-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  <span className="text-xs font-bold">{formatNumber(thread.upvotes_count)}</span>
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                      {thread.type === 'question' ? 'Q&A' : thread.type}
                    </span>
                    {(thread.space as unknown as { name?: string })?.name && (
                      <span className="text-[10px] text-gray-400">
                        {(thread.space as unknown as { name: string }).name}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm leading-snug line-clamp-2">{thread.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{thread.content}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                    <span>{thread.author?.full_name || 'Anonymous'}</span>
                    {thread.author?.county && <span>· {thread.author.county}</span>}
                    <span>· {timeAgo(thread.created_at)}</span>
                    <span className="flex items-center gap-1 ml-auto">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {thread.reply_count}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
