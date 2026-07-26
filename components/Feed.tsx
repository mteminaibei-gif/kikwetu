'use client';

import React, { useState } from 'react';
import { QuestionCard } from './QuestionCard';
import { DebateCard } from './DebateCard';
import { SpacesCarousel } from './SpacesCarousel';
import { Button } from './ui/Button';
import { Plus } from 'lucide-react';

interface FeedProps {
  onCreatePost?: () => void;
}

export const Feed: React.FC<FeedProps> = ({ onCreatePost }) => {
  const [posts] = useState([
    {
      id: '1',
      type: 'question' as const,
      author: {
        id: 'farmer1',
        name: 'Farmer Benson',
        username: '@farmer_benson',
        avatar: 'https://via.placeholder.com/48',
      },
      content: 'Farmer Benson tomato caras in the carovid / Question my tomato?',
      tags: ['#Kilimo', '#AgriTips'],
      upvotes: 1200,
      replies: 45,
      verified: true,
    },
    {
      id: '2',
      type: 'debate' as const,
      author: {
        id: 'mjadala1',
        name: 'Mjadala',
        username: '@mjadala_live',
        avatar: 'https://via.placeholder.com/48',
      },
      title: 'Mjadala: The Future of TVET in Kenya',
      description: 'Debate ago - auto-playing',
      isLive: true,
      participants: [
        'https://via.placeholder.com/32',
        'https://via.placeholder.com/32',
        'https://via.placeholder.com/32',
      ],
    },
    {
      id: '3',
      type: 'question' as const,
      author: {
        id: 'user3',
        name: 'Sarah Kipchoge',
        username: '@sarah_k',
        avatar: 'https://via.placeholder.com/48',
      },
      content: 'Mavuno ya parachichi yashuka, nifanye ninf? (Harvest prices dropped, what should I do?)',
      tags: ['#FarmingAdvice', '#Kiswahili'],
      upvotes: 45,
      replies: 12,
      verified: false,
    },
  ]);

  return (
    <div className="flex flex-col">
      {/* Feed Header with Create Post Button */}
      <div className="sticky top-14 sm:top-16 bg-bg-primary border-b border-border-light px-3 sm:px-4 py-2.5 sm:py-3 z-20">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-text-primary">Feed</h2>
          <Button
            variant="primary"
            size="sm"
            onClick={onCreatePost}
            className="gap-1 sm:gap-2 flex items-center text-xs sm:text-base"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Post</span>
            <span className="sm:hidden">Post</span>
          </Button>
        </div>
      </div>

      {/* Spaces Carousel */}
      <SpacesCarousel onCreateSpace={onCreatePost} />

      {/* Posts Feed */}
      <div className="divide-y divide-border-light">
        {posts.map((post) => (
          <div key={post.id} className="border-b border-border-light last:border-b-0">
            {post.type === 'question' && 'content' in post && (
              <QuestionCard
                author={post.author}
                content={post.content}
                tags={post.tags}
                upvotes={post.upvotes}
                replies={post.replies}
                verified={post.verified}
              />
            )}
            {post.type === 'debate' && 'title' in post && (
              <DebateCard
                author={post.author}
                title={post.title}
                description={post.description}
                isLive={post.isLive}
                participants={post.participants}
              />
            )}
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="p-4 border-t border-border-light text-center">
        <Button variant="ghost" fullWidth>
          Load More Posts
        </Button>
      </div>
    </div>
  );
};

export default Feed;
