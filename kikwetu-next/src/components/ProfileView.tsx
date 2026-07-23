'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import { timeAgo, formatNumber, getInitials, getAvatarColor, heshimaLevel, roleBadge } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import type { Profile, Thread } from '@/types';

interface Props {
  profileId: string;
}

export default function ProfileView({ profileId }: Props) {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const sb = createClient();

  useEffect(() => {
    const load = async () => {
      const [pRes, tRes] = await Promise.all([
        sb.from('profiles').select('*').eq('id', profileId).single(),
        sb.from('threads').select('*, space:spaces(name)').eq('author_id', profileId).order('created_at', { ascending: false }).limit(20),
      ]);
      if (pRes.data) {
        setProfile(pRes.data as Profile);
        setIsOwnProfile(currentUser?.id === profileId);
      }
      if (tRes.data) setThreads(tRes.data as Thread[]);
      setLoading(false);
    };
    load();

    if (currentUser && currentUser.id !== profileId) {
      sb.from('follows').select('id').eq('follower_id', currentUser.id).eq('following_id', profileId).single()
        .then(({ data }) => setFollowing(!!data));
    }
  }, [profileId, currentUser, sb]);

  const handleFollow = async () => {
    if (!currentUser || !profile) return;
    if (following) {
      await sb.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', profileId);
      setFollowing(false);
    } else {
      await sb.from('follows').insert({ follower_id: currentUser.id, following_id: profileId });
      setFollowing(true);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!profile) return <div className="text-center py-12 text-gray-400">User not found.</div>;

  const level = heshimaLevel(profile.heshima_score);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white ${getAvatarColor(profile.full_name)}`}>
              {getInitials(profile.full_name)}
            </div>
            <div>
              <h1 className="text-lg font-black">{profile.full_name}</h1>
              <p className="text-sm text-gray-500">@{profile.username}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-bold ${level.color}`}>{level.name}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${roleBadge(profile.role)}`}>{profile.role}</span>
              </div>
            </div>
          </div>
          {currentUser && !isOwnProfile && (
            <button onClick={handleFollow}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                following ? 'border border-gray-300 dark:border-gray-700 text-gray-500' : 'bg-orange-500 text-white hover:bg-orange-400'
              }`}>
              {following ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        {profile.county && (
          <p className="text-sm text-gray-500 mt-3 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {profile.county} County
          </p>
        )}

        <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          {[
            { label: 'Heshima', value: formatNumber(profile.heshima_score) },
            { label: 'Posts', value: profile.post_count },
            { label: 'Answers', value: profile.answer_count },
            { label: 'Followers', value: profile.follower_count },
            { label: 'Following', value: profile.following_count },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-black">{s.value}</p>
              <p className="text-[10px] text-gray-400 font-medium uppercase">{s.label}</p>
            </div>
          ))}
        </div>

        {profile.badges && profile.badges.length > 0 && (
          <div className="flex gap-2 mt-3">
            {profile.badges.map(b => (
              <span key={b} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                {b}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-sm">Recent Posts</h3>
        {threads.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No posts yet.</p>
        ) : (
          threads.map(t => (
            <Link key={t.id} href={`/thread/${t.id}`}
              className="block p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
              <h4 className="font-bold text-sm line-clamp-1">{t.title}</h4>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.content}</p>
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                <span className="text-[10px] font-bold uppercase">{t.type}</span>
                <span>· {timeAgo(t.created_at)}</span>
                <span>· {t.upvotes_count} votes</span>
                <span>· {t.reply_count} replies</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
