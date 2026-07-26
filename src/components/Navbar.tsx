'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { createClient } from '@/lib/supabase';
import { cn, timeAgo } from '@/lib/utils';
import Image from 'next/image';

function BellIcon({ className }: { className?: string }) { return <svg xmlns="http://www.w3.org/2000/svg" className={cn('h-5 w-5', className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>; }
function SunIcon({ className }: { className?: string }) { return <svg xmlns="http://www.w3.org/2000/svg" className={cn('h-5 w-5', className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>; }
function MoonIcon({ className }: { className?: string }) { return <svg xmlns="http://www.w3.org/2000/svg" className={cn('h-5 w-5', className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>; }

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const { notifications, unreadCount, pendingSyncCount } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; title: string; author: { full_name: string } }[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
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

  const toggleTheme = useCallback(() => setDark(prev => !prev), []);
  const handleSignOut = useCallback(async () => { await signOut(); setProfileOpen(false); router.push('/'); }, [signOut, router]);

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
    setSearchQuery('');
    router.push(`/thread/${id}`);
  }, [router]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setSearchOpen(false);
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    } else {
      router.push('/search');
    }
  }, [searchQuery, router]);

  return (
    <header className={cn(
      'sticky top-0 z-[9999] backdrop-blur-xl border-b transition-all duration-300',
      scrolled
        ? 'bg-white/95 dark:bg-[#0a0a0a]/95 border-gray-200 dark:border-gray-800 shadow-sm'
        : 'bg-white/70 dark:bg-[#0a0a0a]/70 border-transparent'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link href={user ? '/feed' : '/'} className="flex items-center gap-2.5 shrink-0 group md:w-64">
          <img src="/logo-icon.svg" alt="KikwetuConnect" className="h-8 w-auto group-hover:scale-105 transition-transform" />
          <span className="text-xl font-black font-logo text-brand-deep dark:text-white leading-none hidden sm:block">
            Kikwetu<span className="text-brand-red">Connect</span>
          </span>
        </Link>

        {user && pathname !== '/' && (
          <div className="flex-1 max-w-2xl relative hidden md:block" ref={searchRef}>
            <form onSubmit={handleSearchSubmit}>
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input type="text" value={searchQuery} onChange={e => handleSearchChange(e.target.value)} placeholder="Tafuta (Search) questions, #KilimoSmart, or spaces..."
                className="w-full pl-10 pr-10 py-2.5 rounded-full border-0 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 text-sm transition-all placeholder:text-gray-500" />
            </form>
            {searchOpen && (
              <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 py-2 max-h-72 overflow-y-auto">
                {searchResults.map(r => (
                  <button key={r.id} onClick={() => handleSearchSelect(r.id)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <span className="truncate font-medium">{r.title}</span>
                    <span className="text-[10px] text-gray-400 shrink-0 ml-auto">{r.author?.full_name || ''}</span>
                  </button>
                ))}
                {searchQuery.trim() && (
                  <button
                    onClick={() => handleSearchSubmit({ preventDefault: () => {} } as React.FormEvent)}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-brand-red hover:bg-gray-50 dark:hover:bg-gray-800 border-t border-gray-100 dark:border-gray-800"
                  >
                    See all results for “{searchQuery.trim()}” →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-1 sm:gap-2 shrink-0 md:w-80 justify-end">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-all active:scale-90" aria-label="Theme">
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>

          {user ? (
            <>
              <div className="relative" ref={notifRef}>
                <button onClick={() => setNotifOpen(prev => !prev)} className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-all active:scale-90" aria-label="Notifications">
                  <BellIcon />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-red text-[9px] font-bold text-white border-2 border-white dark:border-[#0a0a0a]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl py-3 z-50">
                    <div className="px-4 pb-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Notifications</p>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-xs text-gray-500 dark:text-gray-400">No new notifications.</div>
                    ) : (
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {notifications.map(n => (
                          <div key={n.id} className={cn("px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-xs cursor-pointer", !n.is_read && "bg-brand-terracotta/5 font-semibold")}>
                            <p className="text-gray-800 dark:text-gray-200">{n.title || n.body || `New ${n.type}`}</p>
                            <span className="text-[10px] text-gray-400 mt-1 block">{timeAgo(n.created_at)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative md:hidden" ref={profileRef}>
                <button onClick={() => setProfileOpen(prev => !prev)} className="flex items-center justify-center ml-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-terracotta to-brand-red flex items-center justify-center text-white text-sm font-bold overflow-hidden shadow-sm">
                    {user.avatar_url ? <Image src={user.avatar_url} alt="" width={32} height={32} className="h-full w-full object-cover" unoptimized={!user.avatar_url.includes('supabase') && !user.avatar_url.includes('google')} />
                      : user.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1 z-50">
                    <button onClick={handleSignOut} className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800">Sign Out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/onboarding" className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-brand-red px-3 py-1.5">Log in</Link>
              <Link href="/onboarding" className="bg-brand-red text-white px-4 py-2 rounded-full text-sm font-bold shadow-md hover:bg-brand-deep transition-all">Sign up</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
