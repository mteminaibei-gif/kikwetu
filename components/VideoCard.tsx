'use client';

import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, MoreVertical, ThumbsUp, MessageSquare, Share2, Bookmark } from 'lucide-react';

interface VideoCardProps {
  author: {
    name: string;
    username: string;
    avatar: string;
  };
  title: string;
  thumbnail: string;
  isLive?: boolean;
  views?: string;
  timestamp?: string;
  likes?: number;
  comments?: number;
}

export default function VideoCard({
  author,
  title,
  thumbnail,
  isLive = false,
  views,
  timestamp,
  likes = 0,
  comments = 0,
}: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <div className="bg-[#1a1f26] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition">
      {/* Video Player */}
      <div className="relative aspect-video bg-black group cursor-pointer">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover"
        />
        
        {/* Live Badge */}
        {isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-xs font-bold uppercase">Live</span>
          </div>
        )}

        {/* Play/Pause Overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-16 h-16 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition transform hover:scale-110"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-black ml-0" />
            ) : (
              <Play className="w-8 h-8 text-black ml-1" />
            )}
          </button>
        </div>

        {/* Video Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-white hover:text-[#4a9d63] transition"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-white hover:text-[#4a9d63] transition"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {/* Progress Bar */}
            <div className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
              <div className="h-full bg-[#2d7c4a] rounded-full" style={{ width: '35%' }} />
            </div>

            <span className="text-white text-xs font-medium">2:34 / 7:20</span>

            <button className="text-white hover:text-[#4a9d63] transition">
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Views Badge (if not live) */}
        {!isLive && views && (
          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-white text-xs font-medium">
            {views} views
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Author Info */}
        <div className="flex items-start gap-3 mb-3">
          <img
            src={author.avatar}
            alt={author.name}
            className="w-10 h-10 rounded-full border-2 border-[#2d7c4a]/40"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white mb-1 line-clamp-2 leading-snug">{title}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="font-medium text-gray-400">{author.name}</span>
              {timestamp && (
                <>
                  <span>•</span>
                  <span>{timestamp}</span>
                </>
              )}
            </div>
          </div>
          <button className="text-gray-500 hover:text-gray-300 p-1 hover:bg-gray-800 rounded-lg transition">
            <MoreVertical className="w-5 h-5" />
          </button>
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

          <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition">
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
