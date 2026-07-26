'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import {
  GraduationCap, BadgeCheck, MessagesSquare, Plus, CircleHelp,
  MessageCircleQuestion, ThumbsUp, Send, Award, BookOpen, Target,
  ChevronRight, Tag,
} from 'lucide-react';

const stats = [
  { label: 'Sessions', value: '6', icon: BookOpen, color: 'var(--greenSoft)', textColor: 'var(--green)' },
  { label: 'Questions', value: '18', icon: MessageCircleQuestion, color: 'var(--goldSoft)', textColor: 'var(--earth)' },
  { label: 'Badges', value: '4', icon: Award, color: 'var(--earthSoft)', textColor: 'var(--earth)' },
];

const MOCK_STUDENTS = [
  { name: 'Njeri Wambui', initials: 'NW', color: 'earth', topic: 'Urban farming and climate education', badge: 'Approved professional' },
  { name: 'James Otieno', initials: 'JO', color: 'blue', topic: 'Solar systems for small businesses', badge: 'Approved professional' },
  { name: 'Fatuma Ali', initials: 'FA', color: 'green', topic: 'Swahili heritage and storytelling', badge: 'Approved professional' },
  { name: 'Ruth Kilonzo', initials: 'RK', color: 'earth', topic: 'County procurement and tenders', badge: 'Approved professional' },
];

