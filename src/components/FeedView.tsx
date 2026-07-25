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
import ProfileView from '@/components/ProfileView';
import type { Thread, Space } from '@/types';


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

const SPACES_DATA = [
  { name: 'Kilimo Smart (Rift Valley)', desc: 'Modern agronomy, soil health, and market access.', members: '14.2k', icon: '🌾', color: 'text-brand-red' },
  { name: 'Nairobi Tech & Startups', desc: 'Full-stack engineering, Flutter, and local software solutions.', members: '9.8k', icon: '💻', color: 'text-blue-500' },
  { name: 'Swahili & Folklore Hub', desc: 'Preserving Kenyan storytelling, poetry, and linguistic roots.', members: '6.4k', icon: '📖', color: 'text-purple-500' },
  { name: 'Mombasa Business & Trade', desc: 'Coastal trade, logistics, and tourism networks.', members: '5.1k', icon: '🚢', color: 'text-cyan-500' },
  { name: 'Nyumba Kumi Usalama', desc: 'Neighborhood security watch, community alerts, and local issue reporting.', members: '3.2k', icon: '🏘️', color: 'text-amber-600' },
];

const LEADERBOARD_DATA = [
  { name: 'Mkulima Jane', county: 'Trans-Nzoia', points: 4820, rank: 1 },
  { name: 'Yonas Boley', county: 'Nairobi', points: 3950, rank: 2 },
  { name: 'Amina Baraka', county: 'Mombasa', points: 3210, rank: 3 },
];

