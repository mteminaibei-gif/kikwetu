'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import {
  Plus, Image, MessageCircleQuestion, Video, ThumbsUp,
  MessageCircle, Send, Bookmark, MoreHorizontal, MapPin,
  Sprout, CircleHelp, BadgeDollarSign, Ellipsis
} from 'lucide-react';

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
            <GraduationCap className="icon-sm" /> Open Students Area
          </button>
          <button onClick={() => showToast('Ask the community')}>
            <Plus className="icon-sm" /> Ask the community
          </button>
        </div>
      </div>
    </section>
  );
}

function Composer() {
  const { showToast } = useApp();

  return (
    <section className="composer">
      <div className="composer-top">
        <div className="avatar">GP</div>
        <button className="composer-open" onClick={() => showToast('Composer opened')}>
          Share something useful with your county...
        </button>
      </div>
      <div className="composer-actions">
        <button className="composer-action" onClick={() => showToast('Photo/video composer')}>
          <Image className="icon" /> Photo / video
        </button>
        <button className="composer-action" onClick={() => showToast('Question composer')}>
          <MessageCircleQuestion className="icon" /> Ask a question
        </button>
        <button className="composer-action" onClick={() => showToast('Session offer')}>
          <Video className="icon" /> Offer a session
        </button>
      </div>
    </section>
  );
}

function FeedPost() {
  const [liked, setLiked] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const { showToast } = useApp();

  return (
    <article className="post">
      <div className="post-head">
        <div className="avatar earth">AM</div>
        <div className="author">
          <strong>Amina Muthoni <span className="verified">✓</span></strong>
          <div className="meta">
            <span>@aminam</span>
            <span>·</span>
            <span>38m</span>
            <span>·</span>
            <span>Kiambu</span>
          </div>
        </div>
        <button className="icon-btn post-menu"><Ellipsis className="icon" /></button>
      </div>
      <div className="post-body">
        <div className="post-type"><Sprout className="icon-sm" /> Baraza post</div>
        <h3>What are you planting before the short rains?</h3>
        <p>I am trialling sukuma wiki in grow bags this season. The first batch is holding up nicely on a small balcony in Ruiru.</p>
        <div className="translation">
          <strong>Read in Kiswahili</strong>
          <span> · &ldquo;Unapanda nini kabla ya mvua fupi?&rdquo;</span>
        </div>
        <div className="tags">
          <span className="tag">#KilimoSmart</span>
          <span className="tag">#Kiambu</span>
        </div>
      </div>
      <div className="post-actions">
        <button className={`action ${liked ? 'active' : ''}`} onClick={() => { setLiked(!liked); showToast(liked ? 'Vote removed' : 'Marked useful'); }}>
          <ThumbsUp className="icon-sm" /> <span>48</span>
        </button>
        <button className="action" onClick={() => showToast('Comments opened')}>
          <MessageCircle className="icon-sm" /> <span>12</span>
        </button>
        <button className="action" onClick={() => showToast('Share link copied')}>
          <Send className="icon-sm" /> <span>Share</span>
        </button>
        <button className={`action ${saved ? 'saved' : ''}`} onClick={() => { setSaved(!saved); showToast(saved ? 'Removed from saved' : 'Saved to your Kikwetu'); }}>
          <Bookmark className="icon-sm" />
        </button>
        <button className="action"><Ellipsis className="icon-sm" /></button>
      </div>
    </article>
  );
}

function FeedQuestion() {
  const { showToast } = useApp();

  return (
    <article className="section" onClick={() => showToast('Thread opened')} style={{ cursor: 'pointer' }}>
      <div className="post-type"><CircleHelp className="icon-sm" /> Deep-dive inquiry</div>
      <div className="question-box">
        <h4>What should a small business check before going solar?</h4>
        <p>Looking for practical advice from someone who has sized a system for a shop or workshop in Nakuru.</p>
        <span className="bounty"><BadgeDollarSign className="icon-sm" /> 120 tokens bounty</span>
      </div>
      <div className="tags">
        <span className="tag">#NakuruTech</span>
        <span className="tag gold">#Biashara</span>
      </div>
      <div className="post-actions">
        <button className="action"><ThumbsUp className="icon-sm" /> <span>31</span></button>
        <button className="action"><MessageCircleQuestion className="icon-sm" /> <span>8 answers</span></button>
        <button className="action"><Send className="icon-sm" /> <span>Share</span></button>
      </div>
    </article>
  );
}

function FeedPoll() {
  const [voted, setVoted] = React.useState<number | null>(null);
  const { showToast } = useApp();

  const options = [
    { label: 'Yes, definitely', pct: 62 },
    { label: 'Maybe, need more info', pct: 24 },
    { label: 'No, not relevant', pct: 14 },
  ];

  return (
    <article className="section">
      <div className="post-head">
        <div className="avatar green">NW</div>
        <div className="author">
          <strong>Njeri Wambui <span className="verified">✓</span></strong>
          <div className="meta">
            <span>@njeri_w</span>
            <span>·</span>
            <span>1h</span>
            <span>·</span>
            <span>Nairobi</span>
          </div>
        </div>
        <button className="icon-btn post-menu"><Ellipsis className="icon" /></button>
      </div>
      <div className="post-body">
        <div className="post-type"><Sprout className="icon-sm" /> Community poll</div>
        <h3>Should we organize a community seed swap before the rains?</h3>
        <div style={{ marginTop: 12 }}>
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => { setVoted(i); showToast('Vote recorded'); }}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 12px',
                marginBottom: 6,
                borderRadius: 10,
                border: voted === i ? '1px solid var(--green)' : '1px solid var(--line)',
                background: voted === i ? 'var(--greenSoft)' : 'var(--bg)',
                color: 'var(--text)',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
                fontSize: '.78rem',
                fontWeight: voted === i ? 700 : 400,
              }}
            >
              {voted !== null && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  width: `${opt.pct}%`,
                  background: 'var(--greenSoft)',
                  opacity: .4,
                  transition: 'width .3s ease',
                }} />
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>
                {opt.label}
                {voted !== null && <span style={{ float: 'right', color: 'var(--text3)' }}>{opt.pct}%</span>}
              </span>
            </button>
          ))}
        </div>
        <div className="tags" style={{ marginTop: 10 }}>
          <span className="tag">#KilimoSmart</span>
          <span className="tag gold">#Nairobi</span>
        </div>
      </div>
      <div className="post-actions">
        <button className="action"><ThumbsUp className="icon-sm" /> <span>24</span></button>
        <button className="action"><MessageCircle className="icon-sm" /> <span>8</span></button>
        <button className="action"><Send className="icon-sm" /> <span>Share</span></button>
      </div>
    </article>
  );
}

