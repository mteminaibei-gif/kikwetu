'use client';

import React from 'react';
import { Search, Bell, Mic } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
  showSidebar?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, showSidebar = true }) => {
  return (
    <header className="sticky top-0 z-40 bg-bg-primary border-b border-border-light safe-top">
      <div className="px-3 sm:px-4 py-3 flex items-center justify-between gap-2 sm:gap-3 min-h-14 sm:min-h-16">
        {/* Left: Menu toggle + Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-fit">
          {!showSidebar && (
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-bg-secondary rounded-lg transition"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-kikwetu-green to-kikwetu-orange rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs sm:text-sm">K</span>
            </div>
            <span className="font-bold text-base sm:text-lg hidden sm:inline text-text-primary">KikwetuConnect</span>
          </div>
        </div>

        {/* Center: Search Bar - Hidden on mobile */}
        <div className="flex-1 max-w-md hidden sm:flex items-center gap-2 bg-bg-secondary rounded-full px-3 py-2">
          <Search className="w-4 h-4 text-text-tertiary flex-shrink-0" />
          <input
            type="text"
            placeholder="Search KikwetuConnect..."
            className="bg-transparent outline-none text-sm w-full text-text-primary placeholder-text-tertiary"
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-3">
          <button className="p-2 hover:bg-bg-secondary rounded-lg transition sm:hidden" aria-label="Search">
            <Search className="w-5 h-5 text-text-primary" />
          </button>
          <button className="p-2 hover:bg-bg-secondary rounded-lg transition" aria-label="Voice search">
            <Mic className="w-5 h-5 text-text-primary" />
          </button>
          <button className="p-2 hover:bg-bg-secondary rounded-lg transition relative" aria-label="Notifications">
            <Bell className="w-5 h-5 text-text-primary" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent-live rounded-full" />
          </button>
          <button className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex-shrink-0 overflow-hidden" aria-label="Profile">
            <img src="https://via.placeholder.com/32" alt="Profile" className="w-full h-full" />
          </button>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="sm:hidden px-3 pb-3">
        <div className="flex items-center gap-2 bg-bg-secondary rounded-full px-3 py-2">
          <Search className="w-4 h-4 text-text-tertiary flex-shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none text-sm w-full text-text-primary placeholder-text-tertiary"
          />
        </div>
      </div>
    </header>
  );
};
