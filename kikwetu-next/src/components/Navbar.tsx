'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

function BellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const { unreadCount } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const [dark, setDark] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setOnline(navigator.onLine);
    const stored = localStorage.getItem('theme');
    setDark(stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches));
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    if (dark) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark, mounted]);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const loadPending = async () => {
      try {
        const { Offline } = await import('@/lib/offline');
        const actions = await Offline.getPendingActions();
        if (!cancelled) setPendingCount(actions.length);
      } catch {
        if (!cancelled) setPendingCount(0);
      }
    };
    loadPending();
    const interval = setInterval(loadPending, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  const toggleTheme = useCallback(() => setDark(prev => !prev), []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setProfileOpen(false);
    closeMobile();
  }, [signOut, closeMobile]);

  const navLinkClass = 'text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-brand-orange dark:hover:text-brand-lightOrange transition-colors';

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-brand-bgDark/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/feed" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-bold text-brand-green">KikwetuConnect</span>
          </Link>

          <div className="hidden md:flex items-center gap-5">
            {user ? (
              <>
                <Link href="/feed" className={navLinkClass}>Feed</Link>
                <Link href="/onboarding" className={navLinkClass}>Spaces</Link>
                {isAdmin && (
                  <Link href="/admin" className="text-sm font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors">Admin</Link>
                )}

                <button className="relative p-1.5 text-gray-600 dark:text-gray-400 hover:text-brand-orange dark:hover:text-brand-lightOrange transition-colors" aria-label="Notifications">
                  <BellIcon />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span className={cn('h-2 w-2 rounded-full', online ? 'bg-green-500' : 'bg-red-500')} />
                  <span>{online ? 'Online' : 'Offline'}</span>
                  {pendingCount > 0 && <span className="text-amber-500 font-medium">({pendingCount})</span>}
                </div>

                <button onClick={toggleTheme} className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-brand-orange dark:hover:text-brand-lightOrange transition-colors" aria-label="Toggle theme">
                  {dark ? <SunIcon /> : <MoonIcon />}
                </button>

                <div className="relative" ref={profileRef}>
                  <button onClick={() => setProfileOpen(prev => !prev)} className="flex items-center gap-2" aria-label="Profile menu">
                    <div className="h-8 w-8 rounded-full bg-brand-green flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        user.full_name?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1 z-50">
                      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.full_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user.username}</p>
                      </div>
                      <Link
                        href={`/profile/${user.id}`}
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Profile
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button onClick={toggleTheme} className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-brand-orange dark:hover:text-brand-lightOrange transition-colors" aria-label="Toggle theme">
                  {dark ? <SunIcon /> : <MoonIcon />}
                </button>
                <Link href="/onboarding" className={navLinkClass}>Sign In</Link>
                <Link
                  href="/onboarding"
                  className="rounded-full bg-brand-orange px-5 py-2 text-sm font-bold text-white hover:bg-brand-lightOrange transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}

            <button onClick={() => setMobileOpen(prev => !prev)} className="md:hidden p-1.5 text-gray-600 dark:text-gray-400" aria-label="Toggle menu">
              {mobileOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>

          <button onClick={() => setMobileOpen(prev => !prev)} className="md:hidden p-1.5 text-gray-600 dark:text-gray-400" aria-label="Toggle menu">
            {mobileOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-brand-bgDark px-4 py-4 space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
            <button onClick={toggleTheme} className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-brand-orange transition-colors" aria-label="Toggle theme">
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            {user && (
              <>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span className={cn('h-2 w-2 rounded-full', online ? 'bg-green-500' : 'bg-red-500')} />
                  <span>{online ? 'Online' : 'Offline'}</span>
                  {pendingCount > 0 && <span className="text-amber-500 font-medium">({pendingCount})</span>}
                </div>
                <button className="relative p-1.5 text-gray-600 dark:text-gray-400 hover:text-brand-orange transition-colors ml-auto" aria-label="Notifications">
                  <BellIcon />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>

          {user ? (
            <>
              <div className="flex items-center gap-3 pb-2">
                <div className="h-10 w-10 rounded-full bg-brand-green flex items-center justify-center text-white font-bold overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    user.full_name?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.full_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">@{user.username}</p>
                </div>
              </div>
              <Link href="/feed" onClick={closeMobile} className="block py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-brand-orange transition-colors">Feed</Link>
              <Link href="/onboarding" onClick={closeMobile} className="block py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-brand-orange transition-colors">Spaces</Link>
              <Link href={`/profile/${user.id}`} onClick={closeMobile} className="block py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-brand-orange transition-colors">Profile</Link>
              {isAdmin && (
                <Link href="/admin" onClick={closeMobile} className="block py-2 text-sm font-medium text-red-500 hover:text-red-600 transition-colors">Admin</Link>
              )}
              <button onClick={handleSignOut} className="block w-full text-left py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 transition-colors">Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/onboarding" onClick={closeMobile} className="block py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-brand-orange transition-colors">Sign In</Link>
              <Link href="/onboarding" onClick={closeMobile} className="inline-block rounded-full bg-brand-orange px-5 py-2 text-sm font-bold text-white hover:bg-brand-lightOrange transition-colors">Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
