'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { createClient } from '@/lib/supabase';
import { timeAgo, formatNumber, getInitials, getAvatarColor, heshimaLevel, cn } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { User } from '@supabase/supabase-js';

interface Question {
  id: string;
  author_id: string;
  title: string;
  content: string;
  subject: string;
  grade_level: string;
  county: string;
  is_resolved: boolean;
  upvotes_count: number;
  answer_count: number;
  created_at: string;
  author: { full_name: string; avatar_url?: string; username: string; county?: string; heshima_score: number };
  accepted_answer_id?: string;
}

interface Answer {
  id: string;
  question_id: string;
  author_id: string;
  content: string;
  is_accepted: boolean;
  upvotes_count: number;
  created_at: string;
  author: { full_name: string; avatar_url?: string; username: string; role: string; heshima_score: number };
}

export default function QuestionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { tr, contentLang } = useLanguage();
  const sbRef = useRef<ReturnType<typeof createClient> | null>(null);
  if (typeof window !== 'undefined' && !sbRef.current) {
    sbRef.current = createClient();
  }
  const sb = sbRef.current!;

  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAnswer, setNewAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [upvotingQ, setUpvotingQ] = useState(false);
  const [upvotingA, setUpvotingA] = useState<string | null>(null);

  const loadQuestion = useCallback(async () => {
    const qId = params.id as string;
    const { data: q } = await sb.from('student_questions').select('*, author:profiles!student_questions_author_id_fkey(full_name, avatar_url, username, county, heshima_score)').eq('id', qId).single();
    if (q) setQuestion(q as Question);
    const { data: a } = await sb.from('student_answers').select('*, author:profiles!student_answers_author_id_fkey(full_name, avatar_url, username, role, heshima_score)').eq('question_id', qId).order('is_accepted', { ascending: false }).order('upvotes_count', { ascending: false });
    setAnswers((a || []) as Answer[]);
    setLoading(false);
  }, [params.id, sb]);

  useEffect(() => { loadQuestion(); }, [loadQuestion]);

  const handleUpvoteQuestion = async () => {
    if (!user || !question || upvotingQ) return;
    setUpvotingQ(true);
    await sb.from('student_questions').upsert({ id: question.id, upvotes_count: (question.upvotes_count || 0) + 1 }, { onConflict: 'id' });
    setQuestion(q => q ? { ...q, upvotes_count: (q.upvotes_count || 0) + 1 } : q);
    setUpvotingQ(false);
  };

  const handleUpvoteAnswer = async (answerId: string) => {
    if (!user || upvotingA) return;
    setUpvotingA(answerId);
    const ans = answers.find(a => a.id === answerId);
    if (ans) {
      await sb.from('student_answers').upsert({ id: answerId, upvotes_count: (ans.upvotes_count || 0) + 1 }, { onConflict: 'id' });
      setAnswers(prev => prev.map(a => a.id === answerId ? { ...a, upvotes_count: (a.upvotes_count || 0) + 1 } : a));
    }
    setUpvotingA(null);
  };

  const handleAcceptAnswer = async (answerId: string) => {
    if (!user || !question || user.id !== question.author_id) return;
    await sb.from('student_questions').update({ is_resolved: true, accepted_answer_id: answerId }).eq('id', question.id);
    await sb.from('student_answers').update({ is_accepted: true }).eq('id', answerId);
    setQuestion(q => q ? { ...q, is_resolved: true, accepted_answer_id: answerId } : q);
    setAnswers(prev => prev.map(a => a.id === answerId ? { ...a, is_accepted: true } : { ...a, is_accepted: false }));
    if (user.id !== answers.find(a => a.id === answerId)?.author_id) {
      await sb.from('notifications').insert({ user_id: answers.find(a => a.id === answerId)?.author_id, type: 'answer_accepted', message: `${user.email} accepted your answer`, from_user_id: user.id, entity_id: answerId });
    }
  };

  const handleSubmitAnswer = async () => {
    if (!user || !newAnswer.trim() || submitting) return;
    setSubmitting(true);
    const { data, error } = await sb.from('student_answers').insert({ question_id: question!.id, author_id: user.id, content: newAnswer.trim() }).select('*, author:profiles!student_answers_author_id_fkey(full_name, avatar_url, username, role, heshima_score)').single();
    if (!error && data) {
      setAnswers(prev => [...prev, data as Answer]);
      setNewAnswer('');
      await sb.from('student_questions').update({ answer_count: (question!.answer_count || 0) + 1 }).eq('id', question!.id);
      if (user.id !== question!.author_id) {
        await sb.from('notifications').insert({ user_id: question!.author_id, type: 'new_answer', message: `${user.email} answered your question`, from_user_id: user.id, entity_id: question!.id });
      }
    }
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  if (!question) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-gray-500">{tr('Swali halijapatikana', 'Question not found')}</p>
      <Link href="/students" className="sun-btn px-4 py-2 rounded-full text-sm font-bold">{tr('Rudi', 'Go Back')}</Link>
    </div>
  );

  const level = heshimaLevel(question.author.heshima_score || 0);
  const isAuthor = user?.id === question.author_id;

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/students" className="inline-flex items-center gap-2 text-sm text-brand-red hover:text-brand-deep mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
          {tr('Maswali ya Wanafunzi', 'Student Questions')}
        </Link>

        <div className="sun-card p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-1">
              <button onClick={handleUpvoteQuestion} disabled={!user || upvotingQ} className={cn('p-1.5 rounded-lg transition-colors', upvotingQ ? 'opacity-50' : 'hover:bg-brand-terracotta/10 text-gray-400 hover:text-brand-terracotta')}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
              </button>
              <span className="text-sm font-bold text-brand-terracotta">{formatNumber(question.upvotes_count || 0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', level.color)}>{level.icon} {level.name}</span>
                {question.is_resolved && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">✓ {tr('Imetatuliwa', 'Resolved')}</span>}
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-terracotta/10 text-brand-terracotta font-bold">{question.subject}</span>
                {question.grade_level && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 font-bold">{question.grade_level}</span>}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-brand-deep dark:text-white mb-3 leading-tight">{question.title}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap mb-4">{question.content}</p>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: getAvatarColor(question.author.full_name) }}>
                    {question.author.avatar_url ? <img src={question.author.avatar_url} alt="" className="w-6 h-6 rounded-full" /> : getInitials(question.author.full_name)}
                  </div>
                  <span className="font-bold text-gray-600 dark:text-gray-300">{question.author.full_name}</span>
                  <span className="text-gray-400">@{question.author.username}</span>
                </div>
                <span>&middot;</span>
                <span>{timeAgo(question.created_at)}</span>
                {question.county && <><span>&middot;</span><span>{question.county}</span></>}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-black text-brand-deep dark:text-white mb-4">{tr('Majibu', 'Answers')} ({answers.length})</h2>
          <div className="space-y-4">
            {answers.map(ans => {
              const ansLevel = heshimaLevel(ans.author.heshima_score || 0);
              return (
                <div key={ans.id} className={cn('sun-card p-5 sm:p-6', ans.is_accepted && 'ring-2 ring-green-400 dark:ring-green-500')}>
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <button onClick={() => handleUpvoteAnswer(ans.id)} disabled={!user || upvotingA === ans.id} className={cn('p-1 rounded-lg transition-colors', upvotingA === ans.id ? 'opacity-50' : 'hover:bg-brand-terracotta/10 text-gray-400 hover:text-brand-terracotta')}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                      </button>
                      <span className="text-xs font-bold text-brand-terracotta">{formatNumber(ans.upvotes_count || 0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {ans.is_accepted && (
                        <div className="inline-flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400 mb-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          {tr('Jibu Lililokubalika', 'Accepted Answer')}
                        </div>
                      )}
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap mb-3">{ans.content}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: getAvatarColor(ans.author.full_name) }}>
                            {ans.author.avatar_url ? <img src={ans.author.avatar_url} alt="" className="w-5 h-5 rounded-full" /> : getInitials(ans.author.full_name)}
                          </div>
                          <span className="font-bold text-gray-600 dark:text-gray-300">{ans.author.full_name}</span>
                          <span className="text-gray-400">@{ans.author.username}</span>
                          <span className={cn('text-[10px] font-bold', ansLevel.color)}>{ansLevel.icon}</span>
                        </div>
                        <span>&middot;</span>
                        <span>{timeAgo(ans.created_at)}</span>
                        {isAuthor && !question.is_resolved && (
                          <button onClick={() => handleAcceptAnswer(ans.id)} className="ml-auto text-green-600 dark:text-green-400 font-bold hover:underline">
                            ✓ {tr('Kubali Jibu', 'Accept Answer')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {answers.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">{tr('Hakuna majibu bado. Kuwa wa kwanza!', 'No answers yet. Be the first!')}</div>
            )}
          </div>
        </div>

        {user ? (
          <div className="mt-8 sun-card p-5 sm:p-6">
            <h3 className="text-base font-bold text-brand-deep dark:text-white mb-3">{tr('Andika Jibu', 'Write an Answer')}</h3>
            <textarea
              value={newAnswer}
              onChange={e => setNewAnswer(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 resize-none"
              placeholder={tr('Andika jibu lako hapa...', 'Write your answer here...')}
            />
            <div className="flex justify-end mt-3">
              <button onClick={handleSubmitAnswer} disabled={!newAnswer.trim() || submitting} className="sun-btn px-6 py-2.5 rounded-full text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50">
                {submitting ? <LoadingSpinner size="sm" /> : tr('Tuma Jibu', 'Submit Answer')}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 text-center py-8 sun-card">
            <p className="text-sm text-gray-500">{tr('Ingia ili uweze kujibu', 'Sign in to answer')}</p>
            <Link href="/" className="sun-btn inline-block mt-3 px-6 py-2 rounded-full text-sm font-bold">{tr('Ingia', 'Sign In')}</Link>
          </div>
        )}
      </div>
    </div>
  );
}
