'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import DesktopSidebar from '@/components/DesktopSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { timeAgo, cn } from '@/lib/utils';
import type { Thread, Professional, Space, Profile } from '@/types';

type Tab = 'all' | 'threads' | 'professionals' | 'spaces' | 'people';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const initialQ = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQ);
  const [tab, setTab] = useState<Tab>('all');
  const [loading, setLoading] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [people, setPeople] = useState<Profile[]>([]);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setThreads([]); setProfessionals([]); setSpaces([]); setPeople([]);
      return;
    }
    setLoading(true);
    const sb = createClient();
    const like = `%${q.trim()}%`;

    const [tRes, pRes, sRes, uRes] = await Promise.all([
      sb.from('threads')
        .select('*, author:profiles(full_name, avatar_url, verified, county, username), space:spaces(name)')
        .or(`title.ilike.${like},content.ilike.${like}`)
        .order('created_at', { ascending: false })
        .limit(20),
      sb.from('professionals')
        .select('*, profile:profiles(full_name, avatar_url, county, verified, heshima_score, role)')
        .eq('verification_status', 'approved')
        .or(`title.ilike.${like},bio.ilike.${like}`)
        .limit(12),
      sb.from('spaces')
        .select('*')
        .or(`name.ilike.${like},description.ilike.${like}`)
        .limit(12),
      sb.from('profiles')
        .select('*')
        .or(`full_name.ilike.${like},username.ilike.${like},bio.ilike.${like}`)
        .limit(12),
    ]);

    if (tRes.data) setThreads(tRes.data as Thread[]);
    if (pRes.data) setProfessionals(pRes.data as Professional[]);
    if (sRes.data) setSpaces(sRes.data as Space[]);
    if (uRes.data) setPeople(uRes.data as Profile[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (initialQ) runSearch(initialQ);
  }, [initialQ, runSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
    runSearch(q);
  };

  const showThreads = tab === 'all' || tab === 'threads';
  const showPros = tab === 'all' || tab === 'professionals';
  const showSpaces = tab === 'all' || tab === 'spaces';
  const showPeople = tab === 'all' || tab === 'people';

  const total =
    (showThreads ? threads.length : 0) +
    (showPros ? professionals.length : 0) +
    (showSpaces ? spaces.length : 0) +
    (showPeople ? people.length : 0);

  return (
    <div className="min-h-screen bg-brand-bgLight dark:bg-brand-bgDark">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6 pt-4 pb-24 md:pb-8">
        <DesktopSidebar />
        <main className="flex-1 min-w-0 max-w-3xl mx-auto w-full space-y-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Tafuta</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Search threads, experts, spaces & people across Kenya</p>
          </div>

          <form onSubmit={handleSubmit} className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search questions, #KilimoSmart, experts, counties…"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 text-sm shadow-sm"
              autoFocus
            />
          </form>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['all', 'threads', 'professionals', 'spaces', 'people'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'px-4 py-2 rounded-full text-xs font-bold capitalize whitespace-nowrap transition-all',
                  tab === t
                    ? 'bg-brand-red text-white shadow-md'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {loading && (
            <div className="text-center py-12 text-sm text-gray-500">Searching…</div>
          )}

          {!loading && query.trim() && total === 0 && (
            <div className="text-center py-16 space-y-2">
              <p className="text-4xl">🔍</p>
              <p className="font-bold text-gray-800 dark:text-gray-200">Hakuna matokeo</p>
              <p className="text-sm text-gray-500">No results for “{query}”. Try a different keyword.</p>
            </div>
          )}

          {!loading && !query.trim() && (
            <div className="text-center py-16 space-y-2">
              <p className="text-4xl">🇰🇪</p>
              <p className="font-bold text-gray-800 dark:text-gray-200">Search KikwetuConnect</p>
              <p className="text-sm text-gray-500">Find discussions, verified professionals, spaces and people.</p>
            </div>
          )}

          {showThreads && threads.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Threads ({threads.length})</h2>
              {threads.map(t => (
                <Link
                  key={t.id}
                  href={`/thread/${t.id}`}
                  className="block p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-brand-terracotta/40 transition-all shadow-sm"
                >
                  <p className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{t.title}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.content}</p>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
                    <span>{t.author?.full_name || 'Anonymous'}</span>
                    {t.county && <span>· {t.county}</span>}
                    <span>· {timeAgo(t.created_at)}</span>
                    <span>· ▲ {t.upvotes_count}</span>
                  </div>
                </Link>
              ))}
            </section>
          )}

          {showPros && professionals.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Professionals ({professionals.length})</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {professionals.map(p => (
                  <Link
                    key={p.id}
                    href={`/professionals/${p.profile_id}`}
                    className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-emerald-400/40 transition-all shadow-sm"
                  >
                    <p className="font-bold text-gray-900 dark:text-gray-100">{p.profile?.full_name || p.title}</p>
                    <p className="text-xs text-emerald-600 font-medium">{p.title}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.bio}</p>
                    <div className="flex gap-2 mt-2 text-[11px] text-gray-400">
                      {p.profile?.county && <span>{p.profile.county}</span>}
                      <span>★ {p.avg_rating?.toFixed(1) || '—'}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {showSpaces && spaces.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Spaces ({spaces.length})</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {spaces.map(s => (
                  <Link
                    key={s.id}
                    href={`/feed?space=${s.id}`}
                    className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-brand-red/30 transition-all shadow-sm"
                  >
                    <p className="font-bold text-gray-900 dark:text-gray-100">{s.icon} {s.name}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.description}</p>
                    <p className="text-[11px] text-gray-400 mt-2">{s.member_count} members · {s.thread_count} threads</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {showPeople && people.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">People ({people.length})</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {people.map(p => (
                  <Link
                    key={p.id}
                    href={`/profile/${p.id}`}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-brand-terracotta/40 transition-all shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-terracotta to-brand-red flex items-center justify-center text-white font-bold shrink-0">
                      {p.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{p.full_name}</p>
                      <p className="text-xs text-gray-500">@{p.username}{p.county ? ` · ${p.county}` : ''}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-gray-500">Loading search…</div>}>
      <SearchContent />
    </Suspense>
  );
}
