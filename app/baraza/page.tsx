'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import {
  Plus, Image, MessageCircleQuestion, Video, ThumbsUp,
  MessageCircle, Send, Bookmark, MoreHorizontal, Sprout,
  CircleHelp, BadgeDollarSign, Ellipsis, Filter
} from 'lucide-react';

const feedPosts = [
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
    author: { name: 'Grid Pulse', initials: 'GP', color: 'default', verified: false },
    meta: { handle: '@gridpulse', time: '1h', county: 'Nairobi' },
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

function PostCard({ post, onAction }: { post: typeof feedPosts[0]; onAction: (action: string) => void }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [voted, setVoted] = useState<number | null>(null);

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
                onClick={() => { setVoted(i); onAction('Vote recorded'); }}
                style={{
                  display: 'block', width: '100%', padding: '10px 12px', marginBottom: 6,
                  borderRadius: 10, border: voted === i ? '1px solid var(--green)' : '1px solid var(--line)',
                  background: voted === i ? 'var(--greenSoft)' : 'var(--bg)', color: 'var(--text)',
                  textAlign: 'left', position: 'relative', overflow: 'hidden', fontSize: '.78rem',
                  fontWeight: voted === i ? 700 : 400, cursor: 'pointer',
                }}
              >
                {voted !== null && (
                  <div style={{ position: 'absolute', inset: 0, width: `${opt.pct}%`, background: 'var(--greenSoft)', opacity: .4, transition: 'width .3s ease' }} />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>
                  {opt.label}
                  {voted !== null && <span style={{ float: 'right', color: 'var(--text3)' }}>{opt.pct}%</span>}
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
        <button className={`action ${liked ? 'active' : ''}`} onClick={() => { setLiked(!liked); onAction(liked ? 'Vote removed' : 'Marked useful'); }}>
          <ThumbsUp className="icon-sm" /> <span>{post.stats.likes}</span>
        </button>
        <button className="action" onClick={() => onAction('Comments opened')}>
          <MessageCircle className="icon-sm" />
          <span>{'answers' in post.stats ? `${post.stats.answers} answers` : post.stats.comments}</span>
        </button>
        <button className="action" onClick={() => onAction('Share link copied')}>
          <Send className="icon-sm" /> <span>Share</span>
        </button>
        <button className={`action ${saved ? 'saved' : ''}`} onClick={() => { setSaved(!saved); onAction(saved ? 'Removed from saved' : 'Saved'); }}>
          <Bookmark className="icon-sm" />
        </button>
        <button className="action"><Ellipsis className="icon-sm" /></button>
      </div>
    </article>
  );
}

export default function BarazaFeed() {
  const { showToast } = useApp();
  const [filter, setFilter] = useState('for-you');

  const filters = [
    { key: 'for-you', label: 'For You' },
    { key: 'following', label: 'Following' },
    { key: 'spaces', label: 'Spaces' },
    { key: 'trending', label: 'Trending' },
  ];

  return (
    <AppLayout>
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
          <button className="composer-open" onClick={() => showToast('Composer opened')}>
            Share something useful with your county...
          </button>
        </div>
        <div className="composer-actions">
          <button className="composer-action" onClick={() => showToast('Photo/video')}>
            <Image className="icon" /> Photo / video
          </button>
          <button className="composer-action" onClick={() => showToast('Ask a question')}>
            <MessageCircleQuestion className="icon" /> Ask a question
          </button>
          <button className="composer-action" onClick={() => showToast('Offer a session')}>
            <Video className="icon" /> Offer a session
          </button>
        </div>
      </section>

      <section style={{ marginTop: 14 }}>
        {feedPosts.map((post, i) => (
          <PostCard key={i} post={post} onAction={showToast} />
        ))}
      </section>
    </AppLayout>
  );
}
