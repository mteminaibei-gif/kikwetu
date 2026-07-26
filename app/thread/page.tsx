'use client';

import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, toggleVote, toggleSave, createReply, fetchReplies } from '@/lib/supabase-helpers';
import Link from 'next/link';
import {
  ArrowLeft, CircleHelp, BadgeDollarSign, ThumbsUp, MessageCircle,
  Send, Bookmark, Ellipsis, BadgeCheck, Award, Star,
  MessageCircleQuestion, Edit
} from 'lucide-react';

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

export default function ThreadPage() {
  const { showToast, user } = useApp();
  const [liked, setLiked] = useState(false);
  const [voteCount, setVoteCount] = useState(24);
  const [saved, setSaved] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [threadId] = useState('1');
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [replyCount, setReplyCount] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const channelRef = useRef<any>(null);
  const repliesListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const profile = await getCurrentUser();
      setCurrentUser(profile);

      const { data: replyData } = await fetchReplies(threadId);
      if (replyData) {
        setReplies(replyData as Reply[]);
        setReplyCount(replyData.length);
      }
    }
    init();
  }, [threadId]);

  useEffect(() => {
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
    if (!currentUser?.user_id) return;
    const result = await toggleVote(currentUser.user_id, 'thread', threadId, 1);
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
    if (!currentUser?.user_id) return;
    const isSaved = await toggleSave(currentUser.user_id, 'thread', threadId);
    setSaved(isSaved);
    showToast(isSaved ? 'Answer saved' : 'Answer unsaved');
  };

  const handleReply = async () => {
    if (!replyText.trim() || !currentUser?.user_id || submitting) return;

    setSubmitting(true);
    const { data, error } = await createReply(threadId, currentUser.user_id, replyText.trim());
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

  return (
    <AppLayout showRightSidebar={false}>
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
          How do I price a small digital service without undercutting myself?
        </h2>

        <p className="thread-copy">
          I can build simple websites and product mockups, but I keep pricing from fear.
        </p>

        <div className="tags" style={{ marginTop: 12 }}>
          <span className="tag">#TechAndStartups</span>
          <span className="tag gold">{replyCount} replies</span>
        </div>

        <div className="thread-meta" style={{ marginTop: 12 }}>
          <div className="avatar">GP</div>
          <div>
            <strong>Grid Pulse <span className="verified">✓</span></strong>
            <div className="meta">
              <span>Asked today</span>
              <span>·</span>
              <span>Nairobi</span>
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
                <div className="avatar earth">AM</div>
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
                {currentUser?.user_id === reply.author_id && !reply.is_accepted && (
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
