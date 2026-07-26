'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, toggleVote, checkVote, toggleSave, checkSaved, createThread } from '@/lib/supabase-helpers';
import {
  Plus, Image, MessageCircleQuestion, Video, ThumbsUp,
  MessageCircle, Send, Bookmark, MoreHorizontal, MapPin,
  Sprout, CircleHelp, BadgeDollarSign, Ellipsis
} from 'lucide-react';

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
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string | null;
    county: string | null;
    is_verified: boolean;
  };
}

interface User {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  county: string | null;
  is_verified: boolean;
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
      <button className="story add">
        <span className="story-plus"><Plus className="icon-sm" /></span>
        <span>Your story</span>
      </button>
      {stories.map((s, i) => (
        <button key={i} className="story">
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
          <button className="gold" onClick={() => showToast('Opening Students Area')}>
            Open Students Area
          </button>
          <button onClick={() => showToast('Ask the community')}>
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
          <button onClick={onClose} className="icon-btn" style={{ fontSize: 18 }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {['post', 'question'].map(t => (
            <button key={t} onClick={() => setType(t)} className={type === t ? 'primary' : 'secondary'}>
              {t === 'post' ? <Sprout className="icon-sm" /> : <CircleHelp className="icon-sm" />}
              {t === 'post' ? ' Post' : ' Question'}
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
          <button className="secondary" onClick={onClose}>Cancel</button>
          <button className="primary" onClick={handleSubmit} disabled={submitting || !title.trim()}>
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Composer({ onOpenComposer }: { onOpenComposer: () => void }) {
  return (
    <section className="composer">
      <div className="composer-top">
        <div className="avatar">GP</div>
        <button className="composer-open" onClick={onOpenComposer}>
          Share something useful with your county...
        </button>
      </div>
      <div className="composer-actions">
        <button className="composer-action" onClick={onOpenComposer}>
          <Image className="icon" /> Photo / video
        </button>
        <button className="composer-action" onClick={onOpenComposer}>
          <MessageCircleQuestion className="icon" /> Ask a question
        </button>
        <button className="composer-action" onClick={() => null}>
          <Video className="icon" /> Offer a session
        </button>
      </div>
    </section>
  );
}

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
  const { showToast } = useApp();
  const profile = thread.profiles;
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';
  const timeAgo = getTimeAgo(thread.created_at);

  useEffect(() => {
    if (!user) return;
    checkVote(user.id, 'thread', thread.id).then(v => {
      if (v) {
        setLiked(true);
        setLikeDelta(v.value === 1 ? 0 : -1);
      }
    });
    checkSaved(user.id, 'thread', thread.id).then(s => setSaved(s));
  }, [user, thread.id]);

  const handleVote = async () => {
    if (!user) {
      showToast('Please sign in to vote');
      return;
    }
    const prev = liked;
    const delta = liked ? -1 : 1;
    setLiked(!liked);
    setLikeDelta(prev => (liked ? prev - 1 : prev + 1));
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
    setSaved(!saved);
    onSaveChange(thread.id, !saved);
    try {
      await toggleSave(user.id, 'thread', thread.id);
    } catch {
      setSaved(saved);
      onSaveChange(thread.id, saved);
      showToast('Failed to update save');
    }
  };

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
        <button className="icon-btn post-menu"><Ellipsis className="icon" /></button>
      </div>
      <div className="post-body">
        <div className="post-type">
          {thread.type === 'question' ? <CircleHelp className="icon-sm" /> : <Sprout className="icon-sm" />}
          {thread.type === 'question' ? 'Deep-dive inquiry' : 'Baraza post'}
        </div>
        <h3>{thread.title}</h3>
        {thread.body && <p>{thread.body}</p>}
        {thread.bounty_amount && (
          <span className="bounty"><BadgeDollarSign className="icon-sm" /> {thread.bounty_amount} tokens bounty</span>
        )}
        {thread.tags && thread.tags.length > 0 && (
          <div className="tags">
            {thread.tags.map((tag, i) => (
              <span key={i} className={`tag ${i % 2 === 1 ? 'gold' : ''}`}>#{tag}</span>
            ))}
          </div>
        )}
      </div>
      <div className="post-actions">
        <button className={`action ${liked ? 'active' : ''}`} onClick={handleVote}>
          <ThumbsUp className="icon-sm" /> <span>{thread.likes_count + likeDelta}</span>
        </button>
        <button className="action" onClick={() => showToast('Comments opened')}>
          <MessageCircle className="icon-sm" /> <span>{thread.comments_count}</span>
        </button>
        <button className="action" onClick={() => showToast('Share link copied')}>
          <Send className="icon-sm" /> <span>Share</span>
        </button>
        <button className={`action ${saved ? 'saved' : ''}`} onClick={handleSave}>
          <Bookmark className="icon-sm" />
        </button>
        <button className="action"><Ellipsis className="icon-sm" /></button>
      </div>
    </article>
  );
}

function FeedSkeleton() {
  return (
    <div style={{ padding: '19px 0' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div className="avatar" style={{ background: 'var(--surface2)', animation: 'pulse 1.5s infinite' }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, width: 120, background: 'var(--surface2)', borderRadius: 6, marginBottom: 6, animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: 10, width: 80, background: 'var(--surface2)', borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ height: 12, width: 60, background: 'var(--surface2)', borderRadius: 6, marginBottom: 8, animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: 18, width: '90%', background: 'var(--surface2)', borderRadius: 6, marginBottom: 8, animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: 14, width: '100%', background: 'var(--surface2)', borderRadius: 6, marginBottom: 6, animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: 14, width: '70%', background: 'var(--surface2)', borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
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
  const { showToast } = useApp();
  const [user, setUser] = useState<User | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [composerOpen, setComposerOpen] = useState(false);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  useEffect(() => {
    getCurrentUser().then(u => setUser(u));
  }, []);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const { data, error } = await supabase
          .from('threads')
          .select(`
            *,
            profiles:user_id (
              full_name,
              username,
              avatar_url,
              county,
              is_verified
            )
          `)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.log('Using mock data:', error.message);
          setThreads(getMockThreads());
        } else if (data && data.length > 0) {
          setThreads(data);
        } else {
          setThreads(getMockThreads());
        }
      } catch (err) {
        console.log('Using mock data');
        setThreads(getMockThreads());
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();

    const channel = supabase
      .channel('threads-feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'threads',
      }, (payload) => {
        setThreads(prev => [payload.new as Thread, ...prev]);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'threads',
      }, (payload) => {
        setThreads(prev => prev.map(t => t.id === (payload.new as Thread).id ? { ...t, ...(payload.new as Partial<Thread>) } : t));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleVoteChange = (threadId: string, delta: number) => {
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, likes_count: t.likes_count + delta } : t));
  };

  const handleSaveChange = (threadId: string, saved: boolean) => {
    showToast(saved ? 'Saved' : 'Removed from saved');
  };

  const handleCreateThread = async (title: string, body: string, type: string, tags: string[]) => {
    if (!user) {
      showToast('Please sign in to post');
      return;
    }
    const { data, error } = await createThread(user.id, title, body, type, tags);
    if (error) {
      showToast('Failed to create post');
      console.error(error);
      return;
    }
    const { data: fullThread } = await supabase
      .from('threads')
      .select(`*, profiles:user_id (full_name, username, avatar_url, county, is_verified)`)
      .eq('id', data.id)
      .single();
    if (fullThread) {
      setThreads(prev => [fullThread, ...prev]);
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
        <button className="select-pill">
          <MapPin className="icon-sm" /> Nairobi
        </button>
      </div>

      <Stories />
      <HeroSection />
      <Composer onOpenComposer={() => setComposerOpen(true)} />

      <section style={{ marginTop: 14 }}>
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

function getMockThreads(): Thread[] {
  return [
    {
      id: 'mock-1',
      author_id: 'mock',
      title: 'What are you planting before the short rains?',
      body: 'I am trialling sukuma wiki in grow bags this season. The first batch is holding up nicely on a small balcony in Ruiru.',
      type: 'post',
      bounty_amount: null,
      tags: ['KilimoSmart', 'Kiambu'],
      likes_count: 48,
      comments_count: 12,
      created_at: new Date(Date.now() - 38 * 60000).toISOString(),
      profiles: { full_name: 'Amina Muthoni', username: 'aminam', avatar_url: null, county: 'Kiambu', is_verified: true },
    },
    {
      id: 'mock-2',
      author_id: 'mock',
      title: 'What should a small business check before going solar?',
      body: 'Looking for practical advice from someone who has sized a system for a shop or workshop in Nakuru.',
      type: 'question',
      bounty_amount: 120,
      tags: ['NakuruTech', 'Biashara'],
      likes_count: 31,
      comments_count: 8,
      created_at: new Date(Date.now() - 60 * 60000).toISOString(),
      profiles: { full_name: 'Grid Pulse', username: 'gridpulse', avatar_url: null, county: 'Nairobi', is_verified: false },
    },
    {
      id: 'mock-3',
      author_id: 'mock',
      title: 'Should we organize a community seed swap before the rains?',
      body: null,
      type: 'poll',
      bounty_amount: null,
      tags: ['KilimoSmart', 'Nairobi'],
      likes_count: 24,
      comments_count: 8,
      created_at: new Date(Date.now() - 90 * 60000).toISOString(),
      profiles: { full_name: 'Njeri Wambui', username: 'njeri_w', avatar_url: null, county: 'Nairobi', is_verified: true },
    },
  ];
}
