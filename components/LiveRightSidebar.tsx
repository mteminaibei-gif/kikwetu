'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/components/AppLayout';
import AdBanner from '@/components/AdBanner';
import {
  TrendingUp, MoreHorizontal, Volume2, Users,
} from 'lucide-react';

const FALLBACK_COLORS = ['var(--green)', 'var(--blue)', 'var(--earth)', 'var(--red)', 'var(--gold)'];
const FALLBACK_SOFT = ['var(--greenSoft)', 'var(--blueSoft)', 'var(--earthSoft)', 'var(--redSoft)', 'var(--goldSoft)'];

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n || 0);
}

interface LiveRightSidebarProps {
  pathname: string;
}

export default function LiveRightSidebar({ pathname }: LiveRightSidebarProps) {
  const { showToast, user } = useApp();

  const [trending, setTrending] = useState<{ tag: string; posts: string; color: string }[]>([]);
  const [liveRooms, setLiveRooms] = useState<{ id: string; title: string; host: string; listeners: number; live: boolean }[]>([]);
  const [spaces, setSpaces] = useState<{ id: string; name: string; emoji: string; members: string; color: string; textColor: string }[]>([]);
  const [people, setPeople] = useState<{ id: string; name: string; initials: string; bio: string; color: string; textColor: string }[]>([]);
  const [listings, setListings] = useState<{ id: string; title: string; price: string; location: string; emoji: string }[]>([]);

  const isHome = pathname === '/';
  const isBaraza = pathname === '/baraza';
  const isExplore = pathname === '/explore';
  const isSpaces = pathname === '/spaces' || pathname.startsWith('/spaces/');
  const isStudents = pathname === '/students';
  const isProfessionals = pathname === '/professionals';
  const isQuizzes = pathname === '/quizzes';
  const isMtaa = pathname === '/mtaa';
  const isNyumbaKumi = pathname === '/nyumba-kumi';
  const isRadio = pathname === '/radio';
  const isProfile = pathname === '/profile';

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Trending tags from recent threads
      const { data: threads } = await supabase
        .from('threads')
        .select('tags')
        .order('created_at', { ascending: false })
        .limit(100);
      if (!cancelled && threads) {
        const counts: Record<string, number> = {};
        threads.forEach((t: any) => {
          (t.tags || []).forEach((tag: string) => {
            const key = tag.startsWith('#') ? tag : `#${tag}`;
            counts[key] = (counts[key] || 0) + 1;
          });
        });
        const ranked = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 7)
          .map(([tag, n], i) => ({
            tag,
            posts: formatCount(n),
            color: FALLBACK_COLORS[i % FALLBACK_COLORS.length],
          }));
        setTrending(ranked);
      }

      // Live rooms
      const { data: rooms } = await supabase
        .from('live_rooms')
        .select('id, title, is_live, listeners_count, host_id, profiles:host_id(full_name)')
        .order('is_live', { ascending: false })
        .order('listeners_count', { ascending: false })
        .limit(5);
      if (!cancelled && rooms) {
        setLiveRooms(
          rooms.map((r: any) => ({
            id: r.id,
            title: r.title,
            host: r.profiles?.full_name || 'Host',
            listeners: r.listeners_count || 0,
            live: !!r.is_live,
          }))
        );
      }

      // Spaces
      const { data: spaceRows } = await supabase
        .from('spaces')
        .select('id, name, icon, members_count, color')
        .order('members_count', { ascending: false })
        .limit(5);
      if (!cancelled && spaceRows) {
        setSpaces(
          spaceRows.map((s: any, i: number) => ({
            id: s.id,
            name: s.name,
            emoji: s.icon || '🏘️',
            members: formatCount(s.members_count || 0),
            color: s.color || FALLBACK_SOFT[i % FALLBACK_SOFT.length],
            textColor: FALLBACK_COLORS[i % FALLBACK_COLORS.length],
          }))
        );
      }

      // People (recent profiles, exclude self)
      let peopleQuery = supabase
        .from('profiles')
        .select('id, full_name, username, bio, county, role')
        .order('created_at', { ascending: false })
        .limit(8);
      if (user?.id) peopleQuery = peopleQuery.neq('id', user.id);
      const { data: profiles } = await peopleQuery;
      if (!cancelled && profiles) {
        setPeople(
          profiles.slice(0, 5).map((p: any, i: number) => {
            const name = p.full_name || p.username || 'Member';
            const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
            return {
              id: p.id,
              name,
              initials,
              bio: p.bio || (p.county ? `${p.role || 'Member'} · ${p.county}` : p.role || 'Member'),
              color: FALLBACK_SOFT[i % FALLBACK_SOFT.length],
              textColor: FALLBACK_COLORS[i % FALLBACK_COLORS.length],
            };
          })
        );
      }

      // Marketplace listings
      const { data: listingRows } = await supabase
        .from('marketplace_listings')
        .select('id, title, price, location, category')
        .eq('is_available', true)
        .order('created_at', { ascending: false })
        .limit(3);
      if (!cancelled && listingRows) {
        const emojiMap: Record<string, string> = {
          food: '🥬', produce: '🥬', services: '☀️', crafts: '🧺', electronics: '📱', default: '🛒',
        };
        setListings(
          listingRows.map((l: any) => ({
            id: l.id,
            title: l.title,
            price: `KES ${Number(l.price || 0).toLocaleString()}`,
            location: l.location || 'Kenya',
            emoji: emojiMap[(l.category || '').toLowerCase()] || emojiMap.default,
          }))
        );
      }
    }

    void load();

    const channel = supabase
      .channel('right-sidebar-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spaces' }, () => { void load(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_rooms' }, () => { void load(); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'threads' }, () => { void load(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketplace_listings' }, () => { void load(); })
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return (
    <aside className="right-sidebar">
      {(isHome || isBaraza || isExplore || isProfile) && (
        <div className="right-block">
          <div className="right-block-head">
            <div className="right-block-title">
              <TrendingUp className="icon" style={{ color: 'var(--gold)' }} />
              <h3>Trending in Kenya</h3>
            </div>
            <Link href="/explore" className="icon-btn sm">
              <MoreHorizontal className="icon-sm" />
            </Link>
          </div>
          <div className="right-list">
            {trending.length === 0 ? (
              <div className="right-item"><div className="right-copy"><span>No trending tags yet</span></div></div>
            ) : trending.map((topic) => (
              <Link key={topic.tag} href={`/explore?tag=${encodeURIComponent(topic.tag)}`} className="right-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="right-copy">
                  <strong style={{ color: topic.color }}>{topic.tag}</strong>
                  <span>{topic.posts} posts</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {(isHome || isBaraza || isRadio) && (
        <div className="right-block">
          <div className="right-block-head">
            <div className="right-block-title">
              <div className="live-dot" />
              <h3>Live Audio Baraza</h3>
            </div>
            <Link href="/radio" className="icon-btn sm">
              <MoreHorizontal className="icon-sm" />
            </Link>
          </div>
          <div className="right-list">
            {liveRooms.length === 0 ? (
              <div className="right-item"><div className="right-copy"><span>No live rooms right now</span></div></div>
            ) : liveRooms.map((audio, i) => (
              <div key={audio.id} className="right-item audio-item" onClick={() => showToast(`Opening ${audio.title}`)}>
                <div className="avatar sm" style={{ background: FALLBACK_SOFT[i % 3], color: FALLBACK_COLORS[i % 3] }}>
                  <Volume2 className="icon-sm" />
                </div>
                <div className="right-copy">
                  <strong>{audio.title}</strong>
                  <span>{audio.host} · {audio.listeners} listening</span>
                </div>
                {audio.live && <span className="live-badge">LIVE</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {(isHome || isExplore || isSpaces) && (
        <div className="right-block">
          <div className="right-block-head">
            <h3>Suggested spaces</h3>
            <Link href="/spaces" className="icon-btn sm">
              <MoreHorizontal className="icon-sm" />
            </Link>
          </div>
          <div className="right-list">
            {spaces.length === 0 ? (
              <div className="right-item"><div className="right-copy"><span>No spaces yet</span></div></div>
            ) : spaces.map((space) => (
              <div key={space.id} className="right-item">
                <div className="avatar sm" style={{ background: space.color, color: space.textColor, fontSize: '1rem' }}>
                  {space.emoji}
                </div>
                <div className="right-copy">
                  <strong>{space.name}</strong>
                  <span>{space.members} members</span>
                </div>
                <Link href={`/spaces/${space.id}`} className="follow" style={{ textDecoration: 'none' }}>Join</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <AdBanner variant="sidebar" index={0} />

      {(isExplore || isProfile || isStudents || isProfessionals) && (
        <div className="right-block">
          <div className="right-block-head">
            <h3>People you may know</h3>
            <Link href="/explore" className="icon-btn sm">
              <MoreHorizontal className="icon-sm" />
            </Link>
          </div>
          <div className="right-list">
            {people.length === 0 ? (
              <div className="right-item"><div className="right-copy"><span>No profiles yet</span></div></div>
            ) : people.map((person) => (
              <div key={person.id} className="right-item">
                <div className="avatar sm" style={{ background: person.color, color: person.textColor, fontSize: '.7rem' }}>
                  {person.initials}
                </div>
                <div className="right-copy">
                  <strong>{person.name}</strong>
                  <span>{person.bio}</span>
                </div>
                <Link href={`/profile?id=${person.id}`} className="follow sm" style={{ textDecoration: 'none' }}>View</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {isQuizzes && (
        <div className="right-block">
          <h3>Your Subject Heshima</h3>
          <div className="subject-list">
            {['Agriculture', 'Culture', 'Rights & Law', 'Health', 'Tech', 'Environment'].map((subject) => (
              <div key={subject} className="subject-row">
                <span>{subject}</span>
                <strong>{user?.heshima ? Math.min(user.heshima, 99) : 0}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {isMtaa && (
        <div className="right-block">
          <h3>Featured listings</h3>
          <div className="right-list">
            {listings.length === 0 ? (
              <div className="right-item"><div className="right-copy"><span>No listings yet</span></div></div>
            ) : listings.map((item) => (
              <Link key={item.id} href="/mtaa" className="right-item listing-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <span className="listing-emoji">{item.emoji}</span>
                <div className="right-copy">
                  <strong>{item.title}</strong>
                  <span>{item.location}</span>
                </div>
                <span className="listing-price">{item.price}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {isNyumbaKumi && (
        <div className="right-block">
          <h3>Emergency contacts</h3>
          <div className="right-list">
            {[
              { name: 'Police', number: '999', emoji: '🚓' },
              { name: 'Ambulance', number: '1199', emoji: '🚑' },
              { name: 'Fire', number: '112', emoji: '🚒' },
              { name: 'Childline', number: '116', emoji: '📞' },
              { name: 'Red Cross', number: '0800 721 111', emoji: '➕' },
            ].map((item, i) => (
              <div key={i} className="right-item emergency-item">
                <span className="listing-emoji">{item.emoji}</span>
                <div className="right-copy">
                  <strong>{item.name}</strong>
                  <span className="mono">{item.number}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isRadio && (
        <div className="right-block">
          <h3>Live rooms</h3>
          <div className="right-list">
            {liveRooms.length === 0 ? (
              <div className="right-item"><div className="right-copy"><span>No rooms scheduled</span></div></div>
            ) : liveRooms.map((r) => (
              <div key={r.id} className="right-item schedule-item">
                <div className="right-copy">
                  <span className="schedule-time">{r.live ? 'LIVE' : 'Soon'}</span>
                  <strong>{r.title}</strong>
                  <span>{r.host}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AdBanner variant="sidebar" index={1} />
    </aside>
  );
}
