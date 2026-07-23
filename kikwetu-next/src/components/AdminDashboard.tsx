'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { timeAgo, getInitials, getAvatarColor, roleBadge } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { Profile, Thread, Report, Space } from '@/types';

interface Stat {
  title: string; value: string; icon: string; color: string;
}

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState<Stat[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  const sb = createClient();

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) { router.push('/feed'); return; }
    loadData();
  }, [user, isAdmin, authLoading, router]);

  const loadData = async () => {
    setLoading(true);
    const [uRes, tRes, rRes, sRes, pCount, tCount, rpCount] = await Promise.all([
      sb.from('profiles').select('*').order('created_at', { ascending: false }).limit(50),
      sb.from('threads').select('*, author:profiles(full_name), space:spaces(name)').order('created_at', { ascending: false }).limit(30),
      sb.from('reports').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      sb.from('spaces').select('*').order('name'),
      sb.from('profiles').select('id', { count: 'exact', head: true }),
      sb.from('threads').select('id', { count: 'exact', head: true }),
      sb.from('replies').select('id', { count: 'exact', head: true }),
    ]);
    if (uRes.data) setUsers(uRes.data as Profile[]);
    if (tRes.data) setThreads(tRes.data as Thread[]);
    if (rRes.data) setReports(rRes.data as Report[]);
    if (sRes.data) setSpaces(sRes.data as Space[]);
    setStats([
      { title: 'Total Users', value: String(pCount.count || 0), icon: 'group', color: 'bg-brand-green' },
      { title: 'Total Threads', value: String(tCount.count || 0), icon: 'forum', color: 'bg-brand-orange' },
      { title: 'Total Replies', value: String(rpCount.count || 0), icon: 'chat', color: 'bg-amber-500' },
      { title: 'Flagged Items', value: String(rRes.data?.length || 0), icon: 'warning', color: 'bg-rose-500' },
    ]);
    setLoading(false);
  };

  const resolveReport = async (id: string, action: 'dismiss' | 'remove') => {
    await sb.from('reports').update({ status: action === 'remove' ? 'resolved' : 'dismissed' }).eq('id', id);
    setReports(prev => prev.filter(r => r.id !== id));
  };

  if (authLoading || loading) return <LoadingSpinner />;
  if (!user || !isAdmin) return null;

  const sidebarClasses = (id: string) =>
    `w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
      tab === id ? 'bg-brand-green text-white shadow-lg' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
    }`;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-brand-bgLight dark:bg-brand-bgDark">
      <aside className="w-full md:w-64 bg-white dark:bg-brand-cardDark border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-200 dark:border-gray-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-green to-brand-orange flex items-center justify-center text-white font-bold text-sm">K</div>
          <div>
            <span className="text-sm font-bold text-brand-green dark:text-white">Kikwetu<span className="text-brand-orange">Admin</span></span>
            <p className="text-[10px] text-gray-400 leading-none">Management Console</p>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {[
            { id: 'overview', label: 'Overview', icon: 'M13 17h8m0 0V9m0 8l-8-8-4 4-4-4' },
            { id: 'users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
            { id: 'threads', label: 'Threads', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
            { id: 'moderation', label: `Moderation${reports.length ? ` (${reports.length})` : ''}`, icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' },
            { id: 'spaces', label: 'Spaces', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={sidebarClasses(t.id)}>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} /></svg>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto p-3 border-t border-gray-200 dark:border-gray-800">
          <button onClick={() => router.push('/feed')} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Feed
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto max-h-screen">
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map(s => (
                <div key={s.title} className="sun-card p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{s.title}</p>
                  <p className="text-2xl font-black text-brand-green dark:text-white mt-1">{s.value}</p>
                  <div className={`w-3 h-3 rounded-full mt-2 ${s.color}`} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="sun-card p-5">
                <h3 className="font-bold mb-3 flex items-center justify-between">
                  <span>Recent Users</span>
                  <span className="text-[10px] text-gray-400 font-medium">{users.length} total</span>
                </h3>
                <div className="space-y-2">
                  {users.slice(0, 5).map(u => (
                    <div key={u.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${getAvatarColor(u.full_name)}`}>
                          {getInitials(u.full_name)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{u.full_name || 'Unnamed'}</p>
                          <p className="text-xs text-gray-400">{u.county || 'Unknown'} <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${roleBadge(u.role)}`}>{u.role}</span></p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="sun-card p-5">
                <h3 className="font-bold mb-3">Spaces</h3>
                <div className="space-y-2">
                  {spaces.map(s => (
                    <div key={s.id} className="flex items-center justify-between py-2">
                      <span className="text-sm font-semibold">{s.icon || '#'} {s.name}</span>
                      <span className="text-xs text-gray-400">{s.member_count} members</span>
                    </div>
                  ))}
                  {spaces.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No spaces created yet.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="sun-card p-5">
            <h3 className="font-bold mb-4">All Users ({users.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-bold text-gray-400 uppercase border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 pr-4">User</th>
                    <th className="pb-3 pr-4">County</th>
                    <th className="pb-3 pr-4">Role</th>
                    <th className="pb-3 pr-4">Heshima</th>
                    <th className="pb-3">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${getAvatarColor(u.full_name)}`}>
                            {getInitials(u.full_name)}
                          </div>
                          <div><p className="font-semibold">{u.full_name || 'Unnamed'}</p><p className="text-xs text-gray-400">{u.email}</p></div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-xs text-gray-500">{u.county || '-'}</td>
                      <td className="py-3 pr-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleBadge(u.role)}`}>{u.role}</span></td>
                      <td className="py-3 pr-4 font-bold">{u.heshima_score}</td>
                      <td className="py-3 text-xs text-gray-400">{timeAgo(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'threads' && (
          <div className="space-y-3">
            {threads.map(t => (
              <div key={t.id} className="sun-card p-4">
                <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-1">
                  <span className="font-bold uppercase px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">{t.type}</span>
                  <span>{t.author?.full_name || 'Unknown'}</span>
                  <span>{timeAgo(t.created_at)}</span>
                </div>
                <p className="font-semibold text-sm line-clamp-1">{t.title}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                  <span>{t.upvotes_count} votes</span>
                  <span>{t.reply_count} replies</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'moderation' && (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="sun-card p-12 text-center">
                <span className="text-4xl block mb-3">🛡️</span>
                <p className="text-sm text-gray-400">No flagged content. All clear!</p>
              </div>
            ) : reports.map(r => (
              <div key={r.id} className="sun-card p-4">
                <div className="flex items-center gap-2 text-xs mb-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-900/30 text-rose-600 border border-rose-200">{r.reason}</span>
                  <span className="text-gray-400">{timeAgo(r.created_at)}</span>
                </div>
                <p className="text-xs text-gray-400">Reported by: {r.reporter_id?.substring(0, 8)}...</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => resolveReport(r.id, 'dismiss')}
                    className="px-3 py-1.5 bg-brand-green/10 text-brand-green hover:bg-brand-green/20 font-semibold text-xs rounded-lg border border-brand-green/30 transition-colors">
                    Dismiss
                  </button>
                  <button onClick={() => resolveReport(r.id, 'remove')}
                    className="px-3 py-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 font-semibold text-xs rounded-lg border border-rose-200 transition-colors">
                    Remove Content
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'spaces' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {spaces.map(s => (
              <div key={s.id} className="sun-card p-5">
                <h3 className="font-bold">{s.icon || '#'} {s.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{s.description || 'No description'}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-3">
                  <span className="font-semibold text-brand-green">{s.member_count} members</span>
                  <span>{s.thread_count} threads</span>
                </div>
              </div>
            ))}
            {spaces.length === 0 && (
              <div className="col-span-full text-center py-12 text-sm text-gray-400">No spaces created yet.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
