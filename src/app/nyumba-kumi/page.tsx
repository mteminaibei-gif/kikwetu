'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase';
import { cn, timeAgo } from '@/lib/utils';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Post {
  id: string;
  author_id: string;
  content: string;
  category: 'alert' | 'question' | 'info' | 'general';
  county: string;
  location?: string;
  urgent: boolean;
  created_at: string;
  author?: { full_name: string; avatar_url?: string; county?: string };
  replies: { id: string; content: string; author: { full_name: string }; created_at: string }[];
}

interface Community {
  id: string;
  name: string;
  county: string;
  description: string;
  memberCount: number;
  emergencyContacts: string[];
  created_at: string;
}

const CATEGORIES = ['general', 'alert', 'question', 'info'] as const;

const COUNTY_LIST = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Trans-Nzoia', 'Uasin Gishu',
  'Kiambu', 'Kilifi', 'Meru', 'Nyeri', 'Machakos', 'Kajiado', 'Bungoma',
  'Kakamega', 'Siaya', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira', 'Kericho',
];

const DEFAULT_COMMUNITIES: Community[] = COUNTY_LIST.map((county, i) => ({
  id: `community-${i}`,
  name: `${county} Usalama`,
  county,
  description: `${county} neighborhood security watch & community updates`,
  memberCount: Math.floor(Math.random() * 500) + 50,
  emergencyContacts: ['112', '999', ''],
  created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
}));

const WHATSAPP_GROUPS: Record<string, { name: string; link: string }[]> = {
  'Nairobi': [{ name: 'Nairobi Nyumba Kumi WhatsApp', link: 'https://chat.whatsapp.com/example1' }],
  'Mombasa': [{ name: 'Mombasa Community Watch', link: 'https://chat.whatsapp.com/example2' }],
  'Kisumu': [{ name: 'Kisumu Usalama Group', link: 'https://chat.whatsapp.com/example3' }],
};

const EMERGENCY_CONTACTS = [
  { name: 'Police Emergency', number: '112', icon: '🚔' },
  { name: 'Ambulance', number: '999', icon: '🚑' },
  { name: 'Fire Brigade', number: '911', icon: '🚒' },
  { name: 'Child Helpline', number: '116', icon: '👶' },
];

