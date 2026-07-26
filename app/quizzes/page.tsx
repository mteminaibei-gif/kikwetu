'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, submitQuizResult } from '@/lib/supabase-helpers';
import {
  Brain, Trophy, Clock, ChevronRight, Star, Award, Target,
  Zap, CheckCircle, XCircle, ArrowRight, X,
} from 'lucide-react';

const categories = [
  { name: 'Agriculture', emoji: '🌾', count: 12, color: 'var(--greenSoft)', textColor: 'var(--green)' },
  { name: 'Culture', emoji: '🎭', count: 8, color: 'var(--goldSoft)', textColor: 'var(--earth)' },
  { name: 'Rights & Law', emoji: '⚖️', count: 6, color: 'var(--earthSoft)', textColor: 'var(--earth)' },
  { name: 'Health', emoji: '🏥', count: 10, color: 'var(--redSoft)', textColor: 'var(--red)' },
  { name: 'Tech', emoji: '💻', count: 9, color: 'var(--blueSoft)', textColor: 'var(--blue)' },
  { name: 'Environment', emoji: '🌿', count: 7, color: 'var(--greenSoft)', textColor: 'var(--green)' },
];

const MOCK_QUIZZES = [
  {
    id: 'mock-1',
    title: 'Kenyan Crops 101',
    questions: 5,
    duration: '3 min',
    category: 'Agriculture',
    difficulty: 'Easy',
    xp: 50,
    description: 'Test your knowledge of Kenya\'s major crops and farming seasons.',
    quiz_data: [
      { question: 'Which is Kenya\'s most exported crop?', options: ['Maize', 'Tea', 'Sorghum', 'Cassava'], answer: 1 },
      { question: 'When is the long rains season in Kenya?', options: ['Oct-Dec', 'Mar-May', 'Jun-Aug', 'Jan-Feb'], answer: 1 },
      { question: 'Which county is known as Kenya\'s breadbasket?', options: ['Nakuru', 'Uasin Gishu', 'Narok', 'Laikipia'], answer: 1 },
      { question: 'What is the main cash crop in Western Kenya?', options: ['Coffee', 'Sugarcane', 'Cotton', 'Tobacco'], answer: 1 },
      { question: 'Which crop is best for semi-arid areas?', options: ['Wheat', 'Cotton', 'Sorghum', 'Rice'], answer: 2 },
    ],
  },
  {
    id: 'mock-2',
    title: 'Swahili Proverbs',
    questions: 8,
    duration: '5 min',
    category: 'Culture',
    difficulty: 'Medium',
    xp: 80,
    description: 'How well do you know traditional Swahili sayings and their meanings?',
    quiz_data: [
      { question: '"Haraka haraka haina baraka" means?', options: ['Haste makes waste', 'Knowledge is power', 'Unity is strength', 'Patience pays'], answer: 0 },
      { question: '"Mti haukui kivuli chake" means?', options: ['Trees provide shade', 'A person cannot outgrow their origin', 'Nature is beautiful', 'Roots are important'], answer: 1 },
      { question: '"Asiyesikia la mkuu huvunjika guu" means?', options: ['Respect authority', 'Bones are fragile', 'Leaders are wise', 'Listen carefully'], answer: 0 },
      { question: '"Penye nia pana njia" means?', options: ['Where there is wealth, there is a way', 'Where there is will, there is a way', 'Where there is a path, there is a goal', 'Where there is courage, there is victory'], answer: 1 },
      { question: '"Dawa ya moto ni moto" means?', options: ['Fire is dangerous', 'Fight fire with fire', 'Heat cures heat', 'Medicine is hot'], answer: 1 },
      { question: '"Maji yakimwagika hayazoleki" means?', options: ['Water is precious', 'Spilt water cannot be gathered', 'Rivers are important', 'Water flows downhill'], answer: 1 },
      { question: '"Kidole kimoja hakivunji chawa" means?', options: ['Fingers are weak', 'One finger cannot crush a louse', 'Insects are tough', 'Teamwork is necessary'], answer: 1 },
      { question: '"Haba na haba hujaza kibaba" means?', options: ['Small things are useless', 'Little by little fills the measure', 'Measuring is important', 'Patience is key'], answer: 1 },
    ],
  },
  {
    id: 'mock-3',
    title: 'Basic Rights',
    questions: 6,
    duration: '4 min',
    category: 'Rights',
    difficulty: 'Easy',
    xp: 60,
    description: 'Know your constitutional rights as a Kenyan citizen.',
    quiz_data: [
      { question: 'How many chapters does the Constitution of Kenya have?', options: ['10', '12', '18', '20'], answer: 2 },
      { question: 'Which article guarantees the right to life?', options: ['Article 24', 'Article 26', 'Article 28', 'Article 30'], answer: 1 },
      { question: 'Which chapter contains the Bill of Rights?', options: ['Chapter 3', 'Chapter 4', 'Chapter 5', 'Chapter 6'], answer: 1 },
      { question: 'What is the right to equality called?', options: ['Article 27', 'Article 28', 'Article 29', 'Article 30'], answer: 0 },
      { question: 'Who protects the Constitution?', options: ['Parliament', 'The President', 'The Judiciary', 'The Judiciary and Parliament'], answer: 2 },
      { question: 'Which right allows freedom of expression?', options: ['Article 31', 'Article 32', 'Article 33', 'Article 34'], answer: 2 },
    ],
  },
];

