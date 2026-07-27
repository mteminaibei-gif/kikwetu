'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import { toggleVote, checkVote, toggleSave, checkSaved, createThread, toggleReaction, getReactions } from '@/lib/supabase-helpers';
import {
  Plus, Image, MessageCircleQuestion, Video, ThumbsUp,
  MessageCircle, Send, Bookmark, MapPin,
  Sprout, CircleHelp, BadgeDollarSign, Ellipsis, Smile
} from 'lucide-react';

interface ThreadProfile {
  full_name: string;
  username: string;
  avatar_url: string | null;
  county: string | null;
  is_verified: boolean;
}

interface Thread {
  id: string;
  author_id: string;
  title: string;
  body: string | null;
  type: string;
  bounty_amount: number | null;
  tags: string[] | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles?: ThreadProfile;
}

interface User {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  county: string | null;
  is_verified: boolean;
}

const THREAD_SELECT = `
  id, author_id, title, body, type, bounty_amount, tags, likes_count, comments_count, created_at,
  profiles:author_id (
    full_name,
    username,
    avatar_url,
    county,
    is_verified
  )
`;

/** Supabase FK joins can type as object | array; normalize to a single profile object. */
function normalizeThread(row: Record<string, unknown>): Thread {
  const raw = row.profiles;
  let profiles: ThreadProfile | undefined;
  if (Array.isArray(raw)) {
    profiles = (raw[0] as ThreadProfile) || undefined;
  } else if (raw && typeof raw === 'object') {
    profiles = raw as ThreadProfile;
  }
  return { ...(row as unknown as Thread), profiles };
}

function Stories() {
  const stories = [
    { initials: 'AM', name: "Amina's garden", color: 'earth' },
    { initials: 'KT', name: 'Kisumu Tech', color: 'blue' },
    { initials: 'NW', name: 'Njeri speaks', color: 'green' },
    { initials: 'MA', name: 'Mombasa now', color: 'earth' },
  ];

  return (
    <div className="stories">
      <button type="button" className="story add">
        <span className="story-plus"><Plus className="icon-sm" /></span>
        <span>Your story</span>
      </button>
      {stories.map((s, i) => (
        <button type="button" key={i} className="story">
          <span className={`story-avatar avatar sm ${s.color}`}>{s.initials}</span>
          <span>{s.name}</span>
        </button>
      ))}
    </div>
  );
}

function HeroSection() {
  const { showToast } = useApp();

  return (
    <section className="hero">
      <div className="hero-content">
        <div className="eyebrow" style={{ color: 'var(--gold)' }}>KikwetuConnect</div>
        <h1 className="serif">Good questions find good people.</h1>
        <p>Ask, match with an approved professional, chat privately, then tip and rate useful guidance.</p>
        <div className="hero-actions">
          <button type="button" className="gold" onClick={() => { window.location.href = '/students'; }}>
            Open Students Area
          </button>
          <button type="button" onClick={() => showToast('Use the composer below to ask the community')}>
            <Plus className="icon-sm" /> Ask the community
          </button>
        </div>
      </div>
    </section>
  );
}

function ComposerModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (title: string, body: string, type: string, tags: string[]) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('post');
  const [tagsInput, setTagsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    try {
      await onSubmit(title.trim(), body.trim(), type, tags);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg)', borderRadius: 16, padding: 24, width: '90%', maxWidth: 520,
        maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 className="serif" style={{ margin: 0, fontSize: '1.2rem' }}>New thread</h2>
          <button type="button" onClick={onClose} className="icon-btn" style={{ fontSize: 18 }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {['post', 'question', 'poll'].map(t => (
            <button type="button" key={t} onClick={() => setType(t)} className={type === t ? 'primary' : 'secondary'}>
              {t === 'post' ? <Sprout className="icon-sm" /> : t === 'question' ? <CircleHelp className="icon-sm" /> : <CircleHelp className="icon-sm" />}
              {` ${t.charAt(0).toUpperCase() + t.slice(1)}`}
            </button>
          ))}
        </div>

        <input
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line)',
            background: 'var(--surface2)', color: 'var(--text)', fontSize: '.85rem', marginBottom: 10,
            boxSizing: 'border-box',
          }}
        />
        <textarea
          placeholder="What's on your mind?"
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={4}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line)',
            background: 'var(--surface2)', color: 'var(--text)', fontSize: '.85rem', marginBottom: 10,
            resize: 'vertical', boxSizing: 'border-box',
          }}
        />
        <input
          placeholder="Tags (comma separated)"
          value={tagsInput}
          onChange={e => setTagsInput(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line)',
            background: 'var(--surface2)', color: 'var(--text)', fontSize: '.85rem', marginBottom: 16,
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="primary" onClick={() => void handleSubmit()} disabled={submitting || !title.trim()}>
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Composer({ onOpenComposer }: { onOpenComposer: () => void }) {
  const { user } = useApp();
  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() || '?';

  return (
    <section className="composer">
      <div className="composer-top">
        <div className="avatar">{initials}</div>
        <button type="button" className="composer-open" onClick={onOpenComposer}>
          Share something useful with your county...
        </button>
      </div>
      <div className="composer-actions">
        <button type="button" className="composer-action" onClick={onOpenComposer}>
          <Image className="icon" /> Post
        </button>
        <button type="button" className="composer-action" onClick={onOpenComposer}>
          <MessageCircleQuestion className="icon" /> Question
        </button>
        <button type="button" className="composer-action" onClick={onOpenComposer}>
          <Video className="icon" /> Poll
        </button>
      </div>
    </section>
  );
}

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

function FeedPost({
  thread,
  user,
  onVoteChange,
  onSaveChange,
}: {
  thread: Thread;
  user: User | null;
  onVoteChange: (threadId: string, delta: number, liked: boolean) => void;
  onSaveChange: (threadId: string, saved: boolean) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeDelta, setLikeDelta] = useState(0);
  const [reactions, setReactions] = useState<{ emoji: string; user_id: string }[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { showToast } = useApp();
  const profile = thread.profiles;
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';
  const timeAgo = getTimeAgo(thread.created_at);

  useEffect(() => {
    if (!user) return;
    void checkVote(user.id, 'thread', thread.id).then(v => {
      if (v) {
        setLiked(true);
        setLikeDelta(v.value === 1 ? 0 : -1);
      }
    });
    void checkSaved(user.id, 'thread', thread.id).then(s => setSaved(s));
  }, [user, thread.id]);

  useEffect(() => {
    void getReactions('thread', thread.id).then(setReactions);
  }, [thread.id]);

  useEffect(() => {
    const channel = supabase
      .channel(`reactions-${thread.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reactions',
        filter: `target_id=eq.${thread.id}`,
      }, () => {
        void getReactions('thread', thread.id).then(setReactions);
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [thread.id]);

  const handleVote = async () => {
    if (!user) {
      showToast('Please sign in to vote');
      return;
    }
    const prev = liked;
    const delta = liked ? -1 : 1;
    setLiked(!liked);
    setLikeDelta(d => (liked ? d - 1 : d + 1));
    onVoteChange(thread.id, delta, !liked);
    try {
      await toggleVote(user.id, 'thread', thread.id, 1);
    } catch {
      setLiked(prev);
      onVoteChange(thread.id, -delta, liked);
      showToast('Failed to update vote');
    }
  };

  const handleSave = async () => {
    if (!user) {
      showToast('Please sign in to save');
      return;
    }
    const prev = saved;
    setSaved(!saved);
    onSaveChange(thread.id, !saved);
    try {
      await toggleSave(user.id, 'thread', thread.id);
    } catch {
      setSaved(prev);
      onSaveChange(thread.id, prev);
      showToast('Failed to update save');
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!user) {
      showToast('Please sign in to react');
      return;
    }
    try {
      await toggleReaction(user.id, 'thread', thread.id, emoji);
      const updated = await getReactions('thread', thread.id);
      setReactions(updated);
      setShowEmojiPicker(false);
    } catch {
      showToast('Failed to add reaction');
    }
  };

  const groupedReactions = EMOJI_OPTIONS
    .map(emoji => ({
      emoji,
      count: reactions.filter(r => r.emoji === emoji).length,
      reacted: user ? reactions.some(r => r.emoji === emoji && r.user_id === user.id) : false,
    }))
    .filter(r => r.count > 0);

  return (
    <article className="post animate-rise">
      <div className="post-head">
        <div className="avatar earth">{initials}</div>
        <div className="author">
          <strong>
            {profile?.full_name || 'Unknown'} {profile?.is_verified && <span className="verified">✓</span>}
          </strong>
          <div className="meta">
            <span>@{profile?.username || 'unknown'}</span>
            <span>·</span>
            <span>{timeAgo}</span>
            {profile?.county && <><span>·</span><span>{profile.county}</span></>}
          </div>
        </div>
        <button type="button" className="icon-btn post-menu"><Ellipsis className="icon" /></button>
      </div>
      <div className="post-body">
        <div className="post-type">
          {thread.type === 'question' ? <CircleHelp className="icon-sm" /> : <Sprout className="icon-sm" />}
          {thread.type === 'question' ? 'Deep-dive inquiry' : 'Baraza post'}
        </div>
        <h3>{thread.title}</h3>
        {thread.body && <p>{thread.body}</p>}
        {thread.bounty_amount ? (
          <span className="bounty"><BadgeDollarSign className="icon-sm" /> {thread.bounty_amount} tokens bounty</span>
        ) : null}
        {thread.tags && thread.tags.length > 0 && (
          <div className="tags">
            {thread.tags.map((tag, i) => (
              <span key={i} className={`tag ${i % 2 === 1 ? 'gold' : ''}`}>#{tag}</span>
            ))}
          </div>
        )}
      </div>
      {groupedReactions.length > 0 && (
        <div style={{ display: 'flex', gap: 6, padding: '0 16px', flexWrap: 'wrap' }}>
          {groupedReactions.map(r => (
            <button
              type="button"
              key={r.emoji}
              onClick={() => void handleReaction(r.emoji)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 8px', borderRadius: 12, fontSize: '.8rem',
                border: r.reacted ? '1.5px solid var(--gold)' : '1px solid var(--line)',
                background: r.reacted ? 'rgba(212,175,55,0.1)' : 'var(--surface2)',
                cursor: 'pointer', color: 'var(--text)',
              }}
            >
              <span>{r.emoji}</span>
              <span style={{ fontSize: '.75rem', opacity: 0.7 }}>{r.count}</span>
            </button>
          ))}
        </div>
      )}
      <div className="post-actions" style={{ position: 'relative' }}>
        <button type="button" className={`action ${liked ? 'active' : ''}`} onClick={() => void handleVote()}>
          <ThumbsUp className="icon-sm" /> <span>{thread.likes_count + likeDelta}</span>
        </button>
        <button type="button" className="action" onClick={() => { window.location.href = `/thread?id=${thread.id}`; }}>
          <MessageCircle className="icon-sm" /> <span>{thread.comments_count}</span>
        </button>
        <button type="button" className="action" onClick={() => {
          const url = typeof window !== 'undefined' ? `${window.location.origin}/thread?id=${thread.id}` : '';
          void navigator.clipboard?.writeText(url).then(() => showToast('Share link copied'));
        }}>
          <Send className="icon-sm" /> <span>Share</span>
        </button>
        <button type="button" className={`action ${saved ? 'saved' : ''}`} onClick={() => void handleSave()}>
          <Bookmark className="icon-sm" />
        </button>
        <div style={{ position: 'relative' }}>
          <button type="button" className="action" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            <Smile className="icon-sm" />
          </button>
          {showEmojiPicker && (
            <div style={{
              position: 'absolute', bottom: '100%', left: 0, marginBottom: 8,
              display: 'flex', gap: 4, padding: '6px 8px', borderRadius: 12,
              background: 'var(--surface)', border: '1px solid var(--line)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 10,
            }}>
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => void handleReaction(emoji)}
                  style={{
                    fontSize: '1.2rem', padding: '4px 6px', borderRadius: 8,
                    border: 'none', background: 'transparent', cursor: 'pointer',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" className="action"><Ellipsis className="icon-sm" /></button>
      </div>
    </article>
  );
}

function FeedSkeleton() {
  return (
    <div style={{ padding: '19px 0' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div className="avatar skeleton-shimmer" style={{ background: 'var(--surface2)' }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton-shimmer" style={{ height: 14, width: 120, background: 'var(--surface2)', borderRadius: 6, marginBottom: 6 }} />
          <div className="skeleton-shimmer" style={{ height: 10, width: 80, background: 'var(--surface2)', borderRadius: 6 }} />
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Home() {
  const { user, showToast } = useApp();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  useEffect(() => {
    const fetchThreads = async () => {
      setFeedError(null);
      try {
        const { data, error } = await supabase
          .from('threads')
          .select(THREAD_SELECT)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('[feed]', error.message);
          setFeedError(error.message);
          setThreads([]);
        } else {
          const rows = (data || []) as Record<string, unknown>[];
          setThreads(rows.map(normalizeThread));
        }
      } catch (err) {
        console.error('[feed]', err);
        setFeedError('Could not load feed');
        setThreads([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchThreads();

    const channel = supabase
      .channel('threads-feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'threads',
      }, async (payload) => {
        const newThread = payload.new as Thread;
        const { data: withProfile } = await supabase
          .from('threads')
          .select(THREAD_SELECT)
          .eq('id', newThread.id)
          .single();
        if (withProfile) {
          setThreads(prev => {
            const normalized = normalizeThread(withProfile as Record<string, unknown>);
            if (prev.some(t => t.id === normalized.id)) return prev;
            return [normalized, ...prev];
          });
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'threads',
      }, (payload) => {
        setThreads(prev => prev.map(t => t.id === (payload.new as Thread).id ? { ...t, ...(payload.new as Partial<Thread>) } : t));
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'replies',
      }, (payload) => {
        const reply = payload.new as { thread_id: string };
        setThreads(prev => prev.map(t =>
          t.id === reply.thread_id ? { ...t, comments_count: t.comments_count + 1 } : t
        ));
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const handleVoteChange = (threadId: string, delta: number) => {
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, likes_count: t.likes_count + delta } : t));
  };

  const handleSaveChange = (_threadId: string, saved: boolean) => {
    showToast(saved ? 'Saved' : 'Removed from saved');
  };

  const handleCreateThread = async (title: string, body: string, type: string, tags: string[]) => {
    if (!user) {
      showToast('Please sign in to post');
      return;
    }
    // author_id must be profiles.id (not auth uuid)
    const { data, error } = await createThread(user.id, title, body, type, tags);
    if (error || !data) {
      showToast(error?.message || 'Failed to create post');
      console.error(error);
      return;
    }
    const { data: fullThread } = await supabase
      .from('threads')
      .select(THREAD_SELECT)
      .eq('id', data.id)
      .single();
    if (fullThread) {
      setThreads(prev => [normalizeThread(fullThread as Record<string, unknown>), ...prev]);
    }
    setComposerOpen(false);
    showToast('Posted successfully!');
  };

  return (
    <AppLayout>
      {composerOpen && (
        <ComposerModal onClose={() => setComposerOpen(false)} onSubmit={handleCreateThread} />
      )}

      <div className="page-head">
        <div>
          <div className="eyebrow">{dateStr}</div>
          <h1 className="serif">Kenya, in conversation.</h1>
          <p>Ideas, questions, and useful local knowledge from people near you.</p>
        </div>
        <button type="button" className="select-pill">
          <MapPin className="icon-sm" /> Nairobi
        </button>
      </div>

      <Stories />
      <HeroSection />
      <Composer onOpenComposer={() => setComposerOpen(true)} />

      <section style={{ marginTop: 14 }}>
        {feedError && (
          <div style={{ padding: 12, marginBottom: 12, borderRadius: 12, background: 'var(--goldSoft)', color: 'var(--earth)', fontSize: '.8rem' }}>
            Feed error: {feedError}. Check Supabase RLS and that migrations are applied.
          </div>
        )}
        {loading ? (
          <>
            <FeedSkeleton />
            <FeedSkeleton />
            <FeedSkeleton />
          </>
        ) : threads.length > 0 ? (
          threads.map((thread) => (
            <FeedPost
              key={thread.id}
              thread={thread}
              user={user}
              onVoteChange={handleVoteChange}
              onSaveChange={handleSaveChange}
            />
          ))
        ) : (
          <div className="empty">
            <div className="empty-icon"><Sprout className="icon" /></div>
            <h3>No posts yet</h3>
            <p>Be the first to share something useful with your community.</p>
          </div>
        )}
      </section>
    </AppLayout>
  );
}
