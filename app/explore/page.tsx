'use client';

import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import { toggleFollow, checkFollowing } from '@/lib/supabase-helpers';
import {
  Search, TrendingUp, CircleHelp, BadgeDollarSign, Users, Tag,
  MapPin, Sprout, MessageCircle, ThumbsUp, Send, Ellipsis, BadgeCheck
} from 'lucide-react';

const tabFilters = [
  { label: 'All', color: 'var(--greenSoft)', textColor: 'var(--green)' },
  { label: 'Threads', color: 'var(--blueSoft)', textColor: 'var(--blue)' },
  { label: 'Professionals', color: 'var(--greenSoft)', textColor: 'var(--green)' },
  { label: 'Spaces', color: 'var(--goldSoft)', textColor: 'var(--earth)' },
  { label: 'People', color: 'var(--earthSoft)', textColor: 'var(--earth)' },
];

const categoryTopics = [
  { label: 'All', color: 'var(--greenSoft)', textColor: 'var(--green)' },
  { label: 'People', color: 'var(--blueSoft)', textColor: 'var(--blue)' },
  { label: 'Questions', color: 'var(--goldSoft)', textColor: 'var(--earth)' },
  { label: 'Spaces', color: 'var(--greenSoft)', textColor: 'var(--green)' },
  { label: 'Counties', color: 'var(--earthSoft)', textColor: 'var(--earth)' },
];

const countyTopics = [
  { name: 'Nairobi', icon: '🏙️', members: '45k' },
  { name: 'Mombasa', icon: '🌊', members: '12k' },
  { name: 'Kisumu', icon: '🐟', members: '8k' },
  { name: 'Nakuru', icon: '🌾', members: '6k' },
  { name: 'Eldoret', icon: '🏔️', members: '5k' },
];

interface SearchResult {
  threads: any[];
  professionals: any[];
  spaces: any[];
  people: any[];
}

