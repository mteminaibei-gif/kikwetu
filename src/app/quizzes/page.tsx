'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import DesktopSidebar from '@/components/DesktopSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { cn } from '@/lib/utils';
import type { Quiz, QuizOption } from '@/types';

export default function QuizzesPage() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Quiz | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [scoreDelta, setScoreDelta] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sb = createClient();
      const { data, error: err } = await sb
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      if (err) throw err;

      const parsed = (data || []).map((q: Record<string, unknown>) => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options as string) : (q.options as QuizOption[]),
      })) as Quiz[];
      setQuizzes(parsed);

      if (user) {
        const { data: results } = await sb
          .from('quiz_results')
          .select('quiz_id')
          .eq('user_id', user.id);
        if (results) setCompletedIds(new Set(results.map(r => r.quiz_id)));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load quizzes';
      if (msg.includes('relation') || msg.includes('does not exist')) {
        setQuizzes([]);
        setError('Quizzes table not applied yet. Run the latest Supabase migration.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const startQuiz = (q: Quiz) => {
    setActive(q);
    setSelected(null);
    setSubmitted(false);
    setScoreDelta(0);
  };

  const submitAnswer = async () => {
    if (!active || selected === null) return;
    const correct = selected === active.correct_answer;
    const points = correct ? active.points : 0;
    setScoreDelta(points);
    setSubmitted(true);

    if (user) {
      try {
        const sb = createClient();
        await sb.from('quiz_results').upsert({
          user_id: user.id,
          quiz_id: active.id,
          score: points,
          answers: [selected],
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,quiz_id' });

        if (correct && points > 0) {
          await sb.rpc('increment_heshima', { p_user_id: user.id, p_amount: points }).catch(() => {
            // RPC may not exist — soft fail
          });
        }
        setCompletedIds(prev => new Set(prev).add(active.id));
      } catch {
        // non-blocking
      }
    }
  };

  const difficultyColor = (d: string) => {
    if (d === 'easy') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (d === 'hard') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  };

  return (
    <div className="min-h-screen bg-brand-bgLight dark:bg-brand-bgDark">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6 pt-4 pb-24 md:pb-8">
        <DesktopSidebar />
        <main className="flex-1 min-w-0 max-w-3xl mx-auto w-full space-y-5">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Quizzes</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Test your knowledge · earn Heshima points</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm border border-amber-200 dark:border-amber-800">
              {error}
            </div>
          )}

          {active ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-5">
              <button onClick={() => setActive(null)} className="text-xs font-bold text-gray-500 hover:text-brand-red">
                ← Back to list
              </button>
              <div className="flex items-center gap-2">
                <span className={cn('text-[10px] font-bold uppercase px-2 py-0.5 rounded-full', difficultyColor(active.difficulty))}>
                  {active.difficulty}
                </span>
                <span className="text-[10px] text-gray-400">{active.points} pts</span>
                {active.category && <span className="text-[10px] text-gray-400">· {active.category}</span>}
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{active.title}</h2>
              {active.description && <p className="text-sm text-gray-500">{active.description}</p>}

              <div className="space-y-2">
                {(active.options || []).map((opt, idx) => {
                  const isSel = selected === idx;
                  const showCorrect = submitted && idx === active.correct_answer;
                  const showWrong = submitted && isSel && idx !== active.correct_answer;
                  return (
                    <button
                      key={opt.id ?? idx}
                      disabled={submitted}
                      onClick={() => setSelected(idx)}
                      className={cn(
                        'w-full text-left p-4 rounded-xl border-2 text-sm font-medium transition-all',
                        showCorrect && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
                        showWrong && 'border-red-400 bg-red-50 dark:bg-red-900/20',
                        !submitted && isSel && 'border-brand-red bg-brand-terracotta/10',
                        !submitted && !isSel && 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      )}
                    >
                      {opt.text}
                    </button>
                  );
                })}
              </div>

              {!submitted ? (
                <button
                  onClick={submitAnswer}
                  disabled={selected === null}
                  className="w-full bg-brand-red text-white py-3 rounded-xl text-sm font-bold disabled:opacity-40"
                >
                  Submit answer
                </button>
              ) : (
                <div className="text-center space-y-3">
                  <p className={cn('text-lg font-black', scoreDelta > 0 ? 'text-emerald-600' : 'text-red-500')}>
                    {scoreDelta > 0 ? `Correct! +${scoreDelta} Heshima` : 'Not quite — try another quiz'}
                  </p>
                  <button
                    onClick={() => setActive(null)}
                    className="px-6 py-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-bold"
                  >
                    Back to quizzes
                  </button>
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="text-center py-16 text-sm text-gray-500">Loading quizzes…</div>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <p className="text-4xl">🧠</p>
              <p className="font-bold text-gray-800 dark:text-gray-200">No quizzes yet</p>
              <p className="text-sm text-gray-500">Admins can add quizzes after running the migration.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quizzes.map(q => (
                <button
                  key={q.id}
                  onClick={() => startQuiz(q)}
                  className="w-full text-left p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:border-brand-terracotta/40 transition-all"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-[10px] font-bold uppercase px-2 py-0.5 rounded-full', difficultyColor(q.difficulty))}>
                      {q.difficulty}
                    </span>
                    <span className="text-[10px] text-gray-400">{q.points} pts</span>
                    {completedIds.has(q.id) && (
                      <span className="text-[10px] font-bold text-emerald-600 ml-auto">Completed ✓</span>
                    )}
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white">{q.title}</p>
                  {q.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{q.description}</p>}
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
