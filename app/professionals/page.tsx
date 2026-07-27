'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import {
  BadgeCheck, CalendarDays, FileCheck2, Users,
  SlidersHorizontal, Plus, ChevronRight, X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, requestSession, toggleFollow, checkFollowing } from '@/lib/supabase-helpers';

const MOCK_PROFESSIONALS = [
  {
    initials: 'NW',
    name: 'Njeri Wambui',
    color: 'earth',
    expertise: 'Urban farming and climate education',
    rating: 4.9,
    consultations: 127,
    location: 'Nairobi',
    user_id: 'mock-nw',
  },
  {
    initials: 'JO',
    name: 'James Otieno',
    color: 'blue',
    expertise: 'Solar systems for small businesses',
    rating: 4.8,
    consultations: 89,
    location: 'Kisumu',
    user_id: 'mock-jo',
  },
  {
    initials: 'FA',
    name: 'Fatuma Ali',
    color: 'green',
    expertise: 'Swahili heritage and storytelling',
    rating: 5.0,
    consultations: 64,
    location: 'Mombasa',
    user_id: 'mock-fa',
  },
  {
    initials: 'RK',
    name: 'Ruth Kilonzo',
    color: 'earth',
    expertise: 'County procurement and tenders',
    rating: 4.7,
    consultations: 156,
    location: 'Machakos',
    user_id: 'mock-rk',
  },
];