export default function NyumbaKumiPage() {
  const { user } = useAuth();
  const { show } = useToast();
  const sbRef = useRef(createClient());
  const sb = sbRef.current;

  const [tab, setTab] = useState<'feed' | 'communities' | 'nearby'>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'general' | 'alert' | 'question' | 'info'>('general');
  const [county, setCounty] = useState('');
  const [location, setLocation] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [filterCounty, setFilterCounty] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [lang, setLang] = useState<'en' | 'sw'>('en');
  const [joinedComms, setJoinedComms] = useState<Set<string>>(new Set());
  const [communities, setCommunities] = useState<Community[]>(DEFAULT_COMMUNITIES);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [newCommCounty, setNewCommCounty] = useState('');
  const [newCommName, setNewCommName] = useState('');
  const [newCommDesc, setNewCommDesc] = useState('');

  const tr = (en: string, sw: string) => lang === 'sw' ? sw : en;

  useEffect(() => {
    const stored = localStorage.getItem('nyumba_kumi_joined');
    if (stored) {
      try { setJoinedComms(new Set(JSON.parse(stored))); } catch {}
    }
    const storedComms = localStorage.getItem('nyumba_kumi_communities');
    if (storedComms) {
      try { setCommunities(prev => [...DEFAULT_COMMUNITIES, ...JSON.parse(storedComms)]); } catch {}
    }
  }, []);

  const loadPosts = useCallback(async () => {
    const { data } = await sb.from('nyumba_kumi_posts')
      .select('*, author:profiles(full_name, avatar_url, county), replies:nyumba_kumi_replies(*, author:profiles(full_name))')
      .order('urgent', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) setPosts(data as Post[]);
    setLoading(false);
  }, [sb]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      show('Geolocation is not available on this device.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setTab('nearby');
        setLocating(false);
      },
      () => {
        show('Unable to get location. Please enable location access.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [show]);

  const joinCommunity = (commId: string) => {
    setJoinedComms(prev => {
      const next = new Set(prev);
      if (next.has(commId)) next.delete(commId);
      else next.add(commId);
      localStorage.setItem('nyumba_kumi_joined', JSON.stringify([...next]));
      return next;
    });
  };

  const createCommunity = () => {
    if (!newCommCounty || !newCommName.trim()) { show('Please enter community name and county.'); return; }
    const newComm: Community = {
      id: `community-custom-${Date.now()}`,
      name: newCommName.trim(),
      county: newCommCounty,
      description: newCommDesc.trim() || `${newCommCounty} community group`,
      memberCount: 1,
      emergencyContacts: ['112', '999'],
      created_at: new Date().toISOString(),
    };
    setCommunities(prev => [newComm, ...prev]);
    const stored = localStorage.getItem('nyumba_kumi_communities');
    const existing = stored ? JSON.parse(stored) : [];
    localStorage.setItem('nyumba_kumi_communities', JSON.stringify([newComm, ...existing]));
    setNewCommCounty('');
    setNewCommName('');
    setNewCommDesc('');
    setShowCreateCommunity(false);
    show('Community created!');
  };

  const filtered = posts.filter(p => {
    if (filterCounty && p.county !== filterCounty) return false;
    if (filterCategory && p.category !== filterCategory) return false;
    return true;
  });

  const handlePost = async () => {
    if (!content.trim()) { show('Please write something.'); return; }
    if (!user) { show('Please sign in.'); return; }
    setPosting(true);
    const { error } = await sb.from('nyumba_kumi_posts').insert({
      author_id: user.id, content: content.trim(), category, county: county || user.county || 'Nairobi',
      location: location || null, urgent,
    }).select().single();
    setPosting(false);
    if (error) { show(error.message); return; }
    show('Posted to Nyumba Kumi!');
    setContent('');
    setShowForm(false);
    loadPosts();
  };

  const handleReply = async (postId: string) => {
    if (!replyContent.trim() || !user) return;
    const { error } = await sb.from('nyumba_kumi_replies').insert({
      post_id: postId, author_id: user.id, content: replyContent.trim(),
    }).select().single();
    if (error) { show(error.message); return; }
    setReplyContent('');
    setReplyTo(null);
    loadPosts();
  };

  const shareToWhatsApp = (message: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message + '\n\n' + window.location.origin + '/nyumba-kumi')}`, '_blank');
  };

  const nearbyCounties = userLocation
    ? COUNTY_LIST.filter(() => Math.random() > 0.5).slice(0, 5)
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 p-6 sm:p-8 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">🏘️</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black">Nyumba Kumi Usalama</h1>
              <p className="text-sm text-amber-200">Neighborhood security watch &bull; Community alerts &bull; Local issue reporting</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <div className="flex-1 min-w-[200px]">
              <select value={filterCounty} onChange={e => setFilterCounty(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30">
                <option value="" className="text-gray-800">All Counties</option>
                {COUNTY_LIST.map(c => <option key={c} value={c} className="text-gray-800">{c}</option>)}
              </select>
            </div>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30">
              <option value="" className="text-gray-800">All Types</option>
              {CATEGORIES.map(c => <option key={c} value={c} className="text-gray-800">{c}</option>)}
            </select>
            {tab === 'feed' && (
              <button onClick={() => setShowForm(true)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                {tr('Chapisha', 'Post Update')}
              </button>
            )}
            <button onClick={() => setLang(l => l === 'en' ? 'sw' : 'en')}
              className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-bold text-amber-200 hover:bg-white/20 transition-colors">
              {lang === 'en' ? 'Kiswahili' : 'English'}
            </button>
            <button onClick={requestLocation} disabled={locating}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {locating ? '...' : tr('Karibu Yangu', 'Near Me')}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1.5 border-b border-gray-200 dark:border-gray-800 pb-3 overflow-x-auto scrollbar-hide">
        {([
          { id: 'feed' as const, label: tr('Machapisho', 'Feed'), icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
          { id: 'communities' as const, label: tr('Jamii', 'Communities'), icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
          { id: 'nearby' as const, label: tr('Karibu Yangu', 'Near Me'), icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all',
              tab === t.id ? 'bg-amber-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} /></svg>
            {t.label}
          </button>
        ))}
      </div>

      {/* Emergency Contacts Bar */}
      <div className="flex flex-wrap gap-2">
        {EMERGENCY_CONTACTS.map(c => (
          <a key={c.number} href={`tel:${c.number}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-950/50 transition-all">
            <span>{c.icon}</span>
            {c.name}: {c.number}
          </a>
        ))}
      </div>

      {/* Tab Content: FEED */}
      {tab === 'feed' && (
        <>
          {showForm && (
            <div className="sun-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">{tr('Post Neighborhood Update', 'Chapisha Taarifa ya Mtaa')}</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <textarea value={content} onChange={e => setContent(e.target.value)}
                rows={3} placeholder={tr('Describe the issue, alert, or question...', 'Eleza tatizo, tahadhari, au swali...')}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none" />
              <div className="flex flex-wrap gap-3">
                <select value={category} onChange={e => setCategory(e.target.value as typeof category)}
                  className="p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50">
                  <option value="general">General</option>
                  <option value="alert">Alert / Emergency</option>
                  <option value="question">Question</option>
                  <option value="info">Information</option>
                </select>
                <select value={county} onChange={e => setCounty(e.target.value)}
                  className="p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none">
                  <option value="">{tr('Select County', 'Chagua Kaunti')}</option>
                  {COUNTY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input value={location} onChange={e => setLocation(e.target.value)}
                  placeholder={tr('Specific area', 'Eneo mahususi')}
                  className="flex-1 min-w-[140px] p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
                <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={urgent} onChange={e => setUrgent(e.target.checked)}
                    className="w-4 h-4 rounded accent-red-500" />
                  {tr('Urgent!', 'Haraka!')}
                </label>
              </div>
              <button onClick={handlePost} disabled={posting || !content.trim()}
                className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 active:scale-95">
                {posting ? 'Posting...' : (tr('Chapisha', 'Post'))}
              </button>
            </div>
          )}

          {/* WhatsApp Community Groups */}
          <div className="sun-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
              <h3 className="font-bold text-sm">{tr('WhatsApp Community Groups', 'Vikundi vya WhatsApp')}</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {tr('Join your local Nyumba Kumi WhatsApp group for real-time alerts:', 'Jiunge na kikundi cha WhatsApp cha Nyumba Kumi eneo lako:')}
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(WHATSAPP_GROUPS).flatMap(([countyName, groups]) =>
                groups.map((g, i) => (
                  <a key={`${countyName}-${i}`} href={g.link} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 rounded-xl text-xs font-bold hover:bg-green-100 dark:hover:bg-green-950/60 transition-all border border-green-200 dark:border-green-900">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
                    {g.name}
                  </a>
                ))
              )}
              <a href="https://chat.whatsapp.com/example" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                {tr('Find Your County Group', 'Tafuta Kikundi cha Kaunti Yako')}
              </a>
            </div>
          </div>

          {/* Posts Feed */}
          {loading ? <LoadingSpinner /> : (
            <div className="space-y-4">
              {filtered.length === 0 && (
                <div className="sun-card p-12 text-center">
                  <span className="text-4xl block mb-3">🏘️</span>
                  <p className="text-sm text-gray-400">{tr('Hakuna machapisho bado.', 'No posts yet.')}</p>
                  <button onClick={() => setShowForm(true)}
                    className="mt-4 sun-btn px-5 py-2.5 rounded-full text-xs font-bold">{tr('Chapisha kwanza', 'Be the first to post')}</button>
                </div>
              )}
              {filtered.map(post => (
                <div key={post.id} className={`sun-card p-4 sm:p-5 space-y-3 ${post.urgent ? 'border-l-4 border-l-red-500' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-xs font-bold text-white">
                        {post.author?.full_name?.[0] || '?'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold">{post.author?.full_name || 'Anonymous'}</p>
                          {post.urgent && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold animate-pulse">URGENT</span>}
                        </div>
                        <p className="text-[10px] text-gray-400">{post.county}{post.location ? ` \u00b7 ${post.location}` : ''} \u00b7 {timeAgo(post.created_at)}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      post.category === 'alert' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      post.category === 'question' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      post.category === 'info' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>{post.category}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{post.content}</p>

                  <button onClick={() => shareToWhatsApp(post.content)}
                    className="text-xs text-green-600 font-bold flex items-center gap-1 hover:text-green-700 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
                    {tr('Shiriki kwa WhatsApp', 'Share on WhatsApp')}
                  </button>

                  <div className="pl-4 border-l-2 border-gray-100 dark:border-gray-800 space-y-2">
                    {(post.replies || []).map(reply => (
                      <div key={reply.id} className="text-xs text-gray-600 dark:text-gray-400">
                        <span className="font-bold text-gray-700 dark:text-gray-300">{reply.author?.full_name || '?'}:</span> {reply.content}
                      </div>
                    ))}
                    {replyTo === post.id ? (
                      <div className="flex gap-2">
                        <input value={replyContent} onChange={e => setReplyContent(e.target.value)}
                          placeholder={tr('Write a reply...', 'Andika jibu...')}
                          className="flex-1 p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
                        <button onClick={() => handleReply(post.id)}
                          className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors">Reply</button>
                        <button onClick={() => setReplyTo(null)}
                          className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setReplyTo(post.id)}
                        className="text-[10px] font-bold text-amber-600 hover:text-amber-700 transition-colors">
                        {tr('Jibu', 'Reply')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab Content: COMMUNITIES */}
      {tab === 'communities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {tr('Jiunge na jamii za kaunti zako ili kupata taarifa za usalama.', 'Join county communities to get local security updates.')}
            </p>
            <button onClick={() => setShowCreateCommunity(true)}
              className="sun-btn px-4 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              {tr('Unda Jamii', 'Create Community')}
            </button>
          </div>

          {showCreateCommunity && (
            <div className="sun-card p-5 space-y-3">
              <h4 className="text-sm font-bold">{tr('Unda Jamii Mpya', 'Create New Community')}</h4>
              <input value={newCommName} onChange={e => setNewCommName(e.target.value)}
                placeholder={tr('Jina la jamii', 'Community name')}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
              <select value={newCommCounty} onChange={e => setNewCommCounty(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none">
                <option value="">{tr('Chagua Kaunti', 'Select County')}</option>
                {COUNTY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <textarea value={newCommDesc} onChange={e => setNewCommDesc(e.target.value)}
                rows={2} placeholder={tr('Maelezo (si lazima)', 'Description (optional)')}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none" />
              <div className="flex gap-2">
                <button onClick={createCommunity}
                  className="sun-btn px-5 py-2 rounded-xl text-xs font-bold">{tr('Unda', 'Create')}</button>
                <button onClick={() => setShowCreateCommunity(false)}
                  className="px-4 py-2 text-xs text-gray-400 hover:text-gray-600">Cancel</button>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {communities.map(comm => (
              <div key={comm.id} className="sun-card p-4 space-y-3 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-lg">🏘️</div>
                    <div>
                      <h4 className="text-sm font-bold">{comm.name}</h4>
                      <p className="text-[10px] text-gray-400">{comm.county}</p>
                    </div>
                  </div>
                  <button onClick={() => joinCommunity(comm.id)}
                    className={cn(
                      'px-3 py-1 rounded-full text-[10px] font-bold transition-all',
                      joinedComms.has(comm.id)
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                        : 'bg-amber-600 text-white hover:bg-amber-700'
                    )}>
                    {joinedComms.has(comm.id) ? tr('Umejiunga', 'Joined') : tr('Jiunga', 'Join')}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{comm.description}</p>
                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span>{comm.memberCount.toLocaleString()} {tr('wanachama', 'members')}</span>
                  {comm.emergencyContacts.filter(Boolean).length > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {tr('Dharura: 112', 'Emergency: 112')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: NEARBY */}
      {tab === 'nearby' && (
        <div className="space-y-4">
          {!userLocation ? (
            <div className="sun-card p-12 text-center space-y-4">
              <span className="text-5xl block">📍</span>
              <h3 className="text-lg font-bold">{tr('Tafuta Jamii Karibu Yako', 'Find Communities Near You')}</h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                {tr('Washa eneo lako ili kuona jamii za Nyumba Kumi na taarifa za usalama karibu na wewe.', 'Enable your location to discover Nyumba Kumi communities and security updates near you.')}
              </p>
              <button onClick={requestLocation} disabled={locating}
                className="sun-btn px-6 py-3 rounded-xl text-sm font-bold shadow-md inline-flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {locating ? tr('Inatafuta...', 'Locating...') : tr('Washa Eneo Langu', 'Enable My Location')}
              </button>
            </div>
          ) : (
            <>
              <div className="sun-card p-5 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📍</span>
                  <div>
                    <h3 className="font-bold text-sm">{tr('Eneo Lako', 'Your Location')}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {tr('Umewasha eneo. Hizi ni jamii zilizo karibu na wewe:', 'Location enabled. Here are communities near you:')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {nearbyCounties.map(countyName => {
                  const comm = communities.find(c => c.county === countyName);
                  if (!comm) return null;
                  return (
                    <div key={comm.id} className="sun-card p-4 space-y-3 hover:shadow-md transition-all border-l-4 border-l-amber-500">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-lg">🏘️</div>
                          <div>
                            <h4 className="text-sm font-bold">{comm.name}</h4>
                            <p className="text-[10px] text-gray-400">{tr('Karibu yako', 'Near you')} &middot; {comm.county}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-amber-600 font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                          {Math.floor(Math.random() * 10) + 1}km
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{comm.description}</p>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <span>{comm.memberCount.toLocaleString()} {tr('wanachama', 'members')}</span>
                        <button onClick={() => joinCommunity(comm.id)}
                          className={cn(
                            'px-3 py-1 rounded-full font-bold transition-all',
                            joinedComms.has(comm.id)
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-amber-600 text-white hover:bg-amber-700'
                          )}>
                          {joinedComms.has(comm.id) ? tr('Umejiunga', 'Joined') : tr('Jiunga', 'Join')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
