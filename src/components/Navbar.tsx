'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { createClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';

function BellIcon({ className }: { className?: string }) { return <svg xmlns="http://www.w3.org/2000/svg" className={cn('h-5 w-5', className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>; }
function SunIcon({ className }: { className?: string }) { return <svg xmlns="http://www.w3.org/2000/svg" className={cn('h-5 w-5', className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>; }
function MoonIcon({ className }: { className?: string }) { return <svg xmlns="http://www.w3.org/2000/svg" className={cn('h-5 w-5', className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>; }
function MenuIcon() { return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 6h16M4 12h16M4 18h16" /></svg>; }
function XIcon() { return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6 6 18M6 6l12 12" /></svg>; }

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const { unreadCount, pendingSyncCount } = useApp();
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
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setOnline(navigator.onLine);
    const stored = localStorage.getItem('theme');
    setDark(stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches));
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
    setSearchQuery('');
    router.push(`/thread/${id}`);
  }, [router]);

  return (
    <header className="sticky top-0 z-50 sun-nav-border bg-white/95 dark:bg-brand-cardDark/95 backdrop-blur-lg shadow-sm border-b-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link href={user ? '/feed' : '/'} className="flex items-center gap-2.5 shrink-0 group">
          <img src="/logo-icon.svg" alt="KikwetuConnect" className="h-9 w-auto group-hover:scale-105 transition-transform drop-shadow-sm" />
          <div className="hidden sm:block">
            <span className="text-lg font-black font-logo text-brand-deep dark:text-white leading-none block">Kikwetu<span className="text-brand-red">Connect</span></span>
          </div>
        </Link>

        {user && pathname !== '/' && (
          <div className="hidden md:flex flex-1 max-w-md relative" ref={searchRef}>
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></span>
            <input type="text" value={searchQuery} onChange={e => handleSearchChange(e.target.value)} placeholder="Tafuta (Search) questions, #KilimoSmart, or spaces..." className="w-full pl-10 pr-10 py-2.5 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 text-sm transition-all placeholder:text-gray-400" />
            <button className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-brand-red transition-colors" title="Voice Search"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" /></svg></button>
            {searchOpen && (
              <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 py-2 max-h-72 overflow-y-auto">
                {searchResults.map(r => (
                  <button key={r.id} onClick={() => handleSearchSelect(r.id)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <span className="truncate font-medium">{r.title}</span>
                    <span className="text-[10px] text-gray-400 shrink-0 ml-auto">{r.author?.full_name || ''}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-1 sm:gap-1.5">
          <button onClick={toggleTheme} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-all active:scale-90" aria-label="Theme">
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>

          {user ? (
            <>
              <div className="relative" ref={notifRef}>
                <button onClick={() => setNotifOpen(prev => !prev)} className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-all active:scale-90" aria-label="Notifications">
                  <BellIcon />
                  {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-red rounded-full animate-ping" />}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl py-3 z-50">
                    <div className="px-4 pb-2 border-b border-gray-100 dark:border-gray-800"><p className="text-sm font-bold">Notifications</p></div>
                    <div className="px-4 py-8 text-center text-xs text-gray-400">No new notifications.</div>
                  </div>
                )}
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-gray-400">
                <span className={cn('w-1.5 h-1.5 rounded-full', online ? 'bg-green-500' : 'bg-red-500')} />
                {pendingSyncCount > 0 && <span className="text-amber-500 font-medium">({pendingSyncCount})</span>}
              </div>

              <div className="relative" ref={profileRef}>
                <button onClick={() => setProfileOpen(prev => !prev)} className="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-gray-700 group">
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
                    <Link href={`/profile/${user.id}`} onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Profile</Link>
                    <Link href="/settings" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Settings</Link>
                    <Link href="/parent" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Mzazi (Parent)</Link>
                    {isAdmin && <Link href="/admin" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800">Admin</Link>}
                    <button onClick={handleSignOut} className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800">Sign Out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/onboarding" className="text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-brand-red px-3 py-1.5 transition-colors">Sign In</Link>
              <Link href="/onboarding" className="sun-btn px-4 py-2 rounded-full text-xs font-bold shadow-md">Get Started</Link>
            </div>
          )}

          <button onClick={() => setMobileOpen(prev => !prev)} className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-all">{mobileOpen ? <XIcon /> : <MenuIcon />}</button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-brand-cardDark/95 backdrop-blur-lg px-4 py-4 space-y-3 shadow-lg">
          {user ? (
            <>
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-terracotta to-brand-red flex items-center justify-center text-white font-bold overflow-hidden shadow-sm">
                  {user.avatar_url ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" /> : user.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div><p className="text-sm font-semibold">{user.full_name}</p><p className="text-xs text-gray-500 dark:text-gray-400">@{user.username}</p></div>
              </div>
              <Link href="/feed" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-brand-red">Feed</Link>
              <Link href="/students" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-brand-red">🎓 Students</Link>
              <Link href="/nyumba-kumi" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg">🏘️ Nyumba Kumi</Link>
              <Link href="/professionals/request" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-brand-red hover:bg-brand-terracotta/5 rounded-lg">Understand</Link>
              <Link href="/feed?view=spaces" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-brand-red">Spaces</Link>
              <Link href="/feed?view=leaderboard" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-brand-red">Karma</Link>
              <Link href={`/profile/${user.id}`} onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-brand-red">Profile</Link>
              <Link href="/settings" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-brand-red">Settings</Link>
              <Link href="/parent" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-brand-red">Mzazi (Parent)</Link>
              {isAdmin && <Link href="/admin" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-red-500 dark:text-red-400">Admin</Link>}
              <button onClick={handleSignOut} className="block w-full text-left py-2 text-sm font-medium text-red-600 dark:text-red-400">Sign Out</button>
            </>
          ) : (
            <Link href="/onboarding" onClick={() => setMobileOpen(false)} className="sun-btn inline-flex items-center px-5 py-2.5 rounded-full text-sm font-bold shadow-md">Get Started</Link>
          )}
        </div>
      )}
    </header>
  );
}


