'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  {
    label: 'Feed',
    href: '/feed',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    label: 'Learn',
    href: '/students',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
  {
    label: 'Safety',
    href: '/nyumba-kumi',
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  },
  {
    label: 'Pros',
    href: '/professionals',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    label: 'Radio',
    href: '/radio',
    icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
  },
];

export default function MobileBottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user || pathname === '/' || pathname?.startsWith('/chat') || pathname?.startsWith('/onboarding') || pathname?.startsWith('/admin')) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === '/feed') return pathname === '/feed' || pathname?.startsWith('/thread');
    if (href === '/students') return pathname === '/students' || pathname?.startsWith('/students/');
    if (href === '/nyumba-kumi') return pathname === '/nyumba-kumi';
    if (href === '/professionals') return pathname?.startsWith('/professionals');
    if (href === '/radio') return pathname === '/radio';
    return false;
  };

  const profileActive = pathname?.startsWith('/profile') || pathname === '/settings' || pathname === '/parent';

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-brand-cardDark/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-800 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
      aria-label="Primary"
    >
      <div className="flex items-stretch justify-around h-14 px-0.5 max-w-lg mx-auto">
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 rounded-lg transition-colors touch-manipulation py-1',
                active ? 'text-brand-red' : 'text-gray-400 dark:text-gray-500 active:bg-gray-50 dark:active:bg-gray-900'
              )}
            >
              {active && (
                <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-7 h-0.5 rounded-full bg-brand-red" aria-hidden />
              )}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d={item.icon} />
              </svg>
              <span className={cn('text-[10px] leading-none font-semibold truncate max-w-full px-0.5', active && 'font-bold')}>
                {item.label}
              </span>
            </Link>
          );
        })}
        <Link
          href={`/profile/${user.id}`}
          className={cn(
            'relative flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 rounded-lg transition-colors touch-manipulation py-1',
            profileActive ? 'text-brand-red' : 'text-gray-400 dark:text-gray-500 active:bg-gray-50 dark:active:bg-gray-900'
          )}
        >
          {profileActive && (
            <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-7 h-0.5 rounded-full bg-brand-red" aria-hidden />
          )}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={profileActive ? 2.5 : 2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className={cn('text-[10px] leading-none font-semibold', profileActive && 'font-bold')}>You</span>
        </Link>
      </div>
    </nav>
  );
}
