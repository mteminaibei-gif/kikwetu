'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { Professional } from '@/types';

interface Props {
  mode?: 'student' | 'professional';
}

export default function StudentArea({ mode = 'student' }: Props) {
  const { user } = useAuth();
  const { professionals, loadProfessionals, loading } = useApp();
  const [search, setSearch] = useState('');
  const [filterExpertise, setFilterExpertise] = useState<string | null>(null);

  const isStudentMode = mode === 'student';

  useEffect(() => {
    loadProfessionals();
  }, [loadProfessionals]);

  const filtered = professionals.filter(p => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.bio.toLowerCase().includes(search.toLowerCase()) && !p.profile?.full_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterExpertise && !p.expertise?.includes(filterExpertise)) return false;
    return true;
  });

  const allExpertise = [...new Set(professionals.flatMap(p => p.expertise || []))];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-deep via-brand-deep to-brand-red p-8 rounded-2xl text-white shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{isStudentMode ? '🎓' : '👨‍🏫'}</span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black">{isStudentMode ? 'Student Area' : 'Verified Professionals'}</h1>
            <p className="text-sm text-gray-200">{isStudentMode ? 'Find verified teachers and book 1-on-1 learning sessions' : 'Browse our verified teachers and experts'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by teacher name, subject, or skill..."
            className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30" />
          <Link href="/onboarding" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            Become a Teacher
          </Link>
        </div>
      </div>

      {/* Expertise Filters */}
      {allExpertise.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterExpertise(null)}
            className={cn('px-3 py-1.5 rounded-full text-xs font-bold transition-all', !filterExpertise ? 'bg-brand-deep text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400')}>
            All
          </button>
          {allExpertise.map(e => (
            <button key={e} onClick={() => setFilterExpertise(e)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-bold transition-all', filterExpertise === e ? 'bg-brand-terracotta text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400')}>
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Professional Cards */}
      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl block mb-4">🔍</span>
          <p className="text-sm text-gray-400">No verified professionals found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <Link key={p.id} href={`/professionals/${p.id}`}
              className="sun-card p-5 space-y-4 hover:-translate-y-1 hover:shadow-md transition-all group">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-terracotta to-brand-red flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
                  {p.profile?.avatar_url ? <img src={p.profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : p.profile?.full_name?.[0]?.toUpperCase() || 'P'}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold truncate group-hover:text-brand-red transition-colors">{p.profile?.full_name || 'Professional'}</h3>
                  <p className="text-xs text-brand-red font-semibold truncate">{p.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                    <span>{p.profile?.county}</span>
                    {p.avg_rating > 0 && (
                      <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        {p.avg_rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">{p.bio}</p>
              <div className="flex flex-wrap gap-1.5">
                {(p.expertise || []).slice(0, 3).map(exp => (
                  <span key={exp} className="text-[10px] font-semibold bg-brand-terracotta/10 text-brand-red px-2 py-0.5 rounded-full">{exp}</span>
                ))}
                {(p.expertise?.length || 0) > 3 && <span className="text-[10px] text-gray-400">+{p.expertise!.length - 3}</span>}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
                <span className="text-gray-400">{p.total_sessions || 0} sessions</span>
                <span className="font-bold text-brand-deep dark:text-white">Book Now &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
