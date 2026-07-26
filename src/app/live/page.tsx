'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import DesktopSidebar from '@/components/DesktopSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { timeAgo, cn } from '@/lib/utils';
import type { LiveRoom } from '@/types';

export default function LivePage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<LiveRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    topic: '',
    language: 'en',
    county: user?.county || '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sb = createClient();
      const { data, error: err } = await sb
        .from('live_rooms')
        .select('*, host:profiles(full_name, avatar_url, username, verified)')
        .eq('is_active', true)
        .order('participant_count', { ascending: false })
        .limit(30);
      if (err) throw err;
      setRooms((data || []) as LiveRoom[]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load rooms';
      if (msg.includes('relation') || msg.includes('does not exist')) {
        setRooms([]);
        setError('Live rooms table not applied yet. Run the latest Supabase migration.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const sb = createClient();
      const { error: err } = await sb.from('live_rooms').insert({
        host_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        topic: form.topic.trim() || null,
        language: form.language,
        county: form.county || null,
        is_active: true,
        participant_count: 1,
      });
      if (err) throw err;
      setShowForm(false);
      setForm({ title: '', description: '', topic: '', language: 'en', county: user.county || '' });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not create room');
    } finally {
      setSubmitting(false);
    }
  };

  const endRoom = async (id: string) => {
    if (!user) return;
    const sb = createClient();
    await sb.from('live_rooms').update({ is_active: false }).eq('id', id).eq('host_id', user.id);
    load();
  };

  return (
    <div className="min-h-screen bg-brand-bgLight dark:bg-brand-bgDark">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6 pt-4 pb-24 md:pb-8">
        <DesktopSidebar />
        <main className="flex-1 min-w-0 max-w-3xl mx-auto w-full space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
                Live Rooms
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Community audio spaces — host or join a baraza</p>
            </div>
            {user && (
              <button
                onClick={() => setShowForm(v => !v)}
                className="shrink-0 bg-brand-red text-white px-4 py-2.5 rounded-full text-sm font-bold shadow-md"
              >
                {showForm ? 'Cancel' : '+ Host'}
              </button>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm border border-amber-200 dark:border-amber-800">
              {error}
            </div>
          )}

          {showForm && user && (
            <form onSubmit={createRoom} className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3">
              <input
                required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Room title (e.g. Evening Kilimo chat)"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
              />
              <textarea
                rows={2}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What will you discuss?"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={form.topic}
                  onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                  placeholder="Topic tag"
                  className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                />
                <select
                  value={form.language}
                  onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                  className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                >
                  <option value="en">English</option>
                  <option value="sw">Kiswahili</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50"
              >
                {submitting ? 'Starting…' : 'Go live'}
              </button>
              <p className="text-[11px] text-gray-400 text-center">
                Note: Full WebRTC audio is coming next. For now rooms are listed so the community can coordinate (WhatsApp / phone).
              </p>
            </form>
          )}

          {loading ? (
            <div className="text-center py-16 text-sm text-gray-500">Loading live rooms…</div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <p className="text-4xl">🎙️</p>
              <p className="font-bold text-gray-800 dark:text-gray-200">No live rooms right now</p>
              <p className="text-sm text-gray-500">Host a room and invite your county to join the conversation.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rooms.map(room => (
                <article
                  key={room.id}
                  className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex gap-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-brand-terracotta flex items-center justify-center text-white text-xl shrink-0">
                    🎙️
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase text-red-500 tracking-wide">Live</span>
                      {room.topic && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">{room.topic}</span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mt-0.5">{room.title}</h3>
                    {room.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{room.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-gray-400">
                      <span>{room.host?.full_name || 'Host'}</span>
                      {room.county && <span>· {room.county}</span>}
                      <span>· {room.language === 'sw' ? 'Kiswahili' : room.language === 'both' ? 'EN/SW' : 'English'}</span>
                      <span>· {room.participant_count} listening</span>
                      <span>· {timeAgo(room.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      className={cn(
                        'px-4 py-2 rounded-full text-xs font-bold',
                        'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      )}
                    >
                      Join
                    </button>
                    {user?.id === room.host_id && (
                      <button
                        onClick={() => endRoom(room.id)}
                        className="px-4 py-2 rounded-full text-xs font-bold border border-gray-200 dark:border-gray-700 text-gray-500"
                      >
                        End
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
