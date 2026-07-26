'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Icon from '@/components/Icon';
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
    <div style={{ padding: '19px 0', opacity: 0.5 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--color-surface-3)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, width: 120, borderRadius: 4, background: 'var(--color-surface-3)', marginBottom: 6 }} />
          <div style={{ height: 10, width: 80, borderRadius: 4, background: 'var(--color-surface-3)' }} />
        </div>
      </div>
      <div style={{ marginTop: 15 }}>
        <div style={{ height: 16, width: '70%', borderRadius: 4, background: 'var(--color-surface-3)', marginBottom: 8 }} />
        <div style={{ height: 12, width: '100%', borderRadius: 4, background: 'var(--color-surface-3)', marginBottom: 4 }} />
        <div style={{ height: 12, width: '85%', borderRadius: 4, background: 'var(--color-surface-3)' }} />
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

  const loadMoreThreads = async () => {
    setLoadingMore(true);
    const lastThread = threads[threads.length - 1];
    if (!lastThread) { setHasMore(false); setLoadingMore(false); return; }

    const newThreads = await loadThreads({ cursor: lastThread.created_at });
    setHasMore(newThreads && newThreads.length >= 30 ? true : false);
    setLoadingMore(false);
  };

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
          if (next >= threads.length) loadMoreThreads();
          return next;
        });
        setTimeout(() => setLoadingMore(false), 300);
      }
    }, { rootMargin: '200px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, threads.length]);

  const feedTabRef = useRef(feedTab);
  useEffect(() => {
    if (feedTabRef.current !== feedTab) {
      feedTabRef.current = feedTab;
      setDisplayCount(PAGE_SIZE);
      setHasMore(true);
    }
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
    } catch {}
  }, [emojiReactions, user]);

  const shareToSocial = useCallback((platform: string, threadId: string, title: string, content: string) => {
    const origin = window.location.origin;
    const link = `${origin}/thread/${threadId}`;
    if (platform === 'copy') {
      navigator.clipboard.writeText(link);
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
    const interval = setInterval(() => { loadThreads(); }, 30000);
    return () => clearInterval(interval);
  }, [loadThreads]);

  const goCompose = () => {
    setView('feed');
    router.replace('/feed?view=feed', { scroll: false });
    setTimeout(openComposer, 120);
  };

  return (
    <div>
      {view === 'feed' && (
        <>
          <div className="page-head">
            <div>
              <div className="eyebrow">{new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
              <h1 className="serif">{tr('Baraza', 'The Baraza')}</h1>
              <p>{tr('Maswali, mawazo na maarifa kutoka kwa watu walio karibu nawe.', 'Questions, ideas, and local knowledge from people near you.')}</p>
            </div>
            <button className="select-pill"><Icon name="map-pin" className="icon-sm" />Nairobi</button>
          </div>

          <section className="section-card composer">
            <div className="composer-top">
              <div className="avatar">{user?.full_name?.[0]?.toUpperCase() || 'U'}</div>
              <PostComposer />
            </div>
          </section>

          <div className="tags" style={{ marginTop: 14, marginBottom: 4 }}>
            {FEED_TABS.map(t => (
              <button key={t.id} onClick={() => setFeedTab(t.id)}
                className={cn('tag', feedTab === t.id && 'gold')}>{t.label}</button>
            ))}
            <button onClick={() => { setShowSaved(prev => !prev); setFeedTab('all'); }}
              className={cn('tag', showSaved && 'gold')}>
              {tr('Imehifadhiwa', 'Saved')}
            </button>
            <button onClick={toggleLang} className="tag gold">
              {contentLang === 'en' ? 'Kiswahili' : 'English'}
            </button>
          </div>

          <section className="section-card" style={{ marginTop: 14 }}>
            {feedError ? (
              <div className="empty-state">
                <div className="empty-icon"><Icon name="alert-circle" className="icon-lg" /></div>
                <h3>{tr('Kuna tatizo', 'Something went wrong')}</h3>
                <p>{tr('Kuna tatizo kupakia machapisho.', 'There was an error loading the feed.')}</p>
                <button className="primary-btn" onClick={() => loadThreads()} style={{ marginTop: 14 }}>
                  {tr('Jaribu Tena', 'Try Again')}
                </button>
              </div>
            ) : loading ? (
              <ThreadSkeleton />
            ) : displayedThreads.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Icon name="message-circle" className="icon-lg" /></div>
                <h3>{tr('Hakuna machapisho bado.', 'No posts yet.')}</h3>
                <p>{tr('Kuwa wa kwanza kushiriki!', 'Be the first to share!')}</p>
              </div>
            ) : (
              <div>
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

                <div ref={sentinelRef} style={{ height: 4 }} />
                {loadingMore && (
                  <div style={{ textAlign: 'center', padding: 16, color: 'var(--color-text-3)', fontSize: '.74rem' }}>
                    {tr('Inapakia...', 'Loading...')}
                  </div>
                )}
                {!hasMore && displayedThreads.length > 0 && (
                  <div style={{ textAlign: 'center', padding: 16, color: 'var(--color-text-3)', fontSize: '.72rem' }}>
                    {tr('Umesoma machapisho yote', 'You have seen all posts')}
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      )}

      {/* Other views logic (spaces, leaderboard, profile) remains similar but stylized */}
      {view === 'spaces' && (
        <div className="p-4 space-y-6">
          <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">{tr('Mitaa & Maarifa', 'Spaces & Knowledge')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{tr('Jiunge na jamii maalum.', 'Join specialized communities.')}</p>
        </div>
      )}

      {view === 'leaderboard' && (
        <div className="p-4 space-y-6">
          <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">{tr('Nyota za Kikwetu', 'Leaderboard & Karma')}</h2>
        </div>
      )}

      {view === 'profile' && user && (
        <ProfileView profileId={user.id} />
      )}

      <button
        type="button"
        onClick={goCompose}
        className="lg:hidden fixed bottom-[80px] right-5 z-40"
        style={{ width: 48, height: 48, borderRadius: '50%', border: 0, color: 'var(--color-surface)', background: 'var(--color-green-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)' }}
        aria-label="Compose post"
      >
        <Icon name="plus" className="icon-lg" />
      </button>
    </div>
  );
}