function FeedAudio() {
  const { showToast } = useApp();

  return (
    <article className="section">
      <div className="post-head">
        <div className="avatar blue">JO</div>
        <div className="author">
          <strong>James Otieno <span className="verified">✓</span></strong>
          <div className="meta">
            <span>@james_o</span>
            <span>·</span>
            <span>2h</span>
            <span>·</span>
            <span>Kisumu</span>
          </div>
        </div>
        <button className="icon-btn post-menu"><Ellipsis className="icon" /></button>
      </div>
      <div className="post-body">
        <div className="post-type"><Sprout className="icon-sm" /> Audio note</div>
        <h3>Quick tip: how to clean your solar panels during the dry season</h3>
        <div style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 12,
          background: 'var(--surface2)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <button
            onClick={() => showToast('Playing audio')}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--green)',
              color: 'var(--surface)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Video className="icon-sm" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ height: 4, borderRadius: 99, background: 'var(--line2)', overflow: 'hidden' }}>
              <div style={{ width: '35%', height: '100%', background: 'var(--green)', borderRadius: 99 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '.62rem', color: 'var(--text3)' }}>
              <span>1:24</span>
              <span>3:58</span>
            </div>
          </div>
        </div>
        <div className="tags" style={{ marginTop: 10 }}>
          <span className="tag">#KilimoSmart</span>
          <span className="tag">#SolarKE</span>
        </div>
      </div>
      <div className="post-actions">
        <button className="action"><ThumbsUp className="icon-sm" /> <span>56</span></button>
        <button className="action"><MessageCircle className="icon-sm" /> <span>14</span></button>
        <button className="action"><Send className="icon-sm" /> <span>Share</span></button>
      </div>
    </article>
  );
}

function RightSidebar() {
  const { showToast } = useApp();

  return (
    <aside className="right-sidebar">
      <div className="right-block">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <TrendingUp className="icon" style={{ color: 'var(--gold)' }} />
          <h3>Trending in Kenya</h3>
        </div>
        <div className="right-list">
          {['#KilimoSmart', '#NairobiTech', '#ShengLife', '#HealthKE', '#StartupKE'].map((tag, i) => (
            <div key={i} className="right-item" style={{ cursor: 'pointer' }} onClick={() => showToast(`Viewing ${tag}`)}>
              <div className="right-copy">
                <strong style={{ color: 'var(--green)' }}>{tag}</strong>
                <span>{(12.4 - i * 1.5).toFixed(1)}k posts</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="right-block">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--red)', animation: 'pulse 1.5s infinite' }} />
          <h3>Live Audio Baraza</h3>
          <button className="icon-btn" style={{ marginLeft: 'auto', width: 28, height: 28 }}>
            <MoreHorizontal className="icon-sm" />
          </button>
        </div>
        <div className="tip">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Volume2 className="icon-sm" style={{ color: 'var(--earth)' }} />
            <span style={{ fontSize: '.68rem', color: 'var(--text3)' }}>Mie Audio</span>
          </div>
          <p>Tech-tomasa live video to livestream conversations</p>
          <button style={{ marginTop: 8 }} onClick={() => showToast('Joining live audio')}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
            {' '}Live Audio
          </button>
        </div>
      </div>

      <div className="right-block">
        <h3>Suggested Spaces</h3>
        <div className="right-list">
          {[
            { name: 'KilimoSmart', desc: 'Farming tips & climate smart agriculture', icon: '🌾', members: '2.8k' },
            { name: 'NairobiTech', desc: 'Tech community in Nairobi', icon: '💻', members: '1.5k' },
          ].map((space, i) => (
            <div key={i} className="right-item">
              <div className="avatar" style={{ background: i === 0 ? 'var(--greenSoft)' : 'var(--blueSoft)', color: i === 0 ? 'var(--green)' : 'var(--blue)', fontSize: '1rem' }}>
                {space.icon}
              </div>
              <div className="right-copy">
                <strong>{space.name}</strong>
                <span>{space.members} members</span>
              </div>
              <button className="follow" onClick={() => showToast(`Joined ${space.name}`)}>Join</button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function GraduationCap(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
      <path d="M22 10v6"/>
      <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
    </svg>
  );
}

function TrendingUp(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </svg>
  );
}

function Volume2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
  );
}

export default function Home() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <AppLayout>
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
      <Composer />

      <section style={{ marginTop: 14 }}>
        <FeedPost />
        <FeedQuestion />
        <FeedPoll />
        <FeedAudio />
      </section>
    </AppLayout>
  );
}
