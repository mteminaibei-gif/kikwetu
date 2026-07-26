'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import {
  Plus, Image, MessageCircleQuestion, Video, ThumbsUp,
  MessageCircle, Send, Bookmark, MoreHorizontal, Sprout,
  CircleHelp, BadgeDollarSign, Ellipsis, Filter
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

function threadToPost(thread: Thread) {
  const profile = thread.profiles;
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';
  const type = thread.type === 'question' ? 'question' : 'post';

  const base = {
    type,
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

function PostCard({ post, onAction }: { post: PostType; onAction: (action: string) => void }) {
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

export default function BarazaFeed() {
  const { showToast } = useApp();
  const [filter, setFilter] = useState('for-you');
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostType[]>(feedPosts as PostType[]);

  const filters = [
    { key: 'for-you', label: 'For You' },
    { key: 'following', label: 'Following' },
    { key: 'spaces', label: 'Spaces' },
    { key: 'trending', label: 'Trending' },
  ];

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const { data, error } = await supabase
          .from('threads')
          .select('*')
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
        {loading ? (
          <>
            <FeedSkeleton />
            <FeedSkeleton />
            <FeedSkeleton />
          </>
        ) : posts.map((post, i) => (
          <PostCard key={i} post={post} onAction={showToast} />
        ))}
      </section>
    </AppLayout>
  );
}
