'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import { StoriesRow } from '@/components/Stories';
import {
  toggleVote, checkVote, toggleSave, checkSaved,
  createThreadWithMedia, createReply, fetchReplies,
  uploadPostMedia, editThread, deleteThread, hideThread,
  editReply, deleteReply,
} from '@/lib/supabase-helpers';
import Link from 'next/link';
import {
  Plus, ThumbsUp, MessageCircle, Send, Bookmark,
  Image as ImageIcon, Video, X, Pencil, Trash2,
  EyeOff, Copy, Flag, ChevronDown, CircleHelp, Sprout,
  Mic, MicOff, Square, Pause, Play, Ellipsis,
} from 'lucide-react';

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
}

interface Reply {
  id: string;
  thread_id: string;
  author_id: string;
  body: string;
  created_at: string;
  profiles?: { full_name: string; username: string; avatar_url: string | null; is_verified: boolean; };
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
}

/* ===== COMPOSER ===== */
function PostComposer({ user, showToast, onPost }: {
  user: any; showToast: (m: string) => void; onPost: (p: FeedPost) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('post');
  const [tagsInput, setTagsInput] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordStartRef = useRef<number>(0);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => f.size < 20 * 1024 * 1024);
    if (valid.length !== files.length) showToast('Some files exceed 20MB');
    setMediaFiles(prev => [...prev, ...valid].slice(0, 4));
    valid.forEach(f => {
      const url = URL.createObjectURL(f);
      setMediaPreviews(prev => [...prev, url]);
    });
  };

  const removeMedia = (i: number) => {
    URL.revokeObjectURL(mediaPreviews[i]);
    setMediaFiles(prev => prev.filter((_, idx) => idx !== i));
    setMediaPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      recordStartRef.current = Date.now();
      setRecording(true);
      setRecordTime(0);
      recordIntervalRef.current = setInterval(() => {
        setRecordTime(Math.floor((Date.now() - recordStartRef.current) / 1000));
      }, 1000);
    } catch {
      showToast('Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
  };

  const cancelRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordTime(0);
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleSubmit = async () => {
    if (!user) return showToast('Sign in to post');
    if (!title.trim()) return;
    setUploading(true);
    try {
      const urls: string[] = [];

      for (const file of mediaFiles) {
        const { url, error } = await uploadPostMedia(file, user.user_id);
        if (url) urls.push(url);
        if (error) showToast(`Upload failed: ${error}`);
      }

      if (audioBlob) {
        const ext = 'webm';
        const path = `${user.user_id}/${Date.now()}.${ext}`;
        const { error: audioErr } = await supabase.storage.from('post-media').upload(path, audioBlob, { cacheControl: '3600', upsert: false });
        if (!audioErr) {
          const { data: urlData } = supabase.storage.from('post-media').getPublicUrl(path);
          if (urlData?.publicUrl) urls.push(urlData.publicUrl);
        } else {
          showToast('Audio upload failed');
        }
      }

      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const finalType = audioBlob && type !== 'audio' ? 'audio' : type;
      const { data, error } = await createThreadWithMedia(user.user_id, title.trim(), body.trim(), finalType, tags, urls);
      if (error || !data) { showToast(error?.message || 'Failed to post'); return; }
      onPost({
        ...data, author_id: user.user_id, is_hidden: null,
        profiles: { full_name: user.full_name, username: user.username, avatar_url: user.avatar_url, county: user.county, is_verified: user.is_verified },
      });
      setTitle(''); setBody(''); setTagsInput(''); setMediaFiles([]); setMediaPreviews([]);
      setAudioBlob(null); setAudioUrl(null); setRecordTime(0);
      setExpanded(false); setType('post');
      showToast('Posted!');
    } catch { showToast('Failed to post'); }
    setUploading(false);
  };

  const initials = user?.full_name ? user.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

  return (
    <div className="composer">
      <div className="composer-top">
        <div className="avatar sm earth">{initials}</div>
        {!expanded ? (
          <button className="composer-open" onClick={() => {
            if (!user) return showToast('Sign in to create a post');
            setExpanded(true);
          }}>
            What's on your mind{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}?
          </button>
        ) : (
          <div className="composer-expanded">
            <div className="composer-type-row">
              {['post', 'question', 'poll', 'audio'].map(t => (
                <button key={t} onClick={() => setType(t)} className={`create-type-btn ${type === t ? 'active' : ''}`}>{t}</button>
              ))}
            </div>

            <input placeholder="Title (required)" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
            <textarea placeholder="What do you want to ask or share?" value={body} onChange={e => setBody(e.target.value)} rows={3} />

            {mediaPreviews.length > 0 && (
              <div className="media-preview-grid">
                {mediaPreviews.map((url, i) => (
                  <div key={i} className="media-preview-item">
                    {mediaFiles[i]?.type.startsWith('video/') ? (
                      <video src={url} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <img src={url} alt="" />
                    )}
                    <button className="media-remove" onClick={() => removeMedia(i)}><X className="icon-sm" /></button>
                  </div>
                ))}
              </div>
            )}

            {audioUrl && (
              <div className="media-preview-grid">
                <div className="media-preview-item" style={{ aspectRatio: 'auto', padding: '12px', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10 }}>
                  <audio src={audioUrl} controls style={{ flex: 1, height: 32 }} />
                  <button className="media-remove" onClick={() => { cancelRecording(); }}><X className="icon-sm" /></button>
                </div>
              </div>
            )}

            {recording && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--roseSoft)', borderRadius: 10, border: '1px solid var(--rose)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--rose)', animation: 'pulse 1s infinite' }} />
                <span style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--rose)' }}>Recording {formatTime(recordTime)}</span>
                <span style={{ flex: 1 }} />
                <button onClick={stopRecording} style={{ background: 'var(--rose)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer' }}>
                  <Square size={12} /> Stop
                </button>
              </div>
            )}

            <input placeholder="Tags (comma separated)" value={tagsInput} onChange={e => setTagsInput(e.target.value)} />
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: 'none' }} />
            <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleFiles} style={{ display: 'none' }} />
            <input ref={audioRef} type="file" accept="audio/*" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                if (f.size > 10 * 1024 * 1024) { showToast('Audio must be under 10MB'); return; }
                setAudioBlob(f);
                setAudioUrl(URL.createObjectURL(f));
              }
            }} style={{ display: 'none' }} />

            <div className="composer-attachments">
              <button className="composer-attach-btn" onClick={() => fileRef.current?.click()}><ImageIcon className="icon-sm" /> Photo</button>
              <button className="composer-attach-btn" onClick={() => videoRef.current?.click()}><Video className="icon-sm" /> Video</button>
              <button className="composer-attach-btn" onClick={() => { if (!recording) startRecording(); }}><Mic className="icon-sm" /> Record</button>
              <button className="composer-attach-btn" onClick={() => audioRef.current?.click()}><Mic className="icon-sm" /> Upload audio</button>
            </div>

            <div className="composer-submit-row">
              <button className="secondary" onClick={() => { setExpanded(false); setMediaFiles([]); setMediaPreviews([]); cancelRecording(); }}>Cancel</button>
              <button className="primary" onClick={() => void handleSubmit()} disabled={uploading || !title.trim()}>
                {uploading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== POST MENU ===== */
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
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?thread=${post.id}`); showToast('Link copied'); setOpen(false); }}>
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

/* ===== COMMENT SECTION ===== */
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
    const channel = supabase.channel(`home-replies-${threadId}`)
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

/* ===== THUMBS UP BTN ===== */
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

/* ===== SAVE BTN ===== */
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

/* ===== FEED POST ===== */
function FeedPost({ post, user, showToast, onDelete, onHide, onVoteChange }: {
  post: FeedPost; user: any; showToast: (m: string) => void;
  onDelete: (id: string) => void; onHide: (id: string) => void;
  onVoteChange: (id: string, delta: number) => void;
}) {
  const initials = post.profiles?.full_name
    ? post.profiles.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const tagLabel = post.type === 'question' ? 'Deep-dive inquiry' : post.type === 'poll' ? 'Community poll' : post.type === 'audio' ? 'Audio post' : 'Baraza post';
  const hasAudio = post.media_urls?.some(u => u.endsWith('.webm') || u.endsWith('.mp3') || u.includes('audio'));
  const hasVideo = post.media_urls?.some(u => u.includes('video') || u.endsWith('.mp4') || u.endsWith('.webm'));
  const imageUrls = post.media_urls?.filter(u => u.match(/\.(jpg|jpeg|png|gif|webp)/i) || u.includes('image')) || [];
  const audioUrl = post.media_urls?.find(u => u.endsWith('.webm') || u.endsWith('.mp3') || u.includes('audio'));
  const videoUrl = post.media_urls?.find(u => u.includes('video') || u.endsWith('.mp4'));

  return (
    <article className="post">
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
            <span>@{post.profiles?.username || 'user'}</span>
            <span>·</span>
            <span>{timeAgo(post.created_at)}</span>
            {post.profiles?.county && <><span>·</span><span>{post.profiles.county}</span></>}
          </div>
        </div>
        <PostMenu post={post} user={user} showToast={showToast} onDelete={onDelete} onHide={onHide} />
      </div>

      <div className="post-body">
        <div className="post-type">
          {post.type === 'question' ? <CircleHelp className="icon-sm" /> : post.type === 'audio' ? <Mic className="icon-sm" /> : <Sprout className="icon-sm" />}
          {tagLabel}
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
          <div className="tags">
            {post.tags.map((t, i) => <span key={i} className={`tag ${i % 2 === 1 ? 'gold' : ''}`}>{t}</span>)}
          </div>
        )}
      </div>

      <div className="post-actions">
        <ThumbsUpBtn postId={post.id} userId={user?.user_id} count={post.likes_count} showToast={showToast} onVoteChange={onVoteChange} />
        <CommentSection threadId={post.id} user={user} showToast={showToast} />
        <button className="action" onClick={() => { navigator.clipboard.writeText(window.location.href); showToast('Link copied'); }}>
          <Send className="icon-sm" /><span>Share</span>
        </button>
        <SaveBtn postId={post.id} userId={user?.user_id} showToast={showToast} />
      </div>
    </article>
  );
}

/* ===== MAIN HOME PAGE ===== */
export default function Home() {
  const { user, showToast } = useApp();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      const { data } = await supabase
        .from('threads')
        .select('*, profiles:author_id(full_name, username, avatar_url, county, is_verified)')
        .order('created_at', { ascending: false })
        .limit(30);
      if (data) setPosts(data.map(p => ({ ...p, _voteDelta: 0 })));
      setLoading(false);
    };
    fetchFeed();

    const channel = supabase.channel('home-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'threads' }, (p) => {
        setPosts(prev => [p.new as FeedPost, ...prev].slice(0, 30));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'threads' }, (p) => {
        setPosts(prev => prev.map(post => post.id === p.new.id ? { ...post, ...(p.new as FeedPost) } : post));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'threads' }, (p) => {
        setPosts(prev => prev.filter(post => post.id !== p.old.id));
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  const handlePost = (newPost: FeedPost) => setPosts(prev => [newPost, ...prev]);
  const handleDelete = (id: string) => setPosts(prev => prev.filter(p => p.id !== id));
  const handleHide = (id: string) => setPosts(prev => prev.filter(p => p.id !== id));
  const handleVoteChange = (threadId: string, delta: number) => {
    setPosts(prev => prev.map(p => p.id === threadId ? { ...p, likes_count: p.likes_count + delta } : p));
  };

  return (
    <AppLayout>
      <div className="page-head">
        <div>
          <div className="eyebrow">KikwetuConnect</div>
          <h1 className="serif">Kenya, in conversation.</h1>
          <p>Compose, share, and discuss. Your community feed with photos, video, and audio.</p>
        </div>
      </div>

      <StoriesRow />

      <PostComposer user={user} showToast={showToast} onPost={handlePost} />

      <section style={{ marginTop: 14 }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="post skeleton-shimmer" style={{ height: 140, borderRadius: 12 }} />
          ))
        ) : posts.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><MessageCircle className="icon" /></div>
            <h3>No posts yet</h3>
            <p>Be the first to share something with your community.</p>
          </div>
        ) : posts.map(post => (
          <FeedPost
            key={post.id}
            post={post}
            user={user}
            showToast={showToast}
            onDelete={handleDelete}
            onHide={handleHide}
            onVoteChange={handleVoteChange}
          />
        ))}
      </section>
    </AppLayout>
  );
}
