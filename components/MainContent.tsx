'use client';

import React from 'react';

interface MainContentProps {
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
  showRightSidebar?: boolean;
}

export const MainContent: React.FC<MainContentProps> = ({
  children,
  rightSidebar,
  showRightSidebar = true,
}) => {
  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0">
      {/* Main Feed */}
      <div className="lg:col-span-2 border-r border-border-light min-h-screen">
        {children}
      </div>

      {/* Right Sidebar - Trending/Suggestions */}
      {showRightSidebar && rightSidebar && (
        <div className="hidden lg:block bg-bg-secondary border-l border-border-light overflow-y-auto">
          {rightSidebar}
        </div>
      )}
    </div>
  );
};

export default MainContent;
