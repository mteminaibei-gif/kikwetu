'use client';

import { useEffect, useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { timeAgo, formatNumber } from '@/lib/utils';
import type { Professional, ServiceRating } from '@/types';

interface Props {
  professionalId: string;
}

export default function ProfessionalProfile({ professionalId }: Props) {
  const { user } = useAuth();
  const { professionals, loadProfessionals, ratings, loadRatings, createSession, loadSessions } = useApp();
  const { show } = useToast();
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [booking, setBooking] = useState(false);

  const pro = useMemo(
    () => professionals.find(p => p.id === professionalId) ?? null,
    [professionals, professionalId]
  );
  const loading = professionals.length === 0 || (professionals.length > 0 && !pro);

  useEffect(() => {
    if (professionals.length === 0) loadProfessionals();
  }, [loadProfessionals, professionals.length]);

  useEffect(() => {
    if (pro) {
      loadRatings(pro.profile_id);
    }
  }, [pro, loadRatings]);

  const handleBook = async () => {
    if (!user) { show('Please sign in to book a session.'); return; }
    if (!topic.trim()) { show('Please enter a topic.'); return; }
    setBooking(true);
    const { error, data } = await createSession({
      professional_id: pro!.profile_id, topic: topic.trim(), description: description.trim() || undefined,
    });
    setBooking(false);
    if (error) { show(error); return; }
    if (data) {
      show('Session requested!');
      window.location.href = `/chat/${data.id}`;
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!pro) return <div className="text-center py-16 text-gray-400">Professional not found.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Profile Header */}
      <div className="sun-card p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-terracotta to-brand-red flex items-center justify-center text-white font-bold text-3xl shadow-md shrink-0">
            {pro.profile?.avatar_url ? <img src={pro.profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : pro.profile?.full_name?.[0]?.toUpperCase() || 'P'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black">{pro.profile?.full_name || 'Professional'}</h1>
              <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Verified
              </span>
            </div>
            <p className="text-sm font-semibold text-brand-red mt-0.5">{pro.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{pro.profile?.county}</p>
            <div className="flex items-center gap-4 mt-3 text-xs">
              {pro.avg_rating > 0 && (
                <span className="flex items-center gap-1 text-amber-500 font-bold">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  {pro.avg_rating.toFixed(1)}
                </span>
              )}
              <span className="text-gray-400">{pro.total_sessions || 0} sessions</span>
              <span className="text-gray-400">KES {pro.total_tips || 0} in tips</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">About</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{pro.bio}</p>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Qualifications</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{pro.qualifications}</p>
          {pro.qualifications_doc_url && (
            <a href={pro.qualifications_doc_url} target="_blank" className="inline-flex items-center gap-1 text-xs text-brand-red font-semibold mt-1 hover:underline">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              View Credentials
            </a>
          )}
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Expertise</h3>
          <div className="flex flex-wrap gap-2">
            {(pro.expertise || []).map(exp => (
              <span key={exp} className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-terracotta/10 text-brand-red border border-brand-terracotta/20">{exp}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Book Session */}
      {user && user.id !== pro.profile_id && (
        <div className="sun-card p-6 space-y-4">
          <h3 className="font-bold">Book a Learning Session</h3>
          <input value={topic} onChange={e => setTopic(e.target.value)}
            placeholder="What do you want to learn? (e.g. Introduction to React)"
            className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50" />
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
            placeholder="Additional details (optional)"
            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 resize-none" />
          <button onClick={handleBook} disabled={booking || !topic.trim()}
            className="w-full bg-gradient-to-r from-brand-terracotta to-brand-red hover:from-brand-red hover:to-brand-terracotta text-white font-bold py-3.5 rounded-xl text-sm shadow-lg transition-all disabled:opacity-50 active:scale-[0.98]">
            {booking ? 'Booking...' : 'Request Session'}
          </button>
        </div>
      )}

      {/* Ratings */}
      <div className="sun-card p-6 space-y-4">
        <h3 className="font-bold flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
          Reviews & Ratings
        </h3>
        {ratings.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No reviews yet. Be the first to book a session!</p>
        ) : (
          <div className="space-y-4">
            {ratings.map(r => (
              <div key={r.id} className="pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold">{r.student?.full_name || 'Student'}</span>
                  <span className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => <span key={s} className={`text-xs ${s <= r.score ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}`}>★</span>)}
                  </span>
                  <span className="text-gray-400">{timeAgo(r.created_at)}</span>
                </div>
                {r.review && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{r.review}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
