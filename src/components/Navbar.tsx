'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { createClient } from '@/lib/supabase';
import { cn, timeAgo } from '@/lib/utils';
import Image from 'next/image';

function BellIcon({ className }: { className?: string }) { return <svg xmlns="http://www.w3.org/2000/svg" className={cn('icon', className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>; }

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const { notifications, unreadCount, pendingSyncCount } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [online, setOnline] = useState(true);
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
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored === 'dark' || (!stored && prefersDark);
    html.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [mounted]);

  useEffect(() => {
    const h = () => setOnline(navigator.onLine);
    window.addEventListener('online', h); window.addEventListener('offline', h);
    return () => { window.removeEventListener('online', h); window.removeEventListener('offline', h); };
  }, []);

  const toggleTheme = useCallback(() => {
    const html = document.documentElement;
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setProfileOpen(false);
    router.push('/');
  }, [signOut, router]);

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

  const themeIcon = mounted && document.documentElement.getAttribute('data-theme') === 'dark' ? 'sun' : 'moon';

  return (
    <header className="topbar">
      <Link href={user ? '/feed' : '/'} className="wordmark">
        <span className="mark">k</span>
        <strong>kikwetu<span>.</span></strong>
      </Link>

      {user && pathname !== '/' && (
        <div className="search-bar" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'contents' }}>
            <i data-lucide="search" className="icon-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search people, counties, topics"
            />
          </form>
          {searchOpen && (
            <div style={{
              position: 'absolute',
              top: '100%', left: 0, right: 0, marginTop: 8,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-line)',
              borderRadius: 16,
              boxShadow: 'var(--shadow-md)',
              zIndex: 50,
              padding: 8,
            }}>
              {searchResults.map(r => (
                <button key={r.id} onClick={() => handleSearchSelect(r.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '10px 12px', border: 0, borderRadius: 10,
                    background: 'transparent', color: 'var(--color-text)', fontSize: '.78rem',
                    cursor: 'pointer', textAlign: 'left',
                  }}>
                  <i data-lucide="search" className="icon-sm" />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700 }}>{r.title}</span>
                  <span style={{ color: 'var(--color-text-3)', fontSize: '.65rem' }}>{r.author?.full_name || ''}</span>
                </button>
              ))}
              {searchQuery.trim() && (
                <button
                  onClick={() => handleSearchSubmit({ preventDefault: () => {} } as React.FormEvent)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '10px 12px', border: 0, borderTop: '1px solid var(--color-line)',
                    borderRadius: 0, background: 'transparent', color: 'var(--color-green)', fontSize: '.72rem',
                    fontWeight: 800, cursor: 'pointer',
                  }}>
                  See all results for &ldquo;{searchQuery.trim()}&rdquo; &rarr;
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {(!user || pathname === '/') && <div />}

      <div className="top-actions">
        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle dark mode">
          <i data-lucide={themeIcon} className="icon" />
        </button>
        <button className="icon-btn" id="langBtn" aria-label="Change language">
          <span className="eyebrow" style={{ letterSpacing: '.05em' }}>EN</span>
        </button>

        {user ? (
          <>
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button className="icon-btn" onClick={() => setNotifOpen(prev => !prev)} aria-label="Notifications">
                <BellIcon />
                {unreadCount > 0 && <span className="notice-dot" />}
              </button>
              {notifOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: 8,
                  width: 320, maxHeight: 384, overflowY: 'auto',
                  border: '1px solid var(--color-line)', borderRadius: 16,
                  background: 'var(--color-surface)', boxShadow: 'var(--shadow-md)',
                  zIndex: 50, padding: '12px 0',
                }}>
                  <div style={{ padding: '0 14px 10px', borderBottom: '1px solid var(--color-line)', display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '.78rem' }}>Notifications</strong>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px 14px', textAlign: 'center', fontSize: '.72rem', color: 'var(--color-text-3)' }}>No new notifications.</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} style={{
                        padding: '10px 14px', fontSize: '.74rem',
                        background: !n.is_read ? 'var(--color-green-soft)' : 'transparent',
                        cursor: 'pointer',
                      }}>
                        <p style={{ color: 'var(--color-text)', fontWeight: !n.is_read ? 700 : 400 }}>{n.title || n.body || `New ${n.type}`}</p>
                        <span style={{ color: 'var(--color-text-3)', fontSize: '.65rem', marginTop: 4, display: 'block' }}>{timeAgo(n.created_at)}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div ref={profileRef} style={{ position: 'relative' }}>
              <button className="profile-pill" onClick={() => setProfileOpen(prev => !prev)}>
                <span>{user.full_name}</span>
                <span className="avatar sm">
                  {user.avatar_url ? (
                    <Image src={user.avatar_url} alt="" width={31} height={31} style={{ borderRadius: '50%', objectFit: 'cover', width: 31, height: 31 }}
                      unoptimized={!user.avatar_url.includes('supabase') && !user.avatar_url.includes('google')} />
                  ) : (
                    user.full_name?.[0]?.toUpperCase() || 'U'
                  )}
                </span>
              </button>
              {profileOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: 8,
                  width: 180, border: '1px solid var(--color-line)', borderRadius: 12,
                  background: 'var(--color-surface)', boxShadow: 'var(--shadow-md)', zIndex: 50, padding: 4,
                }}>
                  <Link href={`/profile/${user.id}`} style={{
                    display: 'block', padding: '10px 12px', fontSize: '.74rem', fontWeight: 700,
                    color: 'var(--color-text)', borderRadius: 8, textDecoration: 'none',
                  }} onClick={() => setProfileOpen(false)}>View profile</Link>
                  <Link href="/settings" style={{
                    display: 'block', padding: '10px 12px', fontSize: '.74rem', fontWeight: 700,
                    color: 'var(--color-text)', borderRadius: 8, textDecoration: 'none',
                  }} onClick={() => setProfileOpen(false)}>Settings</Link>
                  <button onClick={handleSignOut} style={{
                    display: 'block', width: '100%', padding: '10px 12px', fontSize: '.74rem', fontWeight: 700,
                    color: 'var(--color-red)', borderRadius: 8, border: 0, background: 'transparent', textAlign: 'left', cursor: 'pointer',
                  }}>Sign Out</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/onboarding" style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--color-text-2)', textDecoration: 'none', padding: '6px 10px' }}>Log in</Link>
            <Link href="/onboarding" className="primary-btn" style={{ minHeight: 34, padding: '0 14px' }}>Sign up</Link>
          </div>
        )}
      </div>
    </header>
  );
}
