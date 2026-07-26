'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import PostComposer from '@/components/PostComposer';
import ProfileView from '@/components/ProfileView';
import ThreadCard from '@/components/ThreadCard';
import type { Thread } from '@/types';

const FEED_TABS = [
  { id: 'all', label: 'Yote (All)' },
  { id: 'kilimo', label: '#KilimoSmart' },
  { id: 'tech', label: 'Tech & Biz' },
  { id: 'culture', label: 'Utamaduni' },
  { id: 'education', label: 'Elimu' },
  { id: 'health', label: 'Afya' },
];

const PAGE_SIZE = 10;

function ThreadSkeleton() {
  return (
    <div className="post-card mx-3 sm:mx-4 my-2.5 p-5 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-800" />
        <div className="space-y-2 flex-1">
          <div className="h-3 w-28 bg-gray-200 dark:bg-gray-800 rounded-full" />
          <div className="h-2.5 w-20 bg-gray-200 dark:bg-gray-800 rounded-full" />
        </div>
      </div>
      <div className="space-y-2 pt-1">
        <div className="h-4 w-4/5 bg-gray-200 dark:bg-gray-800 rounded-full" />
        <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded-full" />
        <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-800 rounded-full" />
      </div>
    </div>
  );
}

function openComposer() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('kikwetu:open-composer'));
  const el = document.getElementById('post-composer');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export default function FeedView() {
  const { threads, loadThreads, loading, subscribeToFeed, vote, userVotes, feedError } = useApp();
  const { user } = useAuth();
  const { show } = useToast();
  const router = useRouter();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('view');
      if (v && ['feed', 'spaces', 'leaderboard', 'profile'].includes(v)) return v;
    }
    return 'feed';
  });
  const [feedTab, setFeedTab] = useState('all');
  const [showSaved, setShowSaved] = useState(false);
  const { contentLang, setContentLang, tr } = useLanguage();
  const [votingThread, setVotingThread] = useState<string | null>(null);
  const [openShare, setOpenShare] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [localCounts, setLocalCounts] = useState<Record<string, number>>({});

  const [savedThreads, setSavedThreads] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem('kikwetu_saved') || '{}'); } catch { return {}; }
  });

  const [emojiReactions, setEmojiReactions] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem('kikwetu_reactions') || '{}'); } catch { return {}; }
  });

  useEffect(() => {
    const unsub = subscribeToFeed();
    return () => unsub();
  }, [subscribeToFeed]);

  useEffect(() => {
    setLocalCounts(prev => {
      if (Object.keys(prev).length === 0) return prev;
      let changed = false;
      const next = { ...prev };
      for (const t of threads) {
        if (t.id in next && next[t.id] === (t.upvotes_count ?? 0)) {
          delete next[t.id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [threads]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        setLoadingMore(true);
        setDisplayCount(prev => {
          const next = prev + PAGE_SIZE;
          if (next >= threads.length) void loadMoreThreads();
          return next;
        });
        setTimeout(() => setLoadingMore(false), 300);
      }
    }, { rootMargin: '200px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, threads.length]);

  const loadMoreThreads = async () => {
    setLoadingMore(true);
    const lastThread = threads[threads.length - 1];
    if (!lastThread) { setHasMore(false); setLoadingMore(false); return; }
    const newThreads = await loadThreads({ cursor: lastThread.created_at });
    setHasMore(newThreads && newThreads.length >= 30);
    setLoadingMore(false);
  };

  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
    setHasMore(true);
  }, [feedTab]);

  const filtered = showSaved
    ? threads.filter(t => savedThreads[t.id])
    : feedTab === 'all' ? threads : threads.filter(t =>
      t.tags?.some(tg => tg.toLowerCase().includes(feedTab))
    );

  const displayedThreads = filtered.slice(0, displayCount);

  const handleVote = useCallback(async (thread: Thread, voteType: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { show('Please login to vote.'); return; }
    if (votingThread === thread.id) return;

    const prevCount = localCounts[thread.id] ?? thread.upvotes_count ?? 0;
    const optimistic = voteType === 'up' ? prevCount + 1 : Math.max(0, prevCount - 1);
    setLocalCounts(c => ({ ...c, [thread.id]: optimistic }));
    setVotingThread(thread.id);

    try {
      const result = await vote(thread.id, 'thread', voteType);
      if (typeof result.upvotes_count === 'number') {
        setLocalCounts(c => ({ ...c, [thread.id]: result.upvotes_count! }));
      } else {
        setLocalCounts(c => { const next = { ...c }; delete next[thread.id]; return next; });
      }
    } catch (err: unknown) {
      setLocalCounts(c => ({ ...c, [thread.id]: prevCount }));
      show(err instanceof Error ? err.message : 'Vote failed');
    } finally {
      setVotingThread(null);
    }
  }, [user, votingThread, localCounts, vote, show]);

  const toggleSave = useCallback((threadId: string) => {
    const next = { ...savedThreads, [threadId]: !savedThreads[threadId] };
    setSavedThreads(next);
    localStorage.setItem('kikwetu_saved', JSON.stringify(next));
    show(next[threadId] ? 'Saved for later!' : 'Removed from saved');
  }, [savedThreads, show]);

  const addEmoji = useCallback(async (threadId: string, emoji: string) => {
    const current = emojiReactions[threadId];
    const next = { ...emojiReactions, [threadId]: current === emoji ? '' : emoji };
    setEmojiReactions(next);
    localStorage.setItem('kikwetu_reactions', JSON.stringify(next));
    if (!user) return;
    const sb = createClient();
    try {
      const { data: thread } = await sb.from('threads').select('author_id').eq('id', threadId).single();
      if (thread?.author_id && thread.author_id !== user.id) {
        await sb.from('notifications').insert({ user_id: thread.author_id, actor_id: user.id, type: 'emoji', entity_type: 'thread', entity_id: threadId });
      }
    } catch { /* ignore */ }
  }, [emojiReactions, user]);

  const shareToSocial = useCallback((platform: string, threadId: string, title: string, content: string) => {
    const origin = window.location.origin;
    const link = `${origin}/thread/${threadId}`;
    if (platform === 'copy') {
      void navigator.clipboard.writeText(link);
      show('Link copied!');
      return;
    }
    const text = `${title}\n\n${content}\n\n${link}`;
    const encoded = encodeURIComponent(text);
    const encodedLink = encodeURIComponent(link);
    const encodedTitle = encodeURIComponent(title);
    switch (platform) {
      case 'whatsapp': window.open(`https://wa.me/?text=${encoded}`, '_blank'); break;
      case 'telegram': window.open(`https://t.me/share/url?url=${encodedLink}&text=${encodedTitle}`, '_blank'); break;
      case 'facebook': window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedLink}&quote=${encodedTitle}`, '_blank'); break;
      case 'twitter': window.open(`https://twitter.com/intent/tweet?text=${encoded}`, '_blank'); break;
      case 'email': window.open(`mailto:?subject=${encodedTitle}&body=${encoded}`, '_blank'); break;
    }
  }, [show]);

  const toggleLang = useCallback(() => setContentLang(contentLang === 'en' ? 'sw' : 'en'), [contentLang, setContentLang]);

  useEffect(() => {
    const interval = setInterval(() => { void loadThreads(); }, 30000);
    return () => clearInterval(interval);
  }, [loadThreads]);

  const goCompose = () => {
    setView('feed');
    router.replace('/feed?view=feed', { scroll: false });
    setTimeout(openComposer, 120);
  };

  return (
    <div className="w-full pb-8">
      {view === 'feed' && (
        <div className="space-y-0">
          <div className="px-3 sm:px-4 pt-4 pb-3">
            <PostComposer />
          </div>

          <div className="sticky top-16 z-20 glass px-3 sm:px-4 py-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-hide border-y border-gray-100/80 dark:border-gray-800/80">
            {FEED_TABS.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFeedTab(t.id)}
                className={cn('chip whitespace-nowrap', feedTab === t.id && !showSaved ? 'chip-active' : 'chip-idle')}
              >
                {t.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => { setShowSaved(prev => !prev); setFeedTab('all'); }}
              className={cn('chip whitespace-nowrap', showSaved ? 'bg-amber-500 text-white shadow-md' : 'chip-idle')}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {tr('Imehifadhiwa', 'Saved')}
            </button>
            <button
              type="button"
              onClick={toggleLang}
              className="chip chip-idle ml-auto text-brand-red border border-brand-terracotta/20"
            >
              {contentLang === 'en' ? 'Kiswahili' : 'English'}
            </button>
          </div>

          {feedError ? (
            <div className="text-center py-16 space-y-4 px-4">
              <div className="sun-card p-8 max-w-sm mx-auto space-y-4">
                <p className="text-sm text-red-500 dark:text-red-400 font-medium">
                  {tr('Kuna tatizo kupakia machapisho.', 'There was an error loading the feed.')}
                </p>
                <button
                  type="button"
                  onClick={() => void loadThreads()}
                  className="sun-btn px-5 py-2.5 rounded-full font-bold text-sm"
                >
                  {tr('Jaribu Tena', 'Try Again')}
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="pt-1">
              <ThreadSkeleton />
              <ThreadSkeleton />
              <ThreadSkeleton />
            </div>
          ) : displayedThreads.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="sun-card p-10 max-w-sm mx-auto space-y-3">
                <p className="text-4xl">✨</p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {tr('Hakuna machapisho bado. Kuwa wa kwanza kushiriki!', 'No posts yet. Be the first to share!')}
                </p>
                <button type="button" onClick={goCompose} className="sun-btn px-5 py-2.5 rounded-full text-sm font-bold">
                  {tr('Andika chapisho', 'Write a post')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col pt-1">
              {displayedThreads.map((thread) => (
                <ThreadCard
                  key={thread.id}
                  thread={thread}
                  userVote={userVotes[thread.id]}
                  saved={!!savedThreads[thread.id]}
                  emojiReaction={emojiReactions[thread.id]}
                  displayCount={localCounts[thread.id] ?? thread.upvotes_count ?? 0}
                  voting={votingThread === thread.id}
                  onVote={handleVote}
                  onSave={toggleSave}
                  onEmoji={addEmoji}
                  onShare={(id) => setOpenShare(openShare === id ? null : id)}
                  showShareMenu={openShare === thread.id}
                  onShareSelect={(platform, id, title, content) => {
                    shareToSocial(platform, id, title, content);
                    setOpenShare(null);
                  }}
                />
              ))}

              <div ref={sentinelRef} className="h-4" />
              {loadingMore && (
                <div className="flex justify-center py-6">
                  <div className="w-7 h-7 border-2 border-brand-terracotta border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!hasMore && displayedThreads.length > 0 && (
                <div className="text-center py-8 text-xs text-gray-500 dark:text-gray-400">
                  {tr('Umesoma machapisho yote', 'You have seen all posts')}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {view === 'spaces' && (
        <div className="p-5 space-y-3">
          <h2 className="text-2xl font-black">{tr('Mitaa & Maarifa', 'Spaces & Knowledge')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{tr('Jiunge na jamii maalum.', 'Join specialized communities.')}</p>
        </div>
      )}

      {view === 'leaderboard' && (
        <div className="p-5 space-y-3">
          <h2 className="text-2xl font-black">{tr('Nyota za Kikwetu', 'Leaderboard & Karma')}</h2>
        </div>
      )}

      {view === 'profile' && user && (
        <ProfileView profileId={user.id} />
      )}

      <button
        type="button"
        onClick={goCompose}
        className="md:hidden fixed bottom-[88px] right-5 z-40 w-14 h-14 rounded-full sun-btn text-white shadow-2xl flex items-center justify-center active:scale-90"
        aria-label="Compose post"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
