'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import {
  BadgeCheck, CalendarDays, FileCheck2, Users,
  SlidersHorizontal, Plus, ChevronRight, X,
  LayoutDashboard, Inbox, CalendarCheck, MessagesSquare,
  UserRound, Clock3, WalletCards, ChartNoAxesCombined,
  RefreshCcw, ExternalLink, MessageSquare, Star, AlertTriangle,
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

const MOCK_REQUESTS = [
  {
    id: '1',
    title: 'Solar system sizing for small shop',
    student: 'Wanjiku M.',
    studentInitials: 'WM',
    time: '2h ago',
    topic: 'Solar energy',
    urgent: false,
  },
  {
    id: '2',
    title: 'Organic pest control for tomatoes',
    student: 'Kipchoge A.',
    studentInitials: 'KA',
    time: '5h ago',
    topic: 'Urban farming',
    urgent: false,
  },
  {
    id: '3',
    title: 'County tender process guidance',
    student: 'Amina H.',
    studentInitials: 'AH',
    time: '1d ago',
    topic: 'Procurement',
    urgent: true,
  },
];

const MOCK_SESSIONS = [
  {
    id: '1',
    title: 'Solar panel installation walkthrough',
    student: 'Otieno K.',
    studentInitials: 'OK',
    date: 'Today, 3:00 PM',
    status: 'live',
    duration: '45 min',
  },
  {
    id: '2',
    title: 'Organic farming basics',
    student: 'Wanjiku M.',
    studentInitials: 'WM',
    date: 'Tomorrow, 10:00 AM',
    status: 'upcoming',
    duration: '30 min',
  },
  {
    id: '3',
    title: 'Tender documentation review',
    student: 'Amina H.',
    studentInitials: 'AH',
    date: 'Jul 28, 2:00 PM',
    status: 'upcoming',
    duration: '60 min',
  },
];

const MOCK_AVAILABILITY = [
  { day: 'Monday', slots: '9:00 AM - 12:00 PM, 2:00 PM - 5:00 PM' },
  { day: 'Tuesday', slots: '10:00 AM - 1:00 PM' },
  { day: 'Wednesday', slots: '9:00 AM - 12:00 PM' },
  { day: 'Thursday', slots: '2:00 PM - 5:00 PM' },
  { day: 'Friday', slots: '9:00 AM - 11:00 AM' },
];

const MOCK_REVIEWS = [
  {
    id: '1',
    name: 'Kipchoge A.',
    initials: 'KA',
    rating: 5,
    text: 'James explained the solar system sizing perfectly. Very patient and knowledgeable.',
    date: '2 days ago',
  },
  {
    id: '2',
    name: 'Wanjiku M.',
    initials: 'WM',
    rating: 4,
    text: 'Great session on organic pest control. Helped me identify the issue quickly.',
    date: '5 days ago',
  },
  {
    id: '3',
    name: 'Amina H.',
    initials: 'AH',
    rating: 5,
    text: 'Professional and thorough. Guided me through the tender process step by step.',
    date: '1 week ago',
  },
];

const MOCK_PAYOUTS = [
  { id: '1', amount: 'KSh 4,500', from: 'Wanjiku M.', date: 'Jul 25, 2026', status: 'completed' },
  { id: '2', amount: 'KSh 3,000', from: 'Kipchoge A.', date: 'Jul 23, 2026', status: 'completed' },
  { id: '3', amount: 'KSh 6,000', from: 'Amina H.', date: 'Jul 20, 2026', status: 'completed' },
];

