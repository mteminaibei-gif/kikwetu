'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import { timeAgo, formatNumber, getInitials, getAvatarColor, heshimaLevel, roleBadge } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { useLanguage } from '@/context/LanguageContext';
import type { Profile, Thread } from '@/types';

interface Props {
  profileId: string;
}

export default function ProfileView({ profileId }: Props) {
  const { user: currentUser } = useAuth();
  const { contentLang, uiLang, tr } = useLanguage();
  const { show } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    full_name: '',
    bio: '',
    county: '',
    interests: '' as string,
    phone: '',
  });
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'activity'>('posts');

  const sbRef = useRef(createClient());
  const sb = sbRef.current;

  const load = useCallback(async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        sb.from('profiles').select('*').eq('id', profileId).single(),
        sb.from('threads').select('*, space:spaces(name)').eq('author_id', profileId).order('created_at', { ascending: false }).limit(30),
      ]);
      if (pRes.data) {
        setProfile(pRes.data as Profile);
        setIsOwnProfile(currentUser?.id === profileId);
        setEditData({
          full_name: pRes.data.full_name || '',
          bio: pRes.data.bio || '',
          county: pRes.data.county || '',
          interests: (pRes.data.interests || []).join(', '),
          phone: pRes.data.phone || '',
        });
      }
      if (tRes.data) setThreads(tRes.data as Thread[]);
    } catch (e) {
      console.error('[ProfileView] load error:', e);
    }
    setLoading(false);
  }, [profileId, currentUser?.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (currentUser && currentUser.id !== profileId) {
      (async () => {
        try {
          const { data } = await sb.from('follows').select('id').eq('follower_id', currentUser.id).eq('following_id', profileId).maybeSingle();
          setFollowing(!!data);
        } catch { setFollowing(false); }
      })();
    }
  }, [profileId, currentUser]);

  const handleFollow = async () => {
    if (!currentUser || !profile) return;
    if (following) {
      await sb.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', profileId);
      setFollowing(false);
      show('Unfollowed');
    } else {
      await sb.from('follows').insert({ follower_id: currentUser.id, following_id: profileId });
      setFollowing(true);
      show('Now following');
    }
  };

  const handleSave = async () => {
    if (!currentUser || !profile) return;
    setSaving(true);
    try {
      const updates: Partial<Profile> = {
        full_name: editData.full_name,
        bio: editData.bio,
        county: editData.county,
        interests: editData.interests.split(',').map(s => s.trim()).filter(Boolean),
        phone: editData.phone,
      };
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
        const { error: uploadErr } = await sb.storage.from('avatars').upload(fileName, avatarFile, { upsert: true });
        if (!uploadErr) {
          const { data: { publicUrl } } = sb.storage.from('avatars').getPublicUrl(fileName);
          updates.avatar_url = publicUrl;
        }
      }
      const { error } = await sb.from('profiles').update(updates).eq('id', profileId);
      if (error) { show(error.message); return; }
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      setEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      show('Profile updated');
    } catch (e: unknown) {
      show(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { show('Image must be under 2MB'); return; }
      if (!file.type.startsWith('image/')) { show('Please select an image'); return; }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const level = profile ? heshimaLevel(profile.heshima_score) : { name: 'Mwanzo', color: 'text-gray-500', icon: '🌱' };

  if (loading) return <LoadingSpinner />;
  if (!profile) return <div className="text-center py-12 text-gray-400 max-w-5xl mx-auto px-4">{tr('User not found.', 'Mtumiwa haikupatikana.')}</div>;

  const isPro = ['expert', 'admin'].includes(profile.role);

  return (
    <div className="max-w-5xl mx-auto px-0 sm:px-4 pb-8">
      {/* ===== COVER + PROFILE HEADER (Facebook-style) ===== */}
      <div className="bg-white dark:bg-brand-cardDark sm:rounded-b-2xl overflow-hidden shadow-sm border-b border-gray-200 dark:border-gray-800 sm:border sm:border-t-0 sm:border-gray-200/80 dark:sm:border-gray-800">
        {/* Cover photo */}
        <div className="relative h-48 sm:h-64 md:h-72 bg-gradient-to-br from-brand-warm/40 via-brand-amber/25 to-brand-terracotta/35 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(255,216,53,0.25),transparent_50%)]" />
          <div className="absolute -bottom-10 -right-10 w-56 h-56 rounded-full bg-brand-warm/15 blur-3xl" />
          <div className="absolute top-6 right-[12%] w-28 h-28 rounded-full bg-brand-warm/20 blur-2xl" />
          {/* Subtle bird silhouettes */}
          <svg className="absolute top-4 left-[18%] w-28 h-14 opacity-15" viewBox="0 0 120 40" fill="none">
            <path d="M0 20 Q10 10 20 20 Q30 10 40 20 Q30 16 20 24 Q10 16 0 20Z" fill="#bd3b3b"/>
            <path d="M30 10 Q38 4 46 10 Q38 7 30 10Z" fill="#bd3b3b"/>
            <path d="M60 15 Q68 8 76 15 Q68 11 60 15Z" fill="#d28156" opacity="0.7"/>
          </svg>
          {/* Acacia silhouette */}
          <svg className="absolute bottom-0 left-[6%] w-28 h-36 opacity-[0.1]" viewBox="0 0 80 120" fill="none">
            <path d="M40 120 L40 50" stroke="#bd3b3b" strokeWidth="2"/>
            <path d="M40 55 Q25 40 10 35" stroke="#bd3b3b" strokeWidth="1.5"/>
            <path d="M40 55 Q55 40 70 35" stroke="#bd3b3b" strokeWidth="1.5"/>
            <path d="M40 60 Q25 52 15 50" stroke="#bd3b3b" strokeWidth="1"/>
            <path d="M40 60 Q55 52 65 50" stroke="#bd3b3b" strokeWidth="1"/>
          </svg>
        </div>

        {/* Profile picture overlapping cover */}
        <div className="relative px-4 sm:px-6">
          <div className="absolute -top-16 sm:-top-20 left-4 sm:left-6">
            <div className="relative group">
              <div className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center text-4xl sm:text-5xl font-bold text-white shadow-xl ring-4 ring-white dark:ring-brand-cardDark ${getAvatarColor(profile.full_name)} overflow-hidden`}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                ) : profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  getInitials(profile.full_name)
                )}
              </div>
              {isOwnProfile && !editing && (
                <label className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-brand-terracotta flex items-center justify-center text-white shadow-lg cursor-pointer hover:scale-110 transition-transform border-2 border-white dark:border-brand-cardDark">
                  <input type="file" accept="image/*" onChange={handleAvatarSelect} className="sr-only" />
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </label>
              )}
            </div>
          </div>

          {/* Name + actions row */}
          <div className="pt-20 sm:pt-24 pb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black truncate leading-tight">{profile.full_name}</h1>
                {isPro && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-deep/10 text-brand-deep dark:bg-brand-deep/20">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Pro
                  </span>
                )}
                {profile.verified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    ✓ {tr('Verified', 'Imethibitishwa')}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">@{profile.username}</p>

              {/* FB-style mutual stats under name */}
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-600 dark:text-gray-300 flex-wrap">
                <span className={`font-semibold ${level.color} flex items-center gap-1`}>
                  <span>{level.icon}</span> {level.name}
                </span>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <span className="hover:underline cursor-default">
                  <strong className="font-bold text-gray-800 dark:text-gray-100">{formatNumber(profile.follower_count || 0)}</strong>{' '}
                  {tr('followers', 'wafuasi')}
                </span>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <span className="hover:underline cursor-default">
                  <strong className="font-bold text-gray-800 dark:text-gray-100">{formatNumber(profile.following_count || 0)}</strong>{' '}
                  {tr('following', 'anafuata')}
                </span>
              </div>

              {profile.bio && !editing && (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2 max-w-xl">
                  {profile.bio}
                </p>
              )}

              {profile.county && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-brand-terracotta shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {profile.county} County
                </p>
              )}
            </div>

            {/* Action buttons — right side like FB */}
            <div className="flex items-center gap-2 shrink-0">
              {currentUser && !isOwnProfile && (
                <>
                  <button
                    onClick={handleFollow}
                    className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm ${
                      following
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                        : 'sun-btn'
                    }`}
                  >
                    {following ? tr('Following', 'Anafuata') : tr('Follow', 'Fuata')}
                  </button>
                  <Link
                    href={`/chat/${profileId}`}
                    className="px-4 py-2.5 rounded-lg text-sm font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all"
                  >
                    {tr('Message', 'Ujumbe')}
                  </Link>
                </>
              )}
              {isOwnProfile && (
                <button
                  onClick={() => setEditing(!editing)}
                  className="px-5 py-2.5 rounded-lg text-sm font-bold sun-btn whitespace-nowrap"
                >
                  {editing ? tr('Cancel', 'Ghairi') : tr('Edit Profile', 'Hariri Wasifu')}
                </button>
              )}
            </div>
          </div>

          {/* Compact stats bar (Heshima + Posts + Answers) */}
          <div className="flex items-center gap-6 sm:gap-8 py-3 border-t border-gray-100 dark:border-gray-800 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-lg">⚡</span>
              <div>
                <p className="text-sm font-black text-brand-red leading-none">{formatNumber(profile.heshima_score)}</p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{tr('Heshima', 'Karma')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-lg">📝</span>
              <div>
                <p className="text-sm font-black text-brand-deep leading-none">{profile.post_count || 0}</p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{tr('Posts', 'Machapisho')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-lg">💬</span>
              <div>
                <p className="text-sm font-black text-brand-terracotta leading-none">{profile.answer_count || 0}</p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{tr('Answers', 'Majibu')}</p>
              </div>
            </div>
            {profile.badges && profile.badges.length > 0 && (
              <div className="flex items-center gap-1.5 ml-auto shrink-0">
                {profile.badges.slice(0, 3).map(b => (
                  <span key={b} className="text-[10px] font-bold px-2 py-0.5 rounded-full sun-tag">{b}</span>
                ))}
              </div>
            )}
          </div>

          {/* Edit form (collapsible) */}
          {isOwnProfile && editing && (
            <div className="mb-5 p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                {tr('Edit Profile', 'Hariri Wasifu')}
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{tr('Full Name', 'Jina Kamili')}</label>
                  <input value={editData.full_name} onChange={e => setEditData(d => ({ ...d, full_name: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{tr('Bio', 'Wasifu')}</label>
                  <textarea value={editData.bio} onChange={e => setEditData(d => ({ ...d, bio: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 resize-none" placeholder={tr('Tell us about yourself...', 'Tujululishe kuhusu wewe...')} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{tr('County', 'Kaunti')}</label>
                  <input value={editData.county} onChange={e => setEditData(d => ({ ...d, county: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50" list="counties" />
                  <datalist id="counties">
                    {['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Trans-Nzoia', 'Uasin Gishu', 'Kiambu', 'Kilifi', 'Meru', 'Nyeri', 'Machakos', 'Kajiado', 'Bungoma', 'Kakamega', 'Siaya', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira', 'Kericho'].map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{tr('Phone', 'Simu')}</label>
                  <input value={editData.phone} onChange={e => setEditData(d => ({ ...d, phone: e.target.value }))} type="tel" className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{tr('Interests (comma separated)', 'Vipendee (kutengwa na koma)')}</label>
                  <input value={editData.interests} onChange={e => setEditData(d => ({ ...d, interests: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50" placeholder={tr('e.g. farming, tech, storytelling', 'mf. kilimo, teknolojia, hadithi')} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving} className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all sun-btn ${saving ? 'opacity-50' : ''}`}>
                  {saving ? tr('Saving...', 'Inahifadhi...') : tr('Save Changes', 'Hifadhi Mabadiliko')}
                </button>
                <button onClick={() => { setEditing(false); setAvatarFile(null); setAvatarPreview(null); }} className="px-5 py-2.5 rounded-xl text-xs font-bold border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                  {tr('Cancel', 'Ghairi')}
                </button>
              </div>
            </div>
          )}

          {/* Tabs — full-width FB style */}
          <div className="border-t border-gray-200 dark:border-gray-800 -mx-4 sm:-mx-6 px-4 sm:px-6">
            <nav className="flex gap-1 sm:gap-2 -mb-px overflow-x-auto scrollbar-hide" aria-label="Profile tabs">
              {[
                { id: 'posts' as const, label: tr('Posts', 'Machapisho'), count: threads.length },
                { id: 'about' as const, label: tr('About', 'Kuhusu') },
                { id: 'activity' as const, label: tr('Activity', 'Shughuli') },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 py-3.5 px-4 sm:px-5 border-b-[3px] font-semibold text-sm transition-all whitespace-nowrap ${
                    activeTab === t.id
                      ? 'border-brand-terracotta text-brand-red'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {t.label}
                  {t.count !== undefined && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      activeTab === t.id ? 'bg-brand-terracotta/20 text-brand-red' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                    }`}>{t.count}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT: 2-column on desktop (FB style) ===== */}
      <div className="mt-4 sm:mt-5 px-4 sm:px-0 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* LEFT SIDEBAR — Intro / About (sticky on desktop) */}
        <aside className="lg:col-span-4 space-y-4 order-2 lg:order-1">
          <div className="sun-card p-5 sticky top-20">
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-brand-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {tr('Intro', 'Utangulizi')}
            </h3>

            {profile.bio ? (
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap mb-4">{profile.bio}</p>
            ) : (
              <p className="text-sm text-gray-400 italic mb-4">{tr('No bio yet.', 'Hakuna wasifu bado.')}</p>
            )}

            <div className="space-y-3 text-sm">
              {profile.county && (
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span>{tr('Lives in', 'Anaishi')} <strong>{profile.county}</strong></span>
                </div>
              )}
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span>{tr('Joined', 'Alijiunga')} <strong>{new Date(profile.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long' })}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <span className="w-5 h-5 flex items-center justify-center text-base shrink-0">{level.icon}</span>
                <span>{tr('Level', 'Kiwango')}: <strong className={level.color}>{level.name}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${roleBadge(profile.role)}`}>{profile.role}</span>
              </div>
            </div>

            {profile.interests && profile.interests.length > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{tr('Interests', 'Vipendee')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map((i: string) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-brand-deep/10 text-brand-deep border border-brand-deep/15">{i}</span>
                  ))}
                </div>
              </div>
            )}

            {profile.phone && isOwnProfile && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{tr('Contact', 'Mawasiliano')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{profile.phone}</p>
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT / MAIN — Posts & Activity */}
        <div className="lg:col-span-8 space-y-4 order-1 lg:order-2">
          {activeTab === 'posts' && (
            <>
              {threads.length === 0 ? (
                <div className="sun-card p-12 text-center">
                  <span className="text-4xl block mb-3">📝</span>
                  <p className="text-sm text-gray-400 mb-1">{tr('Hakuna machapisho bado.', 'No posts yet.')}</p>
                  {isOwnProfile && (
                    <Link href="/feed?create=true" className="sun-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold mt-4">
                      {tr('Create Post', 'Andika Chapisho')}
                    </Link>
                  )}
                </div>
              ) : (
                threads.map(t => (
                  <Link
                    key={t.id}
                    href={`/thread/${t.id}`}
                    className="sun-card p-5 block hover:-translate-y-0.5 transition-all duration-200 border border-transparent hover:border-brand-terracotta/25"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-deep/10 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-5 h-5 text-brand-deep" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                          <span className="font-bold uppercase text-brand-terracotta tracking-wide">{t.type}</span>
                          <span>·</span>
                          <span>{timeAgo(t.created_at)}</span>
                        </div>
                        <h4 className="font-bold text-base line-clamp-2 leading-snug">{t.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">{t.content}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400 mt-3">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                            {t.upvotes_count} {tr('votes', 'kura')}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            {t.reply_count} {tr('replies', 'majibu')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </>
          )}

          {activeTab === 'about' && (
            <div className="space-y-4">
              {profile.bio && (
                <div className="sun-card p-5">
                  <h4 className="font-bold text-sm flex items-center gap-2 text-brand-deep mb-2">{tr('Bio', 'Wasifu')}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}
              {(profile.interests?.length || profile.county) && (
                <div className="sun-card p-5 space-y-4">
                  <h4 className="font-bold text-sm flex items-center gap-2 text-brand-deep">{tr('Interests & Location', 'Vipendee na Mahali')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.county && <span className="text-xs px-2.5 py-1 rounded-full bg-brand-terracotta/10 text-brand-terracotta border border-brand-terracotta/20">{profile.county} County</span>}
                    {profile.interests?.map((i: string) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-brand-deep/10 text-brand-deep border border-brand-deep/20">{i}</span>
                    ))}
                  </div>
                </div>
              )}
              {profile.phone && (
                <div className="sun-card p-5">
                  <h4 className="font-bold text-sm flex items-center gap-2 text-brand-deep">{tr('Contact', 'Mawasiliano')}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{profile.phone}</p>
                </div>
              )}
              <div className="sun-card p-5">
                <h4 className="font-bold text-sm flex items-center gap-2 text-brand-deep">{tr('Member Since', 'Mwanachama Tangu')}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{new Date(profile.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="sun-card p-5">
              <h4 className="font-bold text-sm flex items-center gap-2 text-brand-deep mb-4">{tr('Recent Activity', 'Shughuli za Hivi Karibuni')}</h4>
              <div className="space-y-3 text-sm">
                {threads.slice(0, 8).map(t => (
                  <Link key={t.id} href={`/thread/${t.id}`} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <svg className="w-5 h-5 text-brand-terracotta shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-1">{t.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(t.created_at)} · {t.upvotes_count} {tr('votes', 'kura')} · {t.reply_count} {tr('replies', 'majibu')}</p>
                    </div>
                  </Link>
                ))}
                {threads.length === 0 && <p className="text-center text-gray-400 py-6">{tr('No activity yet.', 'Hakuna shughuli bado.')}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
