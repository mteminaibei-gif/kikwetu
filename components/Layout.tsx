'use client';

import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';

interface LayoutProps {
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
  showRightSidebar?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  rightSidebar,
  showRightSidebar = true,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-primary">
      {/* Header */}
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} showSidebar={true} />

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <MainContent rightSidebar={rightSidebar} showRightSidebar={showRightSidebar}>
          {children}
        </MainContent>
      </div>
    </div>
  );
};

export default Layout;
