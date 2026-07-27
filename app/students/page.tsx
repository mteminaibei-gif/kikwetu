'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, createThread, requestSession, toggleFollow, checkFollowing } from '@/lib/supabase-helpers';
import {
  GraduationCap, BadgeCheck, MessagesSquare, Plus, CircleHelp,
  MessageCircleQuestion, ThumbsUp, Send, Award, BookOpen, Target,
  ChevronRight, Tag, X, CalendarCheck, ArrowLeft, FileText,
  Smartphone, Star, Clock3,
} from 'lucide-react';

const MOCK_STUDENTS = [
  { name: 'Njeri Wambui', initials: 'NW', color: 'earth', topic: 'Urban farming and climate education', badge: 'Approved professional', user_id: 'mock-nw' },
  { name: 'James Otieno', initials: 'JO', color: 'blue', topic: 'Solar systems for small businesses', badge: 'Approved professional', user_id: 'mock-jo' },
  { name: 'Fatuma Ali', initials: 'FA', color: 'green', topic: 'Swahili heritage and storytelling', badge: 'Approved professional', user_id: 'mock-fa' },
  { name: 'Ruth Kilonzo', initials: 'RK', color: 'earth', topic: 'County procurement and tenders', badge: 'Approved professional', user_id: 'mock-rk' },
];

const MOCK_SESSIONS = [
  { id: '1', pro: MOCK_STUDENTS[1], title: 'Solar basics for a small retail shop', date: 'Tomorrow, 4:30 PM EAT', duration: '45 minutes', status: 'upcoming' as const },
  { id: '2', pro: MOCK_STUDENTS[0], title: 'Urban farming: grow bags that do not leak', date: 'Yesterday', duration: '30 minutes', status: 'completed' as const },
];

const MOCK_THREAD = {
  title: 'How do I price a small digital service without undercutting myself?',
  body: 'I can build simple websites and product mockups, but I keep pricing from fear. I want a practical way to quote clients.',
  author: 'Grid Pulse',
  authorInitials: 'GP',
  time: 'Asked today',
  location: 'Nairobi',
  tags: ['#TechAndStartups'],
  offers: 2,
  upvotes: 31,
  answers: 8,
  guidanceOffers: [
    { pro: MOCK_STUDENTS[0], topic: 'Value-based pricing', date: 'Tomorrow', duration: '30 min' },
    { pro: MOCK_STUDENTS[1], topic: 'Real client example', date: 'Wednesday', duration: '45 min' },
  ],
};

const MOCK_CHAT = [
  { id: '1', sender: 'pro', initials: 'JO', color: 'blue', text: 'Hi Grid Pulse. Bring your power bill if you have it. If not, a list of appliances and hours is enough.', time: '4:02 PM' },
  { id: '2', sender: 'me', text: 'Perfect. I am trying to avoid buying more system than the shop needs.', time: '4:06 PM', read: true },
  { id: '3', sender: 'pro', initials: 'JO', color: 'blue', text: 'That is the right starting point. We will map essential load first, then test two realistic budgets.', time: '4:08 PM', attachment: { name: 'solar-session-prep.pdf', size: 'Checklist · 184 KB' } },
];

const TOPIC_OPTIONS = ['#TechAndStartups', 'Nairobi', 'Urban farming', 'Solar energy', 'Tender docs'];
const TIP_OPTIONS = [300, 500, 1000, 1500];

type Professional = typeof MOCK_STUDENTS[number];
type StudentTab = 'overview' | 'sessions' | 'thread' | 'ask' | 'chat' | 'wallet';

