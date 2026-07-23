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
      { title: 'Total Users', value: String(pCount.count || 0), icon: 'group', color: 'bg-emerald-500' },
      { title: 'Total Threads', value: String(tCount.count || 0), icon: 'forum', color: 'bg-blue-500' },
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
      tab === id ? 'bg-emerald-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
    }`;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950">
      <aside className="w-full md:w-60 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
        <div className="h-14 flex items-center gap-2 px-5 border-b border-slate-800">
          <img src="/logo-icon.svg" alt="KikwetuConnect" className="h-8 w-auto" />
          <span className="text-lg font-bold text-white">Kikwetu<span className="text-emerald-400">Admin</span></span>
        </div>
        <nav className="p-3 space-y-1">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'users', label: 'Users' },
            { id: 'threads', label: 'Threads' },
            { id: 'moderation', label: `Moderation${reports.length ? ` (${reports.length})` : ''}` },
            { id: 'spaces', label: 'Spaces' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={sidebarClasses(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto max-h-screen">
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map(s => (
                <div key={s.title} className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.title}</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{s.value}</p>
                  <div className={`w-3 h-3 rounded-full mt-2 ${s.color}`} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold mb-3">Recent Users</h3>
                <div className="space-y-2">
                  {users.slice(0, 5).map(u => (
                    <div key={u.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${getAvatarColor(u.full_name)}`}>
                          {getInitials(u.full_name)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{u.full_name || 'Unnamed'}</p>
                          <p className="text-xs text-slate-400">{u.county || 'Unknown'} · {u.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold mb-3">Spaces</h3>
                <div className="space-y-2">
                  {spaces.map(s => (
                    <div key={s.id} className="flex items-center justify-between py-2">
                      <span className="text-sm font-semibold">{s.name}</span>
                      <span className="text-xs text-slate-400">{s.member_count} members</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold mb-4">All Users ({users.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                  <th className="pb-3 pr-4">User</th><th className="pb-3 pr-4">County</th><th className="pb-3 pr-4">Role</th><th className="pb-3 pr-4">Heshima</th><th className="pb-3">Joined</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${getAvatarColor(u.full_name)}`}>
                            {getInitials(u.full_name)}
                          </div>
                          <div><p className="font-semibold">{u.full_name || 'Unnamed'}</p><p className="text-xs text-slate-400">{u.email}</p></div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-slate-500 text-xs">{u.county || '-'}</td>
                      <td className="py-3 pr-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleBadge(u.role)}`}>{u.role}</span></td>
                      <td className="py-3 pr-4 font-bold">{u.heshima_score}</td>
                      <td className="py-3 text-xs text-slate-400">{timeAgo(u.created_at)}</td>
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
              <div key={t.id} className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1">
                  <span className="font-bold uppercase">{t.type}</span>
                  <span>· {t.author?.full_name || 'Unknown'}</span>
                  <span>· {timeAgo(t.created_at)}</span>
                </div>
                <p className="font-semibold text-sm line-clamp-1">{t.title}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
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
              <div className="text-center py-12 text-sm text-slate-400">No flagged content. All clear!</div>
            ) : reports.map(r => (
              <div key={r.id} className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs mb-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-900/30 text-rose-600 border border-rose-200">{r.reason}</span>
                  <span className="text-slate-400">{timeAgo(r.created_at)}</span>
                </div>
                <p className="text-xs text-slate-400">Reported by: {r.reporter_id}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => resolveReport(r.id, 'dismiss')}
                    className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 font-semibold text-xs rounded-lg border border-emerald-200">
                    Dismiss
                  </button>
                  <button onClick={() => resolveReport(r.id, 'remove')}
                    className="px-3 py-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 font-semibold text-xs rounded-lg border border-rose-200">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'spaces' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {spaces.map(s => (
              <div key={s.id} className="p-5 rounded-xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold">{s.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{s.description || 'No description'}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-3">
                  <span>{s.member_count} members</span>
                  <span>{s.thread_count} threads</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
