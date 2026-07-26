'use client';

import React, { useState } from 'react';
import { MessageSquare, Share2, Bookmark, MoreVertical, ThumbsUp, Award } from 'lucide-react';

interface PostCardProps {
  author: {
    name: string;
    username: string;
    avatar: string;
    verified?: boolean;
  };
  content: string;
  timestamp: string;
  likes?: number;
  comments?: number;
  bookmarked?: boolean;
  space?: string;
}

export default function PostCard({
  author,
  content,
  timestamp,
  likes = 0,
  comments = 0,
  bookmarked = false,
  space,
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(bookmarked);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <div className="bg-[#1a1f26] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <img
            src={author.avatar}
            alt={author.name}
            className="w-11 h-11 rounded-full border-2 border-[#2d7c4a]/40"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-white truncate">{author.name}</h3>
              {author.verified && (
                <Award className="w-4 h-4 text-[#2d7c4a] flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>@{author.username}</span>
              <span>•</span>
              <span>{timestamp}</span>
              {space && (
                <>
                  <span>•</span>
                  <span className="text-[#4a9d63]">in {space}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <button className="text-gray-500 hover:text-gray-300 p-1 hover:bg-gray-800 rounded-lg transition">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 pt-3 border-t border-gray-800">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition ${
            isLiked
              ? 'bg-[#2d7c4a]/20 text-[#4a9d63]'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          <span>{likeCount}</span>
        </button>

        <button className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition">
          <MessageSquare className="w-4 h-4" />
          <span>{comments}</span>
        </button>

        <button className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition ml-auto">
          <Share2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsBookmarked(!isBookmarked)}
          className={`p-2 rounded-lg transition ${
            isBookmarked
              ? 'text-[#d97e3a]'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
}
