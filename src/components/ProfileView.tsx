'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import { timeAgo, formatNumber, getInitials, getAvatarColor, heshimaLevel, roleBadge } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { useLanguage } from '@/context/LanguageContext';
import ImageCropper from '@/components/ImageCropper';
import type { Profile, Thread } from '@/types';

interface Props { profileId: string; }

export default function ProfileView({ profileId }: Props) {
  const { user: currentUser } = useAuth();
  const { tr } = useLanguage();
  const { show } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ full_name: '', bio: '', county: '', interests: '' as string, phone: '' });
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
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
    } catch (e) { console.error('[ProfileView]', e); }
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
        full_name: editData.full_name, bio: editData.bio, county: editData.county,
        interests: editData.interests.split(',').map(s => s.trim()).filter(Boolean),
        phone: editData.phone,
      };
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const fname = `${currentUser.id}-${Date.now()}.${ext}`;
        const { error: upErr } = await sb.storage.from('avatars').upload(fname, avatarFile, { upsert: true });
        if (!upErr) {
          const { data: { publicUrl } } = sb.storage.from('avatars').getPublicUrl(fname);
          updates.avatar_url = publicUrl;
        }
      }
      const { error } = await sb.from('profiles').update(updates).eq('id', profileId);
      if (error) { show(error.message); return; }
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      setEditing(false); setAvatarFile(null); setAvatarPreview(null);
      show('Profile updated');
    } catch (e: unknown) { show(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { show('Image must be under 5MB'); return; }
    if (!file.type.startsWith('image/')) { show('Please select an image'); return; }
    setCropFile(file);
  };

  const handleCropDone = (blob: Blob) => {
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(blob));
    setCropFile(null);
  };

  const level = profile ? heshimaLevel(profile.heshima_score) : { name: 'Mwanzo', color: 'text-gray-500', icon: '🌱' };

  if (loading) return <LoadingSpinner />;
  if (!profile) return <div className="text-center py-12 text-gray-400 max-w-5xl mx-auto px-4">{tr('User not found.', 'Mtumiwa haikupatikana.')}</div>;

  const isPro = ['expert', 'admin'].includes(profile.role);
  const stats = [
    { label: tr('Heshima', 'Karma'), value: formatNumber(profile.heshima_score), color: 'from-brand-red to-brand-terracotta', icon: '⚡' },
    { label: tr('Machapisho', 'Posts'), value: profile.post_count || 0, color: 'from-brand-deep to-brand-red', icon: '📝' },
    { label: tr('Majibu', 'Answers'), value: profile.answer_count || 0, color: 'from-brand-terracotta to-brand-amber', icon: '💬' },
    { label: tr('Wafuasi', 'Followers'), value: profile.follower_count || 0, color: 'from-brand-deep to-brand-terracotta', icon: '👥' },
    { label: tr('Anafuata', 'Following'), value: profile.following_count || 0, color: 'from-brand-amber to-brand-warm', icon: '👣' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {cropFile && <ImageCropper file={cropFile} onCrop={handleCropDone} onCancel={() => setCropFile(null)} />}

      {/* Banner + Avatar */}
      <div className="rounded-2xl overflow-hidden sun-card p-0 relative">
        <div className="h-44 sm:h-56 bg-gradient-to-br from-brand-warm/30 via-brand-amber/20 to-brand-terracotta/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
          <div className="absolute -bottom-8 -right-8 w-48 h-48 rounded-full bg-brand-warm/10 blur-3xl" />
          <div className="absolute top-6 right-[12%] w-24 h-24 rounded-full bg-brand-warm/15 blur-2xl" />
          <div className="absolute top-6 right-[30%] w-16 h-16 rounded-full bg-brand-terracotta/10 blur-xl" />
          <svg className="absolute top-4 left-[20%] w-28 h-14 opacity-20" viewBox="0 0 120 40" fill="none">
            <path d="M0 20 Q10 10 20 20 Q30 10 40 20 Q30 16 20 24 Q10 16 0 20Z" fill="#bd3b3b"/>
            <path d="M30 10 Q38 4 46 10 Q38 7 30 10Z" fill="#bd3b3b"/>
            <path d="M60 15 Q68 8 76 15 Q68 11 60 15Z" fill="#d28156" opacity="0.6"/>
            <path d="M80 8 Q88 2 96 8 Q88 5 80 8Z" fill="#bd3b3b" opacity="0.4"/>
          </svg>

          <svg className="absolute bottom-0 left-[6%] w-28 h-36 opacity-[0.1]" viewBox="0 0 80 120" fill="none">
            <path d="M40 120 L40 50" stroke="#bd3b3b" strokeWidth="2"/>
            <path d="M40 55 Q25 40 10 35" stroke="#bd3b3b" strokeWidth="1.5"/>
            <path d="M40 55 Q55 40 70 35" stroke="#bd3b3b" strokeWidth="1.5"/>
            <path d="M40 60 Q25 52 15 50" stroke="#bd3b3b" strokeWidth="1"/>
            <path d="M40 60 Q55 52 65 50" stroke="#bd3b3b" strokeWidth="1"/>
          </svg>
          {/* Avatar */}
          <div className="absolute -bottom-14 left-6 sm:left-8">
            <div className="relative group">
              <div className={`w-28 h-28 rounded-2xl flex items-center justify-center text-4xl font-black text-white shadow-2xl ring-4 ring-white dark:ring-brand-cardDark transition-transform group-hover:scale-[1.02] ${getAvatarColor(profile.full_name)}`}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="h-full w-full object-cover rounded-2xl" />
                ) : profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover rounded-2xl" />
                ) : getInitials(profile.full_name)}
              </div>
              {isOwnProfile && (
                <label className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-brand-terracotta flex items-center justify-center text-white shadow-lg cursor-pointer hover:scale-110 hover:bg-brand-red transition-all ring-2 ring-white dark:ring-brand-cardDark">

                  <input type="file" accept="image/*" onChange={handleAvatarSelect} className="sr-only" />
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </label>
              )}
            </div>
          </div>

        <div className="pt-16 pb-6 px-6 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h1 className="text-2xl font-black truncate">{profile.full_name}</h1>
                {isPro && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-deep/10 text-brand-deep">✓ PRO</span>}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">@{profile.username}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-xs font-bold ${level.color} flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800`}>{level.icon} {level.name}</span>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${roleBadge(profile.role)}`}>{profile.role}</span>
                {profile.verified && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">✓ Verified</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {currentUser && !isOwnProfile && (
                <button onClick={handleFollow}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                    following ? 'border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800' : 'sun-btn'
                  }`}>
                  {following ? tr('Following', 'Anafuata') : tr('Follow', 'Fuata')}
                </button>
              )}
              {isOwnProfile && (
                <button onClick={() => setEditing(!editing)} className="px-5 py-2.5 rounded-full text-xs font-bold sun-btn">
                  {editing ? tr('Cancel', 'Cancel') : tr('Edit Profile', 'Hariri')}
                </button>
              )}
            </div>
          </div>

          {profile.bio && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 leading-relaxed">{profile.bio}</p>
          )}

          {profile.county && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {profile.county} County
            </p>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-5 gap-2 mt-5 py-4 border-y border-gray-100 dark:border-gray-800">
            {stats.map(s => (
              <div key={s.label} className="text-center group cursor-default">
                <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white text-base mb-1 group-hover:scale-110 transition-transform shadow-sm`}>
                  {s.icon}
                </div>
                <p className="text-sm font-black text-gray-800 dark:text-gray-200">{s.value}</p>
                <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">{s.label}</p>
              </div>
            ))}

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
            <div className="mt-6 p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-4 animate-fadeUp">

              <h3 className="font-bold text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                {tr('Edit Profile', 'Hariri Wasifu')}
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{tr('Full Name', 'Jina Kamili')}</label>
                  <input value={editData.full_name} onChange={e => setEditData(d => ({ ...d, full_name: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{tr('Bio', 'Wasifu')}</label>
                  <textarea value={editData.bio} onChange={e => setEditData(d => ({ ...d, bio: e.target.value }))} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 resize-none" placeholder={tr('Tell us about yourself...', 'Tujululishe kuhusu wewe...')} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{tr('County', 'Kaunti')}</label>
                  <input value={editData.county} onChange={e => setEditData(d => ({ ...d, county: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50" list="counties" />
                  <datalist id="counties">
                    {['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Trans-Nzoia', 'Uasin Gishu', 'Kiambu', 'Kilifi', 'Meru', 'Nyeri', 'Machakos', 'Kajiado', 'Bungoma', 'Kakamega', 'Siaya', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira', 'Kericho'].map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{tr('Phone', 'Simu')}</label>
                  <input value={editData.phone} onChange={e => setEditData(d => ({ ...d, phone: e.target.value }))} type="tel" className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{tr('Interests (comma separated)', 'Vipendee (kutengwa na koma)')}</label>
                  <input value={editData.interests} onChange={e => setEditData(d => ({ ...d, interests: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50" placeholder={tr('e.g. farming, tech, storytelling', 'mf. kilimo, teknolojia, hadithi')} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold sun-btn disabled:opacity-50">
                  {saving ? tr('Saving...', 'Inahifadhi...') : tr('Save Changes', 'Hifadhi')}

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

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="flex gap-1 -mb-px overflow-x-auto scrollbar-hide" aria-label="Profile tabs">
          {([
            { id: 'posts' as const, label: tr('Posts', 'Machapisho'), icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z', count: threads.length },
            { id: 'about' as const, label: tr('About', 'Kuhusu'), icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', count: undefined },
            { id: 'activity' as const, label: tr('Activity', 'Shughuli'), icon: 'M13 10V3L4 14h7v7l9-11h-7z', count: undefined },
          ]).map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 py-3 px-4 border-b-2 text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? 'border-brand-terracotta text-brand-red'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} /></svg>
              {t.label}
              {t.count !== undefined && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-0.5 ${activeTab === t.id ? 'bg-brand-terracotta/20 text-brand-red' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>{t.count}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-4 animate-fadeIn">
        {activeTab === 'posts' && (
          <>
            {threads.length === 0 ? (
              <div className="sun-card p-12 text-center">
                <span className="text-4xl block mb-3">📝</span>
                <p className="text-sm text-gray-400">{tr('Hakuna machapisho bado.', 'No posts yet.')}</p>
                {isOwnProfile && <Link href="/feed?create=true" className="sun-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold mt-4">{tr('Create Post', 'Andika Chapisho')}</Link>}
              </div>
            ) : (
              <div className="space-y-3">
                {threads.map(t => (
                  <Link key={t.id} href={`/thread/${t.id}`} className="sun-card p-5 block hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 border border-transparent hover:border-brand-terracotta/30">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${t.type === 'question' ? 'bg-blue-50 dark:bg-blue-900/20' : t.type === 'poll' ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-brand-terracotta/10'}`}>
                        <span className="text-base">{t.type === 'question' ? '❓' : t.type === 'poll' ? '📊' : '📖'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm line-clamp-1">{t.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{t.content}</p>
                        <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-2.5 flex-wrap">
                          <span className="font-bold uppercase text-brand-terracotta">{t.type}</span>
                          <span>· {timeAgo(t.created_at)}</span>
                          <span className="flex items-center gap-0.5">🔥 {t.upvotes_count} {tr('kura', 'votes')}</span>
                          <span className="flex items-center gap-0.5">💬 {t.reply_count} {tr('majibu', 'replies')}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
        {activeTab === 'about' && (
          <div className="space-y-4">
            {profile.bio && (
              <div className="sun-card p-5">
                <h4 className="font-bold text-sm flex items-center gap-2 text-brand-deep">{tr('Bio', 'Wasifu')}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
              </div>
            )}
            {(profile.interests?.length || profile.county) && (
              <div className="sun-card p-5 space-y-3">
                <h4 className="font-bold text-sm flex items-center gap-2 text-brand-deep">{tr('Interests & Location', 'Vipendee na Mahali')}</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.county && (
                    <span className="text-xs px-3 py-1.5 rounded-full bg-brand-terracotta/10 text-brand-terracotta border border-brand-terracotta/20 font-semibold flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                      {profile.county}
                    </span>
                  )}
                  {profile.interests?.map((i: string) => (
                    <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-brand-deep/10 text-brand-deep border border-brand-deep/20 font-semibold">{i}</span>

                  ))}
                </div>
              </div>
            )}
            {profile.phone && (
              <div className="sun-card p-5">
                <h4 className="font-bold text-sm flex items-center gap-2 text-brand-deep">{tr('Contact', 'Mawasiliano')}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  {profile.phone}
                </p>
              </div>
            )}
            <div className="sun-card p-5">
              <h4 className="font-bold text-sm flex items-center gap-2 text-brand-deep">{tr('Member Since', 'Mwanachama Tangu')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {new Date(profile.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
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