type Professional = typeof MOCK_PROFESSIONALS[number];

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>(MOCK_PROFESSIONALS);
  const [loading, setLoading] = useState(true);
  const { showToast } = useApp();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  const [sessionModalPro, setSessionModalPro] = useState<Professional | null>(null);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDesc, setSessionDesc] = useState('');
  const [sessionSubmitting, setSessionSubmitting] = useState(false);

  useEffect(() => {
    async function init() {
      const user = await getCurrentUser();
      setCurrentUser(user);

      try {
        const { data, error } = await supabase
          .from('professionals')
          .select('*')
          .order('created_at', { ascending: false });

        if (error || !data || data.length === 0) {
          setProfessionals(MOCK_PROFESSIONALS);
        } else {
          const mappedData = data.map((item: any) => ({
            initials: item.initials,
            name: item.name,
            color: item.color,
            expertise: item.expertise,
            rating: item.rating,
            consultations: item.consultations,
            location: item.location,
            user_id: item.user_id || item.id,
          }));
          setProfessionals(mappedData);
        }
      } catch (err) {
        setProfessionals(MOCK_PROFESSIONALS);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    async function checkAllFollowing() {
      const map: Record<string, boolean> = {};
      for (const pro of professionals) {
        if (pro.user_id) {
          try {
            const result = await checkFollowing(currentUser.id, pro.user_id);
            map[pro.user_id] = result;
          } catch {
            map[pro.user_id] = false;
          }
        }
      }
      setFollowingMap(map);
    }
    checkAllFollowing();
  }, [currentUser, professionals]);

  useEffect(() => {
    const channel = supabase
      .channel('professionals-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'professionals' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const item = payload.new as any;
            setProfessionals((prev) => [
              {
                initials: item.initials,
                name: item.name,
                color: item.color,
                expertise: item.expertise,
                rating: item.rating,
                consultations: item.consultations,
                location: item.location,
                user_id: item.user_id || item.id,
              },
              ...prev,
            ]);
          } else if (payload.eventType === 'UPDATE') {
            const item = payload.new as any;
            setProfessionals((prev) =>
              prev.map((p) =>
                p.user_id === (item.user_id || item.id)
                  ? { ...p, ...item }
                  : p
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as any;
            setProfessionals((prev) =>
              prev.filter((p) => p.user_id !== (old.user_id || old.id))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleToggleFollow(pro: Professional) {
    if (!currentUser) {
      showToast('Please log in to follow professionals');
      return;
    }
    // Skip follow for mock professionals (non-UUID user_id)
    if (!pro.user_id || !pro.user_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      showToast('Follow not available for this professional');
      return;
    }
    try {
      const isNowFollowing = await toggleFollow(currentUser.id, pro.user_id);
      setFollowingMap((prev) => ({ ...prev, [pro.user_id]: isNowFollowing }));
      showToast(isNowFollowing ? `Following ${pro.name}` : `Unfollowed ${pro.name}`);
    } catch {
      showToast('Failed to update follow status');
    }
  }

  async function handleRequestSession() {
    if (!sessionModalPro || !sessionTitle.trim()) {
      showToast('Please enter a session title');
      return;
    }
    if (!currentUser) {
      showToast('Please log in to request a session');
      return;
    }
    setSessionSubmitting(true);
    try {
      const { error } = await requestSession(currentUser.id, sessionModalPro.user_id, sessionTitle, sessionDesc);
      if (error) throw error;
      showToast(`Session request sent to ${sessionModalPro.name}`);
      setSessionTitle('');
      setSessionDesc('');
      setSessionModalPro(null);
    } catch {
      showToast('Failed to send request. Try again.');
    } finally {
      setSessionSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="page-head">
          <div>
            <div className="eyebrow">KikwetuConnect</div>
            <h1 className="serif">Find someone who has done the work.</h1>
            <p>Approved professionals verified by credentials and community trust.</p>
          </div>
        </div>

        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Recommended</div>
              <h2 className="serif">Verified professionals.</h2>
            </div>
          </div>

          <div className="pro-list">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="pro-card">
                <div className="avatar skeleton" style={{ width: 48, height: 48, borderRadius: '50%' }} />
                <div className="pro-copy" style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 14, width: '80%', marginBottom: 4 }} />
                  <div className="skeleton" style={{ height: 14, width: '50%' }} />
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
      {sessionModalPro && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: 'var(--bg)', borderRadius: 16, border: '1px solid var(--line)',
            width: '100%', maxWidth: 420, padding: 24, position: 'relative',
          }}>
            <button onClick={() => setSessionModalPro(null)} style={{
              position: 'absolute', top: 16, right: 16, background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--text3)',
            }}>
              <X size={20} />
            </button>
            <h2 className="serif" style={{ marginBottom: 16 }}>Request Consultation</h2>
            <p style={{ fontSize: '.82rem', color: 'var(--text2)', marginBottom: 16 }}>
              Send a consultation request to <strong>{sessionModalPro.name}</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                placeholder="Consultation title (e.g. Solar system sizing)"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                style={{
                  padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)',
                  background: 'var(--surface)', color: 'var(--text)', fontSize: '.88rem',
                }}
              />
              <textarea
                placeholder="Brief description of what you need help with..."
                value={sessionDesc}
                onChange={(e) => setSessionDesc(e.target.value)}
                rows={3}
                style={{
                  padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)',
                  background: 'var(--surface)', color: 'var(--text)', fontSize: '.88rem',
                  fontFamily: 'inherit', resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="secondary" onClick={() => setSessionModalPro(null)}>Cancel</button>
                <button className="primary" onClick={handleRequestSession} disabled={sessionSubmitting}>
                  {sessionSubmitting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="page-head">
        <div>
          <div className="eyebrow">KikwetuConnect</div>
          <h1 className="serif">Find someone who has done the work.</h1>
          <p>Approved professionals verified by credentials and community trust.</p>
        </div>
        <button className="select-pill" onClick={() => showToast('Filter options')}>
          <SlidersHorizontal className="icon-sm" /> All expertise
        </button>
      </div>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">Recommended</div>
            <h2 className="serif">Verified professionals.</h2>
          </div>
        </div>

        <div className="pro-list">
          {professionals.map((pro, i) => (
            <div key={i} className="pro-card">
              <div className={`avatar ${pro.color}`}>{pro.initials}</div>
              <div className="pro-copy">
                <strong>{pro.name} <BadgeCheck className="icon-sm" style={{ color: 'var(--green)', verticalAlign: 'middle' }} /></strong>
                <p>{pro.expertise}</p>
                <span>{pro.location} · {pro.consultations} consultations · {pro.rating} rating</span>
              </div>
              <div className="pro-actions">
                <button
                  className="follow"
                  onClick={() => handleToggleFollow(pro)}
                  style={{
                    background: followingMap[pro.user_id] ? 'var(--greenSoft)' : undefined,
                    color: followingMap[pro.user_id] ? 'var(--green)' : undefined,
                    borderColor: followingMap[pro.user_id] ? 'var(--green)' : undefined,
                  }}
                >
                  {followingMap[pro.user_id] ? 'Following' : 'Follow'}
                </button>
                <button className="primary" onClick={() => setSessionModalPro(pro)}>Request consult</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid2" style={{ marginTop: 14 }}>
        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">How it works</div>
              <h2 className="serif">How approval works.</h2>
            </div>
          </div>
          <div className="quick">
            <div className="quick-icon" style={{ background: 'var(--greenSoft)', color: 'var(--green)' }}>
              <FileCheck2 className="icon-sm" />
            </div>
            <div className="quick-copy">
              <strong>Credentials reviewed</strong>
              <p>Each professional submits credentials for manual verification by the KikwetuConnect team.</p>
            </div>
          </div>
          <div className="quick">
            <div className="quick-icon" style={{ background: 'var(--goldSoft)', color: 'var(--earth)' }}>
              <Users className="icon-sm" />
            </div>
            <div className="quick-copy">
              <strong>Community trust counted</strong>
              <p>Ratings, consultations, and peer endorsements contribute to a professional&apos;s trust score.</p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">For professionals</div>
              <h2 className="serif">Become an approved professional.</h2>
            </div>
          </div>
          <div className="quick">
            <div className="quick-icon" style={{ background: 'var(--earthSoft)', color: 'var(--earth)' }}>
              <BadgeCheck className="icon-sm" />
            </div>
            <div className="quick-copy">
              <strong>Apply to become approved</strong>
              <p>Submit your expertise, credentials, and references for review.</p>
            </div>
          </div>
          <div className="quick">
            <div className="quick-icon" style={{ background: 'var(--greenSoft)', color: 'var(--green)' }}>
              <CalendarDays className="icon-sm" />
            </div>
            <div className="quick-copy">
              <strong>Set your availability</strong>
              <p>Control when users can book private consultations with you.</p>
            </div>
          </div>
          <div className="quick">
            <div className="quick-icon" style={{ background: 'var(--goldSoft)', color: 'var(--gold)' }}>
              <Plus className="icon-sm" />
            </div>
            <div className="quick-copy">
              <strong>Receive tips</strong>
              <p>Earn tokens when users appreciate your guidance and insights.</p>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
