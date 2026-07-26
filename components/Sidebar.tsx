'use client';

import React from 'react';
import { Home, Users, Zap, Calendar, MessageSquare, LogOut } from 'lucide-react';
import Link from 'next/link';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const navItems = [
    { icon: Home, label: 'Home', href: '/', active: true },
    { icon: Users, label: 'Baraza', href: '/baraza', active: false },
    { icon: Zap, label: 'Spaces', href: '/spaces', active: false },
    { icon: Calendar, label: 'Events', href: '/events', active: false },
    { icon: MessageSquare, label: 'Messages', href: '/messages', active: false },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 sm:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed sm:sticky top-16 sm:top-0 left-0 h-[calc(100vh-4rem)] sm:h-screen w-64 bg-bg-secondary border-r border-border-light transform transition-transform duration-300 z-40 overflow-y-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0`}
      >
        <nav className="pt-4 pb-20">
          {/* Logo Section */}
          <div className="px-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-kikwetu-green to-kikwetu-orange rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">K</span>
              </div>
              <div>
                <h1 className="font-bold text-lg text-text-primary">Kikwetu</h1>
                <p className="text-xs text-text-tertiary">Our Place</p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="space-y-2 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                    item.active
                      ? 'bg-kikwetu-green text-white'
                      : 'text-text-secondary hover:bg-bg-tertiary'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-border-light" />

          {/* Spaces Section */}
          <div className="px-4 mb-4">
            <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Your Spaces</h3>
          </div>

          <div className="space-y-2 px-3">
            {['Kilimo Tech', 'Nairobi Startups', 'Sheng Culture'].map((space) => (
              <button
                key={space}
                className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-bg-tertiary rounded-lg transition"
              >
                {space}
              </button>
            ))}
          </div>

          {/* Create Space Button */}
          <div className="px-3 mt-4">
            <button className="w-full bg-kikwetu-orange text-white py-2 rounded-lg font-medium hover:bg-kikwetu-orange-light transition">
              + Create Space
            </button>
          </div>
        </nav>

        {/* Bottom User Card */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border-light bg-bg-secondary">
          <div className="flex items-center gap-3 mb-3">
            <img
              src="https://via.placeholder.com/40"
              alt="User"
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-text-primary truncate">Farmer Benson</p>
              <p className="text-xs text-text-tertiary">@farmer_benson</p>
            </div>
          </div>
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-bg-tertiary rounded-lg transition">
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
