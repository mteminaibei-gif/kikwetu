'use client';

import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import { StoriesRow } from '@/components/Stories';
import { supabase } from '@/lib/supabase';
import { analytics } from '@/lib/analytics';
import {
  toggleVote, checkVote, toggleSave, checkSaved,
  createReply, fetchReplies,
  editThread, deleteThread, hideThread,
  editReply, deleteReply,
} from '@/lib/supabase-helpers';
import {
  ThumbsUp, MessageCircle, Send, Bookmark,
  Sprout, CircleHelp, Ellipsis,
  Image as ImageIcon, X, Pencil, Trash2,
  EyeOff, Copy, Flag, ChevronDown, Mic, Link as LinkIcon,
  Sparkles, TrendingUp, Users, Compass,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
}

interface FeedPost {
  id: string;
  author_id: string;
  title: string;
  body: string | null;
  type: string;
  tags: string[] | null;
  media_urls: string[] | null;
  likes_count: number;
  comments_count: number;
  is_hidden: boolean | null;
  created_at: string;
  profiles?: { full_name: string; username: string; avatar_url: string | null; county: string | null; is_verified: boolean; };
  _voteDelta?: number;
}

interface Reply {
  id: string;
  thread_id: string;
  author_id: string;
  body: string;
  created_at: string;
  profiles?: { full_name: string; username: string; avatar_url: string | null; is_verified: boolean; };
}

