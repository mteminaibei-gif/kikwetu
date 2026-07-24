'use client';

import { useEffect, useState, useRef } from 'react';
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
  const [lang, setLang] = useState<'en' | 'sw'>('en');
  const tr = (en: string, sw: string) => lang === 'sw' ? sw : en;

  const sbRef = useRef(createClient());
  const sb = sbRef.current;

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, tRes] = await Promise.all([
          sb.from('profiles').select('*').eq('id', profileId).single(),
          sb.from('threads').select('*, space:spaces(name)').eq('author_id', profileId).order('created_at', { ascending: false }).limit(20),
        ]);
        if (pRes.data) {
          setProfile(pRes.data as Profile);
          setIsOwnProfile(currentUser?.id === profileId);
        }
        if (tRes.data) setThreads(tRes.data as Thread[]);
      } catch (e) {
        console.error('[ProfileView] load error:', e);
      }
      setLoading(false);
    };
    load();

    if (currentUser && currentUser.id !== profileId) {
      (async () => {
        try {
          const { data } = await sb.from('follows').select('id').eq('follower_id', currentUser.id).eq('following_id', profileId).maybeSingle();
          setFollowing(!!data);
        } catch {
          setFollowing(false);
        }
      })();
    }
  }, [profileId, currentUser]);

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
      {/* Banner cover with savannah sunset */}
      <div className="rounded-2xl overflow-hidden sun-card p-0">
        <div className="h-40 sm:h-52 bg-gradient-to-br from-brand-warm/30 via-brand-amber/20 to-brand-terracotta/30 relative overflow-hidden">
          <div className="absolute -bottom-6 -right-6 w-40 h-40 rounded-full bg-brand-warm/10 blur-2xl" />
          <div className="absolute top-4 right-[15%] w-20 h-20 rounded-full bg-brand-warm/15 blur-xl" />
          {/* Bird silhouettes on banner */}
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
            <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-xl ring-4 ring-white dark:ring-brand-cardDark ${getAvatarColor(profile.full_name)}`}>
              {getInitials(profile.full_name)}
            </div>
          </div>
        </div>
        <div className="pt-16 pb-6 px-6 sm:px-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-black">{profile.full_name}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">@{profile.username}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-xs font-bold ${level.color}`}>{level.name}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${roleBadge(profile.role)}`}>{profile.role}</span>
              </div>
            </div>
            {currentUser && !isOwnProfile && (
              <button onClick={handleFollow}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                  following ? 'border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-transparent' : 'sun-btn'
                }`}>
                {following ? tr('Anafuata', 'Following') : tr('Fuata', 'Follow')}
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

          <div className="grid grid-cols-5 gap-3 mt-6 py-5 border-y border-gray-100 dark:border-gray-800">
            {[
              { label: tr('Heshima', 'Karma'), value: formatNumber(profile.heshima_score), color: 'text-brand-red' },
              { label: tr('Machapisho', 'Posts'), value: profile.post_count, color: 'text-brand-deep' },
              { label: tr('Majibu', 'Answers'), value: profile.answer_count, color: 'text-brand-terracotta' },
              { label: tr('Wafuasi', 'Followers'), value: profile.follower_count, color: 'text-brand-deep' },
              { label: tr('Anafuata', 'Following'), value: profile.following_count, color: 'text-brand-terracotta' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
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
        </div>
      </div>

      {/* Recent Posts */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 sun-tag w-fit">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
          <span className="text-xs font-bold">{tr('Machapisho Ya Hivi Karibuni', 'Recent Posts')}</span>
        </div>
        {threads.length === 0 ? (
          <div className="sun-card p-10 text-center">
            <span className="text-3xl block mb-2">📝</span>
            <p className="text-sm text-gray-400">{tr('Hakuna machapisho bado.', 'No posts yet.')}</p>
          </div>
        ) : (
          threads.map(t => (
            <Link key={t.id} href={`/thread/${t.id}`}
              className="sun-card p-5 block hover:-translate-y-0.5 transition-all">
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
      </div>
    </div>
  );
}
