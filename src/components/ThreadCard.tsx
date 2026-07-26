'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { timeAgo, formatNumber, cn } from '@/lib/utils';
import type { Thread } from '@/types';

interface ThreadCardProps {
  thread: Thread;
  userVote: 'up' | 'down' | undefined;
  saved: boolean;
  emojiReaction: string | undefined;
  displayCount: number;
  voting: boolean;
  onVote: (thread: Thread, voteType: 'up' | 'down', e: React.MouseEvent) => void;
  onSave: (threadId: string) => void;
  onEmoji: (threadId: string, emoji: string) => void;
  onShare: (threadId: string) => void;
  showShareMenu: boolean;
  onShareSelect: (platform: string, threadId: string, title: string, content: string) => void;
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const ThreadCard = memo(function ThreadCard({
  thread, userVote, saved, emojiReaction, displayCount, voting,
  onVote, onSave, onEmoji, onShare, showShareMenu, onShareSelect
}: ThreadCardProps) {
  return (
    <div className="bg-white dark:bg-brand-cardDark p-4 sm:p-5 space-y-3 sm:space-y-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors group relative overflow-hidden">
      <div className="relative flex items-start justify-between z-10">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${thread.author_id}`} className="shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-terracotta to-brand-red flex items-center justify-center text-sm font-bold text-white shadow-sm overflow-hidden">
              {thread.author?.avatar_url ? (
                <Image src={thread.author.avatar_url} alt="Avatar" width={40} height={40} className="w-full h-full object-cover" unoptimized={!thread.author.avatar_url.includes('supabase') && !thread.author.avatar_url.includes('google')} />
              ) : (
                thread.author?.full_name?.[0]?.toUpperCase() || 'A'
              )}
            </div>
          </Link>
          <div>
            <div className="flex items-center gap-1.5">
              <h5 className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-brand-red transition-colors">{thread.author?.full_name || 'Mgeni'}</h5>
              {thread.author?.username && <span className="text-[11px] text-gray-500 dark:text-gray-400">@{thread.author.username}</span>}
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">{thread.author?.county || ''} &middot; {timeAgo(thread.created_at)}</span>
          </div>
        </div>
      </div>

      <Link href={`/thread/${thread.id}`} className="block relative z-10">
        <h3 className="text-base font-bold leading-snug text-gray-900 dark:text-gray-100 group-hover:text-brand-red transition-colors">{thread.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed line-clamp-3">{thread.content}</p>
      </Link>

      <div className="flex items-center gap-1.5 flex-wrap relative z-10">
        {EMOJIS.map(emoji => (
          <button key={emoji} type="button" onClick={() => onEmoji(thread.id, emoji)}
            className={cn(
              'text-sm px-2 py-0.5 rounded-full border transition-all duration-200 active:scale-90',
              emojiReaction === emoji
                ? 'bg-brand-terracotta/15 border-brand-terracotta/40 scale-110 shadow-sm'
                : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 opacity-60 hover:opacity-100'
            )}>{emoji}</button>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 text-xs relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button type="button" onClick={e => onVote(thread, 'up', e)} disabled={voting}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-l-full font-bold transition-all active:scale-95 disabled:opacity-50",
                userVote === 'up'
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-emerald-500 hover:text-white"
              )}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
              {formatNumber(displayCount)}
            </button>
            <button type="button" onClick={e => onVote(thread, 'down', e)} disabled={voting}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-r-full font-bold transition-all active:scale-95 border-l border-gray-200 dark:border-gray-700 disabled:opacity-50",
                userVote === 'down'
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-red-500 hover:text-white"
              )}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
          <Link href={`/thread/${thread.id}`} className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-brand-red font-medium">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            {thread.reply_count}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onSave(thread.id)}
            className={cn('p-1.5 rounded-full transition-all', saved ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500')}>
            <svg className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
          </button>
          <div className="relative">
            <button type="button" onClick={() => onShare(thread.id)}
              className="flex items-center gap-1.5 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 px-2.5 py-1.5 rounded-full transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </button>
            {showShareMenu && (
              <div className="absolute right-0 bottom-full mb-2 flex flex-col bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl py-1 z-50 min-w-[160px]">
                {(['whatsapp', 'telegram', 'facebook', 'twitter', 'email'] as const).map(p => (
                  <button key={p} type="button" onClick={() => onShareSelect(p, thread.id, thread.title, thread.content)}
                    className="px-4 py-2 text-xs font-medium text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 capitalize">{p}</button>
                ))}
                <button type="button" onClick={() => onShareSelect('copy', thread.id, thread.title, thread.content)}
                  className="px-4 py-2 text-xs font-medium text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-t border-gray-100 dark:border-gray-800">Copy Link</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ThreadCard;
