'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { createClient } from '@/lib/supabase';
import { cn, timeAgo, formatNumber, getInitials, getAvatarColor } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';

interface StudentQuestion {
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

const SUBJECTS = ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Computer Studies', 'Agriculture', 'Business Studies', 'Creative Arts', 'Other'];

export default function StudentPlatform() {
  const { user, loading: authLoading } = useAuth();
  const { tr, contentLang } = useLanguage();
  const { professionals, loadProfessionals } = useApp();
  const [questions, setQuestions] = useState<StudentQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'my-questions' | 'unanswered' | 'resolved'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ title: '', content: '', subject: '', grade_level: '' });
  const [viewingQuestion, setViewingQuestion] = useState<StudentQuestion | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [newAnswer, setNewAnswer] = useState('');
  const [answering, setAnswering] = useState(false);
  const sbRef = useRef(createClient());

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      let query = sbRef.current.from('student_questions')
        .select('*, author:profiles(full_name, avatar_url, username, county, heshima_score)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (activeFilter === 'my-questions' && user) {
        query = query.eq('author_id', user.id);
      } else if (activeFilter === 'unanswered') {
        query = query.eq('is_resolved', false).eq('answer_count', 0);
      } else if (activeFilter === 'resolved') {
        query = query.eq('is_resolved', true);
      }
      if (selectedSubject) {
        query = query.eq('subject', selectedSubject);
      }

      const { data } = await query;
      if (data) setQuestions(data as StudentQuestion[]);
    } catch (e) {
      console.error('Load questions error:', e);
    }
    setLoading(false);
  }, [activeFilter, selectedSubject, user]);

  useEffect(() => {
    if (authLoading) return;
    loadQuestions();
    loadProfessionals();
  }, [authLoading]);

  const loadAnswers = useCallback(async (questionId: string) => {
    const { data } = await sbRef.current.from('student_answers')
      .select('*, author:profiles(full_name, avatar_url, username, role, heshima_score)')
      .eq('question_id', questionId)
      .order('is_accepted', { ascending: false })
      .order('upvotes_count', { ascending: false })
      .order('created_at', { ascending: true });
    if (data) setAnswers(data as Answer[]);
  }, []);

  const handleCreateQuestion = async () => {
    if (!user || !newQuestion.title.trim() || !newQuestion.content.trim()) return;
    setCreating(true);
    const { error } = await sbRef.current.from('student_questions').insert({
      author_id: user.id,
      title: newQuestion.title.trim(),
      content: newQuestion.content.trim(),
      subject: newQuestion.subject,
      grade_level: newQuestion.grade_level,
      county: user.county || '',
    });
    if (!error) {
      setNewQuestion({ title: '', content: '', subject: '', grade_level: '' });
      setShowCreate(false);
      loadQuestions();
    }
    setCreating(false);
  };

  const handleVoteQuestion = async (questionId: string, voteType: 'up' | 'down') => {
    if (!user) return;
    const sb = sbRef.current;
    const { error } = await sb.rpc('toggle_vote', {
      p_user_id: user.id,
      p_entity_id: questionId,
      p_entity_type: 'student_question',
      p_vote_type: voteType,
    });
    if (!error) loadQuestions();
  };

  const handleVoteAnswer = async (answerId: string, voteType: 'up' | 'down') => {
    if (!user) return;
    const sb = sbRef.current;
    const { error } = await sb.rpc('toggle_vote', {
      p_user_id: user.id,
      p_entity_id: answerId,
      p_entity_type: 'student_answer',
      p_vote_type: voteType,
    });
    if (!error && viewingQuestion) {
      loadAnswers(viewingQuestion.id);
    }
  };

  const handleAcceptAnswer = async (answerId: string, questionId: string) => {
    if (!user) return;
    const sb = sbRef.current;
    await sb.from('student_questions').update({ is_resolved: true, accepted_answer_id: answerId }).eq('id', questionId);
    await sb.from('student_answers').update({ is_accepted: false }).eq('question_id', questionId).neq('id', answerId);
    await sb.from('student_answers').update({ is_accepted: true }).eq('id', answerId);
    // Award karma to answer author
    const answer = answers.find(a => a.id === answerId);
    if (answer) {
      await sb.rpc('award_karma', { p_user_id: answer.author_id, p_points: 15, p_reason: 'answer_accepted' });
    }
    setViewingQuestion(prev => prev ? { ...prev, is_resolved: true, accepted_answer_id: answerId } : null);
    loadAnswers(questionId);
    loadQuestions();
  };

  const handleSubmitAnswer = async () => {
    if (!user || !viewingQuestion || !newAnswer.trim()) return;
    setAnswering(true);
    const sb = sbRef.current;
    const { error } = await sb.from('student_answers').insert({
      question_id: viewingQuestion.id,
      author_id: user.id,
      content: newAnswer.trim(),
    });
    if (!error) {
      setNewAnswer('');
      loadAnswers(viewingQuestion.id);
      await sb.rpc('award_karma', { p_user_id: user.id, p_points: 5, p_reason: 'answer_posted' });
    }
    setAnswering(false);
  };

  if (authLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-deep via-brand-deep to-brand-red p-6 rounded-2xl text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black">{tr('Student Q&A', 'Maswali & Majibu Ya Wanafunzi')}</h1>
            <p className="text-sm text-gray-200 mt-1">{tr('Ask questions, get answers from verified professionals. Earn karma for great answers!', 'Uliza maswali, pata majibu kutoka kwa wataalamu walio thibitishwa. Pata heshima kwa majibu mazuri!')}</p>
          </div>
          {user && (
            <button onClick={() => setShowCreate(true)} className="sun-btn px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              {tr('Ask Question', 'Uliza Swali')}
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: tr('All Questions', 'Maswali Yote') },
          { id: 'unanswered', label: tr('Unanswered', 'Bila Majibu') },
          { id: 'resolved', label: tr('Resolved', 'Yamejibiwa') },
          ...(user ? [{ id: 'my-questions', label: tr('My Questions', 'Maswali Yangu') }] : []),
        ].map(f => (
          <button key={f.id} onClick={() => { setActiveFilter(f.id as typeof activeFilter); setSelectedSubject(null); }}
            className={cn('px-3 py-1.5 rounded-full text-xs font-bold transition-all', activeFilter === f.id ? 'bg-brand-deep text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700')}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Subject Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{tr('Subject:', 'Somuo:')}</span>
        <button onClick={() => setSelectedSubject(null)}
          className={cn('px-3 py-1.5 rounded-full text-xs font-bold transition-all', !selectedSubject ? 'bg-brand-terracotta text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400')}>
          {tr('All', 'Zote')}
        </button>
        {SUBJECTS.map(s => (
          <button key={s} onClick={() => setSelectedSubject(s)}
            className={cn('px-3 py-1.5 rounded-full text-xs font-bold transition-all', selectedSubject === s ? 'bg-brand-red text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400')}>
            {s}
          </button>
        ))}
      </div>

      {/* Questions List */}
      {loading ? <LoadingSpinner /> : questions.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl block mb-4">❓</span>
          <p className="text-sm text-gray-400">{tr('No questions found. Be the first to ask!', 'Hakuna maswali yaliyopatikana. Kuwa mwanzo kuuliza!')}</p>
          {user && <button onClick={() => setShowCreate(true)} className="sun-btn inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mt-4">{tr('Ask a Question', 'Uliza Swali')}</button>}
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map(q => (
            <div key={q.id} className="sun-card p-5 space-y-4 hover:shadow-md transition-shadow border border-transparent hover:border-brand-terracotta/30">
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-100 dark:bg-gray-800">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${getAvatarColor(q.author.full_name)}`}>
                    {q.author.avatar_url ? <img src={q.author.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : getInitials(q.author.full_name)}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-gray-600 dark:text-gray-300 truncate max-w-[150px]">@{q.author.username}</p>
                    <p className="text-[9px] text-gray-400">{q.author.county} • {timeAgo(q.created_at)}</p>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/students/question/${q.id}`} className="block">
                    <h3 className="font-bold text-base line-clamp-1 group-hover:text-brand-red transition-colors">{q.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{q.content}</p>
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-terracotta/10 text-brand-terracotta border border-brand-terracotta/20">{q.subject}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{q.grade_level}</span>
                    <span className="text-[10px] text-gray-400">📍 {q.county}</span>
                    {q.is_resolved && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">{tr('✓ Resolved', '✓ Yamejibiwa')}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-12 shrink-0">
                  <button onClick={() => handleVoteQuestion(q.id, 'up')} className="flex items-center gap-1 text-gray-400 hover:text-emerald-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                    <span className="font-bold text-sm">{formatNumber(q.upvotes_count)}</span>
                  </button>
                  <Link href={`/students/question/${q.id}`} className="flex items-center gap-1 text-gray-400 hover:text-brand-red text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    <span className="font-bold">{q.answer_count}</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Question Modal */}
      {showCreate && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-brand-cardDark rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scalePop">
            <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-black">{tr('Ask a Question', 'Uliza Swali')}</h3>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleCreateQuestion(); }} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{tr('Subject', 'Somuo')}</label>
                <select value={newQuestion.subject} onChange={e => setNewQuestion(d => ({ ...d, subject: e.target.value }))} required className="sun-select w-full">
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{tr('Grade/Level', 'Darasa/Kiwanda')}</label>
                <input value={newQuestion.grade_level} onChange={e => setNewQuestion(d => ({ ...d, grade_level: e.target.value }))} required placeholder={tr('e.g., Form 2, Year 3, Standard 7', 'mf. Kidato cha 2, Mwaka 3, Darasa 7')} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{tr('Question Title', 'Kichwa Cha Swali')}</label>
                <input value={newQuestion.title} onChange={e => setNewQuestion(d => ({ ...d, title: e.target.value }))} required placeholder={tr('What do you need help with?', 'Unahitaji msaada gani?')} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50" maxLength={120} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{tr('Details', 'Maelezo')}</label>
                <textarea value={newQuestion.content} onChange={e => setNewQuestion(d => ({ ...d, content: e.target.value }))} required rows={4} placeholder={tr('Explain your question clearly...', 'Eleza swali lako kwa uwazi...')} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                  {tr('Cancel', 'Ghairi')}
                </button>
                <button type="submit" disabled={creating} className="flex-1 px-5 py-2.5 rounded-xl text-xs font-bold sun-btn active:scale-95 disabled:opacity-50">
                  {creating ? tr('Posting...', 'Inapost...') : tr('Post Question', 'Weka Swali')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}