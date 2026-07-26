'use client';

import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';

export default function RightSidebar() {
  const { spaces } = useApp();
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <aside className="hidden lg:flex flex-col w-80 sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto pl-4 lg:pl-8 py-4">
      {/* Trending Spaces Widget */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 text-lg">Trending Spaces</h3>
        <div className="space-y-4">
          {spaces.slice(0, 4).map(space => (
            <Link key={space.id} href={`/feed?view=spaces&space=${space.id}`} className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-terracotta to-brand-red flex shrink-0 items-center justify-center text-white font-bold shadow-sm group-hover:scale-105 transition-transform">
                {space.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-brand-red transition-colors">{space.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{space.description}</p>
              </div>
            </Link>
          ))}
        </div>
        <Link href="/feed?view=spaces" className="block text-brand-red text-sm font-semibold hover:underline mt-4">
          Show more
        </Link>
      </div>

      {/* Footer Links */}
      <nav className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400 mt-auto pt-4 border-t border-gray-200 dark:border-gray-800">
        <Link href="/about" className="hover:underline">About</Link>
        <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
        <Link href="/terms" className="hover:underline">Terms of Service</Link>
        <Link href="/advertise" className="hover:underline">Advertise</Link>
        <span>&copy; {new Date().getFullYear()} KikwetuConnect</span>
      </nav>
    </aside>
  );
}
