'use client';

import React, { useState, useEffect } from 'react';
import AppLayout, { useApp } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import {
  Layers3, Plus, Users, MessageCircle, Calendar,
  TrendingUp, Star, MapPin, MoreHorizontal,
} from 'lucide-react';

const MOCK_JOINED = [
  {
    icon: '🌾',
    name: 'KilimoSmart',
    members: '2.8k',
    posts: '45.2k',
    description: 'Smart farming techniques and agricultural innovations for East African farmers.',
    tags: ['#Agriculture', '#ClimateSmart'],
    location: 'Nakuru',
    activity: '12 posts today',
  },
  {
    icon: '💻',
    name: 'NairobiTech',
    members: '1.5k',
    posts: '23.1k',
    description: 'Kenya\'s leading tech community discussing startups, coding, and innovation.',
    tags: ['#Tech', '#Startups'],
    location: 'Nairobi',
    activity: '8 posts today',
  },
  {
    icon: '🏥',
    name: 'Health KE',
    members: '980',
    posts: '18.7k',
    description: 'Healthcare discussions, wellness tips, and medical advice for Kenyans.',
    tags: ['#Health', '#Wellness'],
    location: 'Kenya-wide',
    activity: '5 posts today',
  },
];

const MOCK_SUGGESTED = [
  {
    icon: '🚀',
    name: 'StartupKE',
    members: '3.2k',
    posts: '67.4k',
    description: 'Building and scaling startups in Kenya — from idea to exit.',
    tags: ['#Business', '#Funding'],
    location: 'Nairobi',
    rating: 4.8,
  },
  {
    icon: '🎤',
    name: 'Sheng Life',
    members: '1.8k',
    posts: '89.3k',
    description: 'Kenyan culture, music, and lifestyle — keeping it real.',
    tags: ['#Culture', '#Sheng'],
    location: 'Nairobi',
    rating: 4.6,
  },
  {
    icon: '⚖️',
    name: 'Legal Kenya',
    members: '650',
    posts: '12.4k',
    description: 'Legal advice, rights awareness, and justice discussions.',
    tags: ['#Law', '#Rights'],
    location: 'Kenya-wide',
    rating: 4.9,
  },
];

