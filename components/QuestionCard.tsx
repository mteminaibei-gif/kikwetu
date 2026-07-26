'use client';

import React from 'react';
import { ThumbsUp, Heart, MessageCircle } from 'lucide-react';
import { Badge } from './ui/Badge';

interface QuestionCardProps {
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  tags: string[];
  upvotes: number;
  replies: number;
  verified?: boolean;
  onReply?: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  author,
  content,
  tags,
  upvotes,
  replies,
  verified = false,
  onReply,
}) => {
  return (
    <div className="p-3 sm:p-4 hover:bg-bg-secondary transition cursor-pointer">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 sm:gap-3 mb-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <img
            src={author.avatar}
            alt={author.name}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="font-semibold text-text-primary text-sm sm:text-base truncate">{author.name}</span>
              {verified && <Badge variant="verified" size="sm">✓</Badge>}
            </div>
            <p className="text-xs sm:text-sm text-text-tertiary truncate">{author.username}</p>
          </div>
        </div>
        <button className="text-text-tertiary hover:text-text-primary transition p-1 sm:p-2 flex-shrink-0">
          ⋯
        </button>
      </div>

      {/* Content */}
      <div className="mb-3">
        <p className="text-sm sm:text-base text-text-primary leading-relaxed line-clamp-3">{content}</p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
        {tags.map((tag) => (
          <span
            key={tag}
            className="text-xs sm:text-sm text-kikwetu-green hover:underline cursor-pointer"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-text-secondary mb-3">
        <span className="flex items-center gap-1">
          <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">{upvotes.toLocaleString()}</span>
          <span className="sm:hidden">{(upvotes / 1000).toFixed(1)}k</span>
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
          {replies}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between -mx-2">
        <div className="flex gap-0 text-text-secondary">
          <button className="flex items-center gap-1 hover:text-kikwetu-green transition py-1.5 px-2 hover:bg-bg-tertiary rounded text-xs sm:text-sm">
            <ThumbsUp className="w-4 h-4" />
            <span className="hidden sm:inline">Upvote</span>
          </button>
          <button className="flex items-center gap-1 hover:text-kikwetu-orange transition py-1.5 px-2 hover:bg-bg-tertiary rounded text-xs sm:text-sm">
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">Love</span>
          </button>
          <button
            onClick={onReply}
            className="flex items-center gap-1 hover:text-kikwetu-green transition py-1.5 px-2 hover:bg-bg-tertiary rounded text-xs sm:text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Reply</span>
          </button>
        </div>
        <button className="text-text-tertiary hover:text-text-primary transition py-1.5 px-2">
          ↗
        </button>
      </div>
    </div>
  );
};
