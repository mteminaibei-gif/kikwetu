'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Feed', href: '/feed', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'Spaces', href: '/feed?view=spaces', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { label: 'Karma', href: '/feed?view=leaderboard', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
];

export default function MobileBottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  if (!user) return null;

  const isActive = (href: string) => {
    if (href === '/feed' && pathname === '/feed') return true;
    if (href.includes('view=') && pathname === '/feed') return true;
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-brand-cardDark/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 saf-area-bottom">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {NAV_ITEMS.map(item => (
          <Link key={item.href} href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-0 flex-1',
              isActive(item.href) ? 'text-brand-red' : 'text-gray-400 dark:text-gray-500'
            )}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive(item.href) ? 2.5 : 2} d={item.icon} />
            </svg>
            <span className="text-[10px] font-semibold leading-none">{item.label}</span>
          </Link>
        ))}
        <Link href={user ? `/profile/${user.id}` : '/onboarding'}
          className={cn(
            'flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-0 flex-1',
            pathname?.startsWith('/profile') ? 'text-brand-red' : 'text-gray-400 dark:text-gray-500'
          )}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={pathname?.startsWith('/profile') ? 2.5 : 2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[10px] font-semibold leading-none">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
