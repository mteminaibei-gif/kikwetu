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
  const [replyCount, setReplyCount] = useState(0);

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
  }, [profileId]);

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
  if (!profile) return <div className="text-center py-12 text-gray-400 max-w-3xl mx-auto px-4">{tr('User not found.', 'Mtumiwa haikupatikana.')}</div>;

  const isPro = ['expert', 'admin'].includes(profile.role);
  const stats = [
    { label: tr('Heshima', 'Karma'), value: formatNumber(profile.heshima_score), color: 'text-brand-red', icon: '⚡' },
    { label: tr('Machapisho', 'Posts'), value: profile.post_count || 0, color: 'text-brand-deep', icon: '📝' },
    { label: tr('Majibu', 'Answers'), value: profile.answer_count || 0, color: 'text-brand-terracotta', icon: '💬' },
    { label: tr('Wafuasi', 'Followers'), value: profile.follower_count || 0, color: 'text-brand-deep', icon: '👥' },
    { label: tr('Anafuata', 'Following'), value: profile.following_count || 0, color: 'text-brand-terracotta', icon: '👣' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Banner cover with savannah sunset */}
      <div className="rounded-2xl overflow-hidden sun-card p-0 relative">
        <div className="h-40 sm:h-52 bg-gradient-to-br from-brand-warm/30 via-brand-amber/20 to-brand-terracotta/30 relative overflow-hidden">
          <div className="absolute -bottom-6 -right-6 w-40 h-40 rounded-full bg-brand-warm/10 blur-2xl" />
          <div className="absolute top-4 right-[15%] w-20 h-20 rounded-full bg-brand-warm/15 blur-xl" />
          {/* Bird silhouettes */}
          <svg className="absolute top-3 left-[20%] w-24 h-12 opacity-20" viewBox="0 0 120 40" fill="none">
            <path d="M0 20 Q10 10 20 20 Q30 10 40 20 Q30 16 20 24 Q10 16 0 20Z" fill="#bd3b3b"/>
            <path d="M30 10 Q38 4 46 10 Q38 7 30 10Z" fill="#bd3b3b"/>
            <path d="M60 15 Q68 8 76 15 Q68 11 60 15Z" fill="#d28156" opacity="0.6"/>
          </svg>
          {/* Acacia tree silhouette */}
          <svg className="absolute bottom-0 left-[8%] w-24 h-32 opacity-[0.12]" viewBox="0 0 80 120" fill="none">
            <path d="M40 120 L40 50" stroke="#bd3b3b" strokeWidth="2"/>
            <path d="M40 55 Q25 40 10 35" stroke="#bd3b3b" strokeWidth="1.5"/>
            <path d="M40 55 Q55 40 70 35" stroke="#bd3b3b" strokeWidth="1.5"/>
            <path d="M40 60 Q25 52 15 50" stroke="#bd3b3b" strokeWidth="1"/>
            <path d="M40 60 Q55 52 65 50" stroke="#bd3b3b" strokeWidth="1"/>
          </svg>
          {/* Avatar placed over banner */}
          <div className="absolute -bottom-12 left-8">
            <div className="relative">
              <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-xl ring-4 ring-white dark:ring-brand-cardDark ${getAvatarColor(profile.full_name)}`}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="h-full w-full object-cover rounded-2xl" />
                ) : (
                  profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-full w-full object-cover rounded-2xl" />
                  ) : (
                    getInitials(profile.full_name)
                  )
                )}
              </div>
              {isOwnProfile && !editing && (
                <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-terracotta flex items-center justify-center text-white text-xs shadow-lg cursor-pointer hover:scale-110 transition-transform">
                  <input type="file" accept="image/*" onChange={handleAvatarSelect} className="sr-only" />
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="pt-16 pb-6 px-6 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h1 className="text-2xl font-black truncate">{profile.full_name}</h1>
                <span className="text-sm text-gray-500 dark:text-gray-400">@{profile.username}</span>
                {isPro && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-deep/10 text-brand-deep dark:bg-brand-deep/20 dark:text-brand-deep">✓ Verified Pro</span>}
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`text-xs font-bold ${level.color} flex items-center gap-1`}>{level.icon} {level.name}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${roleBadge(profile.role)}`}>{profile.role}</span>
                {profile.verified && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">✓ Verified</span>}
              </div>
            </div>
            {currentUser && !isOwnProfile && (
              <button onClick={handleFollow}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm whitespace-nowrap ${
                  following ? 'border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800' : 'sun-btn'
                }`}>
                {following ? tr('Anafuata', 'Following') : tr('Fuata', 'Follow')}
              </button>
            )}
            {isOwnProfile && (
              <button onClick={() => setEditing(!editing)} className="px-5 py-2.5 rounded-full text-xs font-bold sun-btn whitespace-nowrap">
                {editing ? tr('Cancel', 'Cancel') : tr('Edit Profile', 'Hariri Wasifu')}
              </button>
            )}
          </div>

          {profile.county && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {profile.county} County
            </p>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-5 gap-3 mt-6 py-5 border-y border-gray-100 dark:border-gray-800">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-xl font-black ${s.color} flex items-center justify-center gap-1`}>
                  <span>{s.icon}</span>
                  {s.value}
                </p>
                <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {profile.badges && profile.badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {profile.badges.map(b => (
                <span key={b} className="text-[10px] font-bold px-2.5 py-1 rounded-full sun-tag">{b}</span>
              ))}
            </div>
          )}

          {/* Edit Form */}
          {isOwnProfile && editing && (
            <div className="mt-6 p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-4">
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
                <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all {saving ? 'opacity-50' : ''} sun-btn">
                  {saving ? tr('Saving...', 'Inahifadhi...') : tr('Save Changes', 'Hifadhi Mabadiliko')}
                </button>
                <button onClick={() => { setEditing(false); setAvatarFile(null); setAvatarPreview(null); }} className="px-5 py-2.5 rounded-xl text-xs font-bold border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                  {tr('Cancel', 'Ghairi')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="flex gap-6 -mb-px" aria-label="Profile tabs">
          {[
            { id: 'posts', label: tr('Posts', 'Machapisho'), count: threads.length },
            { id: 'about', label: tr('About', 'Kuhusu') },
            { id: 'activity', label: tr('Activity', 'Shughuli') },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`flex items-center gap-1.5 py-3 px-1 border-b-2 font-medium text-sm transition-all ${
                activeTab === t.id
                  ? 'border-brand-terracotta text-brand-red'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}>
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

      {/* Tab Content */}
      <div className="space-y-4 animate-fadeIn">
        {activeTab === 'posts' && (
          <>
            <div className="flex items-center gap-2 sun-tag w-fit">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
              <span className="text-xs font-bold">{tr('Machapisho Ya Hivi Karibuni', 'Recent Posts')}</span>
            </div>
            {threads.length === 0 ? (
              <div className="sun-card p-10 text-center">
                <span className="text-3xl block mb-2">📝</span>
                <p className="text-sm text-gray-400">{tr('Hakuna machapisho bado.', 'No posts yet.')}</p>
                {isOwnProfile && <Link href="/feed?create=true" className="sun-btn inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mt-4">{tr('Create Post', 'Andika Chapisho')}</Link>}
              </div>
            ) : (
              threads.map(t => (
                <Link key={t.id} href={`/thread/${t.id}`} className="sun-card p-5 block hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 border border-transparent hover:border-brand-terracotta/30">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-deep/10 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-brand-deep" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm line-clamp-1">{t.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{t.content}</p>
                      <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-2.5">
                        <span className="font-bold uppercase text-brand-terracotta">{t.type}</span>
                        <span>· {timeAgo(t.created_at)}</span>
                        <span>· {t.upvotes_count} {tr('kura', 'votes')}</span>
                        <span>· {t.reply_count} {tr('majibu', 'replies')}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </>
        )}

        {activeTab === 'about' && (
          <div className="space-y-5">
            {profile.bio && (
              <div className="sun-card p-5">
                <h4 className="font-bold text-sm flex items-center gap-2 text-brand-deep">{tr('Bio', 'Wasifu')}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
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
              {threads.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <svg className="w-5 h-5 text-brand-terracotta shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-1">{t.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(t.created_at)} · {t.upvotes_count} {tr('kura', 'votes')} · {t.reply_count} {tr('majibu', 'replies')}</p>
                  </div>
                </div>
              ))}
              {threads.length === 0 && <p className="text-center text-gray-400 py-4">{tr('No activity yet.', 'Hakuna shughuli bado.')}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}