'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const MAIN_NAV = [
  { label: 'Home', href: '/feed', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'Search', href: '/search', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { label: 'Spaces', href: '/feed?view=spaces', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { label: 'Students', href: '/students', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { label: 'Professionals', href: '/professionals', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { label: 'Mtaa Exchange', href: '/mtaa', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { label: 'Nyumba Kumi', href: '/nyumba-kumi', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { label: 'Live', href: '/live', icon: 'M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 0112.728 0' },
  { label: 'Quizzes', href: '/quizzes', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { label: 'Radio', href: '/radio', icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' },
];

export default function DesktopSidebar() {
  const { user, isAdmin } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const isActive = (href: string) => {
    if (href === '/feed' && pathname === '/feed') return true;
    if (href === '/search' && pathname === '/search') return true;
    if (href === '/students' && pathname === '/students') return true;
    if (href === '/nyumba-kumi' && pathname === '/nyumba-kumi') return true;
    if (href === '/professionals' && pathname?.startsWith('/professionals')) return true;
    if (href === '/mtaa' && pathname === '/mtaa') return true;
    if (href === '/live' && pathname === '/live') return true;
    if (href === '/quizzes' && pathname === '/quizzes') return true;
    if (href === '/radio' && pathname === '/radio') return true;
    if (href.includes('view=') && pathname === '/feed') return true;
    return false;
  };

  return (
    <aside className="hidden md:flex flex-col w-64 sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto pr-4 lg:pr-8 py-4">
      <nav className="flex-1 space-y-2">
        {MAIN_NAV.map(item => (
          <Link key={item.href} href={item.href}
            className={cn(
              'flex items-center gap-4 px-4 py-3 rounded-full transition-all group',
              isActive(item.href)
                ? 'bg-brand-red text-white shadow-md font-bold'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium'
            )}>
            <svg className={cn("w-6 h-6", isActive(item.href) ? "text-white" : "text-gray-500 dark:text-gray-400 group-hover:text-brand-red")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive(item.href) ? 2.5 : 2} d={item.icon} />
            </svg>
            <span className="text-base tracking-wide">{item.label}</span>
          </Link>
        ))}

        <Link href={`/profile/${user.id}`}
          className={cn(
            'flex items-center gap-4 px-4 py-3 rounded-full transition-all group mt-4',
            pathname?.startsWith('/profile')
              ? 'bg-brand-red text-white shadow-md font-bold'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium'
          )}>
          <svg className={cn("w-6 h-6", pathname?.startsWith('/profile') ? "text-white" : "text-gray-500 dark:text-gray-400 group-hover:text-brand-red")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={pathname?.startsWith('/profile') ? 2.5 : 2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-base tracking-wide">Profile</span>
        </Link>

        {isAdmin && (
          <Link href="/admin"
            className={cn(
              'flex items-center gap-4 px-4 py-3 rounded-full transition-all group mt-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium',
              pathname?.startsWith('/admin') && 'bg-red-100 dark:bg-red-900/40 font-bold'
            )}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-base tracking-wide">Admin</span>
          </Link>
        )}
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3 px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-xl transition-colors">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-terracotta to-brand-red flex shrink-0 items-center justify-center text-white font-bold overflow-hidden shadow-sm">
          {user.avatar_url ? (
            <Image src={user.avatar_url} alt="Avatar" width={40} height={40} className="object-cover w-full h-full" unoptimized={!user.avatar_url.includes('supabase') && !user.avatar_url.includes('google')} />
          ) : (
            user.full_name?.[0]?.toUpperCase() || 'U'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{user.full_name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user.username}</p>
        </div>
      </div>
    </aside>
  );
}
