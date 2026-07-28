'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, toggleVote, toggleSave, createReply, fetchReplies } from '@/lib/supabase-helpers';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft, CircleHelp, BadgeDollarSign, ThumbsUp, MessageCircle,
  Send, Bookmark, Ellipsis, BadgeCheck, Award, Star,
  MessageCircleQuestion, Edit
} from 'lucide-react';

interface Thread {
  id: string;
  title: string;
  body: string;
  tags: string[];
  likes_count: number;
  created_at: string;
  author_id: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string;
    county: string;
    heshima: number;
    is_verified: boolean;
  };
}

interface Reply {
  id: string;
  thread_id: string;
  author_id: string;
  body: string;
  is_accepted: boolean;
  created_at: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string;
    county: string;
    is_verified: boolean;
  };
}

const guidanceOffers = [
  {
    name: 'Njeri Wambui',
    initials: 'NW',
    color: 'earth',
    topic: 'Value-based pricing',
    time: 'Tomorrow, 30 min',
    badge: 'Approved professional',
  },
  {
    name: 'James Otieno',
    initials: 'JO',
    color: 'blue',
    topic: 'Real client example',
    time: 'Wednesday, 45 min',
    badge: 'Approved professional',
  },
];

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function ThreadPageInner() {
  const searchParams = useSearchParams();
  const threadIdParam = searchParams.get('id');

  const { showToast, user } = useApp();
  const [liked, setLiked] = useState(false);
  const [voteCount, setVoteCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [threadId] = useState(threadIdParam || '1');
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [replyCount, setReplyCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const channelRef = useRef<any>(null);
  const repliesListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchThread() {
      if (!threadId) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('threads')
        .select('*, profiles:author_id(full_name, username, avatar_url, county, heshima, is_verified)')
        .eq('id', threadId)
        .single();
      if (data) {
        setThread(data);
        setVoteCount(data.likes_count || 0);
      }
      setLoading(false);
    }
    fetchThread();
  }, [threadId]);

  useEffect(() => {
    async function init() {
      const profile = await getCurrentUser();
      setCurrentUser(profile);

      if (!threadId) return;
      const { data: replyData } = await fetchReplies(threadId);
      if (replyData) {
        setReplies(replyData as unknown as Reply[]);
        setReplyCount(replyData.length);
      }
    }
    init();
  }, [threadId]);

  useEffect(() => {
    if (!threadId) return;

    const channel = supabase
      .channel('thread-replies-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'replies', filter: `thread_id=eq.${threadId}` },
        (payload) => {
          const newReply = payload.new as Reply;
          setReplies((prev) => {
            if (prev.some((r) => r.id === newReply.id)) return prev;
            return [...prev, newReply];
          });
          setReplyCount((prev) => prev + 1);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [threadId]);

  useEffect(() => {
    if (repliesListRef.current) {
      repliesListRef.current.scrollTop = repliesListRef.current.scrollHeight;
    }
  }, [replies.length]);

  const handleVote = async () => {
    if (!currentUser?.id) return;
    const result = await toggleVote(currentUser.id, 'thread', threadId, 1);
    if (result.voted) {
      setLiked(true);
      setVoteCount((prev) => prev + result.delta);
      showToast('Marked useful');
    } else {
      setLiked(false);
      setVoteCount((prev) => prev + result.delta);
      showToast('Vote removed');
    }
  };

  const handleSave = async () => {
    if (!currentUser?.id) return;
    const isSaved = await toggleSave(currentUser.id, 'thread', threadId);
    setSaved(isSaved);
    showToast(isSaved ? 'Answer saved' : 'Answer unsaved');
  };

  const handleReply = async () => {
    if (!replyText.trim() || !currentUser?.id || submitting) return;

    setSubmitting(true);
    const { data, error } = await createReply(threadId, currentUser.id, replyText.trim());
    setSubmitting(false);

    if (error) {
      showToast('Failed to post reply');
      return;
    }

    if (data) {
      const optimisticReply: Reply = {
        id: data.id,
        thread_id: data.thread_id,
        author_id: data.author_id,
        body: data.body,
        is_accepted: false,
        created_at: data.created_at,
        profiles: currentUser as any,
      };
      setReplies((prev) => [...prev, optimisticReply]);
      setReplyCount((prev) => prev + 1);
    }
    setReplyText('');
    showToast('Reply posted');
  };

  const handleAcceptAnswer = async (replyId: string) => {
    const { error } = await supabase
      .from('replies')
      .update({ is_accepted: true })
      .eq('id', replyId);

    if (error) {
      showToast('Failed to accept answer');
      return;
    }

    setReplies((prev) =>
      prev.map((r) => (r.id === replyId ? { ...r, is_accepted: true } : { ...r, is_accepted: false }))
    );
    showToast('Answer accepted');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="page-head">
          <div>
            <div className="eyebrow">Students Area</div>
            <h1 className="serif">Thread view.</h1>
          </div>
        </div>
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--muted)' }}>
          Loading thread...
        </div>
      </AppLayout>
    );
  }

  if (!thread) {
    return (
      <AppLayout>
        <div className="page-head">
          <div>
            <div className="eyebrow">Students Area</div>
            <h1 className="serif">Thread view.</h1>
          </div>
        </div>
        <Link href="/students" className="back" onClick={() => showToast('Back to Students')}>
          <ArrowLeft className="icon-sm" /> Back to Students
        </Link>
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--muted)' }}>
          Thread not found.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-head">
        <div>
          <div className="eyebrow">Students Area</div>
          <h1 className="serif">Thread view.</h1>
        </div>
      </div>

      <Link href="/students" className="back" onClick={() => showToast('Back to Students')}>
        <ArrowLeft className="icon-sm" /> Back to Students
      </Link>

      <section className="thread-head" style={{ marginTop: 16 }}>
        <div className="post-type" style={{ marginBottom: 12 }}>
          <CircleHelp className="icon-sm" /> Deep-dive inquiry
        </div>

        <h2 className="serif" style={{ fontSize: '1.1rem', margin: '0 0 8px' }}>
          {thread.title || 'Untitled thread'}
        </h2>

        <p className="thread-copy">
          {thread.body || ''}
        </p>

        <div className="tags" style={{ marginTop: 12 }}>
          {(thread.tags || []).map((tag, i) => (
            <span key={i} className="tag">#{tag}</span>
          ))}
          <span className="tag gold">{replyCount} replies</span>
        </div>

        <div className="thread-meta" style={{ marginTop: 12 }}>
          <div className="avatar">
            {thread.profiles?.full_name
              ? thread.profiles.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
              : '??'}
          </div>
          <div>
            <strong>
              {thread.profiles?.full_name || 'Anonymous'}
              {thread.profiles?.is_verified && <BadgeCheck className="icon-sm" style={{ color: 'var(--green)', verticalAlign: 'middle' }} />}
            </strong>
            <div className="meta">
              <span>{thread.created_at ? timeAgo(thread.created_at) : 'Unknown'}</span>
              <span>·</span>
              <span>{thread.profiles?.county || ''}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ marginTop: 22 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow">Guidance offers</div>
            <h2 className="serif">2 professionals willing to help.</h2>
          </div>
        </div>

        <div className="pro-list">
          {guidanceOffers.map((pro, i) => (
            <div key={i} className="pro-card">
              <div className={`avatar ${pro.color}`}>{pro.initials}</div>
              <div className="pro-copy">
                <strong>
                  {pro.name} <BadgeCheck className="icon-sm" style={{ color: 'var(--green)', verticalAlign: 'middle' }} />
                </strong>
                <p>{pro.topic}</p>
                <span>{pro.time} · {pro.badge}</span>
              </div>
              <div className="pro-actions">
                <button
                  className="follow"
                  onClick={() => showToast(`Following ${pro.name}`)}
                >
                  Follow
                </button>
                <button
                  className="primary"
                  onClick={() => showToast(`Private chat request sent to ${pro.name}`)}
                >
                  Request private chat
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ marginTop: 22 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow">Public answers</div>
            <h2 className="serif">{replyCount} answer{replyCount !== 1 ? 's' : ''}</h2>
          </div>
        </div>

        <div className="answer" ref={repliesListRef}>
          {replies.map((reply) => (
            <div key={reply.id} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
              <div className="answer-head">
                <div className="avatar earth">
                  {reply.profiles?.full_name
                    ? reply.profiles.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                    : '??'}
                </div>
                <div>
                  <strong>
                    {reply.profiles?.full_name || 'User'} {reply.profiles?.is_verified && <BadgeCheck className="icon-sm" style={{ color: 'var(--green)', verticalAlign: 'middle' }} />}
                  </strong>
                  <div className="meta">
                    <span>@{reply.profiles?.username || 'user'}</span>
                    <span>·</span>
                    <span>{new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {reply.profiles?.county && (
                      <>
                        <span>·</span>
                        <span>{reply.profiles.county}</span>
                      </>
                    )}
                  </div>
                </div>
                <button className="icon-btn" style={{ marginLeft: 'auto' }}>
                  <Ellipsis className="icon-sm" />
                </button>
              </div>

              <div className="answer-copy">
                {reply.body}
              </div>

              <div className="answer-foot">
                <button
                  className={`action ${liked ? 'active' : ''}`}
                  onClick={handleVote}
                >
                  <ThumbsUp className="icon-sm" />
                  <span>Useful {voteCount}</span>
                </button>
                <button className="action" onClick={() => showToast('Reply opened')}>
                  <MessageCircle className="icon-sm" />
                  <span>Reply</span>
                </button>
                <button className="action" onClick={handleSave}>
                  <Bookmark className="icon-sm" />
                </button>
                {currentUser?.id === reply.author_id && !reply.is_accepted && (
                  <button
                    className="action"
                    onClick={() => handleAcceptAnswer(reply.id)}
                    style={{ marginLeft: 'auto', color: 'var(--green)' }}
                  >
                    <BadgeCheck className="icon-sm" />
                    <span>Accept</span>
                  </button>
                )}
                {reply.is_accepted && (
                  <span style={{ marginLeft: 'auto', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
                    <BadgeCheck className="icon-sm" /> Accepted
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="reply-form" style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleReply()}
            style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.9rem' }}
          />
          <button
            className="primary"
            onClick={handleReply}
            disabled={!replyText.trim() || submitting}
            style={{ borderRadius: 99, width: 38, height: 38, padding: 0 }}
          >
            <Send className="icon-sm" />
          </button>
        </div>
      </section>
    </AppLayout>
  );
}

export default function ThreadPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="page" style={{ display: 'grid', gap: 16 }}>
          <div style={{ height: 40, width: '60%', borderRadius: 10, background: 'var(--surface)', animation: 'shimmer 1.5s infinite' }} />
          <div style={{ height: 200, borderRadius: 14, background: 'var(--surface)', animation: 'shimmer 1.5s infinite' }} />
        </div>
      </AppLayout>
    }>
      <ThreadPageInner />
    </Suspense>
  );
}
