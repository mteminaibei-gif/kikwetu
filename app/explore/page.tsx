'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import {
  Search, TrendingUp, CircleHelp, BadgeDollarSign, Users, Tag,
  MapPin, Sprout, MessageCircle, ThumbsUp, Send, Ellipsis, BadgeCheck
} from 'lucide-react';

const topics = [
  { label: 'All', color: 'var(--greenSoft)', textColor: 'var(--green)' },
  { label: 'People', color: 'var(--blueSoft)', textColor: 'var(--blue)' },
  { label: 'Questions', color: 'var(--goldSoft)', textColor: 'var(--earth)' },
  { label: 'Spaces', color: 'var(--greenSoft)', textColor: 'var(--green)' },
  { label: 'Counties', color: 'var(--earthSoft)', textColor: 'var(--earth)' },
];

const trendingTopics = [
  { tag: '#KilimoSmart', posts: '12.4k', desc: 'Farming tips for the short rains' },
  { tag: '#NairobiTech', posts: '8.2k', desc: 'Tech community events and jobs' },
  { tag: '#ShengLife', posts: '6.1k', desc: 'Sheng language and culture' },
  { tag: '#HealthKE', posts: '4.8k', desc: 'Health tips and wellness' },
  { tag: '#StartupKE', posts: '3.5k', desc: 'Startup stories and funding' },
];

const countyTopics = [
  { name: 'Nairobi', icon: '🏙️', members: '45k' },
  { name: 'Mombasa', icon: '🌊', members: '12k' },
  { name: 'Kisumu', icon: '🐟', members: '8k' },
  { name: 'Nakuru', icon: '🌾', members: '6k' },
  { name: 'Eldoret', icon: '🏔️', members: '5k' },
];

export default function ExplorePage() {
  const { showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('solar for small business');
  const [activeTopic, setActiveTopic] = useState('All');

  return (
    <AppLayout>
      <div className="page-head">
        <div>
          <div className="eyebrow">Search</div>
          <h1 className="serif">Find the useful thread.</h1>
          <p>Search people, spaces, counties, questions, and local knowledge.</p>
        </div>
      </div>

      <section className="section">
        <div className="search" style={{ width: '100%', background: 'var(--bg)' }}>
          <Search className="icon-sm" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Kikwetu"
            onKeyDown={(e) => e.key === 'Enter' && showToast(`Searching for "${searchQuery}"`)}
          />
        </div>
        <div className="tags" style={{ marginTop: 12 }}>
          {topics.map((t) => (
            <button
              key={t.label}
              className="tag"
              onClick={() => { setActiveTopic(t.label); showToast(`Filtering by ${t.label}`); }}
              style={{
                background: activeTopic === t.label ? t.color : undefined,
                color: activeTopic === t.label ? t.textColor : undefined,
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <div className="grid2" style={{ marginTop: 14 }}>
        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Results</div>
              <h2 className="serif">3 useful matches.</h2>
            </div>
          </div>

          <article className="section" style={{ cursor: 'pointer' }} onClick={() => showToast('Thread opened')}>
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
              <button className="action"><CircleHelp className="icon-sm" /> <span>8 answers</span></button>
              <button className="action"><Send className="icon-sm" /> <span>Share</span></button>
            </div>
          </article>

          <div className="pro-card" style={{ marginTop: 14 }}>
            <div className="avatar blue">JO</div>
            <div className="pro-copy">
              <strong>James Otieno <span className="verified">✓</span></strong>
              <p>Solar systems for small businesses</p>
              <span>Approved professional · private sessions · 4.9 rating</span>
            </div>
            <div className="pro-actions">
              <button className="follow">Follow</button>
              <button className="primary" onClick={() => showToast('Request sent')}>Request consult</button>
            </div>
          </div>
        </section>

        <div>
          <section className="section">
            <div className="section-head">
              <div>
                <div className="eyebrow">Trending topics</div>
                <h2 className="serif">What Kenya follows.</h2>
              </div>
            </div>
            <div className="right-list">
              {trendingTopics.map((t, i) => (
                <div key={i} className="right-item" style={{ cursor: 'pointer' }} onClick={() => showToast(`Viewing ${t.tag}`)}>
                  <div className="right-copy">
                    <strong style={{ color: 'var(--green)' }}>{t.tag}</strong>
                    <span>{t.desc}</span>
                    <span>{t.posts} posts</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="section" style={{ marginTop: 14 }}>
            <div className="section-head">
              <div>
                <div className="eyebrow">Counties</div>
                <h2 className="serif">Find your people.</h2>
              </div>
            </div>
            <div className="right-list">
              {countyTopics.map((c, i) => (
                <div key={i} className="right-item" style={{ cursor: 'pointer' }} onClick={() => showToast(`Viewing ${c.name}`)}>
                  <div className="avatar" style={{ background: 'var(--greenSoft)', color: 'var(--green)', fontSize: '1.1rem' }}>
                    {c.icon}
                  </div>
                  <div className="right-copy">
                    <strong>{c.name}</strong>
                    <span>{c.members} members</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
