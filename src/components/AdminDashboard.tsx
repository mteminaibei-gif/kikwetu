'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { timeAgo, getInitials, getAvatarColor, roleBadge } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { Profile, Thread, Report, Space, ProfessionalRequest, Professional, Tip, ServiceRating, Payout } from '@/types';

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
  const [proRequests, setProRequests] = useState<ProfessionalRequest[]>([]);
  const [pros, setPros] = useState<Professional[]>([]);
  const [allTips, setAllTips] = useState<Tip[]>([]);
  const [allRatings, setAllRatings] = useState<ServiceRating[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const fetchAllData = async () => {
    const sb = createClient();
    const [uRes, tRes, rRes, sRes, pCount, tCount, rpCount, prRes, pRes, tipRes, rateRes, payoutRes] = await Promise.all([
      sb.from('profiles').select('*').order('created_at', { ascending: false }).limit(50),
      sb.from('threads').select('*, author:profiles(full_name), space:spaces(name)').order('created_at', { ascending: false }).limit(30),
      sb.from('reports').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      sb.from('spaces').select('*').order('name'),
      sb.from('profiles').select('id', { count: 'exact', head: true }),
      sb.from('threads').select('id', { count: 'exact', head: true }),
      sb.from('replies').select('id', { count: 'exact', head: true }),
      sb.from('professional_requests').select('*, profile:profiles(full_name, avatar_url, county, email)').order('created_at', { ascending: false }),
      sb.from('professionals').select('*, profile:profiles(full_name, avatar_url, county)').order('created_at', { ascending: false }),
      sb.from('tips').select('*, student:profiles!tips_student_id_fkey(full_name), professional:profiles!tips_professional_id_fkey(full_name)').order('created_at', { ascending: false }).limit(30),
      sb.from('service_ratings').select('*, student:profiles(full_name, avatar_url)').order('created_at', { ascending: false }).limit(30),
      sb.from('payouts').select('*, professional:profiles!payouts_professional_id_fkey(full_name, avatar_url), tip:tips!payouts_tip_id_fkey(amount, mpesa_ref, created_at, student:profiles!tips_student_id_fkey(full_name))').order('created_at', { ascending: false }).limit(50),
    ]);
    if (uRes.data) setUsers(uRes.data as Profile[]);
    if (tRes.data) setThreads(tRes.data as Thread[]);
    if (rRes.data) setReports(rRes.data as Report[]);
    if (sRes.data) setSpaces(sRes.data as Space[]);
    if (prRes.data) setProRequests(prRes.data as ProfessionalRequest[]);
    if (pRes.data) setPros(pRes.data as Professional[]);
    if (tipRes.data) setAllTips(tipRes.data as Tip[]);
    if (rateRes.data) setAllRatings(rateRes.data as ServiceRating[]);
    if (payoutRes.data) setPayouts(payoutRes.data as Payout[]);
    setStats([
      { title: 'Total Users', value: String(pCount.count || 0), icon: 'group', color: 'bg-brand-deep' },
      { title: 'Total Threads', value: String(tCount.count || 0), icon: 'forum', color: 'bg-brand-terracotta' },
      { title: 'Total Replies', value: String(rpCount.count || 0), icon: 'chat', color: 'bg-amber-500' },
      { title: 'Flagged Items', value: String(rRes.data?.length || 0), icon: 'warning', color: 'bg-rose-500' },
    ]);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) { router.push('/feed'); return; }
    let mounted = true;
    fetchAllData();
    return () => { mounted = false; };
  }, [user, isAdmin, authLoading, router]);

  const handleProReview = async (id: string, status: 'approved' | 'rejected') => {
    const req = proRequests.find(r => r.id === id);
    if (!req) return;
    if (status === 'rejected' && !rejectReason.trim()) return;
    const sb = createClient();
    if (status === 'approved') {
      await sb.from('professional_requests').update({ status, reviewed_by: user!.id, reviewed_at: new Date().toISOString() }).eq('id', id);
      await sb.from('professionals').upsert({
        profile_id: req.profile_id, title: req.title, bio: req.bio,
        qualifications: req.qualifications, qualifications_doc_url: req.qualifications_doc_url,
        expertise: req.expertise, verification_status: 'approved', verified_by: user!.id, verified_at: new Date().toISOString(),
      }).select().single();
      await sb.from('profiles').update({ role: 'expert' }).eq('id', req.profile_id);
    } else {
      await sb.from('professional_requests').update({ status, reviewed_by: user!.id, reviewed_at: new Date().toISOString(), rejection_reason: rejectReason || null }).eq('id', id);
    }
    setRejectReason('');
    setRejectingId(null);
    await fetchAllData();
  };

  const handleMarkPayout = async (id: string, status: 'paid' | 'cancelled', notes?: string) => {
    const sb = createClient();
    await sb.from('payouts').update({ status, paid_by: user!.id, paid_at: status === 'paid' ? new Date().toISOString() : undefined, notes: notes || null }).eq('id', id);
    await sb.from('tips').update({ payout_status: status }).eq('id', payouts.find(p => p.id === id)?.tip_id || '');
    await fetchAllData();
  };

  const createPayouts = async () => {
    const sb = createClient();
    const pendingTips = allTips.filter(t => t.status === 'completed' && t.payout_status !== 'paid');
    for (const tip of pendingTips) {
      await sb.from('payouts').upsert({
        professional_id: tip.professional_id, tip_id: tip.id,
        amount_professional: tip.professional_amount || Math.round(tip.amount * 0.7),
        amount_platform: tip.platform_amount || (tip.amount - Math.round(tip.amount * 0.7)),
        status: 'pending',
      }).select().single();
    }
    await fetchAllData();
  };

  const resolveReport = async (id: string, action: 'dismiss' | 'remove') => {
    const sb = createClient();
    await sb.from('reports').update({ status: action === 'remove' ? 'resolved' : 'dismissed' }).eq('id', id);
    setReports(prev => prev.filter(r => r.id !== id));
  };

  if (authLoading || loading) return <LoadingSpinner />;
  if (!user || !isAdmin) return null;

  const sidebarClasses = (id: string) =>
    `w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
      tab === id ? 'bg-brand-deep text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300'
    }`;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-brand-bgLight dark:bg-brand-bgDark">
      <aside className="w-full md:w-64 bg-white dark:bg-brand-cardDark border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0">
        <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-200 dark:border-gray-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-deep to-brand-red flex items-center justify-center text-white font-bold text-sm shadow-sm">K</div>
          <div>
            <span className="text-sm font-black text-brand-deep dark:text-white">Kikwetu<span className="text-brand-red">Admin</span></span>
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
            { id: 'professionals', label: `Professionals${proRequests.filter(r => r.status === 'pending').length ? ` (${proRequests.filter(r => r.status === 'pending').length})` : ''}`, icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
            { id: 'payouts', label: `Payouts${payouts.filter(p => p.status === 'pending').length ? ` (${payouts.filter(p => p.status === 'pending').length})` : ''}`, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={sidebarClasses(t.id)}>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} /></svg>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto p-3 border-t border-gray-200 dark:border-gray-800">
          <button onClick={() => router.push('/feed')} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
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
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{s.title}</p>
                  <p className="text-2xl font-black text-brand-deep dark:text-white mt-1">{s.value}</p>
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
                    <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${getAvatarColor(u.full_name)}`}>
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
                    <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
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
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${getAvatarColor(u.full_name)}`}>
                            {getInitials(u.full_name)}
                          </div>
                          <div><p className="font-semibold text-sm">{u.full_name || 'Unnamed'}</p><p className="text-xs text-gray-400">{u.email}</p></div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-xs text-gray-500 dark:text-gray-400">{u.county || '-'}</td>
                      <td className="py-3 pr-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleBadge(u.role)}`}>{u.role || 'user'}</span></td>
                      <td className="py-3 pr-4 font-bold text-sm">{u.heshima_score}</td>
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
              <div key={t.id} className="sun-card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-1.5">
                  <span className="font-bold uppercase px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">{t.type}</span>
                  <span>{t.author?.full_name || 'Unknown'}</span>
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  <span>{timeAgo(t.created_at)}</span>
                </div>
                <p className="font-semibold text-sm line-clamp-1">{t.title}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                  <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>{t.upvotes_count} votes</span>
                  <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>{t.reply_count} replies</span>
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
              <div key={r.id} className="sun-card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-xs mb-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200">{r.reason}</span>
                  <span className="text-gray-400">{timeAgo(r.created_at)}</span>
                </div>
                <p className="text-xs text-gray-400">Reported by: {r.reporter_id?.substring(0, 8)}...</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => resolveReport(r.id, 'dismiss')}
                    className="px-3 py-1.5 bg-brand-deep/10 text-brand-deep hover:bg-brand-deep/20 font-semibold text-xs rounded-lg border border-brand-deep/30 transition-colors active:scale-95">
                    Dismiss
                  </button>
                  <button onClick={() => resolveReport(r.id, 'remove')}
                    className="px-3 py-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 font-semibold text-xs rounded-lg border border-rose-200 transition-colors active:scale-95">
                    Remove Content
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'professionals' && (
          <div className="space-y-6">
            {/* Pending Requests */}
            <div className="sun-card p-5">
              <h3 className="font-bold mb-4 flex items-center justify-between">
                <span>Pending Verification Requests ({proRequests.filter(r => r.status === 'pending').length})</span>
              </h3>
              {proRequests.filter(r => r.status === 'pending').length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No pending requests.</p>
              ) : (
                <div className="space-y-3">
                  {proRequests.filter(r => r.status === 'pending').map(req => (
                    <div key={req.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-terracotta to-brand-red flex items-center justify-center text-white font-bold text-sm">
                            {req.profile?.full_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{req.profile?.full_name || 'Unknown'}</p>
                            <p className="text-xs text-brand-red font-semibold">{req.title}</p>
                            <p className="text-[10px] text-gray-400">{req.profile?.county} · {req.profile?.email}</p>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-bold">Pending</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <p><span className="font-bold text-gray-700 dark:text-gray-300">Bio:</span> {req.bio}</p>
                        <p><span className="font-bold text-gray-700 dark:text-gray-300">Qualifications:</span> {req.qualifications}</p>
                        {req.qualifications_doc_url && (
                          <a href={req.qualifications_doc_url} target="_blank" className="text-brand-red font-semibold hover:underline inline-flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            View Credentials
                          </a>
                        )}
                        <p><span className="font-bold text-gray-700 dark:text-gray-300">Expertise:</span> {(req.expertise || []).join(', ')}</p>
                      </div>
                      {rejectingId === req.id ? (
                        <div className="space-y-2">
                          <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={2}
                            placeholder="Reason for rejection (required)..."
                            className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 resize-none" />
                          <div className="flex gap-2">
                            <button onClick={() => { setRejectingId(null); setRejectReason(''); }}
                              className="px-3 py-1.5 text-xs font-bold border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                            <button onClick={() => handleProReview(req.id, 'rejected')}
                              className="px-3 py-1.5 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">Confirm Reject</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => handleProReview(req.id, 'approved')}
                            className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all active:scale-95">
                            <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Approve
                          </button>
                          <button onClick={() => setRejectingId(req.id)}
                            className="px-4 py-1.5 text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 rounded-lg transition-colors">
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* All Verified Professionals */}
            <div className="sun-card p-5">
              <h3 className="font-bold mb-4">All Verified Professionals ({pros.filter(p => p.verification_status === 'approved').length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] font-bold text-gray-400 uppercase border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-3 pr-4">Professional</th>
                      <th className="pb-3 pr-4">Title</th>
                      <th className="pb-3 pr-4">Rating</th>
                      <th className="pb-3 pr-4">Sessions</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {pros.filter(p => p.verification_status === 'approved').map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-terracotta to-brand-red flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                              {p.profile?.full_name?.[0]?.toUpperCase() || 'P'}
                            </div>
                            <span className="font-semibold text-sm">{p.profile?.full_name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-xs text-gray-500 dark:text-gray-400">{p.title}</td>
                        <td className="py-3 pr-4 text-xs font-bold text-amber-500">{p.avg_rating > 0 ? p.avg_rating.toFixed(1) : '-'}</td>
                        <td className="py-3 pr-4 text-xs">{p.total_sessions}</td>
                        <td className="py-3"><span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold">Active</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tips & Ratings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="sun-card p-5">
                <h3 className="font-bold mb-3">Recent Tips</h3>
                {allTips.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No tips yet.</p>
                ) : (
                  <div className="space-y-2">
                    {allTips.slice(0, 10).map(t => (
                      <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <div>
                          <p className="text-xs font-semibold">{t.student?.full_name || 'Student'} → {t.professional?.full_name || 'Pro'}</p>
                          <p className="text-[10px] text-gray-400">{timeAgo(t.created_at)} · {t.mpesa_ref ? `Ref: ${t.mpesa_ref}` : 'Pending'}</p>
                        </div>
                        <span className="text-xs font-bold text-emerald-600">KES {t.amount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="sun-card p-5">
                <h3 className="font-bold mb-3">Recent Ratings</h3>
                {allRatings.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No ratings yet.</p>
                ) : (
                  <div className="space-y-2">
                    {allRatings.slice(0, 10).map(r => (
                      <div key={r.id} className="py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold">{r.student?.full_name || 'Student'}</span>
                          <span className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => <span key={s} className={`text-[10px] ${s <= r.score ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}`}>★</span>)}
                          </span>
                          <span className="text-gray-400">{timeAgo(r.created_at)}</span>
                        </div>
                        {r.review && <p className="text-xs text-gray-500 mt-0.5">&ldquo;{r.review}&rdquo;</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'payouts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Payout Management</h3>
              <button onClick={createPayouts}
                className="px-4 py-2 bg-brand-deep text-white rounded-xl text-xs font-bold hover:bg-brand-deep/90 transition-colors">
                Generate Payouts from Tips
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="sun-card p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Pending</p>
                <p className="text-2xl font-black text-amber-500">{payouts.filter(p => p.status === 'pending').length}</p>
              </div>
              <div className="sun-card p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Paid</p>
                <p className="text-2xl font-black text-emerald-600">{payouts.filter(p => p.status === 'paid').length}</p>
              </div>
              <div className="sun-card p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Total Platform</p>
                <p className="text-2xl font-black text-brand-red">KES {payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount_platform || 0), 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="sun-card p-5">
              <h3 className="font-bold mb-4">All Payouts</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] font-bold text-gray-400 uppercase border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-3 pr-4">Professional</th>
                      <th className="pb-3 pr-4">Tip Amount</th>
                      <th className="pb-3 pr-4">Professional (70%)</th>
                      <th className="pb-3 pr-4">Platform (30%)</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {payouts.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-terracotta to-brand-red flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                              {p.professional?.full_name?.[0] || 'P'}
                            </div>
                            <span className="font-semibold text-xs">{p.professional?.full_name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 font-bold text-xs">KES {p.tip?.amount || 0}</td>
                        <td className="py-3 pr-4 text-xs text-emerald-600 font-semibold">KES {p.amount_professional}</td>
                        <td className="py-3 pr-4 text-xs text-brand-red font-semibold">KES {p.amount_platform}</td>
                        <td className="py-3 pr-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            p.status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            p.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>{p.status}</span>
                        </td>
                        <td className="py-3">
                          {p.status === 'pending' && (
                            <div className="flex gap-1.5">
                              <button onClick={() => handleMarkPayout(p.id, 'paid')}
                                className="px-2.5 py-1 text-[10px] font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">Mark Paid</button>
                              <button onClick={() => handleMarkPayout(p.id, 'cancelled')}
                                className="px-2.5 py-1 text-[10px] font-bold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">Cancel</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {payouts.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-xs text-gray-400">No payouts yet. Complete tips first.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'spaces' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {spaces.map(s => (
              <div key={s.id} className="sun-card p-5 hover:shadow-md transition-shadow">
                <h3 className="font-bold">{s.icon || '#'} {s.name}</h3>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{s.description || 'No description'}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <span className="font-semibold text-brand-deep dark:text-white">{s.member_count} members</span>
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
