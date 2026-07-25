'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase';
import { timeAgo, cn } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { Profile } from '@/types';

interface Community {
  id: string; name: string; county: string; description: string;
  memberCount: number; isPrivate?: boolean; inviteCode?: string;
  created_at: string;
}

interface GroupPost {
  id: string; author_id: string; content: string; category: string;
  urgent: boolean; created_at: string;
  author?: { full_name: string; avatar_url?: string; username?: string };
  replies: { id: string; content: string; author: { full_name: string }; created_at: string }[];
}

interface GroupMember {
  user_id: string; joined_at: string;
  profile?: { full_name: string; avatar_url?: string; username?: string; heshima_score?: number };
}

interface Props {
  community: Community;
  onBack: () => void;
}

export default function NyumbaKumiGroupView({ community, onBack }: Props) {
  const { user } = useAuth();
  const { tr } = useLanguage();
  const { show } = useToast();
  const sbRef = useRef(createClient());
  const sb = sbRef.current;

  const [tab, setTab] = useState<'feed' | 'members' | 'info'>('feed');
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [followingMembers, setFollowingMembers] = useState<Set<string>>(new Set());

  const loadPosts = useCallback(async () => {
    const { data } = await sb.from('nyumba_kumi_posts')
      .select('*, author:profiles(full_name, avatar_url, username), replies:nyumba_kumi_replies(*, author:profiles(full_name))')
      .eq('county', community.county)
      .order('urgent', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setPosts(data as GroupPost[]);
    setLoading(false);
  }, [sb, community.county]);

  const loadMembers = useCallback(async () => {
    const { data } = await sb.from('nyumba_kumi_community_members')
      .select('user_id, joined_at, profile:profiles(full_name, avatar_url, username, heshima_score)')
      .eq('community_id', community.id)
      .order('joined_at', { ascending: false });
    if (data) setMembers(data as unknown as GroupMember[]);
  }, [sb, community.id]);

  useEffect(() => { loadPosts(); loadMembers(); }, [loadPosts, loadMembers]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await sb.from('follows').select('following_id').eq('follower_id', user.id);
      if (data) setFollowingMembers(new Set(data.map((d: { following_id: string }) => d.following_id)));
    })();
  }, [user, sb]);

  const handlePost = async () => {
    if (!content.trim() || !user) return;
    setPosting(true);
    const { error } = await sb.from('nyumba_kumi_posts').insert({
      author_id: user.id, content: content.trim(), category: 'general',
      county: community.county, urgent: false,
    });
    setPosting(false);
    if (error) { show(error.message); return; }
    show('Posted!');
    setContent('');
    loadPosts();
  };

  const handleReply = async (postId: string) => {
    if (!replyContent.trim() || !user) return;
    const { error } = await sb.from('nyumba_kumi_replies').insert({
      post_id: postId, author_id: user.id, content: replyContent.trim(),
    });
    if (error) { show(error.message); return; }
    setReplyContent(''); setReplyTo(null);
    loadPosts();
  };

  const handleFollow = async (userId: string) => {
    if (!user || userId === user.id) return;
    const isFollowing = followingMembers.has(userId);
    if (isFollowing) {
      await sb.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId);
      setFollowingMembers(prev => { const n = new Set(prev); n.delete(userId); return n; });
      show('Unfollowed');
    } else {
      await sb.from('follows').insert({ follower_id: user.id, following_id: userId });
      setFollowingMembers(prev => new Set(prev).add(userId));
      show('Following');
    }
  };

  const sharePost = (post: GroupPost) => {
    const msg = `${post.content}\n\n— ${post.author?.full_name || 'Member'} on ${community.name}\n${typeof window !== 'undefined' ? window.location.origin : ''}/nyumba-kumi`;
    if (navigator.share) {
      navigator.share({ title: community.name, text: msg }).catch(() => {});
    } else {
      navigator.clipboard.writeText(msg).then(() => show('Copied to clipboard!'));
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 p-5 sm:p-6 rounded-2xl text-white relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-amber-500/10 blur-2xl" />
        <div className="relative z-10">
          <button onClick={onBack} className="flex items-center gap-1.5 text-amber-200 hover:text-white text-xs font-bold mb-3 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            {tr('Rudi', 'Back')}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-2xl shadow-lg">
              {community.isPrivate ? '🔒' : '🏘️'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black truncate">{community.name}</h2>
              <p className="text-xs text-amber-200 mt-0.5">{community.county} · {community.memberCount} {tr('wanachama', 'members')}</p>
            </div>
          </div>
          <p className="text-xs text-amber-100/80 mt-3 leading-relaxed">{community.description}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800 overflow-x-auto scrollbar-hide">
        {([
          { id: 'feed' as const, label: tr('Machapisho', 'Feed'), icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
          { id: 'members' as const, label: tr('Wanachama', 'Members'), icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
          { id: 'info' as const, label: tr('Taarifa', 'Info'), icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all',
              tab === t.id ? 'border-amber-600 text-amber-700 dark:text-amber-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} /></svg>
            {t.label}
          </button>
        ))}
      </div>

      {/* FEED TAB */}
      {tab === 'feed' && (
        <div className="space-y-4">
          {/* New Post */}
          {user && (
            <div className="sun-card p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-terracotta to-brand-red flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                  {user.avatar_url ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" /> : user.full_name?.[0] || '?'}
                </div>
                <textarea value={content} onChange={e => setContent(e.target.value)}
                  rows={2} placeholder={tr('Andika kitu kwa jamii...', 'Share something with the community...')}
                  className="flex-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none" />
              </div>
              <div className="flex justify-end">
                <button onClick={handlePost} disabled={posting || !content.trim()}
                  className="sun-btn px-5 py-2 rounded-xl text-xs font-bold shadow-sm disabled:opacity-50">
                  {posting ? '...' : tr('Chapisha', 'Post')}
                </button>
              </div>
            </div>
          )}

          {loading ? <LoadingSpinner /> : posts.length === 0 ? (
            <div className="sun-card p-12 text-center">
              <span className="text-4xl block mb-3">🏘️</span>
              <p className="text-sm text-gray-400">{tr('Hakuna machapisho bado.', 'No posts yet.')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className={`sun-card p-4 sm:p-5 space-y-3 ${post.urgent ? 'border-l-4 border-l-red-500' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0">
                        {post.author?.avatar_url ? <img src={post.author.avatar_url} alt="" className="h-full w-full object-cover" /> : post.author?.full_name?.[0] || '?'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold">{post.author?.full_name || 'Anonymous'}</span>
                          {post.author?.username && <span className="text-[10px] text-gray-400">@{post.author.username}</span>}
                          {post.urgent && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold animate-pulse">URGENT</span>}
                        </div>
                        <p className="text-[10px] text-gray-400">{timeAgo(post.created_at)}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{post.content}</p>
                  <div className="flex items-center gap-3 text-[10px]">
                    {post.author_id !== user?.id && post.author_id && (
                      <button onClick={() => handleFollow(post.author_id)}
                        className={cn('font-bold transition-colors',
                          followingMembers.has(post.author_id)
                            ? 'text-gray-400 hover:text-gray-600'
                            : 'text-amber-600 hover:text-amber-700'
                        )}>
                        {followingMembers.has(post.author_id) ? tr('Unfollow', 'Acha') : tr('Follow', 'Fuata')}
                      </button>
                    )}
                    <button onClick={() => sharePost(post)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-bold flex items-center gap-1 transition-colors">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                      {tr('Shiriki', 'Share')}
                    </button>
                    <button onClick={() => setReplyTo(replyTo === post.id ? null : post.id)}
                      className="text-amber-600 hover:text-amber-700 font-bold transition-colors">
                      💬 {tr('Jibu', 'Reply')}
                    </button>
                  </div>
                  {/* Replies */}
                  {(post.replies || []).length > 0 && (
                    <div className="pl-4 border-l-2 border-gray-100 dark:border-gray-800 space-y-2 mt-1">
                      {post.replies.map(reply => (
                        <div key={reply.id} className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-bold text-gray-700 dark:text-gray-300">{reply.author?.full_name || '?'}:</span> {reply.content}
                        </div>
                      ))}
                    </div>
                  )}
                  {replyTo === post.id && (
                    <div className="flex gap-2 pt-1">
                      <input value={replyContent} onChange={e => setReplyContent(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleReply(post.id)}
                        placeholder={tr('Andika jibu...', 'Write reply...')}
                        className="flex-1 p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
                      <button onClick={() => handleReply(post.id)} className="px-4 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors">
                        {tr('Tuma', 'Send')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MEMBERS TAB */}
      {tab === 'members' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">{members.length} {tr('wanachama', 'members')}</p>
          {members.length === 0 ? (
            <div className="sun-card p-10 text-center">
              <span className="text-3xl block mb-2">👥</span>
              <p className="text-sm text-gray-400">{tr('Bado hakuna wanachama.', 'No members yet.')}</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {members.map(m => (
                <div key={m.user_id} className="sun-card p-4 flex items-center gap-3 hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-sm font-bold text-white overflow-hidden shrink-0">
                    {m.profile?.avatar_url ? <img src={m.profile.avatar_url} alt="" className="h-full w-full object-cover" /> : m.profile?.full_name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{m.profile?.full_name || 'Member'}</p>
                    {m.profile?.username && <p className="text-[10px] text-gray-400">@{m.profile.username}</p>}
                    {m.profile?.heshima_score !== undefined && (
                      <p className="text-[10px] text-amber-600 font-bold">⚡ {Number(m.profile.heshima_score)} Heshima</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {m.user_id !== user?.id && (
                      <button onClick={() => handleFollow(m.user_id)}
                        className={cn('px-3 py-1.5 rounded-full text-[10px] font-bold transition-all',
                          followingMembers.has(m.user_id)
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                            : 'bg-amber-600 text-white hover:bg-amber-700'
                        )}>
                        {followingMembers.has(m.user_id) ? tr('Following', 'Unfollow') : tr('Follow', 'Fuata')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* INFO TAB */}
      {tab === 'info' && (
        <div className="space-y-4">
          <div className="sun-card p-5 space-y-3">
            <h4 className="font-bold text-sm flex items-center gap-2 text-brand-deep">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {tr('Kuhusu', 'About')}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{community.description}</p>
          </div>
          <div className="sun-card p-5 space-y-3">
            <h4 className="font-bold text-sm flex items-center gap-2 text-brand-deep">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
              {tr('Eneo', 'Location')}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">{community.county} County</p>
          </div>
          <div className="sun-card p-5 space-y-3">
            <h4 className="font-bold text-sm flex items-center gap-2 text-brand-deep">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {tr('Wanachama', 'Members')}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">{community.memberCount}</p>
          </div>
          <div className="sun-card p-5 space-y-3">
            <h4 className="font-bold text-sm flex items-center gap-2 text-brand-deep">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              {tr('Dharura', 'Emergency')}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">112 · 999</p>
          </div>
          <div className="sun-card p-5 space-y-3">
            <h4 className="font-bold text-sm flex items-center gap-2 text-brand-deep">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {tr('Ilianzishwa', 'Created')}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">{new Date(community.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          {community.isPrivate && community.inviteCode && (
            <div className="sun-card p-5 space-y-3 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <h4 className="font-bold text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
                🔒 {tr('Msimbo wa Karibu', 'Invite Code')}
              </h4>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center font-mono text-xl font-black tracking-widest text-amber-600">
                {community.inviteCode}
              </div>
              <button onClick={() => {
                navigator.clipboard.writeText(community.inviteCode || '');
                show('Code copied!');
              }} className="w-full sun-btn py-2.5 rounded-xl text-xs font-bold">
                {tr('Nakili Msimbo', 'Copy Code')}
              </button>
            </div>
          )}
          {/* Emergency Contacts */}
          <div className="sun-card p-5 space-y-3">
            <h4 className="font-bold text-sm flex items-center gap-2 text-red-600">
              🚨 {tr('Nambari za Dharura', 'Emergency Numbers')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {[{ name: 'Police', num: '112', icon: '🚔' }, { name: 'Ambulance', num: '999', icon: '🚑' }, { name: 'Fire', num: '911', icon: '🚒' }, { name: 'Child Helpline', num: '116', icon: '👶' }].map(c => (
                <a key={c.num} href={`tel:${c.num}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-950/50 transition-all">
                  {c.icon} {c.name}: {c.num}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
