'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface TrendingItemProps {
  hashtag: string;
  postCount: number;
}

const TrendingItem: React.FC<TrendingItemProps> = ({ hashtag, postCount }) => (
  <div className="px-4 py-3 hover:bg-bg-tertiary transition cursor-pointer border-b border-border-light last:border-b-0">
    <p className="text-sm text-text-tertiary">Trending in Kenya</p>
    <h3 className="text-base font-bold text-text-primary hover:text-kikwetu-green transition">
      {hashtag}
    </h3>
    <p className="text-xs text-text-tertiary">{postCount.toLocaleString()} posts</p>
  </div>
);

interface SuggestedSpaceProps {
  name: string;
  description: string;
  members: number;
  avatar: string;
  joined?: boolean;
  onJoin?: () => void;
}

const SuggestedSpace: React.FC<SuggestedSpaceProps> = ({
  name,
  description,
  members,
  avatar,
  joined = false,
  onJoin,
}) => (
  <div className="px-4 py-3 border-b border-border-light last:border-b-0">
    <div className="flex items-start gap-3">
      <img src={avatar} alt={name} className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-text-primary text-sm truncate">{name}</h4>
        <p className="text-xs text-text-tertiary truncate">{description}</p>
        <p className="text-xs text-text-tertiary mt-1">{members.toLocaleString()} members</p>
      </div>
    </div>
    <Button
      variant={joined ? 'ghost' : 'secondary'}
      size="sm"
      fullWidth
      onClick={onJoin}
      className="mt-2 text-xs"
    >
      {joined ? 'Joined' : 'Join'}
    </Button>
  </div>
);

export const TrendingSidebar: React.FC = () => {
  const trendingItems = [
    { hashtag: '#KilimoSmart', postCount: 12450 },
    { hashtag: '#NairobiTech', postCount: 8934 },
    { hashtag: '#NairobiTech', postCount: 7821 },
    { hashtag: '#NairobiTech', postCount: 6543 },
    { hashtag: '#NairobiTech', postCount: 5210 },
  ];

  const suggestedSpaces = [
    {
      name: 'KilimoSmart',
      description: 'Smart Farming Innovations',
      members: 2845,
      avatar: '🌾',
      joined: false,
    },
    {
      name: 'Lasia warrior',
      description: 'Suggested spaces Last ela...',
      members: 1543,
      avatar: '⚔️',
      joined: false,
    },
  ];

  return (
    <div className="bg-bg-secondary border-l border-border-light overflow-y-auto">
      {/* Trending Section */}
      <div className="border-b border-border-light">
        <div className="px-4 py-3 sticky top-0 bg-bg-secondary border-b border-border-light z-10">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-kikwetu-orange" />
            <h2 className="font-bold text-text-primary">Trending in Kenya</h2>
          </div>
        </div>

        {trendingItems.map((item, idx) => (
          <TrendingItem key={idx} hashtag={item.hashtag} postCount={item.postCount} />
        ))}
      </div>

      {/* Live Audio Section */}
      <div className="border-b border-border-light">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 bg-accent-live rounded-full animate-pulse" />
            <h3 className="font-bold text-text-primary">Live Audio Baraza</h3>
          </div>

          <div className="bg-gradient-to-br from-kikwetu-orange to-kikwetu-brown rounded-lg p-4 text-white">
            <p className="text-xs opacity-80 mb-1">Mie Audio</p>
            <h4 className="font-semibold text-sm mb-2">Tech-tomasa live video to lives...</h4>
            <Badge variant="live" size="sm">
              <span>● Live Audio</span>
            </Badge>
          </div>
        </div>
      </div>

      {/* Suggested Spaces */}
      <div>
        <div className="px-4 py-3 border-b border-border-light">
          <h3 className="font-bold text-text-primary">Suggested Spaces</h3>
        </div>

        {suggestedSpaces.map((space, idx) => (
          <SuggestedSpace
            key={idx}
            name={space.name}
            description={space.description}
            members={space.members}
            avatar={space.avatar}
            joined={space.joined}
          />
        ))}

        <div className="px-4 py-3 text-center border-t border-border-light">
          <button className="text-kikwetu-orange font-semibold text-sm hover:underline transition">
            Join join
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrendingSidebar;
