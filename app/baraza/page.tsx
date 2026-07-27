'use client';

import React, { useState, useEffect, Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import { analytics } from '@/lib/analytics';
import {
  getCurrentUser, toggleVote, checkVote, toggleSave, checkSaved,
  createThread, createReply, fetchReplies,
} from '@/lib/supabase-helpers';
import {
  Plus, Image, MessageCircleQuestion, Video, ThumbsUp,
  MessageCircle, Send, Bookmark, MoreHorizontal, Sprout,
  CircleHelp, BadgeDollarSign, Ellipsis, Filter
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

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

interface Reply {
  id: string;
  thread_id: string;
  author_id: string;
  body: string;
  created_at: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string | null;
    county: string | null;
    is_verified: boolean;
  };
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

function ComposerModal({
  onClose,
  onSubmit,
  initialType = 'post',
}: {
  onClose: () => void;
  onSubmit: (title: string, body: string, type: string, tags: string[]) => Promise<void>;
  initialType?: string;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState(initialType);
  const [tagsInput, setTagsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    try {
      await onSubmit(title.trim(), body.trim(), type, tags);
      analytics.createPost(type);
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
          {['post', 'question', 'poll'].map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: `1px solid ${type === t ? 'var(--green)' : 'var(--line)'}`,
                background: type === t ? 'var(--greenSoft)' : 'transparent',
                color: type === t ? 'var(--green)' : 'var(--text3)',
                fontSize: '.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all .2s',
              }}
            >
              {t}
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

function ReplySection({
  threadId,
  user,
  replyCount,
  onReplyAdded,
}: {
  threadId: string;
  user: User | null;
  replyCount: number;
  onReplyAdded: (threadId: string) => void;
}) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [showReplies, setShowReplies] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useApp();

  const loadReplies = async () => {
    const { data } = await fetchReplies(threadId);
    if (data) setReplies(data as unknown as Reply[]);
  };

  useEffect(() => {
    if (showReplies) loadReplies();
  }, [showReplies, threadId]);

  useEffect(() => {
    const channel = supabase
      .channel(`replies-${threadId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'replies',
        filter: `thread_id=eq.${threadId}`,
      }, (payload) => {
        const newReply = payload.new as Reply;
        setReplies(prev => {
          if (prev.some(r => r.id === newReply.id)) return prev;
          return [...prev, newReply];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  const handleSubmitReply = async () => {
    if (!user) {
      showToast('Please sign in to reply');
      return;
    }
    if (!replyBody.trim()) return;
    setSubmitting(true);
    try {
      const { data, error } = await createReply(threadId, user.id, replyBody.trim());
      if (error || !data) {
        showToast('Failed to post reply');
        console.error(error);
        return;
      }
      const { data: fullReply } = await supabase
        .from('replies')
        .select(`*, profiles:author_id (full_name, username, avatar_url, county, is_verified)`)
        .eq('id', data.id)
        .single();
      if (fullReply) {
        setReplies(prev => {
          if (prev.some(r => r.id === fullReply.id)) return prev;
          return [...prev, fullReply];
        });
      }
      setReplyBody('');
      showToast('Reply posted!');
      analytics.reply();
    } catch {
      showToast('Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ borderTop: '1px solid var(--line)', padding: '10px 16px' }}>
      <button
        className="action"
        onClick={() => setShowReplies(!showReplies)}
        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0' }}
      >
        <MessageCircle className="icon-sm" />
        <span>{replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
      </button>

      {showReplies && (
        <div style={{ marginTop: 8 }}>
          {replies.map(r => {
            const rp = r.profiles;
            const rInitials = rp?.full_name
              ? rp.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
              : '??';
            return (
              <div key={r.id} style={{
                padding: '8px 0', borderTop: '1px solid var(--line)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="avatar earth" style={{ width: 24, height: 24, fontSize: '.5rem' }}>{rInitials}</div>
                  <strong style={{ fontSize: '.75rem' }}>{rp?.full_name || 'Unknown'}</strong>
                  <span style={{ fontSize: '.65rem', color: 'var(--text3)' }}>{getTimeAgo(r.created_at)}</span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '.8rem' }}>{r.body}</p>
              </div>
            );
          })}

          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <input
              placeholder="Write a reply..."
              value={replyBody}
              onChange={e => setReplyBody(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitReply(); } }}
              style={{
                flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)',
                background: 'var(--surface2)', color: 'var(--text)', fontSize: '.8rem',
              }}
            />
            <button className="primary" onClick={handleSubmitReply} disabled={submitting || !replyBody.trim()}
              style={{ padding: '6px 12px', fontSize: '.78rem' }}>
              <Send className="icon-sm" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PostCard({
  post,
  threadId,
  user,
  onAction,
  onVoteChange,
  onSaveChange,
  onReplyAdded,
}: {
  post: PostType;
  threadId: string | null;
  user: User | null;
  onAction: (msg: string) => void;
  onVoteChange: (threadId: string, delta: number, liked: boolean) => void;
  onSaveChange: (threadId: string, saved: boolean) => void;
  onReplyAdded: (threadId: string) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [voted, setVoted] = useState<number | null>(null);
  const [votedPoll, setVotedPoll] = useState<number | null>(null);
  const [likeDelta, setLikeDelta] = useState(0);

  useEffect(() => {
    if (!user || !threadId) return;
    checkVote(user.id, 'thread', threadId).then(v => {
      if (v) {
        setLiked(true);
        setLikeDelta(v.value === 1 ? 0 : -1);
      }
    });
    checkSaved(user.id, 'thread', threadId).then(s => setSaved(s));
  }, [user, threadId]);

  const handlePollVote = async (optionIndex: number) => {
    if (!user || votedPoll !== null || !threadId) return;
    try {
      await toggleVote(user.id, 'thread', threadId, 1);
      setVotedPoll(optionIndex);
      onAction('Vote recorded');
    } catch {
      onAction('Failed to record vote');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      onAction('Link copied to clipboard');
    } catch {
      onAction('Could not copy link');
    }
  };

  const handleVote = async () => {
    if (!user || !threadId) {
      onAction('Please sign in to vote');
      return;
    }
    const prevLiked = liked;
    const delta = liked ? -1 : 1;
    setLiked(!liked);
    setLikeDelta(ld => liked ? ld - 1 : ld + 1);
    onVoteChange(threadId, delta, !liked);
    try {
      await toggleVote(user.id, 'thread', threadId, 1);
      analytics.vote('thread', liked ? -1 : 1);
    } catch {
      setLiked(prevLiked);
      onVoteChange(threadId, -delta, liked);
      onAction('Failed to update vote');
    }
  };

  const handleSave = async () => {
    if (!user || !threadId) {
      onAction('Please sign in to save');
      return;
    }
    setSaved(!saved);
    onSaveChange(threadId, !saved);
    try {
      await toggleSave(user.id, 'thread', threadId);
    } catch {
      setSaved(saved);
      onSaveChange(threadId, saved);
      onAction('Failed to update save');
    }
  };

  return (
    <article className="post">
      <div className="post-head">
        <div className={`avatar ${post.author.color}`}>{post.author.initials}</div>
        <div className="author">
          <strong>
            {post.author.name} {post.author.verified && <span className="verified">✓</span>}
          </strong>
          <div className="meta">
            <span>{post.meta.handle}</span>
            <span>·</span>
            <span>{post.meta.time}</span>
            <span>·</span>
            <span>{post.meta.county}</span>
          </div>
        </div>
        <button className="icon-btn post-menu"><Ellipsis className="icon" /></button>
      </div>

      <div className="post-body">
        <div className="post-type">
          {post.type === 'question' ? <CircleHelp className="icon-sm" /> : <Sprout className="icon-sm" />}
          {post.content.tag}
        </div>

        <h3>{post.content.title}</h3>

        {'body' in post.content && post.content.body && (
          <p>{post.content.body}</p>
        )}

        {'translation' in post.content && post.content.translation && (
          <div className="translation">
            <strong>{post.content.translation.label}</strong>
            <span> · {post.content.translation.text}</span>
          </div>
        )}

        {'bounty' in post.content && post.content.bounty && (
          <div className="question-box" style={{ marginTop: 12 }}>
            <span className="bounty">
              <BadgeDollarSign className="icon-sm" /> {post.content.bounty}
            </span>
          </div>
        )}

        {'options' in post.content && post.content.options && (
          <div style={{ marginTop: 12 }}>
            {post.content.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handlePollVote(i)}
                disabled={votedPoll !== null}
                style={{
                  display: 'block', width: '100%', padding: '10px 12px', marginBottom: 6,
                  borderRadius: 10, border: votedPoll === i ? '1px solid var(--green)' : '1px solid var(--line)',
                  background: votedPoll === i ? 'var(--greenSoft)' : 'var(--bg)', color: 'var(--text)',
                  textAlign: 'left', position: 'relative', overflow: 'hidden', fontSize: '.78rem',
                  fontWeight: votedPoll === i ? 700 : 400, cursor: votedPoll !== null ? 'default' : 'pointer',
                  opacity: votedPoll !== null && votedPoll !== i ? 0.6 : 1,
                }}
              >
                {votedPoll !== null && (
                  <div style={{ position: 'absolute', inset: 0, width: `${opt.pct}%`, background: 'var(--greenSoft)', opacity: .4, transition: 'width .3s ease' }} />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>
                  {opt.label}
                  {votedPoll !== null && <span style={{ float: 'right', color: 'var(--text3)' }}>{opt.pct}%</span>}
                </span>
              </button>
            ))}
          </div>
        )}

        {'audio' in post.content && post.content.audio && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: 'var(--surface2)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => onAction('Playing audio')} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--green)', color: 'var(--surface)', display: 'grid', placeItems: 'center', flexShrink: 0, cursor: 'pointer' }}>
              <Video className="icon-sm" />
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 99, background: 'var(--line2)', overflow: 'hidden' }}>
                <div style={{ width: `${post.content.audio.progress}%`, height: '100%', background: 'var(--green)', borderRadius: 99 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '.62rem', color: 'var(--text3)' }}>
                <span>{post.content.audio.elapsed}</span>
                <span>{post.content.audio.duration}</span>
              </div>
            </div>
          </div>
        )}

        <div className="tags">
          {post.content.tags.map((tag, i) => (
            <span key={i} className={`tag ${i % 2 === 1 ? 'gold' : ''}`}>{tag}</span>
          ))}
        </div>
      </div>

      <div className="post-actions">
        <button className={`action ${liked ? 'active' : ''}`} onClick={handleVote}>
          <ThumbsUp className="icon-sm" /> <span>{post.stats.likes + likeDelta}</span>
        </button>
        <button className="action" onClick={() => onAction('Comments opened')}>
          <MessageCircle className="icon-sm" />
          <span>{'answers' in post.stats ? `${post.stats.answers} answers` : post.stats.comments}</span>
        </button>
        <button className="action" onClick={handleShare}>
          <Send className="icon-sm" /> <span>Share</span>
        </button>
        <button className={`action ${saved ? 'saved' : ''}`} onClick={handleSave}>
          <Bookmark className="icon-sm" />
        </button>
        <button className="action"><Ellipsis className="icon-sm" /></button>
      </div>

      {threadId && (
        <ReplySection
          threadId={threadId}
          user={user}
          replyCount={'answers' in post.stats ? (post.stats.answers || 0) : (post.stats.comments || 0)}
          onReplyAdded={onReplyAdded}
        />
      )}
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

function BarazaPageInner() {
  const { showToast } = useApp();
  const searchParams = useSearchParams();
  const composeType = searchParams.get('compose');
  const [user, setUser] = useState<User | null>(null);
  const [filter, setFilter] = useState('for-you');
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostType[]>(feedPosts as PostType[]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerType, setComposerType] = useState<'post' | 'question' | 'poll'>('post');

  useEffect(() => {
    if (composeType) {
      setComposerOpen(true);
      setComposerType(composeType as 'post' | 'question' | 'poll');
    }
  }, [composeType]);

  const filters = [
    { key: 'for-you', label: 'For You' },
    { key: 'following', label: 'Following' },
    { key: 'spaces', label: 'Spaces' },
    { key: 'trending', label: 'Trending' },
  ];

  useEffect(() => {
    getCurrentUser().then(u => setUser(u));
  }, []);

  useEffect(() => {
    analytics.pageView('baraza');
    const fetchThreads = async () => {
      try {
        const { data, error } = await supabase
          .from('threads')
          .select('*, profiles:author_id(full_name, username, avatar_url, county, heshima, is_verified)')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.log('Using mock data:', error.message);
          setPosts(feedPosts);
        } else if (data && data.length > 0) {
          setPosts(data.map(threadToPost));
        } else {
          setPosts(feedPosts);
        }
      } catch (err) {
        console.log('Using mock data');
        setPosts(feedPosts);
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();

    const channel = supabase
      .channel('baraza-feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'threads',
      }, (payload) => {
        const newPost = threadToPost(payload.new as Thread) as PostType;
        setPosts(prev => [newPost, ...prev]);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'replies',
      }, (payload) => {
        const newReply = payload.new as { thread_id: string };
        setPosts(prev => prev.map(p => {
          if (!p._threadId) return p;
          if (p._threadId === newReply.thread_id) {
            const stats = { ...p.stats };
            if ('answers' in stats) stats.answers = (stats.answers || 0) + 1;
            else stats.comments = (stats.comments || 0) + 1;
            return { ...p, stats };
          }
          return p;
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleVoteChange = (threadId: string, delta: number) => {
    setPosts(prev => prev.map(p => {
      if (p._threadId === threadId) {
        const stats = { ...p.stats, likes: p.stats.likes + delta };
        return { ...p, stats };
      }
      return p;
    }));
  };

  const handleSaveChange = (threadId: string, saved: boolean) => {
    showToast(saved ? 'Saved' : 'Removed from saved');
  };

  const handleReplyAdded = (threadId: string) => {
    setPosts(prev => prev.map(p => {
      if (p._threadId === threadId) {
        const stats = { ...p.stats };
        if ('answers' in stats) stats.answers = (stats.answers || 0) + 1;
        else stats.comments = (stats.comments || 0) + 1;
        return { ...p, stats };
      }
      return p;
    }));
  };

  const handleCreateThread = async (title: string, body: string, type: string, tags: string[]) => {
    if (!user) {
      showToast('Please sign in to post');
      return;
    }
    const { data, error } = await createThread(user.id, title, body, type, tags);
    if (error || !data) {
      showToast('Failed to create post');
      console.error(error);
      return;
    }
    const { data: fullThread } = await supabase
      .from('threads')
      .select('*')
      .eq('id', data.id)
      .single();
    if (fullThread) {
      setPosts(prev => [threadToPost(fullThread), ...prev]);
    }
    setComposerOpen(false);
    showToast('Posted successfully!');
  };

  return (
    <AppLayout>
      {composerOpen && (
        <ComposerModal onClose={() => setComposerOpen(false)} onSubmit={handleCreateThread} initialType={composerType} />
      )}

      <div className="page-head">
        <div>
          <div className="eyebrow">Baraza feed</div>
          <h1 className="serif">What Kenya is talking about.</h1>
          <p>Questions, posts, polls, and audio from your communities and beyond.</p>
        </div>
        <button className="select-pill"><Filter className="icon-sm" /> All topics</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 22, overflow: 'auto' }}>
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); showToast(`Viewing ${f.label}`); }}
            className={filter === f.key ? 'primary' : 'secondary'}
          >
            {f.label}
          </button>
        ))}
      </div>

      <section className="composer">
        <div className="composer-top">
          <div className="avatar">GP</div>
          <button className="composer-open" onClick={() => setComposerOpen(true)}>
            Share something useful with your county...
          </button>
        </div>
        <div className="composer-actions">
          <button className="composer-action" onClick={() => setComposerOpen(true)}>
            <Image className="icon" /> Photo / video
          </button>
          <button className="composer-action" onClick={() => setComposerOpen(true)}>
            <MessageCircleQuestion className="icon" /> Ask a question
          </button>
          <button className="composer-action" onClick={() => null}>
            <Video className="icon" /> Offer a session
          </button>
        </div>
      </section>

      <section style={{ marginTop: 14 }}>
        {loading ? (
          <>
            <FeedSkeleton />
            <FeedSkeleton />
            <FeedSkeleton />
          </>
        ) : posts.map((post, i) => (
          <PostCard
            key={i}
            post={post}
            threadId={(post as any)._threadId || null}
            user={user}
            onAction={showToast}
            onVoteChange={handleVoteChange}
            onSaveChange={handleSaveChange}
            onReplyAdded={handleReplyAdded}
          />
        ))}
      </section>
    </AppLayout>
  );
}

export default function BarazaFeed() {
  return (
    <Suspense fallback={<AppLayout><div className="page"><div className="skeleton" style={{ height: 400 }} /></div></AppLayout>}>
      <BarazaPageInner />
    </Suspense>
  );
}

type PostContent = {
  tag: string;
  title: string;
  body?: string;
  translation?: { label: string; text: string };
  bounty?: string;
  audio?: { duration: string; elapsed: string; progress: number };
  options?: { label: string; pct: number }[];
  tags: string[];
};

type PostAuthor = {
  name: string;
  initials: string;
  color: string;
  verified: boolean;
};

type PostMeta = {
  handle: string;
  time: string;
  county: string;
};

type PostStats = {
  likes: number;
  comments?: number;
  answers?: number;
};

type PostType = {
  type: string;
  author: PostAuthor;
  meta: PostMeta;
  content: PostContent;
  stats: PostStats;
  _threadId?: string;
};

const feedPosts: PostType[] = [
  {
    type: 'post',
    author: { name: 'Amina Muthoni', initials: 'AM', color: 'earth', verified: true },
    meta: { handle: '@aminam', time: '38m', county: 'Kiambu' },
    content: {
      tag: 'Baraza post',
      title: 'What are you planting before the short rains?',
      body: 'I am trialling sukuma wiki in grow bags this season. The first batch is holding up nicely on a small balcony in Ruiru.',
      translation: { label: 'Read in Kiswahili', text: '"Unapanda nini kabla ya mvua fupi?"' },
      tags: ['#KilimoSmart', '#Kiambu'],
    },
    stats: { likes: 48, comments: 12 },
  },
  {
    type: 'question',
    author: { name: 'Anonymous', initials: 'GP', color: 'default', verified: false },
    meta: { handle: '@anonymous', time: '1h', county: 'Nairobi' },
    content: {
      tag: 'Deep-dive inquiry',
      title: 'What should a small business check before going solar?',
      body: 'Looking for practical advice from someone who has sized a system for a shop or workshop in Nakuru.',
      bounty: '120 tokens bounty',
      tags: ['#NakuruTech', '#Biashara'],
    },
    stats: { likes: 31, answers: 8 },
  },
  {
    type: 'poll',
    author: { name: 'Njeri Wambui', initials: 'NW', color: 'green', verified: true },
    meta: { handle: '@njeri_w', time: '1h', county: 'Nairobi' },
    content: {
      tag: 'Community poll',
      title: 'Should we organize a community seed swap before the rains?',
      options: [
        { label: 'Yes, definitely', pct: 62 },
        { label: 'Maybe, need more info', pct: 24 },
        { label: 'No, not relevant', pct: 14 },
      ],
      tags: ['#KilimoSmart', '#Nairobi'],
    },
    stats: { likes: 24, comments: 8 },
  },
  {
    type: 'audio',
    author: { name: 'James Otieno', initials: 'JO', color: 'blue', verified: true },
    meta: { handle: '@james_o', time: '2h', county: 'Kisumu' },
    content: {
      tag: 'Audio note',
      title: 'Quick tip: how to clean your solar panels during the dry season',
      audio: { duration: '3:58', elapsed: '1:24', progress: 35 },
      tags: ['#KilimoSmart', '#SolarKE'],
    },
    stats: { likes: 56, comments: 14 },
  },
];

function threadToPost(thread: Thread) {
  const profile = thread.profiles;
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';
  const type = thread.type === 'question' ? 'question' : 'post';

  const base = {
    type,
    _threadId: thread.id,
    author: {
      name: profile?.full_name || 'Unknown',
      initials,
      color: 'earth' as const,
      verified: profile?.is_verified || false,
    },
    meta: {
      handle: profile?.username ? `@${profile.username}` : '@unknown',
      time: getTimeAgo(thread.created_at),
      county: profile?.county || 'Kenya',
    },
    stats: { likes: thread.likes_count, comments: thread.comments_count },
  };

  if (type === 'question') {
    return {
      ...base,
      content: {
        tag: 'Deep-dive inquiry',
        title: thread.title,
        body: thread.body || '',
        bounty: thread.bounty_amount ? `${thread.bounty_amount} tokens bounty` : '',
        tags: (thread.tags || []).map(t => `#${t}`),
      },
      stats: { likes: thread.likes_count, answers: thread.comments_count },
    };
  }

  return {
    ...base,
    content: {
      tag: 'Baraza post',
      title: thread.title,
      body: thread.body || '',
      tags: (thread.tags || []).map(t => `#${t}`),
    },
  };
}