export default function StudentsPage() {
  const { showToast } = useApp();
  const [question, setQuestion] = useState('');
  const [questionTitle, setQuestionTitle] = useState('');
  const [professionals, setProfessionals] = useState<Professional[]>(MOCK_STUDENTS);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<StudentTab>('overview');

  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [sessionModalPro, setSessionModalPro] = useState<Professional | null>(null);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDesc, setSessionDesc] = useState('');
  const [sessionSubmitting, setSessionSubmitting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedTopics, setSelectedTopics] = useState<string[]>(['#TechAndStartups']);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState(MOCK_CHAT);
  const [tipAmount, setTipAmount] = useState(500);
  const [tipRating, setTipRating] = useState(0);

  useEffect(() => {
    if (!currentUser || !professionals.length) return;
    async function checkAll() {
      const map: Record<string, boolean> = {};
      for (const pro of professionals) {
        map[pro.user_id] = await checkFollowing(currentUser!.user_id, pro.user_id);
      }
      setFollowingMap(map);
    }
    checkAll();
  }, [currentUser, professionals]);

  const handleFollow = async (proUserId: string) => {
    if (!currentUser) return showToast('Please sign in');
    const nowFollowing = await toggleFollow(currentUser.user_id, proUserId);
    setFollowingMap(prev => ({ ...prev, [proUserId]: nowFollowing }));
    showToast(nowFollowing ? 'Following' : 'Unfollowed');
  };

  useEffect(() => {
    async function init() {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch {}

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
              user_id: pro.user_id || pro.id || String(i),
            }))
          );
        }
      } catch {
        setProfessionals(MOCK_STUDENTS);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  async function handlePublishQuestion() {
    if (!question.trim() || !questionTitle.trim()) {
      showToast('Please add a title and question');
      return;
    }
    if (!currentUser) {
      showToast('Please log in to ask a question');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await createThread(currentUser.id, questionTitle, question, 'question');
      if (error) throw error;
      showToast('Question published!');
      setQuestion('');
      setQuestionTitle('');
      setActiveTab('thread');
    } catch {
      showToast('Failed to publish. Try again.');
    } finally {
      setSubmitting(false);
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

  function handleSendMessage() {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [
      ...prev,
      { id: String(Date.now()), sender: 'me', text: chatInput, time: 'now', read: false },
    ]);
    setChatInput('');
    showToast('Message sent privately');
  }

  function handleConfirmTip() {
    if (!tipRating) {
      showToast('Choose a rating first');
      return;
    }
    const net = Math.round(tipAmount * 0.9);
    showToast(`M-Pesa prompt sent, professional receives KSh ${net.toLocaleString()}`);
    setActiveTab('overview');
  }

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
            <h2 className="serif" style={{ marginBottom: 16 }}>Request Session</h2>
            <p style={{ fontSize: '.82rem', color: 'var(--text2)', marginBottom: 16 }}>
              Send a session request to <strong>{sessionModalPro.name}</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                placeholder="Session title (e.g. Solar basics)"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
              />
              <textarea
                placeholder="Brief description of what you want to learn..."
                value={sessionDesc}
                onChange={(e) => setSessionDesc(e.target.value)}
                rows={3}
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
          <div className="eyebrow">Students Area</div>
          <h1 className="serif">{activeTab === 'sessions' ? 'Your private guidance room.' : activeTab === 'thread' ? MOCK_THREAD.title.slice(0, 50) + '...' : activeTab === 'ask' ? 'Turn the stuck feeling into a clear question.' : activeTab === 'chat' ? 'Your guidance circle.' : activeTab === 'wallet' ? 'Thank useful guidance.' : 'Ask better. Learn privately.'}</h1>
          <p>{activeTab === 'sessions' ? 'Everything before, during, and after a consultation lives here.' : activeTab === 'thread' ? 'Give professionals enough context to offer useful guidance.' : activeTab === 'ask' ? 'Give professionals enough context to offer useful guidance.' : activeTab === 'chat' ? 'Ask follow-ups, share context, and keep session advice in one place.' : activeTab === 'wallet' ? 'Tips move through M-Pesa. The platform fee is visible before confirmation.' : 'Post a question, compare approved professionals, book a private consultation, then tip and rate useful guidance.'}</p>
        </div>
        {activeTab === 'sessions' && (
          <button className="primary" onClick={() => setActiveTab('overview')}>
            <Plus className="icon-sm" /> Book session
          </button>
        )}
      </div>

      {activeTab === 'overview' && (
        <>
          <section className="hero">
            <div className="hero-content">
              <div className="eyebrow" style={{ color: 'var(--gold)' }}>Your learning hub</div>
              <h1 className="serif">From &ldquo;I am stuck&rdquo; to &ldquo;I can do this.&rdquo;</h1>
              <p>Ask, match, chat, meet, tip, rate. M-Pesa fees are shown before you confirm.</p>
              <div className="hero-actions">
                <button className="gold" onClick={() => setActiveTab('ask')}>
                  <MessageCircleQuestion className="icon-sm" /> Ask a question
                </button>
                <button onClick={() => showToast('Browse experts')}>
                  <BadgeCheck className="icon-sm" /> Browse experts
                </button>
                <button onClick={() => setActiveTab('chat')}>
                  <MessagesSquare className="icon-sm" /> Open messages
                </button>
              </div>
            </div>
          </section>

          <div className="grid2">
            <section className="section">
              <div className="section-head">
                <div>
                  <div className="eyebrow">Your learning loop</div>
                  <h2 className="serif">Keep moving.</h2>
                </div>
              </div>
              <div className="stats">
                <div className="stat">
                  <strong>6</strong>
                  <span>sessions completed</span>
                </div>
                <div className="stat">
                  <strong>18</strong>
                  <span>questions asked</span>
                </div>
                <div className="stat">
                  <strong>4</strong>
                  <span>badges earned</span>
                </div>
              </div>
              <div className="progress-track">
                <div className="progress-value" />
              </div>
              <p className="muted" style={{ marginTop: 6, fontSize: '.63rem' }}>68% toward your Curious neighbour badge.</p>
            </section>

            <section className="section">
              <div className="section-head">
                <div>
                  <div className="eyebrow">Upcoming</div>
                  <h2 className="serif">Your next session.</h2>
                </div>
              </div>
              <button className="quick" onClick={() => setActiveTab('chat')}>
                <div className="avatar sm blue">JO</div>
                <div className="quick-copy">
                  <strong>James Otieno</strong>
                  <span>Solar basics · tomorrow · 4:30 PM</span>
                </div>
                <span className="status ready">Open</span>
              </button>
            </section>
          </div>

          <section className="section" style={{ marginTop: 13 }}>
            <div className="section-head">
              <div>
                <div className="eyebrow">Quick help</div>
                <h2 className="serif">Common questions.</h2>
              </div>
            </div>
            <button className="quick" onClick={() => showToast('How do I ask a good question?')}>
              <div className="quick-icon"><CircleHelp className="icon-sm" /></div>
              <div className="quick-copy">
                <strong>How do I ask a good question?</strong>
                <span>Guide</span>
              </div>
              <ChevronRight className="icon-sm" style={{ color: 'var(--text3)' }} />
            </button>
            <button className="quick" onClick={() => showToast('What badges can I earn?')}>
              <div className="quick-icon" style={{ color: 'var(--earth)', background: 'var(--earthSoft)' }}><Award className="icon-sm" /></div>
              <div className="quick-copy">
                <strong>What badges can I earn?</strong>
                <span>Rewards</span>
              </div>
              <ChevronRight className="icon-sm" style={{ color: 'var(--text3)' }} />
            </button>
            <button className="quick" onClick={() => showToast('How do I track my learning goals?')}>
              <div className="quick-icon"><Target className="icon-sm" /></div>
              <div className="quick-copy">
                <strong>How do I track my learning goals?</strong>
                <span>Progress</span>
              </div>
              <ChevronRight className="icon-sm" style={{ color: 'var(--text3)' }} />
            </button>
          </section>

          <section className="section" style={{ marginTop: 13 }}>
            <div className="section-head">
              <div>
                <div className="eyebrow">Ask the community</div>
                <h2 className="serif">Need an answer?</h2>
              </div>
            </div>
            <button className="quick" onClick={() => setActiveTab('ask')}>
              <div className="quick-icon" style={{ color: 'var(--earth)', background: 'var(--goldSoft)' }}><MessageCircleQuestion className="icon-sm" /></div>
              <div className="quick-copy">
                <strong>How do I price a digital service?</strong>
                <span>#TechAndStartups · 2 offers</span>
              </div>
              <ChevronRight className="icon-sm" style={{ color: 'var(--text3)' }} />
            </button>
          </section>

          <section className="section" style={{ marginTop: 13 }}>
            <div className="section-head">
              <div>
                <div className="eyebrow">Approved professionals</div>
                <h2 className="serif">Learn from the best.</h2>
              </div>
              <button className="secondary" onClick={() => showToast('View all professionals')}>
                View all <ChevronRight className="icon-sm" />
              </button>
            </div>
            {professionals.map((pro) => (
              <div key={pro.initials} className="pro">
                <div className={`avatar sm ${pro.color}`}>{pro.initials}</div>
                <div className="pro-copy">
                  <strong>{pro.name} <span className="verified">✓</span></strong>
                  <p>{pro.topic}</p>
                  <span>{pro.badge} · private sessions · 4.9 rating</span>
                </div>
                <div className="pro-actions">
                  <button className="follow" onClick={() => handleFollow(pro.user_id)}>
                    {followingMap[pro.user_id] ? 'Following' : 'Follow'}
                  </button>
                  <button className="primary" onClick={() => setSessionModalPro(pro)}>Request</button>
                </div>
              </div>
            ))}
          </section>
        </>
      )}

      {activeTab === 'sessions' && (
        <>
          <section className="section">
            <div className="section-head">
              <div>
                <div className="eyebrow">Upcoming</div>
                <h2 className="serif">Do not miss the useful bit.</h2>
              </div>
            </div>
            {MOCK_SESSIONS.filter(s => s.status === 'upcoming').map((session) => (
              <div key={session.id} className="offer">
                <div className={`avatar ${session.pro.color}`}>{session.pro.initials}</div>
                <div className="offer-copy">
                  <strong>{session.pro.name} <span className="verified">✓</span></strong>
                  <p>{session.title}</p>
                  <span>{session.date} · {session.duration} · Private chat</span>
                </div>
                <button className="primary" onClick={() => setActiveTab('chat')}>Enter</button>
              </div>
            ))}
          </section>

          <section className="section" style={{ marginTop: 13 }}>
            <div className="section-head">
              <div>
                <div className="eyebrow">Completed</div>
                <h2 className="serif">Close the loop.</h2>
              </div>
            </div>
            {MOCK_SESSIONS.filter(s => s.status === 'completed').map((session) => (
              <div key={session.id} className="offer">
                <div className={`avatar ${session.pro.color}`}>{session.pro.initials}</div>
                <div className="offer-copy">
                  <strong>{session.pro.name} <span className="verified">✓</span></strong>
                  <p>{session.title}</p>
                  <span>Completed {session.date} · {session.duration}</span>
                </div>
                <button className="primary" onClick={() => setActiveTab('wallet')}>Tip & rate</button>
              </div>
            ))}
          </section>
        </>
      )}

      {activeTab === 'thread' && (
        <>
          <button className="secondary" onClick={() => setActiveTab('overview')} style={{ marginBottom: 12 }}>
            <ArrowLeft className="icon-sm" /> Students Area
          </button>
          <section className="section">
            <div className="eyebrow">Your question</div>
            <h1 className="serif" style={{ marginTop: 6, fontSize: '1.65rem', lineHeight: 1.05 }}>{MOCK_THREAD.title}</h1>
            <p style={{ marginTop: 9, color: 'var(--text2)', fontSize: '.72rem' }}>{MOCK_THREAD.body}</p>
            <div className="tags">
              {MOCK_THREAD.tags.map(t => <span key={t} className="tag">{t}</span>)}
              <span className="tag gold">{MOCK_THREAD.offers} offers</span>
            </div>
            <div className="question-footer">
              <button><ThumbsUp className="icon-sm" /> {MOCK_THREAD.upvotes}</button>
              <button><MessageCircleQuestion className="icon-sm" /> {MOCK_THREAD.answers} answers</button>
              <span className="spacer" />
              <button onClick={() => showToast('Saved')}>Bookmark</button>
            </div>
          </section>

          <section className="section" style={{ marginTop: 13 }}>
            <div className="section-head">
              <div>
                <div className="eyebrow">Guidance offers</div>
                <h2 className="serif">Choose your next conversation.</h2>
              </div>
            </div>
            {MOCK_THREAD.guidanceOffers.map((offer, i) => (
              <div key={i} className="offer">
                <div className={`avatar ${offer.pro.color}`}>{offer.pro.initials}</div>
                <div className="offer-copy">
                  <strong>{offer.pro.name} <span className="verified">✓</span></strong>
                  <p>{offer.topic} · {offer.date} · {offer.duration}</p>
                </div>
                <button className="primary" onClick={() => setSessionModalPro(offer.pro)}>Book</button>
              </div>
            ))}
          </section>
        </>
      )}

      {activeTab === 'ask' && (
        <section className="section">
          <div className="eyebrow">Ask Kikwetu</div>
          <h1 className="serif" style={{ marginTop: 6, fontSize: '1.45rem', lineHeight: 1.05 }}>Turn the stuck feeling into a clear question.</h1>
          <div style={{ marginTop: 14 }}>
            <div className="form-field">
              <label>Question title</label>
              <input
                type="text"
                value={questionTitle}
                onChange={(e) => setQuestionTitle(e.target.value)}
                placeholder="How do I price a small digital service without undercutting myself?"
              />
            </div>
            <div className="form-field">
              <label>Context</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={5}
                placeholder="I can build simple websites and product mockups, but I keep pricing from fear. I want a practical way to quote clients."
              />
            </div>
            <div className="form-field">
              <label>Topics and bounty</label>
              <div className="choice-row">
                {TOPIC_OPTIONS.map(t => (
                  <button
                    key={t}
                    className={`choice ${selectedTopics.includes(t) ? 'selected' : ''}`}
                    onClick={() => setSelectedTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <button className="primary" style={{ width: '100%', marginTop: 15 }} onClick={handlePublishQuestion}>
              <Send className="icon-sm" /> Publish question
            </button>
          </div>
        </section>
      )}

      {activeTab === 'chat' && (
        <section className="chat">
          <div className="chat-main">
            <div className="chat-top">
              <div className="avatar sm blue">JO</div>
              <div>
                <strong>James Otieno <span className="verified">✓</span></strong>
                <p><span className="live-dot" /> Online now · Approved solar mentor</p>
              </div>
            </div>
            <div className="session-bar">
              <strong>Upcoming private session</strong>
              <span>Solar basics for a small retail shop · Tomorrow, 4:30 PM EAT · 45 minutes</span>
              <div className="session-actions">
                <button onClick={() => showToast('Session details')}>Details</button>
                <button className="join" onClick={() => showToast('Joining room')}>Join room</button>
              </div>
            </div>
            <div className="chat-body">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`message-row ${msg.sender === 'me' ? 'mine' : ''}`}>
                  {msg.sender !== 'me' && <div className={`avatar sm ${msg.color}`}>{msg.initials}</div>}
                  <div className="message-bubble">
                    {msg.text}
                    {msg.attachment && (
                      <div className="attachment">
                        <span className="attachment-icon"><FileText className="icon-sm" /></span>
                        <span className="attachment-copy">
                          <strong>{msg.attachment.name}</strong>
                          <span>{msg.attachment.size}</span>
                        </span>
                      </div>
                    )}
                    <div className="message-time">
                      {msg.time}
                      {msg.read && <span className="read"> ✓✓</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="chat-input">
              <button className="secondary" onClick={() => showToast('Attach file')}>
                <FileText className="icon-sm" />
              </button>
              <input
                id="messageInput"
                type="text"
                placeholder="Type a private message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button className="primary" onClick={handleSendMessage}>
                <Send className="icon-sm" />
              </button>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'wallet' && (
        <>
          <section className="section">
            <div className="section-head">
              <div>
                <div className="eyebrow">Close your last session</div>
                <h2 className="serif">Tip and rate Njeri.</h2>
              </div>
            </div>
            <div className="pro">
              <div className="avatar earth">NW</div>
              <div className="pro-copy">
                <strong>Njeri Wambui <span className="verified">✓</span></strong>
                <p>Urban farming: grow bags that do not leak</p>
                <span>Completed yesterday · suggested KSh 1,000</span>
              </div>
            </div>
            <div className="tip-choices">
              {TIP_OPTIONS.map(amount => (
                <button
                  key={amount}
                  className={`tip-choice ${tipAmount === amount ? 'selected' : ''}`}
                  onClick={() => setTipAmount(amount)}
                >
                  KSh {amount.toLocaleString()}
                </button>
              ))}
            </div>
            <div className="stars">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} className={`star ${tipRating >= n ? 'on' : ''}`} onClick={() => setTipRating(n)}>★</button>
              ))}
            </div>
            <div className="money">
              <div className="money-row">
                <span>Your tip</span>
                <strong>KSh {tipAmount.toLocaleString()}</strong>
              </div>
              <div className="money-row fee">
                <span>Platform service fee, 10%</span>
                <strong>-KSh {Math.round(tipAmount * 0.1).toLocaleString()}</strong>
              </div>
              <div className="money-row total">
                <span>Professional receives</span>
                <strong>KSh {Math.round(tipAmount * 0.9).toLocaleString()}</strong>
              </div>
              <div className="mpesa">
                <span className="mpesa-mark">M</span>
                <span>M-Pesa confirmation and receipt next</span>
              </div>
            </div>
            <button className="primary" style={{ width: '100%', marginTop: 12 }} onClick={handleConfirmTip}>
              <Smartphone className="icon-sm" /> Confirm tip via M-Pesa
            </button>
          </section>

          <section className="section" style={{ marginTop: 13 }}>
            <div className="section-head">
              <div>
                <div className="eyebrow">Transparent platform split</div>
                <h2 className="serif">No mystery math.</h2>
              </div>
            </div>
            <div className="money">
              <div className="money-row">
                <span>Platform fee</span>
                <strong>10%</strong>
              </div>
              <div className="money-row">
                <span>M-Pesa processing</span>
                <strong>Included</strong>
              </div>
              <div className="money-row total">
                <span>Professional receives</span>
                <strong>90% of your tip</strong>
              </div>
            </div>
          </section>
        </>
      )}
    </AppLayout>
  );
}
