'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import { timeAgo, formatNumber, getInitials, getAvatarColor, heshimaLevel, roleBadge, cn } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/Toast';
import { useLanguage } from '@/context/LanguageContext';
import ImageCropper from '@/components/ImageCropper';
import type { Profile, Thread } from '@/types';

interface Props {
  profileId: string;
}

type TabId = 'posts' | 'about' | 'photos' | 'followers' | 'following';

interface MiniProfile {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  county?: string;
  verified?: boolean;
}

const COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Trans-Nzoia', 'Uasin Gishu',
  'Kiambu', 'Kilifi', 'Meru', 'Nyeri', 'Machakos', 'Kajiado', 'Bungoma',
  'Kakamega', 'Siaya', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira', 'Kericho',
];

export default function ProfileView({ profileId }: Props) {
  const { user: currentUser } = useAuth();
  const { tr } = useLanguage();
  const { show } = useToast();
  const sb = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followers, setFollowers] = useState<MiniProfile[]>([]);
  const [followingList, setFollowingList] = useState<MiniProfile[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('posts');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editData, setEditData] = useState({
    full_name: '', bio: '', county: '', interests: '', phone: '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const isOwnProfile = currentUser?.id === profileId;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, tRes, foRes, fgRes] = await Promise.all([
        sb.from('profiles').select('*').eq('id', profileId).single(),
        sb.from('threads')
          .select('*, space:spaces(name), author:profiles(full_name, avatar_url, verified, username)')
          .eq('author_id', profileId)
          .order('created_at', { ascending: false })
          .limit(40),
        sb.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', profileId),
        sb.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', profileId),
      ]);

      if (pRes.data) {
        const p = pRes.data as Profile & { cover_url?: string };
        setProfile(p);
        setCoverUrl(p.cover_url || null);
        setEditData({
          full_name: p.full_name || '',
          bio: p.bio || '',
          county: p.county || '',
          interests: (p.interests || []).join(', '),
          phone: p.phone || '',
        });
      }
      if (tRes.data) setThreads(tRes.data as Thread[]);
      setFollowerCount(foRes.count ?? pRes.data?.follower_count ?? 0);
      setFollowingCount(fgRes.count ?? pRes.data?.following_count ?? 0);
    } catch (e) {
      console.error('[ProfileView]', e);
    } finally {
      setLoading(false);
    }
  }, [profileId, sb]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!currentUser || currentUser.id === profileId) return;
    (async () => {
      const { data } = await sb
        .from('follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', profileId)
        .maybeSingle();
      setFollowing(!!data);
    })();
  }, [profileId, currentUser, sb]);

  const loadPeople = useCallback(async (mode: 'followers' | 'following') => {
    try {
      if (mode === 'followers') {
        const { data } = await sb
          .from('follows')
          .select('follower:profiles!follows_follower_id_fkey(id, full_name, username, avatar_url, county, verified)')
          .eq('following_id', profileId)
          .limit(50);
        const list = (data || [])
          .map((r: { follower: MiniProfile | MiniProfile[] | null }) =>
            Array.isArray(r.follower) ? r.follower[0] : r.follower
          )
          .filter(Boolean) as MiniProfile[];
        setFollowers(list);
      } else {
        const { data } = await sb
          .from('follows')
          .select('following:profiles!follows_following_id_fkey(id, full_name, username, avatar_url, county, verified)')
          .eq('follower_id', profileId)
          .limit(50);
        const list = (data || [])
          .map((r: { following: MiniProfile | MiniProfile[] | null }) =>
            Array.isArray(r.following) ? r.following[0] : r.following
          )
          .filter(Boolean) as MiniProfile[];
        setFollowingList(list);
      }
    } catch (e) {
      console.error('[ProfileView] loadPeople', e);
    }
  }, [profileId, sb]);

  useEffect(() => {
    if (activeTab === 'followers') void loadPeople('followers');
    if (activeTab === 'following') void loadPeople('following');
  }, [activeTab, loadPeople]);

  const handleFollow = async () => {
    if (!currentUser || !profile || followBusy) return;
    setFollowBusy(true);
    try {
      if (following) {
        await sb.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', profileId);
        setFollowing(false);
        setFollowerCount(c => Math.max(0, c - 1));
        show(tr('Unfollowed', 'Umeacha kufuata'));
      } else {
        await sb.from('follows').insert({ follower_id: currentUser.id, following_id: profileId });
        setFollowing(true);
        setFollowerCount(c => c + 1);
        show(tr('Following', 'Unafuata sasa'));
        try {
          await sb.from('notifications').insert({
            user_id: profileId,
            actor_id: currentUser.id,
            type: 'follow',
            title: `${currentUser.full_name} started following you`,
          });
        } catch { /* optional */ }
      }
    } catch (e) {
      show(e instanceof Error ? e.message : 'Could not update follow');
    } finally {
      setFollowBusy(false);
    }
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: profile?.full_name, url });
      } else {
        await navigator.clipboard.writeText(url);
        show(tr('Link copied', 'Kiungo kimenakiliwa'));
      }
    } catch { /* cancelled */ }
  };

  const handleSave = async () => {
    if (!currentUser || !profile) return;
    setSaving(true);
    try {
      const updates: Partial<Profile> & { cover_url?: string } = {
        full_name: editData.full_name.trim(),
        bio: editData.bio.trim(),
        county: editData.county,
        interests: editData.interests.split(',').map(s => s.trim()).filter(Boolean),
        phone: editData.phone.trim() || undefined,
      };
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() || 'jpg';
        const fname = `${currentUser.id}/avatar-${Date.now()}.${ext}`;
        const { error: upErr } = await sb.storage.from('avatars').upload(fname, avatarFile, { upsert: true });
        if (!upErr) {
          const { data: { publicUrl } } = sb.storage.from('avatars').getPublicUrl(fname);
          updates.avatar_url = publicUrl;
        } else {
          show(upErr.message);
        }
      }
      const { error } = await sb.from('profiles').update(updates).eq('id', profileId);
      if (error) {
        show(error.message);
        return;
      }
      setProfile(prev => (prev ? { ...prev, ...updates } : null));
      setEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      show(tr('Profile updated', 'Wasifu umesasishwa'));
    } catch (e) {
      show(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      show('Image must be under 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      show('Please select an image');
      return;
    }
    setCropFile(file);
  };

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    if (file.size > 8 * 1024 * 1024) {
      show('Cover must be under 8MB');
      return;
    }
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${currentUser.id}/cover-${Date.now()}.${ext}`;
      const { error } = await sb.storage.from('avatars').upload(path, file, { upsert: true });
      if (error) {
        show(error.message);
        return;
      }
      const { data: { publicUrl } } = sb.storage.from('avatars').getPublicUrl(path);
      setCoverUrl(publicUrl);
      // Best-effort persist if column exists
      await sb.from('profiles').update({ cover_url: publicUrl } as never).eq('id', profileId);
      show(tr('Cover updated', 'Jalada limesasishwa'));
    } catch (err) {
      show(err instanceof Error ? err.message : 'Cover upload failed');
    }
  };

  const handleCropDone = (blob: Blob) => {
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(blob));
    setCropFile(null);
  };

  const photos = useMemo(() => {
    const urls: string[] = [];
    threads.forEach(t => {
      (t.media_urls || []).forEach(u => {
        if (u && !urls.includes(u)) urls.push(u);
      });
    });
    if (profile?.avatar_url) urls.unshift(profile.avatar_url);
    return urls.slice(0, 24);
  }, [threads, profile?.avatar_url]);

  if (loading) return <LoadingSpinner />;
  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-500">
        {tr('User not found.', 'Mtumiwa haikupatikana.')}
      </div>
    );
  }

  const level = heshimaLevel(profile.heshima_score);
  const displayAvatar = avatarPreview || profile.avatar_url;
  const postCount = threads.length || profile.post_count || 0;

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'posts', label: tr('Posts', 'Machapisho'), count: postCount },
    { id: 'about', label: tr('About', 'Kuhusu') },
    { id: 'photos', label: tr('Photos', 'Picha'), count: photos.length },
    { id: 'followers', label: tr('Followers', 'Wafuasi'), count: followerCount },
    { id: 'following', label: tr('Following', 'Anafuata'), count: followingCount },
  ];

  return (
    <div className="w-full bg-gray-100 dark:bg-[#0a0a0a] min-h-screen pb-24">
      {cropFile && (
        <ImageCropper file={cropFile} onCrop={handleCropDone} onCancel={() => setCropFile(null)} />
      )}

      {/* ===== COVER + HEADER (Facebook-style) ===== */}
      <div className="bg-white dark:bg-[#18191a] shadow-sm">
        <div className="max-w-5xl mx-auto">
          {/* Cover */}
          <div className="relative h-48 sm:h-64 md:h-72 rounded-b-xl overflow-hidden mx-0 sm:mx-4 bg-gradient-to-br from-[#3a1c12] via-[#8B4513] to-[#cc5b47]">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 opacity-40">
                <div className="absolute top-8 right-16 w-40 h-40 rounded-full bg-amber-300/30 blur-3xl" />
                <div className="absolute bottom-4 left-10 w-56 h-24 rounded-full bg-orange-500/20 blur-2xl" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {isOwnProfile && (
              <label className="absolute bottom-3 right-3 sm:right-6 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/95 dark:bg-gray-900/90 text-xs font-bold shadow-md cursor-pointer hover:bg-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {tr('Edit cover', 'Hariri jalada')}
                <input type="file" accept="image/*" className="sr-only" onChange={handleCoverSelect} />
              </label>
            )}
          </div>

          {/* Avatar + identity row */}
          <div className="relative px-4 sm:px-6 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-5 -mt-16 sm:-mt-20">
              {/* Avatar */}
              <div className="relative shrink-0 self-center sm:self-auto">
                <div
                  className={cn(
                    'w-32 h-32 sm:w-40 sm:h-40 rounded-full ring-4 ring-white dark:ring-[#18191a] overflow-hidden shadow-xl flex items-center justify-center text-4xl font-black text-white',
                    getAvatarColor(profile.full_name)
                  )}
                >
                  {displayAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={displayAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(profile.full_name)
                  )}
                </div>
                {isOwnProfile && (
                  <label className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-[#18191a] flex items-center justify-center cursor-pointer hover:bg-gray-300 shadow-md">
                    <svg className="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarSelect} />
                  </label>
                )}
              </div>

              {/* Name + stats */}
              <div className="flex-1 min-w-0 text-center sm:text-left pb-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
                    {profile.full_name}
                  </h1>
                  {profile.verified && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-[10px]" title="Verified">✓</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">@{profile.username}</p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 mt-2 text-sm text-gray-600 dark:text-gray-300">
                  <button type="button" onClick={() => setActiveTab('followers')} className="hover:underline">
                    <strong className="text-gray-900 dark:text-white">{formatNumber(followerCount)}</strong>{' '}
                    {tr('followers', 'wafuasi')}
                  </button>
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  <button type="button" onClick={() => setActiveTab('following')} className="hover:underline">
                    <strong className="text-gray-900 dark:text-white">{formatNumber(followingCount)}</strong>{' '}
                    {tr('following', 'anafuata')}
                  </button>
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  <button type="button" onClick={() => setActiveTab('posts')} className="hover:underline">
                    <strong className="text-gray-900 dark:text-white">{formatNumber(postCount)}</strong>{' '}
                    {tr('posts', 'machapisho')}
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                  <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800', level.color)}>
                    {level.icon} {level.name} · {formatNumber(profile.heshima_score)} Heshima
                  </span>
                  <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full uppercase', roleBadge(profile.role))}>
                    {profile.role}
                  </span>
                  {profile.county && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">📍 {profile.county}</span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 pb-2 shrink-0">
                {isOwnProfile ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditing(v => !v)}
                      className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors min-h-[40px]"
                    >
                      {editing ? tr('Cancel', 'Ghairi') : tr('Edit profile', 'Hariri wasifu')}
                    </button>
                    <Link
                      href="/settings"
                      className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors min-h-[40px] flex items-center"
                    >
                      {tr('Settings', 'Mipangilio')}
                    </Link>
                  </>
                ) : currentUser ? (
                  <>
                    <button
                      type="button"
                      onClick={handleFollow}
                      disabled={followBusy}
                      className={cn(
                        'px-5 py-2 rounded-lg text-sm font-bold min-h-[40px] transition-colors disabled:opacity-50',
                        following
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300'
                          : 'bg-[#0866FF] hover:bg-[#0759db] text-white shadow-sm'
                      )}
                    >
                      {following ? tr('Following', 'Unafuata') : `+ ${tr('Follow', 'Fuata')}`}
                    </button>
                    <Link
                      href={`/chat/${profileId}`}
                      className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-300 min-h-[40px] flex items-center"
                    >
                      {tr('Message', 'Ujumbe')}
                    </Link>
                  </>
                ) : null}

                <button
                  type="button"
                  onClick={handleShare}
                  className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600"
                  aria-label="Share"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen(v => !v)}
                    className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600"
                    aria-label="More"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl py-1 z-20">
                      <button
                        type="button"
                        onClick={() => { setActiveTab('about'); setMenuOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        {tr('View about', 'Angalia kuhusu')}
                      </button>
                      <button
                        type="button"
                        onClick={() => { handleShare(); setMenuOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        {tr('Copy profile link', 'Nakili kiungo')}
                      </button>
                      {!isOwnProfile && (
                        <button
                          type="button"
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => { show(tr('Report submitted to moderators', 'Ripoti imetumwa')); setMenuOpen(false); }}
                        >
                          {tr('Report profile', 'Ripoti wasifu')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Edit panel */}
            {isOwnProfile && editing && (
              <div className="mt-4 p-4 sm:p-5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 space-y-4">
                <h3 className="font-bold text-sm">{tr('Edit profile', 'Hariri wasifu')}</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">{tr('Name', 'Jina')}</label>
                    <input
                      value={editData.full_name}
                      onChange={e => setEditData(d => ({ ...d, full_name: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0866FF]/40"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">{tr('Bio', 'Wasifu')}</label>
                    <textarea
                      value={editData.bio}
                      onChange={e => setEditData(d => ({ ...d, bio: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0866FF]/40"
                      placeholder={tr('Tell people about yourself…', 'Waambie kuhusu wewe…')}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">{tr('County', 'Kaunti')}</label>
                    <select
                      value={editData.county}
                      onChange={e => setEditData(d => ({ ...d, county: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                    >
                      <option value="">—</option>
                      {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">{tr('Phone', 'Simu')}</label>
                    <input
                      value={editData.phone}
                      onChange={e => setEditData(d => ({ ...d, phone: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">{tr('Interests', 'Vipendee')}</label>
                    <input
                      value={editData.interests}
                      onChange={e => setEditData(d => ({ ...d, interests: e.target.value }))}
                      placeholder="farming, tech, culture"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-lg bg-[#0866FF] text-white text-sm font-bold hover:bg-[#0759db] disabled:opacity-50"
                  >
                    {saving ? tr('Saving…', 'Inahifadhi…') : tr('Save', 'Hifadhi')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditing(false); setAvatarFile(null); setAvatarPreview(null); }}
                    className="px-5 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm font-semibold"
                  >
                    {tr('Cancel', 'Ghairi')}
                  </button>
                </div>
              </div>
            )}

            {/* Sticky-ish tab bar */}
            <div className="mt-3 border-t border-gray-200 dark:border-gray-800 overflow-x-auto scrollbar-hide">
              <nav className="flex gap-1 min-w-max" aria-label="Profile sections">
                {tabs.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={cn(
                      'relative px-4 sm:px-5 py-3.5 text-sm font-semibold transition-colors whitespace-nowrap',
                      activeTab === t.id
                        ? 'text-[#0866FF]'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    )}
                  >
                    {t.label}
                    {t.count !== undefined && (
                      <span className="ml-1.5 text-xs font-bold text-gray-400">{t.count}</span>
                    )}
                    {activeTab === t.id && (
                      <span className="absolute left-2 right-2 bottom-0 h-[3px] rounded-t bg-[#0866FF]" />
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* ===== BODY: intro + content ===== */}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 grid lg:grid-cols-[340px_1fr] gap-4">
        {/* Left intro column */}
        <aside className="space-y-3 lg:sticky lg:top-20 self-start">
          <div className="bg-white dark:bg-[#18191a] rounded-xl shadow-sm p-4 space-y-3">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">{tr('Intro', 'Utangulizi')}</h2>
            {profile.bio ? (
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">{tr('No bio yet.', 'Hakuna wasifu bado.')}</p>
            )}
            <ul className="space-y-2.5 text-sm text-gray-600 dark:text-gray-300">
              {profile.county && (
                <li className="flex items-center gap-2">
                  <span className="text-lg">📍</span>
                  <span>{tr('Lives in', 'Anaishi')} <strong>{profile.county}</strong></span>
                </li>
              )}
              <li className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <span>{formatNumber(profile.heshima_score)} Heshima · {level.name}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lg">📅</span>
                <span>
                  {tr('Joined', 'Alijiunga')}{' '}
                  {new Date(profile.created_at).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}
                </span>
              </li>
              {profile.interests?.length > 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-lg">💡</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.interests.map(i => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium">{i}</span>
                    ))}
                  </div>
                </li>
              )}
            </ul>
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="w-full py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {tr('Edit details', 'Hariri maelezo')}
              </button>
            )}
          </div>

          {/* Photos preview card */}
          {photos.length > 0 && (
            <div className="bg-white dark:bg-[#18191a] rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-lg text-gray-900 dark:text-white">{tr('Photos', 'Picha')}</h2>
                <button type="button" onClick={() => setActiveTab('photos')} className="text-sm text-[#0866FF] font-semibold hover:underline">
                  {tr('See all', 'Ona zote')}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1 rounded-lg overflow-hidden">
                {photos.slice(0, 9).map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt="" className="aspect-square object-cover w-full h-full" />
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main feed column */}
        <main className="space-y-3 min-w-0">
          {activeTab === 'posts' && (
            <>
              {isOwnProfile && (
                <Link
                  href="/feed"
                  className="flex items-center gap-3 bg-white dark:bg-[#18191a] rounded-xl shadow-sm p-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0', getAvatarColor(profile.full_name))}>
                    {displayAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={displayAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : getInitials(profile.full_name)}
                  </div>
                  <div className="flex-1 py-2.5 px-4 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-500">
                    {tr("What's on your mind?", 'Unafikiria nini?')}
                  </div>
                </Link>
              )}

              {threads.length === 0 ? (
                <div className="bg-white dark:bg-[#18191a] rounded-xl shadow-sm p-12 text-center">
                  <p className="text-4xl mb-3">📝</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{tr('No posts yet', 'Hakuna machapisho bado')}</p>
                  <p className="text-sm text-gray-500 mt-1">{tr('Posts will appear here.', 'Machapisho yataonekana hapa.')}</p>
                  {isOwnProfile && (
                    <Link href="/feed" className="inline-block mt-4 px-5 py-2.5 rounded-lg bg-[#0866FF] text-white text-sm font-bold">
                      {tr('Create post', 'Andika chapisho')}
                    </Link>
                  )}
                </div>
              ) : (
                threads.map(t => (
                  <article key={t.id} className="bg-white dark:bg-[#18191a] rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 flex items-start gap-3">
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0', getAvatarColor(profile.full_name))}>
                        {displayAvatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={displayAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : getInitials(profile.full_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{profile.full_name}</p>
                        <p className="text-xs text-gray-500">
                          {timeAgo(t.created_at)}
                          {t.space?.name ? ` · ${t.space.name}` : ''}
                          {t.county ? ` · ${t.county}` : ''}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                        {t.type}
                      </span>
                    </div>
                    <Link href={`/thread/${t.id}`} className="block px-4 pb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{t.title}</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-4 whitespace-pre-wrap">{t.content}</p>
                      {t.media_urls?.[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.media_urls[0]} alt="" className="mt-3 w-full max-h-80 object-cover rounded-lg" />
                      )}
                    </Link>
                    <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
                      <span>▲ {formatNumber(t.upvotes_count)} · 💬 {formatNumber(t.reply_count)}</span>
                      <Link href={`/thread/${t.id}`} className="font-semibold text-[#0866FF] hover:underline">
                        {tr('View', 'Angalia')}
                      </Link>
                    </div>
                  </article>
                ))
              )}
            </>
          )}

          {activeTab === 'about' && (
            <div className="bg-white dark:bg-[#18191a] rounded-xl shadow-sm p-5 space-y-5">
              <h2 className="font-bold text-xl text-gray-900 dark:text-white">{tr('About', 'Kuhusu')}</h2>
              {profile.bio && (
                <section>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">{tr('Bio', 'Wasifu')}</h3>
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{profile.bio}</p>
                </section>
              )}
              <section className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">{tr('County', 'Kaunti')}</p>
                  <p className="mt-1">{profile.county || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">{tr('Role', 'Wadhifa')}</p>
                  <p className="mt-1 capitalize">{profile.role}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Heshima</p>
                  <p className="mt-1">{formatNumber(profile.heshima_score)} ({level.name})</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">{tr('Member since', 'Mwanachama tangu')}</p>
                  <p className="mt-1">{new Date(profile.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                {isOwnProfile && profile.phone && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">{tr('Phone', 'Simu')}</p>
                    <p className="mt-1">{profile.phone}</p>
                  </div>
                )}
              </section>
              {profile.interests?.length > 0 && (
                <section>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">{tr('Interests', 'Vipendee')}</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map(i => (
                      <span key={i} className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-semibold">{i}</span>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="bg-white dark:bg-[#18191a] rounded-xl shadow-sm p-4">
              <h2 className="font-bold text-xl text-gray-900 dark:text-white mb-3">{tr('Photos', 'Picha')}</h2>
              {photos.length === 0 ? (
                <p className="text-sm text-gray-500 py-10 text-center">{tr('No photos yet.', 'Hakuna picha bado.')}</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {photos.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={url} alt="" className="aspect-square object-cover rounded-lg w-full" />
                  ))}
                </div>
              )}
            </div>
          )}

          {(activeTab === 'followers' || activeTab === 'following') && (
            <div className="bg-white dark:bg-[#18191a] rounded-xl shadow-sm p-4">
              <h2 className="font-bold text-xl text-gray-900 dark:text-white mb-3">
                {activeTab === 'followers' ? tr('Followers', 'Wafuasi') : tr('Following', 'Anafuata')}
              </h2>
              {(activeTab === 'followers' ? followers : followingList).length === 0 ? (
                <p className="text-sm text-gray-500 py-10 text-center">
                  {tr('No one here yet.', 'Hakuna mtu bado.')}
                </p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(activeTab === 'followers' ? followers : followingList).map(p => (
                    <li key={p.id}>
                      <Link href={`/profile/${p.id}`} className="flex items-center gap-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 px-1 rounded-lg">
                        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0 overflow-hidden', getAvatarColor(p.full_name))}>
                          {p.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : getInitials(p.full_name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                            {p.full_name}{p.verified ? ' ✓' : ''}
                          </p>
                          <p className="text-xs text-gray-500 truncate">@{p.username}{p.county ? ` · ${p.county}` : ''}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
