'use client';

import React, { useState, useEffect } from 'react';
import AppLayout, { useApp } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import { joinSpace, checkSpaceMember } from '@/lib/supabase-helpers';
import {
  Layers3, Plus, Users, MessageCircle, Calendar,
  TrendingUp, Star, MapPin, MoreHorizontal, X,
} from 'lucide-react';

const MOCK_JOINED = [
  {
    id: 'mock-j1',
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
    id: 'mock-j2',
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
    id: 'mock-j3',
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
    id: 'mock-s1',
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
    id: 'mock-s2',
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
    id: 'mock-s3',
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
  const { user, showToast } = useApp();
  const [filter, setFilter] = useState('All');
  const [joinedSpaces, setJoinedSpaces] = useState(MOCK_JOINED);
  const [suggestedSpaces, setSuggestedSpaces] = useState(MOCK_SUGGESTED);
  const [loading, setLoading] = useState(true);
  const [memberStatus, setMemberStatus] = useState<Record<string, boolean>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIcon, setNewIcon] = useState('🏘️');

  useEffect(() => {
    async function init() {
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
          id: row.id,
          icon: row.icon || '🏘️',
          name: row.name,
          members: row.members_count ? `${(row.members_count / 1000).toFixed(1)}k` : '0',
          membersCount: row.members_count || 0,
          posts: row.posts_count ? `${(row.posts_count / 1000).toFixed(1)}k` : '0',
          description: row.description || '',
          tags: row.tags || [],
          location: row.location || 'Kenya-wide',
          activity: row.activity || '0 posts today',
          rating: row.rating,
        }));

        setJoinedSpaces(all.slice(0, 3));
        setSuggestedSpaces(all.slice(3));

        if (user) {
          const status: Record<string, boolean> = {};
          await Promise.all(
            all.map(async (s: any) => {
              if (s.id) {
                status[s.id] = await checkSpaceMember(s.id, user.user_id);
              }
            })
          );
          setMemberStatus(status);
        }
      }

      setLoading(false);
    }

    init();
  }, []);

  async function handleJoinToggle(space: any) {
    if (!user) {
      showToast('Please log in to join spaces');
      return;
    }
    if (!space.id) return;

    const wasMember = memberStatus[space.id] || false;
    const newStatus = await joinSpace(space.id, user.user_id);

    setMemberStatus((prev) => ({ ...prev, [space.id]: newStatus }));

    if (newStatus) {
      setJoinedSpaces((prev) => {
        if (prev.some((s) => s.id === space.id)) return prev;
        return [{ ...space, members: `${((space.membersCount + 1) / 1000).toFixed(1)}k`, membersCount: space.membersCount + 1 }, ...prev];
      });
      setSuggestedSpaces((prev) => prev.filter((s) => s.id !== space.id));
      showToast(`Joined ${space.name}`);
    } else {
      setJoinedSpaces((prev) => prev.filter((s) => s.id !== space.id));
      setSuggestedSpaces((prev) => {
        if (prev.some((s) => s.id === space.id)) return prev;
        return [...prev, { ...space, members: `${((space.membersCount - 1) / 1000).toFixed(1)}k`, membersCount: space.membersCount - 1 }];
      });
      showToast(`Left ${space.name}`);
    }
  }

  async function handleCreateSpace(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newName.trim()) return;

    const { data, error } = await supabase
      .from('spaces')
      .insert({
        name: newName.trim(),
        description: newDesc.trim(),
        icon: newIcon || '🏘️',
        created_by: user.user_id,
        members_count: 1,
      })
      .select()
      .single();

    if (error) {
      showToast('Failed to create space');
      return;
    }

    const created = {
      id: data.id,
      icon: data.icon || '🏘️',
      name: data.name,
      members: '0',
      membersCount: 1,
      posts: '0',
      description: data.description || '',
      tags: data.tags || [],
      location: data.location || 'Kenya-wide',
      activity: '0 posts today',
      rating: data.rating,
    };

    setJoinedSpaces((prev) => [created, ...prev]);
    setMemberStatus((prev) => ({ ...prev, [data.id]: true }));
    setShowCreate(false);
    setNewName('');
    setNewDesc('');
    setNewIcon('🏘️');
    showToast(`Created ${data.name}`);
  }

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
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="secondary" onClick={() => setShowCreate(true)}>
              <Plus className="icon-sm" /> Create Space
            </button>
            <button className="secondary" onClick={() => showToast('Browse all spaces')}>
              <Plus className="icon-sm" /> Join new
            </button>
          </div>
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
                <button
                  className={`follow ${memberStatus[space.id] ? 'following' : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleJoinToggle(space); }}
                >
                  {memberStatus[space.id] ? 'Joined' : 'Join'}
                </button>
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
                <button
                  className={`follow ${memberStatus[space.id] ? 'following' : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleJoinToggle(space); }}
                >
                  {memberStatus[space.id] ? 'Joined' : 'Join'}
                </button>
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

      {showCreate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'oklch(0% 0 0 / .5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowCreate(false)}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 16,
              padding: 24,
              width: '90%',
              maxWidth: 420,
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowCreate(false)}
              style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)' }}
            >
              <X className="icon-sm" />
            </button>
            <h3 className="serif" style={{ marginBottom: 16 }}>Create a Space</h3>
            <form onSubmit={handleCreateSpace}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Icon</label>
                <input
                  type="text"
                  value={newIcon}
                  onChange={(e) => setNewIcon(e.target.value)}
                  maxLength={2}
                  style={{ width: 60, fontSize: '1.2rem', textAlign: 'center', padding: '6px 8px' }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. KilimoSmart"
                  required
                  style={{ fontSize: '.85rem', width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: '.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Description</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What is this space about?"
                  style={{ fontSize: '.85rem', width: '100%' }}
                />
              </div>
              <button className="primary" type="submit" style={{ width: '100%' }}>
                Create Space
              </button>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
