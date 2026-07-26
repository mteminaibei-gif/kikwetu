'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { QuestionCard } from '@/components/QuestionCard';
import { DebateCard } from '@/components/DebateCard';
import { Badge } from '@/components/ui/Badge';
import { Users, Settings, Share2, Zap } from 'lucide-react';

export default function SpaceDetailPage() {
  const params = useParams();
  const spaceId = params.id;

  const [activeTab, setActiveTab] = useState<'posts' | 'mjadala' | 'quiz'>('posts');
  const [isJoined, setIsJoined] = useState(false);

  // Mock space data
  const space = {
    id: spaceId,
    name: 'Kilimo Tech',
    icon: '🌾',
    description: 'Smart Farming Innovations in Kenya',
    tagline: 'Learn, share, and grow sustainable farming practices',
    members: 2845,
    posts: 1234,
    verified: true,
    banner: 'linear-gradient(135deg, #2d7c4a 0%, #4a9d63 100%)',
    headerImage: 'https://via.placeholder.com/1200x300',
    moderators: [
      { name: 'Dr. Kipchoge', avatar: 'https://via.placeholder.com/40' },
      { name: 'Sarah Mwangi', avatar: 'https://via.placeholder.com/40' },
    ],
  };

  const posts = [
    {
      id: '1',
      type: 'question' as const,
      author: {
        id: 'farmer1',
        name: 'Farmer Benson',
        username: '@farmer_benson',
        avatar: 'https://via.placeholder.com/48',
      },
      content: 'Welcome to Kilimo Tech! How are you using tech on your farm?',
      tags: ['#Kilimo', '#Innovation'],
      upvotes: 234,
      replies: 12,
      verified: true,
    },
    {
      id: '2',
      type: 'question' as const,
      author: {
        id: 'user2',
        name: 'Jane Kipchoge',
        username: '@jane_k',
        avatar: 'https://via.placeholder.com/48',
      },
      content: 'Mavuno ya parachichi yashuka, nifanye ninf? (Harvest prices dropped, what should I do?)',
      tags: ['#FarmingAdvice', '#Kiswahili'],
      upvotes: 45,
      replies: 12,
      verified: false,
    },
  ];

  const debates = [
    {
      id: '1',
      type: 'debate' as const,
      author: {
        id: 'mjadala1',
        name: 'Mjadala Live',
        username: '@mjadala',
        avatar: 'https://via.placeholder.com/48',
      },
      title: 'Organic vs Conventional Farming in Kenya',
      description: 'Live debate - 3 participants',
      isLive: true,
      participants: [
        'https://via.placeholder.com/32',
        'https://via.placeholder.com/32',
        'https://via.placeholder.com/32',
      ],
    },
  ];

  return (
    <Layout rightSidebar={<SpaceRightSidebar space={space} />}>
      <div className="bg-bg-primary">
        {/* Space Header */}
        <div
          className="h-48 md:h-64 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${space.headerImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-kikwetu-green to-kikwetu-orange opacity-80" />
          <div className="absolute inset-0 flex items-end justify-between p-4 md:p-6">
            <div className="flex items-center gap-4">
              <div className="text-5xl md:text-6xl bg-white bg-opacity-20 p-4 rounded-lg backdrop-blur-md">
                {space.icon}
              </div>
              <div className="text-white">
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  {space.name}
                  {space.verified && <Badge variant="verified" size="sm">✓</Badge>}
                </h1>
                <p className="text-sm opacity-90">{space.description}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={isJoined ? 'ghost' : 'primary'}
                size="md"
                onClick={() => setIsJoined(!isJoined)}
              >
                {isJoined ? 'Joined' : 'Join'}
              </Button>
            </div>
          </div>
        </div>

        {/* Tagline & Stats */}
        <div className="border-b border-border-light px-4 md:px-6 py-4">
          <p className="text-text-secondary mb-4">{space.tagline}</p>
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <p className="font-semibold text-text-primary">{space.members.toLocaleString()}</p>
              <p className="text-text-tertiary flex items-center gap-1">
                <Users className="w-4 h-4" /> Members
              </p>
            </div>
            <div>
              <p className="font-semibold text-text-primary">{space.posts.toLocaleString()}</p>
              <p className="text-text-tertiary">Posts</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border-light sticky top-14 bg-bg-primary z-10">
          <div className="px-4 md:px-6 flex gap-6">
            {['posts', 'mjadala', 'quiz'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as 'posts' | 'mjadala' | 'quiz')}
                className={`py-3 font-medium text-sm border-b-2 transition ${
                  activeTab === tab
                    ? 'border-kikwetu-orange text-kikwetu-orange'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab === 'posts' && 'Posts'}
                {tab === 'mjadala' && 'Mjadala (Debates)'}
                {tab === 'quiz' && 'Quiz'}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="divide-y divide-border-light">
          {activeTab === 'posts' && (
            <>
              {posts.map((post) => (
                <QuestionCard
                  key={post.id}
                  author={post.author}
                  content={post.content}
                  tags={post.tags}
                  upvotes={post.upvotes}
                  replies={post.replies}
                  verified={post.verified}
                />
              ))}
            </>
          )}

          {activeTab === 'mjadala' && (
            <>
              {debates.map((debate) => (
                <DebateCard
                  key={debate.id}
                  author={debate.author}
                  title={debate.title}
                  description={debate.description}
                  isLive={debate.isLive}
                  participants={debate.participants}
                />
              ))}
            </>
          )}

          {activeTab === 'quiz' && (
            <div className="p-6 text-center">
              <Zap className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">Coming Soon!</h3>
              <p className="text-text-secondary">Quizzes for this space will be available soon.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// Right Sidebar Component
interface SpaceRightSidebarProps {
  space: any;
}

const SpaceRightSidebar: React.FC<SpaceRightSidebarProps> = ({ space }) => {
  return (
    <div className="bg-bg-secondary border-l border-border-light overflow-y-auto p-4">
      {/* Moderators */}
      <div className="mb-6">
        <h3 className="font-bold text-text-primary mb-3 text-sm">Moderators</h3>
        <div className="space-y-3">
          {space.moderators.map((mod: any, idx: number) => (
            <div key={idx} className="flex items-center gap-3">
              <img src={mod.avatar} alt={mod.name} className="w-10 h-10 rounded-full" />
              <div>
                <p className="text-sm font-medium text-text-primary">{mod.name}</p>
                <p className="text-xs text-text-tertiary">Moderator</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-border-light pt-4 space-y-2">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-bg-tertiary transition text-text-secondary text-sm">
          <Share2 className="w-4 h-4" />
          Share Space
        </button>
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-bg-tertiary transition text-text-secondary text-sm">
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      {/* Rules */}
      <div className="border-t border-border-light mt-4 pt-4">
        <h4 className="font-semibold text-text-primary text-sm mb-3">Community Guidelines</h4>
        <ul className="text-xs text-text-tertiary space-y-2">
          <li>• Be respectful and constructive</li>
          <li>• No harassment or hate speech</li>
          <li>• Share verified information</li>
          <li>• Keep discussions on-topic</li>
        </ul>
      </div>
    </div>
  );
};