type Professional = typeof MOCK_PROFESSIONALS[number];
type DeskTab = 'overview' | 'requests' | 'sessions' | 'messages' | 'profile' | 'availability' | 'payouts' | 'analytics';

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>(MOCK_PROFESSIONALS);
  const [loading, setLoading] = useState(true);
  const { showToast } = useApp();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<DeskTab>('overview');

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
          <div className="eyebrow">Professional workspace</div>
          <h1 className="serif">Good guidance, organised.</h1>
          <p>Manage questions, private consultations, sessions, ratings, tips, availability, and your public expert profile from one calm desk.</p>
        </div>
        <button className="primary" onClick={() => setActiveTab('availability')}>
          <Clock3 className="icon-sm" /> Set availability
        </button>
      </div>

      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow" style={{ color: 'var(--gold)' }}>Approved professional</div>
          <h1 className="serif">James, your expertise is in demand.</h1>
          <p>Four students are waiting for your guidance. You have 2 upcoming sessions this week.</p>
          <div className="hero-actions">
            <button onClick={() => setActiveTab('requests')}>View requests (4)</button>
            <button onClick={() => setActiveTab('sessions')}>Upcoming sessions (2)</button>
            <button className="gold" onClick={() => setActiveTab('analytics')}>View analytics</button>
          </div>
        </div>
      </section>

      <div className="stats" style={{ marginTop: 13 }}>
        <div className="stat">
          <strong>4</strong>
          <span>Pending requests</span>
        </div>
        <div className="stat">
          <strong>2</strong>
          <span>Upcoming sessions</span>
        </div>
        <div className="stat">
          <strong>KSh 13,500</strong>
          <span>Tips earned this month</span>
        </div>
      </div>

      <div className="tool-tabs">
        {([
          { id: 'overview' as const, icon: LayoutDashboard, label: 'Overview' },
          { id: 'requests' as const, icon: Inbox, label: 'Guidance requests', badge: 4 },
          { id: 'sessions' as const, icon: CalendarCheck, label: 'Sessions' },
          { id: 'messages' as const, icon: MessagesSquare, label: 'Messages', badge: 3 },
          { id: 'profile' as const, icon: UserRound, label: 'Public profile' },
          { id: 'availability' as const, icon: Clock3, label: 'Availability' },
          { id: 'payouts' as const, icon: WalletCards, label: 'Payouts' },
          { id: 'analytics' as const, icon: ChartNoAxesCombined, label: 'Analytics' },
        ]).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tool-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className="icon-sm" />
              {tab.label}
              {tab.badge && <span style={{ marginLeft: 4, color: 'var(--red)', fontSize: '.58rem' }}>{tab.badge}</span>}
            </button>
          );
        })}
      </div>

      <div className="split">
        <div>
          {activeTab === 'overview' && (
            <>
              <section className="section">
                <div className="section-head">
                  <div>
                    <div className="eyebrow">Your work</div>
                    <h2 className="serif">Guidance requests.</h2>
                  </div>
                  <button className="secondary" onClick={() => setActiveTab('requests')}>
                    <Inbox className="icon-sm" /> All requests
                  </button>
                </div>
                {MOCK_REQUESTS.slice(0, 3).map((req) => (
                  <div key={req.id} className="task">
                    <div className="task-icon">
                      {req.urgent ? <AlertTriangle className="icon-sm" /> : <MessageSquare className="icon-sm" />}
                    </div>
                    <div className="task-copy">
                      <strong>{req.title}</strong>
                      <p>{req.student} &middot; {req.topic}</p>
                      <span>{req.time}</span>
                    </div>
                    <button className="task-action" onClick={() => showToast(`Opening request: ${req.title}`)}>
                      Answer
                    </button>
                  </div>
                ))}
              </section>

              <section className="section">
                <div className="section-head">
                  <div>
                    <div className="eyebrow">Upcoming</div>
                    <h2 className="serif">Sessions.</h2>
                  </div>
                  <button className="secondary" onClick={() => setActiveTab('sessions')}>
                    <CalendarCheck className="icon-sm" /> All sessions
                  </button>
                </div>
                {MOCK_SESSIONS.filter(s => s.status === 'live' || s.status === 'upcoming').map((session) => (
                  <div key={session.id} className={`session ${session.status === 'live' ? '' : ''}`}>
                    <div className="session-copy">
                      <strong>{session.title}</strong>
                      <p>{session.student} &middot; {session.duration}</p>
                      <span>{session.date}</span>
                    </div>
                    <span className={`status ${session.status === 'live' ? 'live' : ''}`}>
                      {session.status === 'live' ? (
                        <><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', display: 'inline-block', animation: 'pulse 1.5s infinite' }} /> Live</>
                      ) : session.status}
                    </span>
                  </div>
                ))}
              </section>

              <section className="section">
                <div className="section-head">
                  <div>
                    <div className="eyebrow">Recent</div>
                    <h2 className="serif">Reviews.</h2>
                  </div>
                </div>
                {MOCK_REVIEWS.slice(0, 2).map((review) => (
                  <div key={review.id} className="review">
                    <div className="review-top">
                      <div className="avatar sm" style={{ background: 'var(--greenSoft)', color: 'var(--green)' }}>
                        {review.initials}
                      </div>
                      <div className="review-copy">
                        <strong>{review.name}</strong>
                        <span>{review.date}</span>
                      </div>
                      <div className="stars">
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </div>
                    </div>
                    <p>{review.text}</p>
                  </div>
                ))}
              </section>
            </>
          )}

          {activeTab === 'requests' && (
            <section className="section">
              <div className="section-head">
                <div>
                  <div className="eyebrow">Guidance requests</div>
                  <h2 className="serif">Students waiting for help.</h2>
                </div>
                <button className="secondary" onClick={() => showToast('Refreshing requests')}>
                  <RefreshCcw className="icon-sm" /> Refresh
                </button>
              </div>
              {MOCK_REQUESTS.map((req) => (
                <div key={req.id} className="task">
                  <div className="task-icon">
                    <MessageSquare className="icon-sm" />
                  </div>
                  <div className="task-copy">
                    <strong>{req.title}</strong>
                    <p>{req.student} &middot; {req.topic}</p>
                    <span>{req.time}</span>
                  </div>
                  <button className="task-action" onClick={() => showToast(`Opening request: ${req.title}`)}>
                    Answer
                  </button>
                </div>
              ))}
            </section>
          )}

          {activeTab === 'sessions' && (
            <section className="section">
              <div className="section-head">
                <div>
                  <div className="eyebrow">Sessions</div>
                  <h2 className="serif">Your consultations.</h2>
                </div>
              </div>
              {MOCK_SESSIONS.map((session) => (
                <div key={session.id} className="session">
                  <div className="session-copy">
                    <strong>{session.title}</strong>
                    <p>{session.student} &middot; {session.duration}</p>
                    <span>{session.date}</span>
                  </div>
                  <span className={`status ${session.status === 'live' ? 'live' : ''}`}>
                    {session.status === 'live' ? (
                      <><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', display: 'inline-block', animation: 'pulse 1.5s infinite' }} /> Live</>
                    ) : session.status}
                  </span>
                </div>
              ))}
            </section>
          )}

          {activeTab === 'messages' && (
            <section className="section">
              <div className="section-head">
                <div>
                  <div className="eyebrow">Messages</div>
                  <h2 className="serif">Student conversations.</h2>
                </div>
              </div>
              <div className="task">
                <div className="task-icon" style={{ background: 'var(--blueSoft)', color: 'var(--blue)' }}>
                  <MessagesSquare className="icon-sm" />
                </div>
                <div className="task-copy">
                  <strong>Wanjiku M.</strong>
                  <p>Thanks for the solar sizing help!</p>
                  <span>2h ago</span>
                </div>
                <button className="task-action" onClick={() => showToast('Opening chat with Wanjiku')}>
                  Reply
                </button>
              </div>
              <div className="task">
                <div className="task-icon" style={{ background: 'var(--greenSoft)', color: 'var(--green)' }}>
                  <MessagesSquare className="icon-sm" />
                </div>
                <div className="task-copy">
                  <strong>Kipchoge A.</strong>
                  <p>When is our next session?</p>
                  <span>5h ago</span>
                </div>
                <button className="task-action" onClick={() => showToast('Opening chat with Kipchoge')}>
                  Reply
                </button>
              </div>
            </section>
          )}

          {activeTab === 'profile' && (
            <section className="section">
              <div className="section-head">
                <div>
                  <div className="eyebrow">Public profile</div>
                  <h2 className="serif">How students see you.</h2>
                </div>
                <button className="secondary" onClick={() => showToast('Opening profile editor')}>
                  <ExternalLink className="icon-sm" /> Edit
                </button>
              </div>
              <div className="task">
                <div className="task-icon">
                  <UserRound className="icon-sm" />
                </div>
                <div className="task-copy">
                  <strong>James Otieno</strong>
                  <p>Solar systems for small businesses</p>
                  <span>Kisumu &middot; 89 consultations &middot; 4.8 rating</span>
                </div>
                <button className="task-action" onClick={() => showToast('Previewing public profile')}>
                  Preview
                </button>
              </div>
              <div className="task">
                <div className="task-icon">
                  <FileCheck2 className="icon-sm" />
                </div>
                <div className="task-copy">
                  <strong>Answer public questions</strong>
                  <p>Help students in the baraza with your expertise.</p>
                  <span>Build trust and earn tips</span>
                </div>
                <button className="task-action" onClick={() => showToast('Opening public questions')}>
                  View
                </button>
              </div>
            </section>
          )}

          {activeTab === 'availability' && (
            <section className="section">
              <div className="section-head">
                <div>
                  <div className="eyebrow">Availability</div>
                  <h2 className="serif">Set your schedule.</h2>
                </div>
                <button className="secondary" onClick={() => showToast('Opening availability form')}>
                  <Plus className="icon-sm" /> Add slot
                </button>
              </div>
              {MOCK_AVAILABILITY.map((slot) => (
                <div key={slot.day} className="task">
                  <div className="task-icon">
                    <Clock3 className="icon-sm" />
                  </div>
                  <div className="task-copy">
                    <strong>{slot.day}</strong>
                    <p>{slot.slots}</p>
                  </div>
                  <button className="task-action" onClick={() => showToast(`Editing ${slot.day} availability`)}>
                    Edit
                  </button>
                </div>
              ))}
              <div style={{ marginTop: 16 }}>
                <button className="primary" onClick={() => showToast('Availability saved')}>
                  Save schedule
                </button>
              </div>
            </section>
          )}

          {activeTab === 'payouts' && (
            <section className="section">
              <div className="section-head">
                <div>
                  <div className="eyebrow">Payouts</div>
                  <h2 className="serif">Your earnings.</h2>
                </div>
              </div>
              <div className="money">
                <div className="money-row">
                  <span>Consultations (3)</span>
                  <strong>KSh 13,500</strong>
                </div>
                <div className="money-row fee">
                  <span>Platform fee (10%)</span>
                  <strong>-KSh 1,350</strong>
                </div>
                <div className="money-row total">
                  <span>Net earnings</span>
                  <strong>KSh 12,150</strong>
                </div>
              </div>
              <div className="mpesa" style={{ marginTop: 12 }}>
                <div className="mpesa-mark">M</div>
                <span>M-Pesa payouts processed within 24 hours</span>
              </div>
              <div style={{ marginTop: 16 }}>
                {MOCK_PAYOUTS.map((payout) => (
                  <div key={payout.id} className="task">
                    <div className="task-icon" style={{ background: 'var(--greenSoft)', color: 'var(--green)' }}>
                      <WalletCards className="icon-sm" />
                    </div>
                    <div className="task-copy">
                      <strong>{payout.amount}</strong>
                      <p>From {payout.from}</p>
                      <span>{payout.date} &middot; {payout.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'analytics' && (
            <section className="section">
              <div className="section-head">
                <div>
                  <div className="eyebrow">Analytics</div>
                  <h2 className="serif">Your impact.</h2>
                </div>
              </div>
              <div className="chart">
                {[
                  { month: 'Mar', value: 40 },
                  { month: 'Apr', value: 65 },
                  { month: 'May', value: 50 },
                  { month: 'Jun', value: 80 },
                  { month: 'Jul', value: 95 },
                ].map((bar) => (
                  <div
                    key={bar.month}
                    className="bar"
                    style={{ height: `${bar.value}%` }}
                  >
                    <span>{bar.month}</span>
                  </div>
                ))}
              </div>
              <div className="legend">
                <span><strong>5</strong> sessions this month</span>
                <span><strong>KSh 13,500</strong> earned</span>
              </div>
              <div style={{ marginTop: 16 }}>
                <div className="stats">
                  <div className="stat">
                    <strong>89</strong>
                    <span>Profile views</span>
                  </div>
                  <div className="stat">
                    <strong>12</strong>
                    <span>Followers</span>
                  </div>
                  <div className="stat">
                    <strong>4.8</strong>
                    <span>Avg rating</span>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        <div>
          <section className="section">
            <div className="section-head">
              <div>
                <div className="eyebrow">Quick actions</div>
                <h2 className="serif">Tasks.</h2>
              </div>
            </div>
            <div className="task">
              <div className="task-icon">
                <Inbox className="icon-sm" />
              </div>
              <div className="task-copy">
                <strong>Answer guidance request</strong>
                <p>4 students need your help</p>
              </div>
              <button className="task-action" onClick={() => setActiveTab('requests')}>
                Open
              </button>
            </div>
            <div className="task">
              <div className="task-icon" style={{ background: 'var(--earthSoft)', color: 'var(--earth)' }}>
                <CalendarCheck className="icon-sm" />
              </div>
              <div className="task-copy">
                <strong>Upcoming session</strong>
                <p>Solar panel walkthrough at 3:00 PM</p>
              </div>
              <button className="task-action" onClick={() => setActiveTab('sessions')}>
                Open
              </button>
            </div>
            <div className="task">
              <div className="task-icon" style={{ background: 'var(--blueSoft)', color: 'var(--blue)' }}>
                <MessagesSquare className="icon-sm" />
              </div>
              <div className="task-copy">
                <strong>Reply to messages</strong>
                <p>3 unread conversations</p>
              </div>
              <button className="task-action" onClick={() => setActiveTab('messages')}>
                Open
              </button>
            </div>
          </section>

          <section className="section">
            <div className="section-head">
              <div>
                <div className="eyebrow">Your rating</div>
                <h2 className="serif">Heshima.</h2>
              </div>
            </div>
            <div className="task">
              <div className="task-icon" style={{ background: 'var(--goldSoft)', color: 'var(--gold)' }}>
                <Star className="icon-sm" />
              </div>
              <div className="task-copy">
                <strong>4.8 / 5.0</strong>
                <p>Based on 89 ratings</p>
                <span>Top 3% in Kisumu</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