const PAGE_SIZE = 10;
const AD_SPOTS = [
  { id: 1, label: 'Ad Space', desc: 'Promote your business here', color: 'from-blue-500/10 to-blue-600/5' },
  { id: 2, label: 'Sponsored', desc: 'Reach 12,000+ Kenyans', color: 'from-purple-500/10 to-purple-600/5' },
];

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
  const pathname = usePathname();
  const sbRef = useRef(createClient());
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
  const [joinedSpaces, setJoinedSpaces] = useState<Record<string, boolean>>({});
  const [votingThread, setVotingThread] = useState<string | null>(null);
  const [openShare, setOpenShare] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  // Optimistic overrides only while a vote is in flight / until server catches up.
  // Cleared when context threads.upvotes_count matches so Realtime is never blocked.
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

  // Drop optimistic overrides once the authoritative context value matches.
  // This unblocks Realtime updates from other users and loadThreads/poll.
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
          if (next >= threads.length) {
            loadMoreThreads();
          }
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
    if (!lastThread) {
      setHasMore(false);
      setLoadingMore(false);
      return;
    }
    
    const newThreads = await loadThreads({ cursor: lastThread.created_at });
    if (newThreads && newThreads.length > 0) {
      setHasMore(newThreads.length >= 30);
    } else {
      setHasMore(false);
    }
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

  const getDisplayCount = (thread: Thread) =>
    localCounts[thread.id] ?? thread.upvotes_count ?? 0;

  const handleVote = async (thread: Thread, voteType: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { show('Please login to vote.'); return; }
    if (votingThread === thread.id) return;

    const prevCount = getDisplayCount(thread);
    // Optimistic delta only — toggle_vote may add/remove/switch; server count is authoritative.
    const optimistic = voteType === 'up' ? prevCount + 1 : Math.max(0, prevCount - 1);
    setLocalCounts(c => ({ ...c, [thread.id]: optimistic }));
    setVotingThread(thread.id);

    try {
      const result = await vote(thread.id, 'thread', voteType);
      if (typeof result.upvotes_count === 'number') {
        // Align with server; sync effect will clear once context matches.
        setLocalCounts(c => ({ ...c, [thread.id]: result.upvotes_count! }));
      } else {
        // No count returned — drop override so context/Realtime drives UI.
        setLocalCounts(c => {
          const next = { ...c };
          delete next[thread.id];
          return next;
        });
      }
      // Do NOT call loadThreads() — avoids scroll jump and races with Realtime.
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

  const addEmoji = async (threadId: string, emoji: string) => {
    const current = emojiReactions[threadId];
    const next = { ...emojiReactions, [threadId]: current === emoji ? '' : emoji };
    setEmojiReactions(next);
    localStorage.setItem('kikwetu_reactions', JSON.stringify(next));
    if (!user) return;
    const sb = createClient();
    try {
      const { data: thread } = await sb.from('threads').select('author_id').eq('id', threadId).single();
      if (thread?.author_id && thread.author_id !== user.id) {
        await sb.from('notifications').insert({
          user_id: thread.author_id,
          actor_id: user.id,
          type: 'emoji',
          entity_type: 'thread',
          entity_id: threadId,
        });
      }
    } catch {}
  };

  const shareToSocial = (platform: string, threadId: string, title: string, content: string) => {
    const origin = window.location.origin;
    const link = `${origin}/thread/${threadId}`;
    const text = `${title}\n\n${content}\n\n${link}`;
    const encoded = encodeURIComponent(text);
    const encodedLink = encodeURIComponent(link);
    const encodedTitle = encodeURIComponent(title);
    switch (platform) {
      case 'whatsapp': window.open(`https://wa.me/?text=${encoded}`, '_blank'); break;
      case 'telegram': window.open(`https://t.me/share/url?url=${encodedLink}&text=${encodedTitle}`, '_blank'); break;
      case 'facebook': window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedLink}&quote=${encodedTitle}`, '_blank'); break;
      case 'twitter': window.open(`https://twitter.com/intent/tweet?text=${encoded}`, '_blank'); break;
      case 'linkedin': window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}`, '_blank'); break;
      case 'instagram': navigator.clipboard.writeText(link); show('Link copied! Share on Instagram.'); break;
      case 'email': window.open(`mailto:?subject=${encodedTitle}&body=${encoded}`, '_blank'); break;
    }
  };

  const toggleLang = useCallback(() => setContentLang(contentLang === 'en' ? 'sw' : 'en'), [contentLang, setContentLang]);

  useEffect(() => {
    const interval = setInterval(() => { loadThreads(); }, 30000);
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
        <div className="sticky top-20 space-y-6">
          <nav className="sun-card p-2 space-y-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => { setView(t.id); router.replace(`/feed?view=${t.id}`, { scroll: false }); }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all',
                  view === t.id ? 'bg-brand-deep text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                )}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} /></svg>
                {t.label}
              </button>
            ))}
            <div className="border-t border-gray-100 dark:border-gray-800 my-2" />
            <Link href="/students" className={cn('flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all', pathname === '/students' ? 'bg-brand-deep text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              Students
            </Link>
            <Link href="/nyumba-kumi" className={cn('flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all', pathname === '/nyumba-kumi' ? 'bg-brand-deep text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Nyumba Kumi
            </Link>
            <Link href="/professionals/request" className={cn('flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all', pathname === '/professionals/request' ? 'bg-brand-deep text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              Professionals
            </Link>
            <Link href="/radio" className={cn('flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all', pathname === '/radio' ? 'bg-brand-deep text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
              Radio
            </Link>
          </nav>

          <button type="button" onClick={goCompose}
            className="w-full bg-gradient-to-r from-brand-terracotta to-brand-red text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 hover:shadow-xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span>Andika (Post)</span>
          </button>

          <div className="sun-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Utu & Heshima</h4>
              <span className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 px-2 py-0.5 rounded-full font-bold">Top 5%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-brand-red">{user?.heshima_score || 0}</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">Trust score based on peer helpfulness.</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-brand-terracotta to-brand-red h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((user?.heshima_score || 0) / 50, 100)}%` }} />
            </div>
          </div>
        </div>
      </aside>

      <main className="col-span-1 md:col-span-3 lg:col-span-3 space-y-6">
        {view === 'feed' && (
          <div className="space-y-6">
            <PostComposer />

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {FEED_TABS.map(t => (
                <button key={t.id} onClick={() => setFeedTab(t.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all',
                    feedTab === t.id ? 'bg-brand-deep text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  )}>{t.label}</button>
              ))}
              <button onClick={() => { setShowSaved(prev => !prev); setFeedTab('all'); }}
                className={cn('px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all', showSaved ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700')}>
                <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                {tr('Imehifadhiwa', 'Saved')}
              </button>
              <button onClick={toggleLang} className="ml-1 px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-800 text-brand-red hover:bg-brand-terracotta/10 transition-all">
                {contentLang === 'en' ? 'Kiswahili' : 'English'}
              </button>
            </div>

            {feedError ? (
              <div className="text-center py-16 space-y-4">
                <div className="text-sm text-red-500 dark:text-red-400 font-medium">
                  {tr('Kuna tatizo kupakia machapisho.', 'There was an error loading the feed.')}
                </div>
                <button onClick={() => loadThreads()} className="bg-brand-terracotta text-white px-4 py-2 rounded-full font-bold shadow hover:bg-brand-red transition-all">
                  {tr('Jaribu Tena', 'Try Again')}
                </button>
              </div>
            ) : loading ? (
              <div className="flex justify-center py-12"><LoadingSpinner /></div>
            ) : displayedThreads.length === 0 ? (
              <div className="text-center py-16 text-sm text-gray-500 dark:text-gray-400">
                {tr('Hakuna machapisho bado. Kuwa wa kwanza kushiriki!', 'No posts yet. Be the first to share!')}
              </div>
            ) : (
              <div className="space-y-4">
                {displayedThreads.map((thread) => (
                  <div key={thread.id} className="sun-card p-4 sm:p-5 space-y-3 sm:space-y-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 border border-transparent hover:border-brand-terracotta/20 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-terracotta/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-start justify-between z-10">
                      <div className="flex items-center gap-3">
                        <Link href={`/profile/${thread.author_id}`} className="shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-terracotta to-brand-red flex items-center justify-center text-sm font-bold text-white shadow-sm overflow-hidden">
                            {thread.author?.avatar_url ? (
                              <img src={thread.author.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              thread.author?.full_name?.[0]?.toUpperCase() || 'A'
                            )}
                          </div>
                        </Link>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h5 className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-brand-red transition-colors">{thread.author?.full_name || tr('Mgeni', 'Guest')}</h5>
                            {thread.author?.username && <span className="text-[11px] text-gray-500 dark:text-gray-400">@{thread.author.username}</span>}
                          </div>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">{thread.author?.county || ''} &middot; {timeAgo(thread.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <Link href={`/thread/${thread.id}`} className="block relative z-10">
                      <h3 className="text-base font-bold leading-snug text-gray-900 dark:text-gray-100 group-hover:text-brand-red transition-colors">{thread.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed line-clamp-2">{thread.content}</p>
                    </Link>

                    <div className="flex items-center gap-1.5 flex-wrap relative z-10">
                      {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                        <button key={emoji} type="button" onClick={() => addEmoji(thread.id, emoji)}
                          className={cn(
                            'text-sm px-2 py-0.5 rounded-full border transition-all duration-200 active:scale-90',
                            emojiReactions[thread.id] === emoji
                              ? 'bg-brand-terracotta/15 border-brand-terracotta/40 scale-110 shadow-sm'
                              : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 opacity-60 hover:opacity-100'

                          )}>{emoji}</button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 text-xs relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={e => handleVote(thread, 'up', e)} disabled={votingThread === thread.id}
                            className={cn(
                              "flex items-center gap-1 px-2.5 py-1.5 rounded-l-full font-bold transition-all active:scale-95 disabled:opacity-50",
                              userVotes[thread.id] === 'up'
                                ? "bg-emerald-500 text-white"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-emerald-500 hover:text-white"
                            )}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                            {formatNumber(getDisplayCount(thread))}
                          </button>
                          <button type="button" onClick={e => handleVote(thread, 'down', e)} disabled={votingThread === thread.id}
                            className={cn(
                              "flex items-center gap-1 px-2.5 py-1.5 rounded-r-full font-bold transition-all active:scale-95 border-l border-gray-200 dark:border-gray-700 disabled:opacity-50",
                              userVotes[thread.id] === 'down'
                                ? "bg-red-500 text-white"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-red-500 hover:text-white"
                            )}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </button>
                        </div>
                        <Link href={`/thread/${thread.id}`} className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-brand-red font-medium">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          {thread.reply_count}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => toggleSave(thread.id)}
                          className={cn('p-1.5 rounded-full transition-all', savedThreads[thread.id] ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500')}>
                          <svg className="w-4 h-4" fill={savedThreads[thread.id] ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                        </button>
                        <div className="relative">
                          <button type="button" onClick={() => setOpenShare(openShare === thread.id ? null : thread.id)}
                            className="flex items-center gap-1.5 text-green-600 font-bold bg-green-50 dark:bg-green-950/40 px-2.5 py-1.5 rounded-full hover:bg-green-100 dark:hover:bg-green-950/60 transition-all">
                            {tr('Shiriki', 'Share')}
                          </button>
                          {openShare === thread.id && (
                            <div className="absolute right-0 bottom-full mb-2 flex flex-col bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl py-1 z-10 min-w-[160px]">
                              {(['whatsapp', 'telegram', 'facebook', 'twitter', 'email'] as const).map(p => (
                                <button key={p} type="button" onClick={() => { shareToSocial(p, thread.id, thread.title, thread.content); setOpenShare(null); }}
                                  className="px-4 py-2 text-xs font-medium text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 capitalize">{p}</button>
                              ))}
                              <button type="button" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/thread/${thread.id}`); show('Link copied!'); setOpenShare(null); }}
                                className="px-4 py-2 text-xs font-medium text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-t border-gray-100 dark:border-gray-800">Copy Link</button>
                            </div>
                          )}
                        </div>
                      </div>
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
                  <div className="text-center py-6 text-xs text-gray-500 dark:text-gray-400">
                    {tr('Umesoma machapisho yote', 'You have seen all posts')}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {view === 'spaces' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-brand-deep via-brand-deep to-brand-red p-6 rounded-2xl text-white shadow-lg space-y-2">
              <h2 className="text-2xl font-black text-white">{tr('Mitaa & Maarifa', 'Spaces & Knowledge')}</h2>
              <p className="text-sm text-gray-200">{tr('Jiunge na jamii maalum kwa kilimo, teknolojia, na utamaduni.', 'Join specialized communities for agriculture, tech, and culture.')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SPACES_DATA.map(s => (
                <div key={s.name} className="sun-card p-5 flex flex-col justify-between space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-brand-terracotta/10 flex items-center justify-center text-xl">{s.icon}</div>
                    <div>
                      <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">{s.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">{s.members} {tr('Wanachama', 'Members')}</span>
                    <button type="button" onClick={() => setJoinedSpaces(prev => ({ ...prev, [s.name]: !prev[s.name] }))}
                      className={cn('px-4 py-1.5 rounded-full font-bold transition-all', joinedSpaces[s.name] ? 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400' : 'bg-brand-terracotta text-white hover:bg-brand-red')}>
                      {joinedSpaces[s.name] ? tr('Umejiunga', 'Joined') : tr('Jiunga', 'Join')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'leaderboard' && (
          <div className="sun-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{tr('Nyota za Kikwetu', 'Leaderboard & Karma')}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{tr('Wachangiaji wakuu hupata zawadi kila wiki.', 'Top contributors rewarded weekly.')}</p>
              </div>
              <span className="text-3xl">🏆</span>
            </div>
            <div className="space-y-3 pt-2">
              {LEADERBOARD_DATA.map(l => (
                <div key={l.rank} className={cn('flex items-center justify-between p-3 rounded-xl border', l.rank === 1 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800')}>
                  <div className="flex items-center gap-3">
                    <span className={cn('w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-white', l.rank === 1 ? 'bg-yellow-500' : l.rank === 2 ? 'bg-gray-400' : 'bg-brand-terracotta')}>{l.rank}</span>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-terracotta to-brand-red flex items-center justify-center font-bold text-white">{l.name[0]}</div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{l.name}</p>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">{l.county}</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-brand-red">{formatNumber(l.points)} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'profile' && user && (
          <ProfileView profileId={user.id} />

        )}
      </main>

      <aside className="hidden lg:block lg:col-span-1">
        <div className="sticky top-20 space-y-6">
          <div className="sun-card p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{tr('Inauma Kenya', 'Trending in Kenya')}</h4>
            <div className="space-y-2">
              {[
                { tag: '#KilimoSmart', posts: '14.2k', desc: 'Agriculture' },
                { tag: '#ShuleYetu', posts: '8.9k', desc: 'Education' },
                { tag: '#NairobiTech', posts: '5.1k', desc: 'Tech & Startups' },
              ].map(t => (
                <div key={t.tag} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 p-2.5 rounded-xl transition-colors">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">{t.desc} &middot; {t.posts} posts</span>
                  <p className="text-xs font-bold text-brand-red">{t.tag}</p>
                </div>
              ))}
            </div>
          </div>
          <div className={`sun-card p-5 text-center bg-gradient-to-br ${AD_SPOTS[0].color} border border-dashed border-gray-300 dark:border-gray-700`}>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{AD_SPOTS[0].label}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{AD_SPOTS[0].desc}</p>
          </div>
        </div>
      </aside>

      <button
        type="button"
        onClick={goCompose}
        className="md:hidden fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-brand-terracotta to-brand-red text-white shadow-2xl flex items-center justify-center transition-all active:scale-90 hover:scale-105"
        aria-label="Compose post"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
      </button>
    </div>
  );
}