export default function ExplorePage() {
  const { user, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [results, setResults] = useState<SearchResult>({ threads: [], professionals: [], spaces: [], people: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [trendingThreads, setTrendingThreads] = useState<any[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;
    const allPros = [...results.professionals];
    if (allPros.length === 0) return;
    async function checkAll() {
      const map: Record<string, boolean> = {};
      for (const pro of allPros) {
        const userId = pro.user_id || pro.id;
        if (userId) map[userId] = await checkFollowing(user!.user_id, userId);
      }
      setFollowingMap(prev => ({ ...prev, ...map }));
    }
    checkAll();
  }, [user, results.professionals]);

  const handleFollow = async (proUserId: string) => {
    if (!user) return showToast('Please sign in');
    // Skip follow for mock professionals (non-UUID user_id)
    if (!proUserId || !proUserId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      showToast('Follow not available for this professional');
      return;
    }
    const nowFollowing = await toggleFollow(user.id, proUserId);
    setFollowingMap(prev => ({ ...prev, [proUserId]: nowFollowing }));
    showToast(nowFollowing ? 'Following' : 'Unfollowed');
  };

  const handleShare = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url || window.location.href);
      showToast('Link copied to clipboard');
    } catch {
      showToast('Could not copy link');
    }
  };

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [searchQuery]);

  useEffect(() => {
    async function fetchTrending() {
      const { data } = await supabase
        .from('threads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) setTrendingThreads(data);
    }
    fetchTrending();
  }, []);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults({ threads: [], professionals: [], spaces: [], people: [] });
      return;
    }

    let cancelled = false;
    async function runSearch() {
      setIsSearching(true);
      const q = debouncedQuery;

      const [threadsRes, professionalsRes, spacesRes, peopleRes] = await Promise.allSettled([
        supabase.from('threads').select('*').textSearch('title', q),
        supabase.from('professionals').select('*, profiles:user_id(full_name, username)').textSearch('expertise', q),
        supabase.from('spaces').select('*').textSearch('name', q),
        supabase.from('profiles').select('*').textSearch('full_name', q),
      ]);

      if (cancelled) return;

      setResults({
        threads: threadsRes.status === 'fulfilled' ? (threadsRes.value.data || []) : [],
        professionals: professionalsRes.status === 'fulfilled' ? (professionalsRes.value.data || []) : [],
        spaces: spacesRes.status === 'fulfilled' ? (spacesRes.value.data || []) : [],
        people: peopleRes.status === 'fulfilled' ? (peopleRes.value.data || []) : [],
      });
      setIsSearching(false);
    }

    runSearch();
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  useEffect(() => {
    const channel = supabase
      .channel('explore-threads-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'threads' }, (payload) => {
        setTrendingThreads((prev) => {
          if (payload.eventType === 'INSERT') {
            return [payload.new, ...prev].slice(0, 5);
          }
          if (payload.eventType === 'DELETE') {
            return prev.filter((t) => t.id !== payload.old.id);
          }
          return prev.map((t) => (t.id === payload.new.id ? payload.new : t));
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const isSearchingActive = debouncedQuery.length > 0;

  const filteredResults = (() => {
    if (activeTab === 'Threads') return results.threads;
    if (activeTab === 'Professionals') return results.professionals;
    if (activeTab === 'Spaces') return results.spaces;
    if (activeTab === 'People') return results.people;
    return [...results.threads, ...results.professionals, ...results.spaces, ...results.people];
  })();

  const totalCount = results.threads.length + results.professionals.length + results.spaces.length + results.people.length;

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
          />
        </div>
        <div className="tags" style={{ marginTop: 12 }}>
          {tabFilters.map((t) => (
            <button
              key={t.label}
              className="tag"
              onClick={() => setActiveTab(t.label)}
              style={{
                background: activeTab === t.label ? t.color : undefined,
                color: activeTab === t.label ? t.textColor : undefined,
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
              <div className="eyebrow">{isSearchingActive ? 'Results' : 'Discover'}</div>
              <h2 className="serif">
                {isSearchingActive
                  ? isSearching
                    ? 'Searching...'
                    : `${totalCount} useful match${totalCount !== 1 ? 'es' : ''}.`
                  : 'Start typing to search.'}
              </h2>
            </div>
          </div>

          {isSearching && (
            <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.6 }}>
              <div className="eyebrow">Searching across threads, professionals, spaces, and people...</div>
            </div>
          )}

          {!isSearching && isSearchingActive && filteredResults.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.6 }}>
              <div className="eyebrow">No results found for &quot;{debouncedQuery}&quot;</div>
            </div>
          )}

          {!isSearching && isSearchingActive && (activeTab === 'All' || activeTab === 'Threads') && results.threads.map((thread) => (
            <article key={thread.id} className="section" style={{ cursor: 'pointer' }} onClick={() => showToast('Thread opened')}>
              <div className="post-type"><CircleHelp className="icon-sm" /> {thread.type || 'Post'}</div>
              <div className="question-box">
                <h4>{thread.title}</h4>
                {thread.body && <p>{thread.body.slice(0, 120)}{thread.body.length > 120 ? '...' : ''}</p>}
              </div>
              <div className="post-actions">
                <button className="action"><ThumbsUp className="icon-sm" /> <span>{thread.likes_count || 0}</span></button>
                <button className="action" onClick={(e) => { e.stopPropagation(); handleShare(window.location.href); }}><Send className="icon-sm" /> <span>Share</span></button>
              </div>
            </article>
          ))}

          {!isSearching && isSearchingActive && (activeTab === 'All' || activeTab === 'Professionals') && results.professionals.map((pro) => (
            <div key={pro.id} className="pro-card" style={{ marginTop: 14 }}>
              <div className="avatar blue">{pro.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('') || '?'}</div>
              <div className="pro-copy">
                <strong>{pro.profiles?.full_name || 'Unknown'} <span className="verified">✓</span></strong>
                <p>{pro.expertise}</p>
                <span>Rating: {pro.rating || 'N/A'} · {pro.county || ''}</span>
              </div>
              <div className="pro-actions">
                <button className="follow" onClick={() => handleFollow(pro.user_id || pro.id)}>{followingMap[pro.user_id || pro.id] ? 'Following' : 'Follow'}</button>
                <button className="primary" onClick={() => showToast('Request sent')}>Request consult</button>
              </div>
            </div>
          ))}

          {!isSearching && isSearchingActive && (activeTab === 'All' || activeTab === 'Spaces') && results.spaces.map((space) => (
            <div key={space.id} className="pro-card" style={{ marginTop: 14 }} onClick={() => showToast(`Opening ${space.name}`)}>
              <div className="avatar" style={{ background: 'var(--greenSoft)', color: 'var(--green)', fontSize: '1.1rem' }}>
                {space.icon || '📦'}
              </div>
              <div className="pro-copy">
                <strong>{space.name}</strong>
                <p>{space.description?.slice(0, 80) || 'Community space'}</p>
                <span>{space.member_count || 0} members</span>
              </div>
            </div>
          ))}

          {!isSearching && isSearchingActive && (activeTab === 'All' || activeTab === 'People') && results.people.map((person) => (
            <div key={person.id} className="pro-card" style={{ marginTop: 14 }} onClick={() => showToast(`Viewing ${person.full_name}`)}>
              <div className="avatar blue">{person.full_name?.split(' ').map((n: string) => n[0]).join('') || '?'}</div>
              <div className="pro-copy">
                <strong>{person.full_name || 'Unknown'}</strong>
                <p>@{person.username || 'unknown'}</p>
                <span>{person.county || ''}</span>
              </div>
            </div>
          ))}

          {!isSearchingActive && (
            <>
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
                  <button className="action" onClick={(e) => { e.stopPropagation(); handleShare(window.location.href); }}><Send className="icon-sm" /> <span>Share</span></button>
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
                  <button className="follow" onClick={() => handleFollow('mock-jo')}>{followingMap['mock-jo'] ? 'Following' : 'Follow'}</button>
                  <button className="primary" onClick={() => showToast('Request sent')}>Request consult</button>
                </div>
              </div>
            </>
          )}
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
              {(trendingThreads.length > 0 ? trendingThreads : []).map((t: any, i: number) => (
                <div key={t.id || i} className="right-item" style={{ cursor: 'pointer' }} onClick={() => showToast(`Viewing thread`)} >
                  <div className="right-copy">
                    <strong style={{ color: 'var(--green)' }}>{t.title?.slice(0, 30) || 'Trending'}</strong>
                    <span>{t.type || 'Post'}</span>
                    <span>{t.likes_count || 0} votes</span>
                  </div>
                </div>
              ))}
              {trendingThreads.length === 0 && [
                { tag: '#KilimoSmart', posts: '12.4k', desc: 'Farming tips for the short rains' },
                { tag: '#NairobiTech', posts: '8.2k', desc: 'Tech community events and jobs' },
                { tag: '#ShengLife', posts: '6.1k', desc: 'Sheng language and culture' },
                { tag: '#HealthKE', posts: '4.8k', desc: 'Health tips and wellness' },
                { tag: '#StartupKE', posts: '3.5k', desc: 'Startup stories and funding' },
              ].map((t: any, i: number) => (
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
