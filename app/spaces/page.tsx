'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout, { useApp } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import { joinSpace, checkSpaceMember } from '@/lib/supabase-helpers';
import {
  Layers3, Plus, Users, MessageCircle, Calendar,
  TrendingUp, Star, MapPin, MoreHorizontal, X,
} from 'lucide-react';
import Link from 'next/link';

interface SpaceRow {
  id: string;
  icon: string;
  name: string;
  members: string;
  membersCount: number;
  posts: string;
  description: string;
  tags: string[];
  location: string;
  activity: string;
  rating?: number;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function mapSpace(row: any): SpaceRow {
  return {
    id: row.id,
    icon: row.icon || '🏘️',
    name: row.name,
    members: formatCount(row.members_count || 0),
    membersCount: row.members_count || 0,
    posts: '—',
    description: row.description || '',
    tags: row.tags || [],
    location: 'Kenya-wide',
    activity: '',
    rating: row.rating,
  };
}

export default function SpacesPage() {
  const { user, showToast } = useApp();
  const [filter, setFilter] = useState('All');
  const [joinedSpaces, setJoinedSpaces] = useState<SpaceRow[]>([]);
  const [suggestedSpaces, setSuggestedSpaces] = useState<SpaceRow[]>([]);
  const [trendingSpaces, setTrendingSpaces] = useState<SpaceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberStatus, setMemberStatus] = useState<Record<string, boolean>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIcon, setNewIcon] = useState('🏘️');

  const loadSpaces = useCallback(async () => {
    const { data, error } = await supabase
      .from('spaces')
      .select('*')
      .order('members_count', { ascending: false })
      .limit(30);

    if (error || !data) {
      setJoinedSpaces([]);
      setSuggestedSpaces([]);
      setTrendingSpaces([]);
      setLoading(false);
      return;
    }

    const all = data.map(mapSpace);
    const status: Record<string, boolean> = {};

    if (user?.id) {
      await Promise.all(
        all.map(async (s) => {
          status[s.id] = await checkSpaceMember(s.id, user.id);
        })
      );
      setMemberStatus(status);
      setJoinedSpaces(all.filter((s) => status[s.id]));
      setSuggestedSpaces(all.filter((s) => !status[s.id]).slice(0, 8));
    } else {
      setJoinedSpaces([]);
      setSuggestedSpaces(all.slice(0, 8));
    }

    setTrendingSpaces([...all].sort((a, b) => b.membersCount - a.membersCount).slice(0, 6));
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void loadSpaces();

    const channel = supabase
      .channel('spaces-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spaces' }, () => {
        void loadSpaces();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'space_members' }, () => {
        void loadSpaces();
      })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [loadSpaces]);

  async function handleJoinToggle(space: SpaceRow) {
    if (!user?.id) {
      showToast('Please log in to join spaces');
      return;
    }
    if (!space.id) return;

    const newStatus = await joinSpace(space.id, user.id);
    setMemberStatus((prev) => ({ ...prev, [space.id]: newStatus }));

    if (newStatus) {
      setJoinedSpaces((prev) => {
        if (prev.some((s) => s.id === space.id)) return prev;
        return [{ ...space, membersCount: space.membersCount + 1, members: formatCount(space.membersCount + 1) }, ...prev];
      });
      setSuggestedSpaces((prev) => prev.filter((s) => s.id !== space.id));
      showToast(`Joined ${space.name}`);
    } else {
      setJoinedSpaces((prev) => prev.filter((s) => s.id !== space.id));
      setSuggestedSpaces((prev) => {
        if (prev.some((s) => s.id === space.id)) return prev;
        return [...prev, { ...space, membersCount: Math.max(0, space.membersCount - 1), members: formatCount(Math.max(0, space.membersCount - 1)) }];
      });
      showToast(`Left ${space.name}`);
    }
  }

  async function handleCreateSpace(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id || !newName.trim()) return;

    const { data, error } = await supabase
      .from('spaces')
      .insert({
        name: newName.trim(),
        description: newDesc.trim(),
        icon: newIcon || '🏘️',
        created_by: user.id,
        members_count: 1,
      })
      .select()
      .single();

    if (error || !data) {
      showToast(error?.message || 'Failed to create space');
      return;
    }

    await supabase.from('space_members').insert({ space_id: data.id, user_id: user.id });

    const created = mapSpace(data);
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
          <div className="pro-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-hover" style={{ opacity: 0.6, pointerEvents: 'none' }}>
                <div className="avatar green skeleton" />
                <div className="pro-copy">
                  <div style={{ background: 'var(--surface2)', height: 14, width: 120, borderRadius: 6, marginBottom: 8 }} />
                  <div style={{ background: 'var(--surface2)', height: 10, width: 240, borderRadius: 6, marginBottom: 6 }} />
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
        <button className="select-pill" onClick={() => setFilter(filter === 'All' ? 'Joined' : 'All')}>
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
          </div>
        </div>

        {joinedSpaces.length === 0 ? (
          <div className="empty" style={{ padding: 24 }}>
            <p>You have not joined any spaces yet. Discover some below.</p>
          </div>
        ) : (
          <div className="pro-list">
            {joinedSpaces.map((space) => (
              <Link key={space.id} href={`/spaces/${space.id}`} className="card-hover pro-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="avatar green" style={{ fontSize: '1.1rem' }}>{space.icon}</div>
                <div className="pro-copy">
                  <strong>{space.name}</strong>
                  <p>{space.description}</p>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <Users className="icon-sm" /> {space.members}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <MapPin className="icon-sm" /> {space.location}
                    </span>
                  </span>
                </div>
                <div className="pro-actions">
                  <button
                    className="follow following"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); void handleJoinToggle(space); }}
                  >
                    Joined
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="section" style={{ marginTop: 14 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow">Discover</div>
            <h2 className="serif">Suggested for you.</h2>
          </div>
        </div>

        {suggestedSpaces.length === 0 ? (
          <div className="empty" style={{ padding: 24 }}>
            <p>No more spaces to suggest. Create one!</p>
          </div>
        ) : (
          <div className="pro-list">
            {suggestedSpaces.map((space) => (
              <div key={space.id} className="card-hover pro-card">
                <div className="avatar" style={{ background: 'var(--goldSoft)', color: 'var(--earth)', fontSize: '1.1rem' }}>{space.icon}</div>
                <div className="pro-copy">
                  <strong>{space.name}</strong>
                  <p>{space.description}</p>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <Users className="icon-sm" /> {space.members}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <MapPin className="icon-sm" /> {space.location}
                    </span>
                  </span>
                </div>
                <div className="pro-actions">
                  <button
                    className="follow"
                    onClick={() => void handleJoinToggle(space)}
                  >
                    Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section" style={{ marginTop: 14 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow">Trending</div>
            <h2 className="serif">Hot spaces this week.</h2>
          </div>
        </div>
        <div className="pro-list">
          {trendingSpaces.map((space) => (
            <div key={space.id} className="card-hover pro-card">
              <div className="avatar" style={{ background: 'var(--earthSoft)', color: 'var(--earth)', fontSize: '1.1rem' }}>{space.icon}</div>
              <div className="pro-copy">
                <strong>{space.name}</strong>
                <p>{space.description}</p>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Users className="icon-sm" /> {space.members}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <TrendingUp className="icon-sm" /> trending
                  </span>
                </span>
              </div>
              <div className="pro-actions">
                <button
                  className={`follow ${memberStatus[space.id] ? 'following' : ''}`}
                  onClick={() => void handleJoinToggle(space)}
                >
                  {memberStatus[space.id] ? 'Joined' : 'Join'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section tip" style={{ marginTop: 14 }}>
        <h3>Community guidelines</h3>
        <p>Respect others, share knowledge, and keep conversations constructive. Spaces are moderated by the community — report any misuse.</p>
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
              style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}
            >
              <X className="icon-sm" />
            </button>
            <h3 className="serif" style={{ marginBottom: 16 }}>Create a Space</h3>
            <form onSubmit={(e) => void handleCreateSpace(e)}>
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
