'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { timeAgo, formatNumber, cn } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import CreatePostModal from '@/components/CreatePostModal';
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

export default function FeedView() {
  const { threads, loadThreads, spaces, loadSpaces, loading, subscribeToFeed, vote } = useApp();
  const { user } = useAuth();
  const { show } = useToast();
  const router = useRouter();
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
  const [showCreate, setShowCreate] = useState(false);
  const [lang, setLang] = useState<'en' | 'sw'>('en');
  const [joinedSpaces, setJoinedSpaces] = useState<Record<string, boolean>>({});
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [optimisticVotes, setOptimisticVotes] = useState<Record<string, number>>({});
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const unsub = subscribeToFeed();
    return () => unsub();
  }, [subscribeToFeed]);

  // Infinite scroll via IntersectionObserver
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
    const sb = sbRef.current;
    setLoadingMore(true);
    const { data } = await sb.from('threads')
      .select('*, author:profiles(full_name, avatar_url, verified, county), space:spaces(name)')
      .order('created_at', { ascending: false })
      .range(threads.length, threads.length + PAGE_SIZE - 1);
    if (data && data.length > 0) {
      setHasMore(data.length >= PAGE_SIZE);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  };

  // Reset displayCount when tab changes
  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
    setHasMore(true);
  }, [feedTab]);

  const filtered = feedTab === 'all' ? threads : threads.filter(t =>
    t.tags?.some(tg => tg.toLowerCase().includes(feedTab))
  );

  const displayedThreads = filtered.slice(0, displayCount);

  const handleVote = async (thread: Thread, e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { show('Please login to vote.'); return; }
    const prev = optimisticVotes[thread.id] || 0;
    setOptimisticVotes(v => ({ ...v, [thread.id]: prev + 1 }));
    await vote(thread.id, 'thread', 'up');
  };

  const shareToSocial = (platform: string, threadId: string, title: string, content: string) => {
    const origin = window.location.origin;
    const link = `${origin}/thread/${threadId}`;
    const text = `${title}\n\n${content}\n\n${link}`;
    const encoded = encodeURIComponent(text);
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    } else if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(title)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(title)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encoded}`, '_blank');
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const tr = useCallback((en: string, sw: string) => lang === 'sw' ? sw : en, [lang]);
  const toggleLang = useCallback(() => setLang(l => l === 'en' ? 'sw' : 'en'), []);

  useEffect(() => {
    const interval = setInterval(() => { loadThreads(); }, 30000);
    return () => clearInterval(interval);
  }, [loadThreads]);

  return (
    <div className="max-w-7xl mx-auto flex-1 w-full grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 px-3 sm:px-6 lg:px-8 py-4 md:py-6">
      {/* LEFT SIDEBAR — sticky */}
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
          </nav>

          <button onClick={() => setShowCreate(true)}
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

      {/* MAIN FEED */}
      <main className="col-span-1 md:col-span-3 lg:col-span-3 space-y-6">
        {view === 'feed' && (
          <div className="space-y-6">
            <div onClick={() => setShowCreate(true)}
              className="sun-card p-4 cursor-pointer hover:border-brand-terracotta transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-deep to-brand-red flex items-center justify-center text-white font-bold shadow-sm">
                  {user?.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 bg-gray-100 dark:bg-gray-900 px-4 py-2.5 rounded-full text-sm text-gray-500 dark:text-gray-400 hover:ring-2 hover:ring-brand-terracotta/30 transition-all cursor-text">
                  {tr('Uliza swali, toa ushauri, ama anzisha Mjadala...', 'Ask a question, give advice, or start a debate...')}
                </div>
              </div>
              <div className="flex items-center justify-around pt-3 mt-3 border-t border-gray-100 dark:border-gray-800 text-xs font-semibold text-gray-400">
                <span className="flex items-center gap-1.5 hover:text-brand-red transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>{tr('Swali (Q&A)', 'Question (Q&A)')}</span></span>
                <span className="flex items-center gap-1.5 hover:text-green-600 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" /></svg><span>{tr('Mjadala (Audio)', 'Debate (Audio)')}</span></span>
                <span className="flex items-center gap-1.5 hover:text-blue-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>{tr('Kura (Poll)', 'Poll')}</span></span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {FEED_TABS.map(t => (
                <button key={t.id} onClick={() => setFeedTab(t.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all',
                    feedTab === t.id ? 'bg-brand-deep text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  )}>{t.label}</button>
              ))}
              <button onClick={toggleLang} className="ml-auto px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-800 text-brand-red hover:bg-brand-terracotta/10 transition-all">
                {lang === 'en' ? 'Kiswahili' : 'English'}
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><LoadingSpinner /></div>
            ) : displayedThreads.length === 0 ? (
              <div className="text-center py-16 text-sm text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                {tr('Hakuna machapisho bado. Kuwa wa kwanza kushiriki!', 'No posts yet. Be the first to share!')}
              </div>
            ) : (
              <div className="space-y-4">
                {displayedThreads.map((thread, idx) => (
                  <div key={thread.id} className="sun-card p-5 space-y-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-terracotta to-brand-red flex items-center justify-center text-sm font-bold text-white shadow-sm">
                          {thread.author?.full_name?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h5 className="text-sm font-bold">{thread.author?.full_name || tr('Mgeni', 'Guest')}</h5>
                            <span className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 text-[10px] px-1.5 py-0.5 rounded font-bold"><svg className="w-2.5 h-2.5 inline" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> Mtaalamu</span>
                          </div>
                          <span className="text-[11px] text-gray-400">{thread.author?.county || ''} &middot; {timeAgo(thread.created_at)} {thread.space && <>in <strong className="text-brand-red">{(thread.space as unknown as { name: string })?.name}</strong></>}</span>
                        </div>
                      </div>
                      <button onClick={toggleLang} className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-lg font-medium transition-colors">
                        <svg className="w-3 h-3 inline mr-1 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                        {lang === 'en' ? 'Tafsiri' : 'Translate'}
                      </button>
                    </div>

                    <Link href={`/thread/${thread.id}`} className="block group">
                      <h3 className="text-base font-bold leading-snug group-hover:text-brand-red transition-colors">{thread.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed line-clamp-2">{thread.content}</p>
                    </Link>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
                      <div className="flex items-center gap-4">
                        <button onClick={e => handleVote(thread, e)} className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-brand-terracotta hover:text-white px-3 py-1.5 rounded-full font-bold transition-all active:scale-95">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                          {formatNumber(thread.upvotes_count + (optimisticVotes[thread.id] || 0))}
                        </button>
                        <Link href={`/thread/${thread.id}`} className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-brand-red font-medium transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          {thread.reply_count} {tr('Majibu', 'Answers')}
                        </Link>
                      </div>
                      <div className="relative group/share">
                        <button className="flex items-center gap-1.5 text-green-600 font-bold bg-green-50 dark:bg-green-950/40 px-3 py-1.5 rounded-full hover:bg-green-100 dark:hover:bg-green-950/60 transition-all">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                          {tr('Shiriki', 'Share')}
                        </button>
                        <div className="absolute right-0 bottom-full mb-2 hidden group-hover/share:flex flex-col bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl py-1 z-10 min-w-[160px]">
                          <button onClick={() => shareToSocial('whatsapp', thread.id, thread.title, thread.content)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg> WhatsApp
                          </button>
                          <button onClick={() => shareToSocial('telegram', thread.id, thread.title, thread.content)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                            <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg> Telegram
                          </button>
                          <button onClick={() => shareToSocial('facebook', thread.id, thread.title, thread.content)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> Facebook
                          </button>
                          <button onClick={() => shareToSocial('twitter', thread.id, thread.title, thread.content)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> X (Twitter)
                          </button>
                          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/thread/${thread.id}`); show('Link copied!'); }}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-t border-gray-100 dark:border-gray-800">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg> Copy Link
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className="h-4" />
                {loadingMore && (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-brand-terracotta border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!hasMore && displayedThreads.length > 0 && (
                  <div className="text-center py-6 text-xs text-gray-400">
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
              <h2 className="text-2xl font-black">{tr('Mitaa & Maarifa', 'Spaces & Knowledge')}</h2>
              <p className="text-sm text-gray-200">{tr('Jiunge na jamii maalum kwa kilimo, teknolojia, na utamaduni.', 'Join specialized communities for agriculture, tech, and culture.')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SPACES_DATA.map(s => (
                <div key={s.name} className="sun-card p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-brand-terracotta/10 flex items-center justify-center text-xl font-bold">{s.icon}</div>
                    <div>
                      <h4 className="text-base font-bold">{s.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
                    <span className="text-gray-400 font-medium">{s.members} {tr('Wanachama', 'Members')}</span>
                    <button onClick={() => setJoinedSpaces(prev => ({ ...prev, [s.name]: !prev[s.name] }))}
                      className={cn('px-4 py-1.5 rounded-full font-bold transition-all', joinedSpaces[s.name] ? 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400' : 'bg-brand-terracotta text-white hover:bg-brand-red')}>
                      {joinedSpaces[s.name] ? (tr('Umejiunga', 'Joined')) : (tr('Jiunga', 'Join'))}
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
                <h3 className="text-lg font-bold">{tr('Nyota za Kikwetu', 'Leaderboard & Karma')}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{tr('Wachangiaji wakuu hupata zawadi kila wiki.', 'Top contributors rewarded weekly.')}</p>
              </div>
              <span className="text-3xl">🏆</span>
            </div>
            <div className="space-y-3 pt-2">
              {LEADERBOARD_DATA.map(l => (
                <div key={l.rank} className={cn('flex items-center justify-between p-3 rounded-xl border transition-all', l.rank === 1 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800')}>
                  <div className="flex items-center gap-3">
                    <span className={cn('w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm', l.rank === 1 ? 'bg-yellow-500' : l.rank === 2 ? 'bg-gray-400' : 'bg-brand-terracotta')}>{l.rank}</span>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-terracotta to-brand-red flex items-center justify-center font-bold text-white shadow-sm">{l.name[0]}</div>
                    <div>
                      <p className="text-xs font-bold">{l.name}</p>
                      <span className="text-[10px] text-gray-400">{l.county}</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-brand-red">{formatNumber(l.points)} pts</span>
                </div>
              ))}
              {user && (() => {
                const userRank = user.heshima_score > (LEADERBOARD_DATA[0]?.points || 0) ? 1 :
                  LEADERBOARD_DATA.reduce((rank, l) => user.heshima_score >= l.points ? Math.min(rank, l.rank) : rank, LEADERBOARD_DATA.length + 1);
                return (
                <div className="flex items-center justify-between p-3 rounded-xl bg-brand-terracotta/10 border border-brand-terracotta/30">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-red text-white font-bold text-xs flex items-center justify-center shadow-sm">{userRank}</span>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-deep to-brand-red flex items-center justify-center font-bold text-white">{user.full_name?.[0] || 'U'}</div>
                    <div>
                      <p className="text-xs font-bold">{user.full_name} ({tr('Wewe', 'You')})</p>
                      <span className="text-[10px] text-gray-400">{user.county || tr('Haijulikani', 'Unknown')}</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-brand-red">{user.heshima_score} pts</span>
                </div>);
              })()}
            </div>
          </div>
        )}

        {view === 'profile' && user && (
          <div className="sun-card rounded-2xl overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-brand-deep via-brand-deep to-brand-red" />
            <div className="px-6 pb-6 relative">
              <div className="flex justify-between items-end -mt-12 mb-4">
                <div className="w-24 h-24 rounded-full border-4 border-white dark:border-brand-cardDark bg-gradient-to-br from-brand-deep to-brand-red flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                  {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : user.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <Link href="/settings" className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-xs font-bold px-4 py-2 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-all shadow-sm">{tr('Hariri', 'Edit Profile')}</Link>
              </div>
              <h2 className="text-xl font-black">{user.full_name}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">@{user.username} &middot; {user.county || ''}</p>
              <div className="grid grid-cols-3 gap-4 my-6 py-4 border-y border-gray-100 dark:border-gray-800 text-center">
                <div>
                  <span className="block text-lg font-bold text-brand-red">{user.heshima_score}</span>
                  <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{tr('Heshima', 'Karma')}</span>
                </div>
                <div>
                  <span className="block text-lg font-bold">{user.answer_count}</span>
                  <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{tr('Majibu', 'Answers')}</span>
                </div>
                <div>
                  <span className="block text-lg font-bold">{(user.badges?.length || 0)}</span>
                  <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{tr('Bidhaa', 'Badges')}</span>
                </div>
              </div>
              {user.badges && user.badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {user.badges.map(b => (
                    <span key={b} className="bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 px-3 py-1 rounded-lg text-xs font-bold">{b}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* RIGHT SIDEBAR — sticky with ads */}
      <aside className="hidden lg:block lg:col-span-1">
        <div className="sticky top-20 space-y-6">
          <div className="sun-card p-4 space-y-3">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
              onClick={() => window.location.href = '/nyumba-kumi'}>
              <span className="text-lg">🏘️</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Nyumba Kumi Usalama</p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 truncate">Neighborhood watch & alerts</p>
              </div>
              <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </div>

          <div className="sun-card p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
              <span>{tr('Inauma Kenya', 'Trending in Kenya')}</span>
              <svg className="w-3.5 h-3.5 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </h4>
            <div className="space-y-2">
              {[
                { tag: '#KilimoSmart', posts: '14.2k', desc: 'Agriculture' },
                { tag: '#ShuleYetu', posts: '8.9k', desc: 'Education' },
                { tag: '#NairobiTech', posts: '5.1k', desc: 'Tech & Startups' },
              ].map(t => (
                <div key={t.tag} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 p-2.5 rounded-xl transition-colors">
                  <span className="text-[10px] text-gray-400">{t.desc} &middot; {t.posts} posts</span>
                  <p className="text-xs font-bold text-brand-red">{t.tag}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AD PLACEHOLDER 1 */}
          <div className={`sun-card p-5 text-center bg-gradient-to-br ${AD_SPOTS[0].color} border border-dashed border-gray-300 dark:border-gray-700`}>
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{AD_SPOTS[0].label}</p>
            <p className="text-[10px] text-gray-400 mt-1">{AD_SPOTS[0].desc}</p>
            <button className="mt-3 text-[10px] font-bold text-brand-red bg-brand-terracotta/10 px-4 py-1.5 rounded-full hover:bg-brand-terracotta/20 transition-colors">
              Advertise Here
            </button>
          </div>

          <div className="sun-card p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">{tr('Vikundi vya Jamii', 'Community Groups')}</h4>
            <div className="space-y-2">
              <a href="https://chat.whatsapp.com/example1" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors group">
                <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-green-700 dark:group-hover:text-green-300">WhatsApp Community</span>
              </a>
              <a href="https://t.me/kikwetugroup" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors group">
                <svg className="w-4 h-4 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-300">Telegram Group</span>
              </a>
            </div>
          </div>

          {/* AD PLACEHOLDER 2 */}
          <div className={`sun-card p-5 text-center bg-gradient-to-br ${AD_SPOTS[1].color} border border-dashed border-gray-300 dark:border-gray-700`}>
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{AD_SPOTS[1].label}</p>
            <p className="text-[10px] text-gray-400 mt-1">{AD_SPOTS[1].desc}</p>
            <button className="mt-3 text-[10px] font-bold text-brand-red bg-brand-terracotta/10 px-4 py-1.5 rounded-full hover:bg-brand-terracotta/20 transition-colors">
              Advertise Here
            </button>
          </div>

          <div className="sun-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-red-500 uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>{tr('Mjadala Moja', 'Live Debate')}</span>
              </span>
              <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded font-bold">Audio</span>
            </div>
            <h5 className="text-xs font-bold">{tr('Mustakabali wa Kazi za Digitali Afrika Mashariki', 'The Future of Digital Careers in East Africa')}</h5>
            <p className="text-[11px] text-gray-400">{tr('Mwenyeji: NairobiTechie na 4 wengine', 'Hosted by NairobiTechie & 4 others')}</p>
            <button className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95">
              <svg className="w-3 h-3 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {tr('Jiunga na Baraza', 'Join Audio Room')}
            </button>
          </div>
        </div>
      </aside>

      <button onClick={() => setShowCreate(true)}
        className="md:hidden fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-brand-terracotta to-brand-red hover:from-brand-red hover:to-brand-terracotta text-white shadow-2xl flex items-center justify-center transition-all active:scale-90 hover:scale-105">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
      </button>

      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