export default function SpacesPage() {
  const { showToast } = useApp();
  const [filter, setFilter] = useState('All');
  const [joinedSpaces, setJoinedSpaces] = useState(MOCK_JOINED);
  const [suggestedSpaces, setSuggestedSpaces] = useState(MOCK_SUGGESTED);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSpaces() {
      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .order('members_count', { ascending: false })
        .limit(20);

      if (error || !data || data.length === 0) {
        setJoinedSpaces(MOCK_JOINED);
        setSuggestedSpaces(MOCK_SUGGESTED);
      } else {
        const all = data.map((row: any) => ({
          icon: row.icon || '🏘️',
          name: row.name,
          members: row.members_count ? `${(row.members_count / 1000).toFixed(1)}k` : '0',
          posts: row.posts_count ? `${(row.posts_count / 1000).toFixed(1)}k` : '0',
          description: row.description || '',
          tags: row.tags || [],
          location: row.location || 'Kenya-wide',
          activity: row.activity || '0 posts today',
          rating: row.rating,
        }));

        setJoinedSpaces(all.slice(0, 3));
        setSuggestedSpaces(all.slice(3));
      }

      setLoading(false);
    }

    fetchSpaces();
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="page-head">
          <div>
            <div className="eyebrow">Spaces</div>
            <h1 className="serif">Find where your interests meet your county.</h1>
            <p>Join communities that match what you care about — farming, tech, health, culture, and more.</p>
          </div>
        </div>

        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Your spaces</div>
              <h2 className="serif">Communities you belong to.</h2>
            </div>
          </div>
          <div className="pro-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="pro-card" style={{ opacity: 0.6, pointerEvents: 'none' }}>
                <div className="avatar green skeleton" />
                <div className="pro-copy">
                  <div style={{ background: 'var(--bgAlt)', height: 14, width: 120, borderRadius: 6, marginBottom: 8 }} />
                  <div style={{ background: 'var(--bgAlt)', height: 10, width: 240, borderRadius: 6, marginBottom: 6 }} />
                  <div style={{ background: 'var(--bgAlt)', height: 10, width: 160, borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section" style={{ marginTop: 14 }}>
          <div className="section-head">
            <div>
              <div className="eyebrow">Discover</div>
              <h2 className="serif">Suggested for you.</h2>
            </div>
          </div>
          <div className="pro-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="pro-card" style={{ opacity: 0.6, pointerEvents: 'none' }}>
                <div className="avatar skeleton" />
                <div className="pro-copy">
                  <div style={{ background: 'var(--bgAlt)', height: 14, width: 120, borderRadius: 6, marginBottom: 8 }} />
                  <div style={{ background: 'var(--bgAlt)', height: 10, width: 240, borderRadius: 6, marginBottom: 6 }} />
                  <div style={{ background: 'var(--bgAlt)', height: 10, width: 160, borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-head">
        <div>
          <div className="eyebrow">Spaces</div>
          <h1 className="serif">Find where your interests meet your county.</h1>
          <p>Join communities that match what you care about — farming, tech, health, culture, and more.</p>
        </div>
        <button className="select-pill" onClick={() => showToast('Filter options')}>
          <Layers3 className="icon-sm" /> {filter} <MoreHorizontal className="icon-sm" />
        </button>
      </div>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">Your spaces</div>
            <h2 className="serif">Communities you belong to.</h2>
          </div>
          <button className="secondary" onClick={() => showToast('Browse all spaces')}>
            <Plus className="icon-sm" /> Join new
          </button>
        </div>

        <div className="pro-list">
          {joinedSpaces.map((space, i) => (
            <div key={i} className="pro-card" onClick={() => showToast(`Opened ${space.name}`)}>
              <div className="avatar green" style={{ fontSize: '1.1rem' }}>
                {space.icon}
              </div>
              <div className="pro-copy">
                <strong>{space.name}</strong>
                <p>{space.description}</p>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Users className="icon-sm" /> {space.members}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <MessageCircle className="icon-sm" /> {space.posts}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <MapPin className="icon-sm" /> {space.location}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Calendar className="icon-sm" /> {space.activity}
                  </span>
                </span>
              </div>
              <div className="pro-actions">
                <button className="follow following">Joined</button>
              </div>
            </div>
          ))}
        </div>

        <div className="tags" style={{ marginTop: 14 }}>
          {joinedSpaces.flatMap((s) => s.tags).map((tag, i) => (
            <span key={i} className="tag">{tag}</span>
          ))}
        </div>
      </section>

      <section className="section" style={{ marginTop: 14 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow">Discover</div>
            <h2 className="serif">Suggested for you.</h2>
          </div>
        </div>

        <div className="pro-list">
          {suggestedSpaces.map((space, i) => (
            <div key={i} className="pro-card" onClick={() => showToast(`Viewing ${space.name}`)}>
              <div className="avatar" style={{ background: 'var(--goldSoft)', color: 'var(--earth)', fontSize: '1.1rem' }}>
                {space.icon}
              </div>
              <div className="pro-copy">
                <strong>{space.name}</strong>
                <p>{space.description}</p>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Users className="icon-sm" /> {space.members}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <MessageCircle className="icon-sm" /> {space.posts}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <MapPin className="icon-sm" /> {space.location}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Star className="icon-sm" /> {space.rating}
                  </span>
                </span>
              </div>
              <div className="pro-actions">
                <button className="follow" onClick={(e) => { e.stopPropagation(); showToast(`Joined ${space.name}`); }}>Join</button>
              </div>
            </div>
          ))}
        </div>

        <div className="tags" style={{ marginTop: 14 }}>
          {suggestedSpaces.flatMap((s) => s.tags).map((tag, i) => (
            <span key={i} className="tag gold">{tag}</span>
          ))}
        </div>
      </section>

      <section className="section" style={{ marginTop: 14 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow">Trending</div>
            <h2 className="serif">Hot spaces this week.</h2>
          </div>
        </div>

        <div className="pro-list">
          {[
            { icon: '💡', name: 'InnoKE', members: '5.1k', posts: '34.2k', desc: 'Innovation and invention community in Kenya.', location: 'Nairobi', rating: 4.7 },
            { icon: '🎯', name: 'Jobs Kenya', members: '4.3k', posts: '28.9k', desc: 'Job listings, CV tips, and career advice.', location: 'Kenya-wide', rating: 4.5 },
            { icon: '🏋️', name: 'FitKE', members: '2.9k', posts: '15.6k', desc: 'Fitness, nutrition, and wellness for Kenyans.', location: 'Nairobi', rating: 4.8 },
          ].map((space, i) => (
            <div key={i} className="pro-card" onClick={() => showToast(`Viewing ${space.name}`)}>
              <div className="avatar" style={{ background: 'var(--earthSoft)', color: 'var(--earth)', fontSize: '1.1rem' }}>
                {space.icon}
              </div>
              <div className="pro-copy">
                <strong>{space.name}</strong>
                <p>{space.desc}</p>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Users className="icon-sm" /> {space.members}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <MessageCircle className="icon-sm" /> {space.posts}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <MapPin className="icon-sm" /> {space.location}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Star className="icon-sm" /> {space.rating}
                  </span>
                </span>
              </div>
              <div className="pro-actions">
                <button className="follow" onClick={(e) => { e.stopPropagation(); showToast(`Joined ${space.name}`); }}>Join</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section tip" style={{ marginTop: 14 }}>
        <h3>Community guidelines</h3>
        <p>Respect others, share knowledge, and keep conversations constructive. Spaces are moderated by the community — report any misuse.</p>
        <button onClick={() => showToast('Full guidelines opened')}>
          <TrendingUp className="icon-sm" /> Read full guidelines
        </button>
      </section>
    </AppLayout>
  );
}