/* ========== POST MENU (Edit/Delete/Hide) ========== */
function PostMenu({ post, user, showToast, onDelete, onHide }: {
  post: FeedPost; user: any; showToast: (m: string) => void;
  onDelete: (id: string) => void; onHide: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const isOwner = user?.user_id === post.author_id;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div className="post-menu-wrap" ref={ref}>
      <button className="icon-btn post-menu" onClick={() => setOpen(!open)}><Ellipsis className="icon-sm" /></button>
      {open && (
        <div className="post-dropdown">
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/baraza?thread=${post.id}`); showToast('Link copied'); setOpen(false); }}>
            <Copy className="icon-sm" /> Copy link
          </button>
          {isOwner && (
            <button onClick={() => { showToast('Edit coming soon'); setOpen(false); }}>
              <Pencil className="icon-sm" /> Edit post
            </button>
          )}
          {isOwner && (
            <button className="danger-text" onClick={async () => {
              if (!confirm('Delete this post?')) return;
              const { error } = await deleteThread(post.id, user.user_id);
              if (!error) { onDelete(post.id); showToast('Post deleted'); }
              setOpen(false);
            }}>
              <Trash2 className="icon-sm" /> Delete
            </button>
          )}
          {isOwner ? (
            <button onClick={async () => { await hideThread(post.id, user.user_id); onHide(post.id); showToast('Post hidden'); setOpen(false); }}>
              <EyeOff className="icon-sm" /> Hide
            </button>
          ) : (
            <button onClick={() => { showToast('Reported'); setOpen(false); }}>
              <Flag className="icon-sm" /> Report
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ========== COMMENT SECTION ========== */
function CommentSection({ threadId, user, showToast }: { threadId: string; user: any; showToast: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);

  const loadReplies = useCallback(async () => {
    const { data } = await fetchReplies(threadId);
    if (data) setReplies(data as unknown as Reply[]);
  }, [threadId]);

  useEffect(() => { if (open) void loadReplies(); }, [open, loadReplies]);

  useEffect(() => {
    if (!open) return;
    const channel = supabase.channel(`baraza-replies-${threadId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'replies', filter: `thread_id=eq.${threadId}` }, (p) => {
        setReplies(prev => { const r = p.new as Reply; return prev.some(x => x.id === r.id) ? prev : [...prev, r]; });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'replies', filter: `thread_id=eq.${threadId}` }, (p) => {
        setReplies(prev => prev.map(r => r.id === (p.new as Reply).id ? { ...r, ...(p.new as Reply) } : r));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'replies', filter: `thread_id=eq.${threadId}` }, (p) => {
        setReplies(prev => prev.filter(r => r.id !== p.old.id));
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [open, threadId]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [replies.length]);

  const handleSubmit = async () => {
    if (!user) return showToast('Sign in to comment');
    if (!input.trim()) return;
    setSubmitting(true);
    const { data, error } = await createReply(threadId, user.user_id, input.trim());
    if (data && !error) {
      const { data: full } = await supabase.from('replies').select('*, profiles:author_id(full_name, username, avatar_url, is_verified)').eq('id', data.id).single();
      if (full) setReplies(prev => prev.some(r => r.id === full.id) ? prev : [...prev, full]);
      setInput('');
    }
    setSubmitting(false);
  };

  const handleEdit = async (replyId: string) => {
    const { error } = await editReply(replyId, user.user_id, editBody);
    if (!error) { setReplies(prev => prev.map(r => r.id === replyId ? { ...r, body: editBody } : r)); showToast('Reply edited'); }
    setEditId(null);
  };

  const handleDelete = async (replyId: string) => {
    if (!confirm('Delete this reply?')) return;
    const { error } = await deleteReply(replyId, user.user_id);
    if (!error) { setReplies(prev => prev.filter(r => r.id !== replyId)); showToast('Reply deleted'); }
  };

  return (
    <div className="comment-section">
      <button className="action comment-toggle" onClick={() => setOpen(!open)}>
        <MessageCircle className="icon-sm" />
        <span>{replies.length > 0 ? replies.length : ''} Comments</span>
        <ChevronDown className="icon-sm" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s' }} />
      </button>
      {open && (
        <div className="comment-panel">
          <div className="comment-list" ref={bodyRef}>
            {replies.length === 0 ? (
              <div className="comment-empty">No comments yet. Be the first!</div>
            ) : replies.map(r => {
              const ri = r.profiles?.full_name ? r.profiles.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : '??';
              const isOwner = user?.user_id === r.author_id;
              return (
                <div key={r.id} className="comment-item">
                  <div className="avatar xs earth">{ri}</div>
                  <div className="comment-body">
                    <div className="comment-head">
                      <strong>{r.profiles?.full_name || 'Unknown'}</strong>
                      <span>{timeAgo(r.created_at)}</span>
                      {isOwner && (
                        <div className="comment-actions-inline">
                          <button onClick={() => { setEditId(r.id); setEditBody(r.body); }}><Pencil className="icon-sm" /></button>
                          <button onClick={() => void handleDelete(r.id)}><Trash2 className="icon-sm" /></button>
                        </div>
                      )}
                    </div>
                    {editId === r.id ? (
                      <div className="comment-edit">
                        <input value={editBody} onChange={e => setEditBody(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleEdit(r.id); if (e.key === 'Escape') setEditId(null); }} autoFocus />
                        <button className="primary sm" onClick={() => void handleEdit(r.id)}>Save</button>
                      </div>
                    ) : (
                      <p>{r.body}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="comment-input-row">
            <div className="avatar xs earth">{user?.full_name ? user.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}</div>
            <input
              placeholder="Write a comment..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSubmit(); } }}
            />
            <button className="icon-btn send-btn" onClick={() => void handleSubmit()} disabled={!input.trim() || submitting}>
              <Send className="icon-sm" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========== THUMBS UP BTN ========== */
function ThumbsUpBtn({ postId, userId, count, showToast, onVoteChange }: {
  postId: string; userId?: string; count: number; showToast: (m: string) => void;
  onVoteChange: (id: string, delta: number) => void;
}) {
  const [voted, setVoted] = useState(false);
  useEffect(() => { if (userId) checkVote(userId, 'thread', postId).then(v => setVoted(!!v && v.value === 1)); }, [userId, postId]);

  const handle = async () => {
    if (!userId) return showToast('Sign in to vote');
    const prev = voted;
    setVoted(!voted);
    onVoteChange(postId, voted ? -1 : 1);
    try { await toggleVote(userId, 'thread', postId, 1); } catch { setVoted(prev); onVoteChange(postId, voted ? 1 : -1); }
  };

  return <button className={`action ${voted ? 'active' : ''}`} onClick={() => void handle()}><ThumbsUp className="icon-sm" /><span>{count + (voted ? 1 : 0)}</span></button>;
}

/* ========== SAVE BTN ========== */
function SaveBtn({ postId, userId, showToast }: { postId: string; userId?: string; showToast: (m: string) => void }) {
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (userId) checkSaved(userId, 'thread', postId).then(s => setSaved(s)); }, [userId, postId]);

  const handle = async () => {
    if (!userId) return showToast('Sign in to save');
    setSaved(!saved);
    await toggleSave(userId, 'thread', postId);
    showToast(saved ? 'Removed from saved' : 'Saved');
  };

  return <button className={`action ${saved ? 'saved' : ''}`} onClick={() => void handle()}><Bookmark className="icon-sm" /></button>;
}

/* ========== MAIN BARAZA PAGE ========== */
function BarazaPageInner() {
  const { user, showToast } = useApp();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState('for-you');
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<FeedPost[]>([]);

  /* --- Build user preference profile --- */
  const buildUserPrefs = useCallback(async () => {
    if (!user) return { tags: [], types: [], counties: [] };

    const prefTags: Record<string, number> = {};
    const prefTypes: Record<string, number> = {};
    const prefCounties: Record<string, number> = {};

    // 1. Tags from user's own posts
    const { data: myPosts } = await supabase
      .from('threads')
      .select('tags, type')
      .eq('author_id', user.user_id)
      .limit(20);
    if (myPosts) {
      myPosts.forEach(p => {
        (p.tags || []).forEach((t: string) => { prefTags[t] = (prefTags[t] || 0) + 3; });
        if (p.type) prefTypes[p.type] = (prefTypes[p.type] || 0) + 2;
      });
    }

    // 2. Tags from voted posts
    const { data: voted } = await supabase
      .from('votes')
      .select('target_id')
      .eq('user_id', user.user_id)
      .eq('target_type', 'thread')
      .eq('value', 1)
      .limit(30);
    if (voted && voted.length > 0) {
      const votedIds = voted.map(v => v.target_id);
      const { data: votedPosts } = await supabase
        .from('threads')
        .select('tags, type, profiles:author_id(county)')
        .in('id', votedIds);
      if (votedPosts) {
        votedPosts.forEach((p: any) => {
          (p.tags || []).forEach((t: string) => { prefTags[t] = (prefTags[t] || 0) + 2; });
          if (p.type) prefTypes[p.type] = (prefTypes[p.type] || 0) + 1;
          const county = Array.isArray(p.profiles) ? p.profiles[0]?.county : p.profiles?.county;
          if (county) prefCounties[county] = (prefCounties[county] || 0) + 1;
        });
      }
    }

    // 3. Tags from saved posts
    const { data: saved } = await supabase
      .from('saves')
      .select('target_id')
      .eq('user_id', user.user_id)
      .eq('target_type', 'thread')
      .limit(20);
    if (saved && saved.length > 0) {
      const savedIds = saved.map(s => s.target_id);
      const { data: savedPosts } = await supabase
        .from('threads')
        .select('tags, type')
        .in('id', savedIds);
      if (savedPosts) {
        savedPosts.forEach(p => {
          (p.tags || []).forEach((t: string) => { prefTags[t] = (prefTags[t] || 0) + 2; });
          if (p.type) prefTypes[p.type] = (prefTypes[p.type] || 0) + 1;
        });
      }
    }

    // 4. User's county
    if (user.county) prefCounties[user.county] = (prefCounties[user.county] || 0) + 3;

    const tags = Object.entries(prefTags).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t);
    const types = Object.entries(prefTypes).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);
    const counties = Object.entries(prefCounties).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c);

    return { tags, types, counties };
  }, [user]);

  /* --- Fetch recommended posts --- */
  useEffect(() => {
    analytics.pageView('baraza');

    const fetchRecommended = async () => {
      const prefs = await buildUserPrefs();
      let query = supabase
        .from('threads')
        .select('*, profiles:author_id(full_name, username, avatar_url, county, is_verified)')
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      // Apply recommendation filters
      if (prefs.tags.length > 0) {
        query = query.overlaps('tags', prefs.tags);
      }

      const { data, error } = await query.limit(50);

      if (data) {
        // Score and rank posts by relevance
        const scored = data.map(p => {
          let score = 0;
          // Tag match score
          (p.tags || []).forEach((t: string) => {
            const idx = prefs.tags.indexOf(t);
            if (idx >= 0) score += (10 - idx) * 2;
          });
          // Type match score
          if (prefs.types.includes(p.type)) score += 5;
          // County match
          const county = Array.isArray(p.profiles) ? p.profiles[0]?.county : p.profiles?.county;
          if (prefs.counties.includes(county)) score += 3;
          // Recency score (newer = higher)
          const age = (Date.now() - new Date(p.created_at).getTime()) / 3600000;
          score += Math.max(0, 10 - age * 0.5);
          // Engagement score
          score += Math.min(p.likes_count * 0.3, 5);
          return { ...p, _score: score, _voteDelta: 0 };
        });

        scored.sort((a: any, b: any) => b._score - a._score);
        setPosts(scored);
      }
      setLoading(false);
    };

    fetchRecommended();

    const channel = supabase.channel('baraza-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'threads' }, (p) => {
        setPosts(prev => [p.new as FeedPost, ...prev].slice(0, 50));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'threads' }, (p) => {
        setPosts(prev => prev.map(post => post.id === p.new.id ? { ...post, ...(p.new as FeedPost) } : post));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'threads' }, (p) => {
        setPosts(prev => prev.filter(post => post.id !== p.old.id));
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [buildUserPrefs]);

  const handleVoteChange = (threadId: string, delta: number) => {
    setPosts(prev => prev.map(p => p.id === threadId ? { ...p, likes_count: p.likes_count + delta } : p));
  };

  const handleDelete = (id: string) => setPosts(prev => prev.filter(p => p.id !== id));
  const handleHide = (id: string) => setPosts(prev => prev.filter(p => p.id !== id));

  const filters = [
    { key: 'for-you', label: 'For You', icon: Sparkles },
    { key: 'following', label: 'Following', icon: Users },
    { key: 'trending', label: 'Trending', icon: TrendingUp },
  ];

  return (
    <AppLayout>
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ color: 'var(--green)' }}><Sparkles className="icon-sm" /> Baraza feed</div>
          <h1 className="serif">Recommended for you.</h1>
          <p>Posts curated from your communities, interests, and reading patterns.</p>
        </div>
        <Link href="/" className="primary" style={{ textDecoration: 'none' }}>
          <Pencil className="icon-sm" /> Create post
        </Link>
      </div>

      <div className="filter-row">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`tag ${filter === f.key ? 'badge-green' : ''}`}>
            <f.icon className="icon-sm" /> {f.label}
          </button>
        ))}
      </div>

      <StoriesRow />

      <section style={{ marginTop: 14 }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="post skeleton-shimmer" style={{ height: 140, borderRadius: 12 }} />)
        ) : posts.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><Compass className="icon" /></div>
            <h3>No recommendations yet</h3>
            <p>Interact with posts on the home page to get personalized recommendations here.</p>
            <Link href="/" className="primary" style={{ textDecoration: 'none', marginTop: 8, display: 'inline-flex' }}>Go to Home</Link>
          </div>
        ) : posts.map(post => {
          const initials = post.profiles?.full_name ? post.profiles.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : '??';
          const hasAudio = post.type === 'audio' || post.media_urls?.some(u => u.endsWith('.webm') || u.endsWith('.mp3'));
          const hasVideo = post.media_urls?.some(u => u.includes('video') || u.endsWith('.mp4'));
          const imageUrls = post.media_urls?.filter(u => u.match(/\.(jpg|jpeg|png|gif|webp)/i) || u.includes('image')) || [];
          const audioUrl = post.media_urls?.find(u => u.endsWith('.webm') || u.endsWith('.mp3') || u.includes('audio'));
          const videoUrl = post.media_urls?.find(u => u.includes('video') || u.endsWith('.mp4'));

          return (
            <article key={post.id} className="post">
              <div className="post-head">
                <Link href={`/profile?id=${post.author_id}`} className="avatar sm earth" style={{ overflow: 'hidden' }}>
                  {post.profiles?.avatar_url ? (
                    <img src={post.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : initials}
                </Link>
                <div className="author">
                  <Link href={`/profile?id=${post.author_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <strong>{post.profiles?.full_name || 'Unknown'} {post.profiles?.is_verified && <span className="verified">✓</span>}</strong>
                  </Link>
                  <div className="meta">
                    <span>@{post.profiles?.username}</span>
                    <span>·</span>
                    <span>{timeAgo(post.created_at)}</span>
                    {post.profiles?.county && <><span>·</span><span>{post.profiles.county}</span></>}
                  </div>
                </div>
                <PostMenu post={post} user={user} showToast={showToast} onDelete={handleDelete} onHide={handleHide} />
              </div>

              <div className="post-body">
                <div className="post-type">
                  {post.type === 'question' ? <CircleHelp className="icon-sm" /> : post.type === 'audio' ? <Mic className="icon-sm" /> : <Sprout className="icon-sm" />}
                  {post.type === 'question' ? 'Deep-dive inquiry' : post.type === 'poll' ? 'Community poll' : post.type === 'audio' ? 'Audio post' : 'Baraza post'}
                </div>
                <h3>{post.title}</h3>
                {post.body && <p>{post.body}</p>}

                {imageUrls.length > 0 && (
                  <div className={`post-media-grid ${imageUrls.length === 1 ? 'single' : imageUrls.length === 2 ? 'double' : imageUrls.length === 3 ? 'triple' : 'quad'}`}>
                    {imageUrls.map((url, i) => <img key={i} src={url} alt="" className="post-media-item" />)}
                  </div>
                )}

                {videoUrl && (
                  <div style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden' }}>
                    <video src={videoUrl} controls style={{ width: '100%', maxHeight: 400, background: '#000' }} />
                  </div>
                )}

                {audioUrl && (
                  <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Mic size={18} style={{ color: 'var(--green)', flexShrink: 0 }} />
                    <audio src={audioUrl} controls style={{ flex: 1, height: 32 }} />
                  </div>
                )}

                {post.tags && post.tags.length > 0 && (
                  <div className="tags">{post.tags.map((t, i) => <span key={i} className={`tag ${i % 2 === 1 ? 'gold' : ''}`}>{t}</span>)}</div>
                )}
              </div>

              <div className="post-actions">
                <ThumbsUpBtn postId={post.id} userId={user?.user_id} count={post.likes_count} showToast={showToast} onVoteChange={handleVoteChange} />
                <CommentSection threadId={post.id} user={user} showToast={showToast} />
                <button className="action" onClick={() => { navigator.clipboard.writeText(window.location.href); showToast('Link copied'); }}>
                  <Send className="icon-sm" /><span>Share</span>
                </button>
                <SaveBtn postId={post.id} userId={user?.user_id} showToast={showToast} />
              </div>
            </article>
          );
        })}
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
