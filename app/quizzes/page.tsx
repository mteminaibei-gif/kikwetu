'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import {
  Brain, Trophy, Clock, ChevronRight, Star, Award, Target,
  Zap, CheckCircle, XCircle, ArrowRight,
} from 'lucide-react';

const categories = [
  { name: 'Agriculture', emoji: '🌾', count: 12, color: 'var(--greenSoft)', textColor: 'var(--green)' },
  { name: 'Culture', emoji: '🎭', count: 8, color: 'var(--goldSoft)', textColor: 'var(--earth)' },
  { name: 'Rights & Law', emoji: '⚖️', count: 6, color: 'var(--earthSoft)', textColor: 'var(--earth)' },
  { name: 'Health', emoji: '🏥', count: 10, color: 'var(--redSoft)', textColor: 'var(--red)' },
  { name: 'Tech', emoji: '💻', count: 9, color: 'var(--blueSoft)', textColor: 'var(--blue)' },
  { name: 'Environment', emoji: '🌿', count: 7, color: 'var(--greenSoft)', textColor: 'var(--green)' },
];

const featuredQuizzes = [
  {
    title: 'Kenyan Crops 101',
    questions: 5,
    duration: '3 min',
    category: 'Agriculture',
    difficulty: 'Easy',
    xp: 50,
    description: 'Test your knowledge of Kenya\'s major crops and farming seasons.',
  },
  {
    title: 'Swahili Proverbs',
    questions: 8,
    duration: '5 min',
    category: 'Culture',
    difficulty: 'Medium',
    xp: 80,
    description: 'How well do you know traditional Swahili sayings and their meanings?',
  },
  {
    title: 'Basic Rights',
    questions: 6,
    duration: '4 min',
    category: 'Rights',
    difficulty: 'Easy',
    xp: 60,
    description: 'Know your constitutional rights as a Kenyan citizen.',
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

export default function QuizzesPage() {
  const { showToast } = useApp();
  const [activeDifficulty, setActiveDifficulty] = useState('All');

  return (
    <AppLayout>
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
                onClick={() => showToast(`Starting "${quiz.title}" quiz`)}
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
              onClick={() => showToast('Starting daily challenge')}
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
              <button style={{ marginTop: 12 }} onClick={(e) => { e.stopPropagation(); showToast('Daily challenge started!'); }}>
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


