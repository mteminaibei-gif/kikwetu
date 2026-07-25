'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { createClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';

function BellIcon({ className }: { className?: string }) { return <svg xmlns="http://www.w3.org/2000/svg" className={cn('h-5 w-5', className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>; }
function SunIcon({ className }: { className?: string }) { return <svg xmlns="http://www.w3.org/2000/svg" className={cn('h-5 w-5', className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>; }
function MoonIcon({ className }: { className?: string }) { return <svg xmlns="http://www.w3.org/2000/svg" className={cn('h-5 w-5', className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>; }
function MenuIcon() { return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 6h16M4 12h16M4 18h16" /></svg>; }
function XIcon() { return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6 6 18M6 6l12 12" /></svg>; }
function SearchIcon({ className }: { className?: string }) { return <svg className={cn('w-4 h-4', className)} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>; }

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const { unreadCount, pendingSyncCount, realtimeStatus } = useApp();
  const { uiLang, setUiLang } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; title: string; author: { full_name: string } }[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setOnline(navigator.onLine);
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDark(stored === 'dark' || (!stored && prefersDark));
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    if (dark) { html.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { html.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [dark, mounted]);

  useEffect(() => {
    const h = () => setOnline(navigator.onLine);
    window.addEventListener('online', h); window.addEventListener('offline', h);
    return () => { window.removeEventListener('online', h); window.removeEventListener('offline', h); };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMobileSearchOpen(false);
    setProfileOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [mobileOpen]);

  const toggleTheme = useCallback(() => setDark(prev => !prev), []);
  const handleSignOut = useCallback(async () => { await signOut(); setProfileOpen(false); setMobileOpen(false); router.push('/'); }, [signOut, router]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || !user) { setSearchResults([]); setSearchOpen(false); return; }
    const sb = createClient();
    const { data } = await sb.from('threads')
      .select('id, title, author:profiles(full_name)')
      .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
      .limit(8);
    if (data) {
      setSearchResults(data as unknown as typeof searchResults);
      setSearchOpen(data.length > 0);
    }
  }, [user]);

  const handleSearchChange = useCallback((val: string) => {
    setSearchQuery(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(val), 300);
  }, [doSearch]);

  const handleSearchSelect = useCallback((id: string) => {
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setSearchQuery('');
    setMobileOpen(false);
    router.push(`/thread/${id}`);
  }, [router]);

  const menuLinkClass = 'flex items-center gap-3 min-h-[48px] px-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-gray-800 touch-manipulation';

  const statusDot =
    !online || realtimeStatus === 'offline'
      ? { color: 'bg-red-500', label: 'Offline' }
      : realtimeStatus === 'polling'
        ? { color: 'bg-amber-500', label: 'Polling' }
        : realtimeStatus === 'connected'
          ? { color: 'bg-green-500', label: 'Live' }
          : { color: 'bg-gray-400', label: 'Connecting' };

  return (
    <header className={cn(
      'sticky top-0 z-[9999] sun-nav-border backdrop-blur-xl border-b-0 transition-all duration-300',
      scrolled
        ? 'bg-white dark:bg-brand-cardDark shadow-[0_2px_20px_rgba(204,91,71,0.12)]'
        : 'bg-white/80 dark:bg-brand-cardDark/80'
    )}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        <Link href={user ? '/feed' : '/'} className="flex items-center gap-2 shrink-0 group min-h-[44px]">
          <img src="/logo-icon.svg" alt="KikwetuConnect" className="h-8 sm:h-9 w-auto group-hover:scale-105 transition-transform drop-shadow-sm" />
          <div className="hidden sm:block">
            <span className="text-lg font-black font-logo text-brand-deep dark:text-white leading-none block">Kikwetu<span className="text-brand-red">Connect</span></span>
          </div>
        </Link>

        {user && pathname !== '/' && (
          <div className="hidden md:flex flex-1 max-w-md relative" ref={searchRef}>
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400"><SearchIcon /></span>
            <input type="search" value={searchQuery} onChange={e => handleSearchChange(e.target.value)} placeholder="Tafuta (Search) questions, #KilimoSmart..." className="w-full pl-10 pr-10 py-2.5 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 text-sm transition-all placeholder:text-gray-400" />
            {searchOpen && (
              <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 py-2 max-h-72 overflow-y-auto">
                {searchResults.map(r => (
                  <button key={r.id} onClick={() => handleSearchSelect(r.id)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
                    <SearchIcon className="shrink-0 text-gray-400" />
                    <span className="truncate font-medium">{r.title}</span>
                    <span className="text-[10px] text-gray-400 shrink-0 ml-auto">{r.author?.full_name || ''}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-0.5 sm:gap-1.5">
          {user && pathname !== '/' && (
            <button
              onClick={() => { setMobileSearchOpen(prev => !prev); setMobileOpen(false); }}
              className="md:hidden p-2.5 min-w-[44px] min-h-[44px] rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-all active:scale-90 touch-manipulation"
              aria-label="Search"
            >
              <SearchIcon className="w-5 h-5" />
            </button>
          )}

          <button onClick={toggleTheme} className="p-2.5 min-w-[44px] min-h-[44px] rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-all active:scale-90 touch-manipulation" aria-label="Theme">
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>

          {user ? (
            <>
              <div className="relative" ref={notifRef}>
                <button onClick={() => setNotifOpen(prev => !prev)} className="relative p-2.5 min-w-[44px] min-h-[44px] rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-all active:scale-90 touch-manipulation" aria-label="Notifications">
                  <BellIcon />
                  {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-red rounded-full animate-ping" />}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl py-3 z-50">
                    <div className="px-4 pb-2 border-b border-gray-100 dark:border-gray-800"><p className="text-sm font-bold">Notifications</p></div>
                    <div className="px-4 py-8 text-center text-xs text-gray-400">No new notifications.</div>
                  </div>
                )}
              </div>

              <div
                className="hidden sm:flex items-center gap-1.5 text-[10px] text-gray-400"
                title={`Realtime: ${statusDot.label}`}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full', statusDot.color, realtimeStatus === 'connected' && 'animate-pulse')} />
                <span className="hidden lg:inline">{statusDot.label}</span>
                {pendingSyncCount > 0 && <span className="text-amber-500 font-medium">({pendingSyncCount})</span>}
              </div>

              <div className="relative hidden sm:block" ref={profileRef}>
                <button onClick={() => setProfileOpen(prev => !prev)} className="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-gray-700 group min-h-[44px]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-terracotta to-brand-red flex items-center justify-center text-white text-sm font-bold overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                    {user.avatar_url ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                      : user.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-bold leading-none">{user.full_name}</p>
                    <span className="text-[10px] text-brand-red font-semibold">Heshima: {user.heshima_score}</span>
                  </div>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1 z-50">
                    <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-sm font-semibold truncate">{user.full_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user.username}</p>
                    </div>
                    <Link href={`/profile/${user.id}`} onClick={() => setProfileOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Profile</Link>
                    <Link href="/settings" onClick={() => setProfileOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Settings</Link>
                    <Link href="/parent" onClick={() => setProfileOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Mzazi (Parent)</Link>
                    {isAdmin && <Link href="/admin" onClick={() => setProfileOpen(false)} className="block px-4 py-2.5 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800">Admin</Link>}
                    <button onClick={handleSignOut} className="block w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800">Sign Out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link href="/onboarding" className="hidden xs:inline text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-brand-red px-2 py-2 transition-colors min-h-[44px] flex items-center">Sign In</Link>
              <Link href="/onboarding" className="sun-btn px-3 sm:px-4 py-2 rounded-full text-xs font-bold shadow-md min-h-[40px] flex items-center">Get Started</Link>
            </div>
          )}

          <button
            onClick={() => setMobileOpen(prev => !prev)}
            className="md:hidden p-2.5 min-w-[44px] min-h-[44px] rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-all touch-manipulation"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {mobileSearchOpen && user && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 px-3 py-2 bg-white dark:bg-brand-cardDark">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><SearchIcon /></span>
            <input
              type="search"
              autoFocus
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Tafuta..."
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 text-sm"
            />
            <button type="button" onClick={() => { setMobileSearchOpen(false); setSearchQuery(''); setSearchOpen(false); }} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400" aria-label="Close search">
              <XIcon />
            </button>
          </div>
          {searchOpen && searchResults.length > 0 && (
            <div className="mt-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map(r => (
                <button key={r.id} onClick={() => handleSearchSelect(r.id)}
                  className="w-full text-left px-4 py-3 text-sm active:bg-gray-100 dark:active:bg-gray-800 flex items-center gap-2 border-b border-gray-50 dark:border-gray-800 last:border-0 touch-manipulation">
                  <span className="truncate font-medium flex-1">{r.title}</span>
                  <span className="text-[10px] text-gray-400 shrink-0">{r.author?.full_name || ''}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 top-14 sm:top-16 z-40 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="md:hidden relative z-50 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-brand-cardDark shadow-xl max-h-[min(80vh,calc(100dvh-3.5rem))] overflow-y-auto overscroll-contain">
            <div className="px-3 py-3 space-y-1 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {user ? (
                <>
                  <div className="flex items-center gap-3 p-3 mb-2 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-terracotta to-brand-red flex items-center justify-center text-white font-bold overflow-hidden shadow-sm shrink-0">
                      {user.avatar_url ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" /> : user.full_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{user.full_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user.username} · Heshima {user.heshima_score}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <span className={cn('w-1.5 h-1.5 rounded-full', statusDot.color)} />
                        {statusDot.label}
                      </p>
                    </div>
                  </div>
                  <Link href="/feed" onClick={() => setMobileOpen(false)} className={menuLinkClass}>Feed</Link>
                  <Link href="/students" onClick={() => setMobileOpen(false)} className={menuLinkClass}>🎓 Students / Learn</Link>
                  <Link href="/nyumba-kumi" onClick={() => setMobileOpen(false)} className={cn(menuLinkClass, 'text-amber-600 dark:text-amber-400')}>🏘️ Nyumba Kumi</Link>
                  <Link href="/professionals" onClick={() => setMobileOpen(false)} className={cn(menuLinkClass, 'text-brand-red')}>🛡️ Professionals</Link>
                  <Link href="/radio" onClick={() => setMobileOpen(false)} className={menuLinkClass}>📻 Radio</Link>
                  <Link href="/feed?view=spaces" onClick={() => setMobileOpen(false)} className={menuLinkClass}>Spaces</Link>
                  <Link href="/feed?view=leaderboard" onClick={() => setMobileOpen(false)} className={menuLinkClass}>Karma</Link>
                  <div className="border-t border-gray-100 dark:border-gray-800 my-2" />
                  <Link href={`/profile/${user.id}`} onClick={() => setMobileOpen(false)} className={menuLinkClass}>Profile</Link>
                  <Link href="/settings" onClick={() => setMobileOpen(false)} className={menuLinkClass}>Settings</Link>
                  <Link href="/parent" onClick={() => setMobileOpen(false)} className={menuLinkClass}>Mzazi (Parent)</Link>
                  {isAdmin && <Link href="/admin" onClick={() => setMobileOpen(false)} className={cn(menuLinkClass, 'text-red-500')}>Admin</Link>}
                  <button onClick={handleSignOut} className={cn(menuLinkClass, 'w-full text-left text-red-600 dark:text-red-400')}>Sign Out</button>
                </>
              ) : (
                <Link href="/onboarding" onClick={() => setMobileOpen(false)} className="sun-btn inline-flex items-center justify-center w-full px-5 py-3 rounded-full text-sm font-bold shadow-md min-h-[48px]">Get Started</Link>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
