'use client';

import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { Badge } from './ui/Badge';

interface Space {
  id: string;
  name: string;
  icon: string;
  description: string;
  members: number;
  verified?: boolean;
}

interface SpacesCarouselProps {
  spaces?: Space[];
  onCreateSpace?: () => void;
}

export const SpacesCarousel: React.FC<SpacesCarouselProps> = ({
  spaces = [
    {
      id: '1',
      name: 'Kilimo Tech',
      icon: '🌾',
      description: 'Smart Farming Innovations',
      members: 2845,
      verified: true,
    },
    {
      id: '2',
      name: 'Nairobi Startups',
      icon: '🚀',
      description: 'Tech entrepreneurship hub',
      members: 5230,
      verified: true,
    },
    {
      id: '3',
      name: 'Sheng Culture',
      icon: '🎨',
      description: 'Slang and urban culture',
      members: 3412,
      verified: false,
    },
    {
      id: '4',
      name: 'Health Kenya',
      icon: '⚕️',
      description: 'Healthcare discussions',
      members: 1876,
      verified: false,
    },
  ],
  onCreateSpace,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="px-4 py-4 border-b border-border-light">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-text-primary">Spaces (Communities)</h3>
        <button
          onClick={onCreateSpace}
          className="text-kikwetu-orange hover:text-kikwetu-orange-light transition text-sm font-medium flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New</span>
        </button>
      </div>

      <div className="relative">
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-bg-primary border border-border-light rounded-full p-2 hover:bg-bg-secondary transition shadow-md"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-text-primary" />
          </button>
        )}

        {/* Carousel Container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollBehavior: 'smooth' }}
        >
          {spaces.map((space) => (
            <Link
              key={space.id}
              href={`/spaces/${space.id}`}
              className="flex-shrink-0 w-48 bg-bg-secondary border border-border-light rounded-lg p-3 hover:border-kikwetu-orange transition hover:shadow-md"
            >
              <div className="text-3xl mb-2">{space.icon}</div>
              <h4 className="font-semibold text-text-primary text-sm line-clamp-2 mb-1">
                {space.name}
              </h4>
              <p className="text-xs text-text-tertiary line-clamp-2 mb-3">
                {space.description}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">
                  {space.members.toLocaleString()} members
                </span>
                {space.verified && (
                  <Badge variant="verified" size="sm">
                    ✓
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-bg-primary border border-border-light rounded-full p-2 hover:bg-bg-secondary transition shadow-md"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-text-primary" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SpacesCarousel;
