'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { timeAgo, formatNumber, cn } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import PostComposer from '@/components/PostComposer';
import type { Thread } from '@/types';

const TABS = [
  { id: 'feed', label: 'Feed', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'spaces', label: 'Spaces', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'leaderboard', label: 'Karma', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
];

const FEED_TABS = [
  { id: 'all', label: 'Yote (All)' },
  { id: 'kilimo', label: '#KilimoSmart' },
  { id: 'tech', label: 'Tech & Biz' },
  { id: 'culture', label: 'Utamaduni' },
  { id: 'education', label: 'Elimu' },
  { id: 'health', label: 'Afya' },
];

const PAGE_SIZE = 10;

function openComposer() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('kikwetu:open-composer'));
  const el = document.getElementById('post-composer');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export default function FeedView() {
  const { threads, loadThreads, appendThreads, loading, subscribeToFeed, vote } = useApp();
  const { user } = useAuth();
  const { show } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const sbRef = useRef(createClient());
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
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
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [localCounts, setLocalCounts] = useState<Record<string, number>>({});

  const [savedThreads, setSavedThreads] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem('kikwetu_saved') || '{}'); } catch { return {}; }
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

  const loadMoreThreads = useCallback(async () => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const sb = sbRef.current;
      const from = threads.length;
      const { data } = await sb.from('threads')
        .select('*, author:profiles(full_name, avatar_url, verified, county, username), space:spaces(name)')
        .order('created_at', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (data && data.length > 0) {
        appendThreads(data as Thread[]);
        setDisplayCount(prev => prev + data.length);
        setHasMore(data.length >= PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [threads.length, appendThreads]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting || loadingMoreRef.current || !hasMore) return;
      if (displayCount < threads.length) {
        setDisplayCount(prev => Math.min(prev + PAGE_SIZE, threads.length));
      } else {
        void loadMoreThreads();
      }
    }, { rootMargin: '240px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, displayCount, threads.length, loadMoreThreads]);

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

  const getDisplayCount = (thread: Thread) =>
    localCounts[thread.id] ?? thread.upvotes_count ?? 0;

  const handleVote = async (thread: Thread, voteType: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { show('Please login to vote.'); return; }
    if (votingThread === thread.id) return;

    const prevCount = getDisplayCount(thread);
    const optimistic = voteType === 'up' ? prevCount + 1 : Math.max(0, prevCount - 1);
    setLocalCounts(c => ({ ...c, [thread.id]: optimistic }));
    setVotingThread(thread.id);

    try {
      const result = await vote(thread.id, 'thread', voteType);
      if (typeof result.upvotes_count === 'number') {
        const count = result.upvotes_count;
        setLocalCounts(c => ({ ...c, [thread.id]: count }));
      } else {
        setLocalCounts(c => {
          const next = { ...c };
          delete next[thread.id];
          return next;
        });
      }
    } catch (err: unknown) {
      setLocalCounts(c => ({ ...c, [thread.id]: prevCount }));
      show(err instanceof Error ? err.message : 'Vote failed');
    } finally {
      setVotingThread(null);
    }
  };

  const toggleSave = (threadId: string) => {
    const next = { ...savedThreads, [threadId]: !savedThreads[threadId] };
    setSavedThreads(next);
    localStorage.setItem('kikwetu_saved', JSON.stringify(next));
    show(savedThreads[threadId] ? 'Removed from saved' : 'Saved for later!');
  };

  const toggleLang = useCallback(() => setContentLang(contentLang === 'en' ? 'sw' : 'en'), [contentLang, setContentLang]);

  useEffect(() => {
    const interval = setInterval(() => { loadThreads(); }, 60000);
    return () => clearInterval(interval);
  }, [loadThreads]);

  const goCompose = () => {
    setView('feed');
    router.replace('/feed?view=feed', { scroll: false });
    setTimeout(openComposer, 120);
  };

  return (
    <div className="max-w-7xl mx-auto flex-1 w-full grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 px-2 sm:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
      <aside className="hidden md:block md:col-span-1">
        <div className="sticky top-24 space-y-6">
          <nav className="sun-card p-2 space-y-1">
            {TABS.map(t => (
              <button key={t.id} type="button" onClick={() => { setView(t.id); router.replace(`/feed?view=${t.id}`, { scroll: false }); }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all',
                  view === t.id ? 'bg-brand-deep text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} /></svg>
                {t.label}
              </button>
            ))}
            <div className="border-t border-gray-100 dark:border-gray-800 my-2" />
            <Link href="/students" className={cn('flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl', pathname === '/students' ? 'bg-brand-deep text-white' : 'text-gray-600 dark:text-gray-400')}>Students</Link>
            <Link href="/nyumba-kumi" className={cn('flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl', pathname === '/nyumba-kumi' ? 'bg-brand-deep text-white' : 'text-gray-600 dark:text-gray-400')}>Nyumba Kumi</Link>
            <Link href="/radio" className={cn('flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl', pathname === '/radio' ? 'bg-brand-deep text-white' : 'text-gray-600 dark:text-gray-400')}>Radio</Link>
          </nav>
          <button type="button" onClick={goCompose}
            className="w-full bg-gradient-to-r from-brand-terracotta to-brand-red text-white font-bold py-3 px-4 rounded-xl shadow-lg">
            Andika (Post)
          </button>
        </div>
      </aside>

      <main className="col-span-1 md:col-span-3 lg:col-span-3 space-y-6">
        {view === 'feed' && (
          <div className="space-y-6">
            <PostComposer />
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {FEED_TABS.map(t => (
                <button key={t.id} type="button" onClick={() => setFeedTab(t.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap',
                    feedTab === t.id ? 'bg-brand-deep text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
                  )}>{t.label}</button>
              ))}
              <button type="button" onClick={() => { setShowSaved(p => !p); setFeedTab('all'); }}
                className={cn('px-3 py-1.5 rounded-full text-xs font-bold', showSaved ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-gray-800')}>
                {tr('Imehifadhiwa', 'Saved')}
              </button>
              <button type="button" onClick={toggleLang} className="ml-1 px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-800 text-brand-red">
                {contentLang === 'en' ? 'Kiswahili' : 'English'}
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><LoadingSpinner /></div>
            ) : displayedThreads.length === 0 ? (
              <div className="text-center py-16 text-sm text-gray-500">
                {tr('Hakuna machapisho bado. Kuwa wa kwanza kushiriki!', 'No posts yet. Be the first to share!')}
              </div>
            ) : (
              <div className="space-y-4">
                {displayedThreads.map((thread) => (
                  <div key={thread.id} className="sun-card p-4 sm:p-5 space-y-3 relative">
                    <div className="flex items-center gap-3">
                      <Link href={`/profile/${thread.author_id}`} className="shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-terracotta to-brand-red flex items-center justify-center text-sm font-bold text-white overflow-hidden">
                          {thread.author?.avatar_url
                            ? <img src={thread.author.avatar_url} alt="" className="w-full h-full object-cover" />
                            : (thread.author?.full_name?.[0]?.toUpperCase() || 'A')}
                        </div>
                      </Link>
                      <div>
                        <h5 className="text-sm font-bold text-gray-900 dark:text-gray-100">{thread.author?.full_name || tr('Mgeni', 'Guest')}</h5>
                        <span className="text-[11px] text-gray-500">{thread.author?.county || ''} &middot; {timeAgo(thread.created_at)}</span>
                      </div>
                    </div>
                    <Link href={`/thread/${thread.id}`} className="block">
                      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{thread.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1.5 line-clamp-2">{thread.content}</p>
                    </Link>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={e => handleVote(thread, 'up', e)} disabled={votingThread === thread.id}
                          className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 hover:bg-emerald-500 hover:text-white px-2.5 py-1.5 rounded-l-full font-bold disabled:opacity-50">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                          {formatNumber(getDisplayCount(thread))}
                        </button>
                        <button type="button" onClick={e => handleVote(thread, 'down', e)} disabled={votingThread === thread.id}
                          className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 hover:bg-red-500 hover:text-white px-2.5 py-1.5 rounded-r-full font-bold border-l disabled:opacity-50">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        <Link href={`/thread/${thread.id}`} className="ml-2 text-gray-500 hover:text-brand-red font-medium">{thread.reply_count}</Link>
                      </div>
                      <button type="button" onClick={() => toggleSave(thread.id)}
                        className={cn('p-1.5', savedThreads[thread.id] ? 'text-amber-500' : 'text-gray-400')}>
                        <svg className="w-4 h-4" fill={savedThreads[thread.id] ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
                <div ref={sentinelRef} className="h-4" />
                {loadingMore && (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-brand-terracotta border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!hasMore && displayedThreads.length > 0 && (
                  <div className="text-center py-6 text-xs text-gray-500">{tr('Umesoma machapisho yote', 'You have seen all posts')}</div>
                )}
              </div>
            )}
          </div>
        )}

        {view === 'spaces' && (
          <div className="sun-card p-6">
            <h2 className="text-xl font-black text-white bg-brand-deep rounded-xl p-4 mb-4">{tr('Mitaa & Maarifa', 'Spaces')}</h2>
            <p className="text-sm text-gray-500">{tr('Jiunge na jamii maalum.', 'Join specialized communities.')}</p>
          </div>
        )}

        {view === 'leaderboard' && (
          <div className="sun-card p-6">
            <h3 className="font-bold">{tr('Nyota za Kikwetu', 'Leaderboard')}</h3>
            <p className="text-xs text-gray-500 mt-2">{tr('Wachangiaji wakuu.', 'Top contributors.')}</p>
          </div>
        )}

        {view === 'profile' && user && (
          <div className="sun-card p-6">
            <h2 className="text-xl font-black">{user.full_name}</h2>
            <p className="text-xs text-gray-500">@{user.username}</p>
            <p className="mt-4 text-brand-red font-bold">Heshima: {user.heshima_score}</p>
          </div>
        )}
      </main>

      <aside className="hidden lg:block lg:col-span-1">
        <div className="sticky top-24 sun-card p-4 space-y-2">
          <h4 className="text-xs font-bold uppercase text-gray-500">{tr('Inauma Kenya', 'Trending')}</h4>
          <p className="text-xs font-bold text-brand-red">#KilimoSmart</p>
          <p className="text-xs font-bold text-brand-red">#NairobiTech</p>
          <p className="text-xs font-bold text-brand-red">#ShuleYetu</p>
        </div>
      </aside>

      <button type="button" onClick={goCompose}
        className="md:hidden fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-brand-terracotta to-brand-red text-white shadow-2xl flex items-center justify-center"
        aria-label="Compose post">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
      </button>
    </div>
  );
}
