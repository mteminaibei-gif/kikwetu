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
    <article className="post">
      <div className="post-head">
        <Link href={`/profile/${thread.author_id}`}>
          <div className="avatar earth" style={{ width: 38, height: 38, fontSize: '.74rem' }}>
            {thread.author?.avatar_url ? (
              <Image src={thread.author.avatar_url} alt="Avatar" width={38} height={38} style={{ borderRadius: '50%', objectFit: 'cover', width: 38, height: 38 }}
                unoptimized={!thread.author.avatar_url.includes('supabase') && !thread.author.avatar_url.includes('google')} />
            ) : (
              thread.author?.full_name?.[0]?.toUpperCase() || 'A'
            )}
          </div>
        </Link>
        <div className="author">
          <strong>{thread.author?.full_name || 'Mgeni'}</strong>
          <div className="meta">
            <span>{thread.author?.county || ''}</span>
            <span>&middot;</span>
            <span>{timeAgo(thread.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="post-body">
        <Link href={`/thread/${thread.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3>{thread.title}</h3>
          <p>{thread.content}</p>
        </Link>
      </div>

      <div className="tags">
        <span className="tag">{thread.type || 'general'}</span>
      </div>

      <div className="post-actions">
        <button type="button" onClick={e => onVote(thread, 'up', e)} disabled={voting}
          className={cn('action-btn', userVote === 'up' && 'active')}>
          <i data-lucide="thumbs-up" className="icon-sm" />
          <span>{formatNumber(displayCount)}</span>
        </button>
        <Link href={`/thread/${thread.id}`} className="action-btn">
          <i data-lucide="message-circle" className="icon-sm" />
          <span>{thread.reply_count || 0}</span>
        </Link>
        <button type="button" onClick={() => onShare(thread.id)}
          className="action-btn">
          <i data-lucide="send" className="icon-sm" />
          <span>Share</span>
        </button>
        <button type="button" onClick={() => onSave(thread.id)}
          className={cn('action-btn', saved && 'saved')}>
          <i data-lucide={saved ? 'bookmark' : 'bookmark'} className="icon-sm" />
        </button>
        <button type="button" className="action-btn">
          <i data-lucide="ellipsis" className="icon-sm" />
        </button>
      </div>
    </article>
  );
});

export default ThreadCard;