const leaderboard = [
  { name: 'Amina Hassan', score: 2840, avatar: 'AH', badge: '🥇' },
  { name: 'Brian Kiprop', score: 2650, avatar: 'BK', badge: '🥈' },
  { name: 'Wanjiku Mwangi', score: 2510, avatar: 'WM', badge: '🥉' },
  { name: 'Otieno Ouma', score: 2380, avatar: 'OO', badge: '' },
  { name: 'Fatuma Osman', score: 2210, avatar: 'FO', badge: '' },
];

const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

const stats = [
  { label: 'Quizzes taken', value: '12', icon: Brain, color: 'var(--greenSoft)', textColor: 'var(--green)' },
  { label: 'Average score', value: '78%', icon: Target, color: 'var(--goldSoft)', textColor: 'var(--earth)' },
  { label: 'Day streak', value: '3 days', icon: Zap, color: 'var(--earthSoft)', textColor: 'var(--earth)' },
];

type Quiz = typeof MOCK_QUIZZES[number];

export default function QuizzesPage() {
  const { showToast } = useApp();
  const [activeDifficulty, setActiveDifficulty] = useState('All');
  const [loading, setLoading] = useState(true);
  const [featuredQuizzes, setFeaturedQuizzes] = useState<Quiz[]>(MOCK_QUIZZES);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizResult, setQuizResult] = useState<{ score: number; total: number; timeTaken: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch {}
      try {
        const { data, error } = await supabase
          .from('quizzes')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        if (data && data.length > 0) {
          setFeaturedQuizzes(data.map((item: any) => ({
            id: item.id ?? String(Math.random()),
            title: item.title ?? 'Untitled Quiz',
            questions: item.question_count ?? item.questions ?? 5,
            duration: item.duration ?? '3 min',
            category: item.category ?? 'General',
            difficulty: item.difficulty ?? 'Easy',
            xp: item.xp ?? 50,
            description: item.description ?? '',
            quiz_data: item.quiz_data ?? null,
          })));
        }
      } catch {
        // fallback to mock
      }
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (!activeQuiz || quizFinished) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeQuiz, quizFinished]);

  function startQuiz(quiz: Quiz) {
    if (!currentUser) {
      showToast('Please log in to take a quiz');
      return;
    }
    const questions = quiz.quiz_data ?? [];
    if (questions.length === 0) {
      showToast('This quiz has no questions yet');
      return;
    }
    setActiveQuiz(quiz);
    setCurrentQuestion(0);
    setAnswers([]);
    setTimeLeft(questions.length * 60);
    setQuizFinished(false);
    setQuizResult(null);
  }

  function selectAnswer(idx: number) {
    if (quizFinished) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[currentQuestion] = idx;
      return next;
    });
    const questions = activeQuiz?.quiz_data ?? [];
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion((p) => p + 1), 300);
    }
  }

  function handleFinishQuiz() {
    if (!activeQuiz || quizFinished) return;
    const questions = activeQuiz.quiz_data ?? [];
    let score = 0;
    answers.forEach((a, i) => {
      if (a === questions[i]?.answer) score++;
    });
    const timeTaken = (questions.length * 60) - timeLeft;
    setQuizFinished(true);
    setQuizResult({ score, total: questions.length, timeTaken });
    if (currentUser) {
      submitQuizResult(activeQuiz.id, currentUser.id, score, questions.length, timeTaken).then(() => {
        showToast('Quiz result saved!');
      }).catch(() => {
        showToast('Could not save result');
      });
    }
  }

  function closeQuiz() {
    setActiveQuiz(null);
    setQuizFinished(false);
    setQuizResult(null);
    setCurrentQuestion(0);
    setAnswers([]);
    setTimeLeft(0);
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="page-head">
          <div>
            <div className="eyebrow">Quizzes</div>
            <h1 className="serif">Learn something local in five minutes.</h1>
            <p>Quick quizzes on Kenyan agriculture, culture, rights, health, tech, and environment.</p>
          </div>
        </div>
        <section className="section">
          <div style={{ opacity: 0.5, padding: 20, textAlign: 'center' }}>Loading quizzes...</div>
        </section>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {activeQuiz && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: 'var(--bg)', borderRadius: 16, border: '1px solid var(--line)',
            width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', padding: 24, position: 'relative',
          }}>
            <button onClick={closeQuiz} style={{
              position: 'absolute', top: 16, right: 16, background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--text3)',
            }}>
              <X size={20} />
            </button>

            {!quizFinished ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <strong style={{ fontSize: '.92rem' }}>{activeQuiz.title}</strong>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    color: timeLeft < 60 ? 'var(--red)' : 'var(--green)',
                    fontWeight: 700, fontSize: '.84rem',
                  }}>
                    <Clock className="icon-sm" /> {formatTime(timeLeft)}
                  </span>
                </div>
                <div style={{ height: 4, borderRadius: 99, background: 'var(--line)', marginBottom: 20 }}>
                  <div style={{
                    height: '100%', borderRadius: 99, background: 'var(--green)',
                    width: `${((currentQuestion + 1) / (activeQuiz.quiz_data?.length ?? 1)) * 100}%`,
                    transition: 'width .3s',
                  }} />
                </div>
                <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginBottom: 8 }}>
                  Question {currentQuestion + 1} of {activeQuiz.quiz_data?.length ?? 0}
                </div>
                <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 20 }}>
                  {activeQuiz.quiz_data?.[currentQuestion]?.question}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {activeQuiz.quiz_data?.[currentQuestion]?.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectAnswer(idx)}
                      style={{
                        padding: '12px 16px', borderRadius: 10, border: '1px solid var(--line)',
                        background: answers[currentQuestion] === idx ? 'var(--greenSoft)' : 'var(--surface)',
                        color: 'var(--text)', textAlign: 'left', cursor: 'pointer', fontSize: '.88rem',
                        borderColor: answers[currentQuestion] === idx ? 'var(--green)' : undefined,
                        transition: 'all .15s',
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                  <button className="secondary" onClick={() => setCurrentQuestion((p) => Math.max(0, p - 1))} disabled={currentQuestion === 0}>
                    Previous
                  </button>
                  {currentQuestion === (activeQuiz.quiz_data?.length ?? 1) - 1 ? (
                    <button className="primary" onClick={handleFinishQuiz} disabled={submitting}>
                      Finish Quiz
                    </button>
                  ) : (
                    <button className="primary" onClick={() => setCurrentQuestion((p) => p + 1)}>
                      Next
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                {quizResult && (
                  <>
                    <div style={{
                      width: 80, height: 80, borderRadius: '50%', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                      background: quizResult.score / quizResult.total >= 0.6 ? 'var(--greenSoft)' : 'var(--redSoft)',
                      color: quizResult.score / quizResult.total >= 0.6 ? 'var(--green)' : 'var(--red)',
                    }}>
                      <Trophy size={36} />
                    </div>
                    <h2 className="serif" style={{ marginBottom: 8 }}>Quiz Complete!</h2>
                    <p style={{ fontSize: '.88rem', color: 'var(--text2)', marginBottom: 4 }}>
                      You scored <strong style={{ color: 'var(--green)' }}>{quizResult.score}</strong> out of{' '}
                      <strong>{quizResult.total}</strong>
                    </p>
                    <p style={{ fontSize: '.78rem', color: 'var(--text3)', marginBottom: 4 }}>
                      Time: {formatTime(quizResult.timeTaken)} · +{activeQuiz.xp} XP earned
                    </p>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '6px 14px', borderRadius: 99, fontWeight: 700, fontSize: '.82rem',
                      background: quizResult.score / quizResult.total >= 0.6 ? 'var(--greenSoft)' : 'var(--redSoft)',
                      color: quizResult.score / quizResult.total >= 0.6 ? 'var(--green)' : 'var(--red)',
                    }}>
                      {quizResult.score / quizResult.total >= 0.6 ? (
                        <><CheckCircle className="icon-sm" /> Passed</>
                      ) : (
                        <><XCircle className="icon-sm" /> Keep practicing</>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
                      <button className="secondary" onClick={closeQuiz}>Close</button>
                      <button className="primary" onClick={() => { closeQuiz(); startQuiz(activeQuiz); }}>
                        Retry Quiz
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="page-head">
        <div>
          <div className="eyebrow">Quizzes</div>
          <h1 className="serif">Learn something local in five minutes.</h1>
          <p>Quick quizzes on Kenyan agriculture, culture, rights, health, tech, and environment.</p>
        </div>
        <div className="tags">
          {difficulties.map((d) => (
            <button
              key={d}
              className="tag"
              onClick={() => { setActiveDifficulty(d); showToast(`Filtering by ${d}`); }}
              style={{
                background: activeDifficulty === d ? 'var(--greenSoft)' : undefined,
                color: activeDifficulty === d ? 'var(--green)' : undefined,
                cursor: 'pointer',
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">Categories</div>
            <h2 className="serif">Pick a topic.</h2>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 14 }}>
          {categories.map((cat) => (
            <div
              key={cat.name}
              onClick={() => showToast(`Browsing ${cat.name} quizzes`)}
              style={{
                padding: 16,
                borderRadius: 14,
                background: 'var(--bg)',
                cursor: 'pointer',
                transition: 'transform .18s var(--ease), border-color .18s var(--ease)',
                border: '1px solid var(--line)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--green)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{cat.emoji}</div>
              <strong style={{ display: 'block', fontSize: '.84rem' }}>{cat.name}</strong>
              <span style={{ display: 'block', color: 'var(--text3)', fontSize: '.67rem', marginTop: 2 }}>{cat.count} quizzes</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid2">
        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Featured</div>
              <h2 className="serif">Start with these.</h2>
            </div>
            <button className="secondary" onClick={() => showToast('View all quizzes')}>
              View all <ChevronRight className="icon-sm" />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
            {featuredQuizzes.map((quiz, i) => (
              <div
                key={i}
                onClick={() => startQuiz(quiz)}
                style={{
                  padding: 16,
                  borderRadius: 14,
                  border: '1px solid var(--line)',
                  background: 'var(--surface)',
                  cursor: 'pointer',
                  transition: 'transform .18s var(--ease), border-color .18s var(--ease)',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--green)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <strong style={{ fontSize: '.92rem' }}>{quiz.title}</strong>
                      <span style={{
                        padding: '2px 7px',
                        borderRadius: 99,
                        fontSize: '.6rem',
                        fontWeight: 800,
                        color: quiz.difficulty === 'Easy' ? 'var(--green)' : quiz.difficulty === 'Medium' ? 'var(--earth)' : 'var(--red)',
                        background: quiz.difficulty === 'Easy' ? 'var(--greenSoft)' : quiz.difficulty === 'Medium' ? 'var(--goldSoft)' : 'var(--redSoft)',
                      }}>
                        {quiz.difficulty}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text2)', fontSize: '.78rem', marginTop: 4 }}>{quiz.description}</p>
                  </div>
                  <ChevronRight className="icon" style={{ color: 'var(--text3)', flexShrink: 0 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text3)', fontSize: '.67rem' }}>
                    <CheckCircle className="icon-sm" /> {quiz.questions} questions
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text3)', fontSize: '.67rem' }}>
                    <Clock className="icon-sm" /> {quiz.duration}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text3)', fontSize: '.67rem' }}>
                    <Award className="icon-sm" /> {quiz.category}
                  </span>
                  <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--gold)', fontSize: '.67rem', fontWeight: 800 }}>
                    <Star className="icon-sm" /> {quiz.xp} XP
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 18 }}>
            <div className="section-head">
              <div>
                <div className="eyebrow">Your stats</div>
                <h2 className="serif">How you are doing.</h2>
              </div>
            </div>
            <div className="stats" style={{ marginTop: 14 }}>
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="stat" onClick={() => showToast(`${s.value} ${s.label}`)}>
                    <div className="avatar" style={{ background: s.color, color: s.textColor }}>
                      <Icon className="icon-sm" />
                    </div>
                    <strong>{s.value}</strong>
                    <span>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div>
          <section className="section">
            <div className="section-head">
              <div>
                <div className="eyebrow">Leaderboard</div>
                <h2 className="serif">Top scorers.</h2>
              </div>
            </div>
            <div className="right-list" style={{ marginTop: 14 }}>
              {leaderboard.map((user, i) => (
                <div key={i} className="right-item" style={{ cursor: 'pointer' }} onClick={() => showToast(`Viewing ${user.name}'s profile`)}>
                  <span style={{ fontSize: '.82rem', fontWeight: 800, color: 'var(--text3)', width: 20, textAlign: 'center' }}>
                    {user.badge || `#${i + 1}`}
                  </span>
                  <div className="avatar" style={{ background: i === 0 ? 'var(--goldSoft)' : i === 1 ? 'var(--earthSoft)' : i === 2 ? 'var(--goldSoft)' : 'var(--greenSoft)', color: i === 0 ? 'var(--earth)' : i === 1 ? 'var(--earth)' : i === 2 ? 'var(--earth)' : 'var(--green)' }}>
                    {user.avatar}
                  </div>
                  <div className="right-copy">
                    <strong>{user.name}</strong>
                    <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{user.score.toLocaleString()} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="section" style={{ marginTop: 14 }}>
            <div className="section-head">
              <div>
                <div className="eyebrow">Daily challenge</div>
                <h2 className="serif">Today's quiz.</h2>
              </div>
            </div>
            <div
              className="tip"
              onClick={() => startQuiz(featuredQuizzes[0])}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Trophy className="icon-sm" style={{ color: 'var(--earth)' }} />
                <strong style={{ fontSize: '.84rem', color: 'var(--earth)' }}>Kenyan Wildlife Quiz</strong>
              </div>
              <p>Test your knowledge of Kenya's national parks and wildlife reserves.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text3)', fontSize: '.66rem' }}>
                  <CheckCircle className="icon-sm" /> 10 questions
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text3)', fontSize: '.66rem' }}>
                  <Clock className="icon-sm" /> 5 min
                </span>
              </div>
              <button style={{ marginTop: 12 }} onClick={(e) => { e.stopPropagation(); startQuiz(featuredQuizzes[0]); }}>
                <Zap className="icon-sm" /> Start challenge <ArrowRight className="icon-sm" />
              </button>
            </div>
          </section>

          <section className="section" style={{ marginTop: 14 }}>
            <div className="section-head">
              <div>
                <div className="eyebrow">Recent results</div>
                <h2 className="serif">Your last quizzes.</h2>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
              {[
                { title: 'Kenyan Crops 101', score: 5, total: 5, correct: true },
                { title: 'Swahili Proverbs', score: 6, total: 8, correct: true },
                { title: 'Basic Rights', score: 4, total: 6, correct: false },
              ].map((result, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: 11,
                    borderRadius: 11,
                    border: '1px solid var(--line)',
                    background: 'var(--surface)',
                    cursor: 'pointer',
                  }}
                  onClick={() => showToast(`Reviewing ${result.title}`)}
                >
                  {result.correct
                    ? <CheckCircle className="icon-sm" style={{ color: 'var(--green)', flexShrink: 0 }} />
                    : <XCircle className="icon-sm" style={{ color: 'var(--red)', flexShrink: 0 }} />
                  }
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <strong style={{ fontSize: '.78rem', display: 'block' }}>{result.title}</strong>
                    <span style={{ color: 'var(--text3)', fontSize: '.66rem' }}>{result.score}/{result.total} correct</span>
                  </div>
                  <span style={{
                    padding: '2px 7px',
                    borderRadius: 99,
                    fontSize: '.6rem',
                    fontWeight: 800,
                    color: result.correct ? 'var(--green)' : 'var(--red)',
                    background: result.correct ? 'var(--greenSoft)' : 'var(--redSoft)',
                  }}>
                    {result.correct ? 'Passed' : 'Try again'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