export default function StudentsPage() {
  const { showToast } = useApp();
  const [question, setQuestion] = useState('');
  const [professionals, setProfessionals] = useState(MOCK_STUDENTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfessionals() {
      try {
        const { data, error } = await supabase
          .from('professionals')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error || !data || data.length === 0) {
          setProfessionals(MOCK_STUDENTS);
        } else {
          const colors = ['earth', 'blue', 'green'];
          setProfessionals(
            data.map((pro: any, i: number) => ({
              name: pro.name || pro.full_name || 'Unknown',
              initials: (pro.name || pro.full_name || 'UN')
                .split(' ')
                .map((w: string) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase(),
              color: colors[i % colors.length],
              topic: pro.topic || pro.specialty || 'General professional',
              badge: pro.badge || 'Approved professional',
            }))
          );
        }
      } catch {
        setProfessionals(MOCK_STUDENTS);
      } finally {
        setLoading(false);
      }
    }

    fetchProfessionals();
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="page-head">
          <div>
            <div className="eyebrow">Students Area</div>
            <h1 className="serif">From stuck to I can do this.</h1>
            <p>Ask questions, learn from experts, and track your progress.</p>
          </div>
        </div>
        <div className="grid2">
          <section className="section">
            <div className="section-head">
              <div>
                <div className="eyebrow">Your learning loop</div>
                <h2 className="serif">Progress so far.</h2>
              </div>
            </div>
            <div className="stats">
              {[1, 2, 3].map((i) => (
                <div key={i} className="stat">
                  <div className="avatar skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
                  <div className="skeleton" style={{ width: 30, height: 14, borderRadius: 4 }} />
                  <div className="skeleton" style={{ width: 50, height: 10, borderRadius: 4 }} />
                </div>
              ))}
            </div>
          </section>
          <section className="section">
            <div className="section-head">
              <div>
                <div className="eyebrow">Upcoming</div>
                <h2 className="serif">Your next session.</h2>
              </div>
            </div>
            <div className="post">
              <div className="post-head">
                <div className="avatar skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: 120, height: 14, borderRadius: 4 }} />
                  <div className="skeleton" style={{ width: 80, height: 10, borderRadius: 4, marginTop: 4 }} />
                </div>
              </div>
            </div>
          </section>
        </div>
        <section className="section" style={{ marginTop: 22 }}>
          <div className="section-head">
            <div>
              <div className="eyebrow">Approved professionals</div>
              <h2 className="serif">Learn from the best.</h2>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginTop: 14 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="pro-card">
                <div className="avatar skeleton" style={{ width: 48, height: 48, borderRadius: 12 }} />
                <div className="pro-copy">
                  <div className="skeleton" style={{ width: 120, height: 14, borderRadius: 4 }} />
                  <div className="skeleton" style={{ width: 180, height: 10, borderRadius: 4, marginTop: 6 }} />
                  <div className="skeleton" style={{ width: 100, height: 10, borderRadius: 4, marginTop: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-head">
        <div>
          <div className="eyebrow">Students Area</div>
          <h1 className="serif">From stuck to I can do this.</h1>
          <p>Ask questions, learn from experts, and track your progress.</p>
        </div>
      </div>

      <section className="hero">
        <div className="hero-content">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="primary" onClick={() => showToast('Ask a question')}>
              <Plus className="icon-sm" /> Ask a question
            </button>
            <button className="secondary" onClick={() => showToast('Browse experts')}>
              <BadgeCheck className="icon-sm" /> Browse experts
            </button>
            <button className="secondary" onClick={() => showToast('Messages opened')}>
              <MessagesSquare className="icon-sm" /> Messages
            </button>
          </div>
        </div>
      </section>

      <div className="grid2">
        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Your learning loop</div>
              <h2 className="serif">Progress so far.</h2>
            </div>
          </div>

          <div className="stats">
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

          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '.72rem', fontWeight: 600, color: 'var(--text2)' }}>Overall progress</span>
              <span style={{ fontSize: '.68rem', color: 'var(--green)', fontWeight: 700 }}>68%</span>
            </div>
            <div style={{ height: 8, borderRadius: 99, background: 'var(--line)', overflow: 'hidden' }}>
              <div style={{ width: '68%', height: '100%', background: 'var(--green)', borderRadius: 99 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <div className="tag"><Target className="icon-sm" /> 4 goals completed</div>
              <div className="tag gold"><Award className="icon-sm" /> 2 badges earned</div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Upcoming</div>
              <h2 className="serif">Your next session.</h2>
            </div>
          </div>

          <div className="post" style={{ cursor: 'pointer' }} onClick={() => showToast('Session details opened')}>
            <div className="post-head">
              <div className="avatar blue">JO</div>
              <div className="author">
                <strong>James Otieno <span className="verified">✓</span></strong>
                <div className="meta">
                  <span>Solar basics</span>
                  <span>·</span>
                  <span>Tomorrow 10:00 AM</span>
                </div>
              </div>
              <ChevronRight className="icon" style={{ color: 'var(--text3)' }} />
            </div>
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: '.78rem', color: 'var(--text2)' }}>
                Private session on sizing a solar system for a small shop in Nakuru.
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <div className="tag"><MessagesSquare className="icon-sm" /> Private session</div>
                <div className="tag"><BadgeCheck className="icon-sm" /> Verified</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="primary" onClick={(e) => { e.stopPropagation(); showToast('Joining session'); }}>
                Join session
              </button>
              <button className="secondary" onClick={(e) => { e.stopPropagation(); showToast('Message sent to James'); }}>
                Message
              </button>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div className="section-head">
              <div>
                <div className="eyebrow">Quick help</div>
                <h2 className="serif">Common questions.</h2>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { icon: CircleHelp, text: 'How do I ask a good question?', tag: 'Guide' },
                { icon: GraduationCap, text: 'What badges can I earn?', tag: 'Rewards' },
                { icon: Target, text: 'How do I track my learning goals?', tag: 'Progress' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={i}
                    className="quick"
                    onClick={() => showToast(item.text)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--line)', cursor: 'pointer' }}
                  >
                    <div className="quick-icon">
                      <Icon className="icon" style={{ color: 'var(--green)' }} />
                    </div>
                    <div className="quick-copy" style={{ flex: 1 }}>
                      <strong style={{ fontSize: '.78rem' }}>{item.text}</strong>
                      <span style={{ fontSize: '.62rem', color: 'var(--text3)' }}>{item.tag}</span>
                    </div>
                    <ChevronRight className="icon-sm" style={{ color: 'var(--text3)' }} />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <section className="section" style={{ marginTop: 22 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow">Approved professionals</div>
            <h2 className="serif">Learn from the best.</h2>
          </div>
          <button className="secondary" onClick={() => showToast('View all professionals')}>
            View all <ChevronRight className="icon-sm" />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginTop: 14 }}>
          {professionals.map((pro) => (
            <div key={pro.initials} className="pro-card" onClick={() => showToast(`Viewing ${pro.name}`)}>
              <div className="avatar" style={{ background: `var(--${pro.color === 'earth' ? 'earthSoft' : pro.color === 'blue' ? 'blueSoft' : 'greenSoft'})`, color: `var(--${pro.color})` }}>
                {pro.initials}
              </div>
              <div className="pro-copy">
                <strong>{pro.name} <span className="verified">✓</span></strong>
                <p>{pro.topic}</p>
                <span>{pro.badge} · private sessions · 4.9 rating</span>
              </div>
              <div className="pro-actions">
                <button className="follow" onClick={(e) => { e.stopPropagation(); showToast(`Following ${pro.name}`); }}>Follow</button>
                <button className="primary" onClick={(e) => { e.stopPropagation(); showToast(`Request sent to ${pro.name}`); }}>Request consult</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ marginTop: 22 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow">Ask the community</div>
            <h2 className="serif">Need an answer?</h2>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What are you stuck on? Be specific and someone from the community or an expert will help."
            style={{
              width: '100%',
              minHeight: 100,
              padding: 12,
              borderRadius: 10,
              border: '1px solid var(--line)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: '.82rem',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="secondary" onClick={() => showToast('Add a photo')}>
                <Plus className="icon-sm" /> Add photo
              </button>
              <button className="secondary" onClick={() => showToast('Add topic tags')}>
                <Tag className="icon-sm" /> Add tags
              </button>
            </div>
            <button
              className="primary"
              onClick={() => {
                if (question.trim()) {
                  showToast('Question published!');
                  setQuestion('');
                } else {
                  showToast('Please write your question first');
                }
              }}
            >
              <Send className="icon-sm" /> Publish
            </button>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
