'use client';

import React from 'react';
import { Play, Volume2 } from 'lucide-react';
import { Badge } from './ui/Badge';

interface DebateCardProps {
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  title: string;
  description: string;
  isLive?: boolean;
  participants?: string[];
  onJoin?: () => void;
}

export const DebateCard: React.FC<DebateCardProps> = ({
  author,
  title,
  description,
  isLive = false,
  participants = [],
  onJoin,
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
              <Badge variant="live" size="sm">
                <span className="animate-pulse text-xs">● LIVE</span>
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-text-tertiary line-clamp-1">{description}</p>
          </div>
        </div>
        <button className="text-text-tertiary hover:text-text-primary transition p-1 sm:p-2 flex-shrink-0">
          ⋯
        </button>
      </div>

      {/* Title */}
      <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-3 line-clamp-2">{title}</h3>

      {/* Video Preview */}
      <div className="relative w-full h-32 sm:h-48 bg-gradient-to-br from-kikwetu-green to-kikwetu-brown rounded-lg overflow-hidden mb-3 sm:mb-4 group">
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Participant Thumbnails */}
          <div className="flex gap-1 sm:gap-2">
            {participants.slice(0, 3).map((participant, idx) => (
              <img
                key={idx}
                src={participant}
                alt={`Participant ${idx + 1}`}
                className="w-16 h-16 sm:w-24 sm:h-24 object-cover rounded"
              />
            ))}
          </div>
        </div>

        {/* Play Button Overlay */}
        <button
          onClick={onJoin}
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 group-hover:bg-opacity-50 transition"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-kikwetu-orange rounded-full flex items-center justify-center transform group-hover:scale-110 transition">
            <Play className="w-5 h-5 sm:w-8 sm:h-8 text-white fill-white" />
          </div>
        </button>

        {/* Live Badge Corner */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
          <Badge variant="live" size="sm">
            <span className="text-xs">● LIVE</span>
          </Badge>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-1 sm:gap-2">
          <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 text-text-secondary flex-shrink-0" />
          <span className="text-xs sm:text-sm text-text-secondary">Audio Debate</span>
        </div>
        <button
          onClick={onJoin}
          className="bg-kikwetu-green text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium hover:bg-kikwetu-green-light transition text-xs sm:text-sm flex-shrink-0"
        >
          <span className="hidden sm:inline">Join Debate</span>
          <span className="sm:hidden">Join</span>
        </button>
      </div>
    </div>
  );
};
