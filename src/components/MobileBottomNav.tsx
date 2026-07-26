'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Feed', href: '/feed', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'Search', href: '/search', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { label: 'Mtaa', href: '/mtaa', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { label: 'Students', href: '/students', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { label: 'Nyumba', href: '/nyumba-kumi', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
];

export default function MobileBottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  if (!user) return null;

  const isActive = (href: string) => {
    if (href === '/feed' && pathname === '/feed') return true;
    if (href === '/search' && pathname === '/search') return true;
    if (href === '/mtaa' && pathname === '/mtaa') return true;
    if (href === '/students' && pathname?.startsWith('/students')) return true;
    if (href === '/nyumba-kumi' && pathname === '/nyumba-kumi') return true;
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-brand-cardDark/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
        {NAV_ITEMS.map(item => (
          <Link key={item.href} href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-0 flex-1',
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
            'flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-0 flex-1',
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
