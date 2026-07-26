'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import Link from 'next/link';
import {
  ArrowLeft, CircleHelp, BadgeDollarSign, ThumbsUp, MessageCircle,
  Send, Bookmark, Ellipsis, BadgeCheck, Award, Star,
  MessageCircleQuestion, Edit
} from 'lucide-react';

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
  const { showToast } = useApp();
  const [liked, setLiked] = useState(false);

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
          <span className="tag gold">2 offers</span>
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
            <h2 className="serif">1 answer</h2>
          </div>
        </div>

        <div className="answer">
          <div className="answer-head">
            <div className="avatar earth">AM</div>
            <div>
              <strong>
                Amina Muthoni <BadgeCheck className="icon-sm" style={{ color: 'var(--green)', verticalAlign: 'middle' }} />
              </strong>
              <div className="meta">
                <span>@aminam</span>
                <span>·</span>
                <span>38m</span>
                <span>·</span>
                <span>Kiambu</span>
              </div>
            </div>
            <button className="icon-btn" style={{ marginLeft: 'auto' }}>
              <Ellipsis className="icon-sm" />
            </button>
          </div>

          <div className="answer-copy">
            Price the outcome and the boundary, not just the hours. Tell the client what changes for them after the work is done, and what stays out of scope. A simple website that helps a shop get found online has a different value than one that just looks nice.
          </div>

          <div className="answer-foot">
            <button
              className={`action ${liked ? 'active' : ''}`}
              onClick={() => {
                setLiked(!liked);
                showToast(liked ? 'Vote removed' : 'Marked useful');
              }}
            >
              <ThumbsUp className="icon-sm" />
              <span>Useful {liked ? 25 : 24}</span>
            </button>
            <button className="action" onClick={() => showToast('Reply opened')}>
              <MessageCircle className="icon-sm" />
              <span>Reply</span>
            </button>
            <button className="action" onClick={() => showToast('Answer saved')}>
              <Bookmark className="icon-sm" />
            </button>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
