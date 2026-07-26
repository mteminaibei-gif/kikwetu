'use client';

import { useState, useCallback, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/components/Toast';
import { cn } from '@/lib/utils';
import Icon from '@/components/Icon';

const COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret',
  'Thika', 'Malindi', 'Nyeri', 'Machakos', 'Meru',
];

const LANGUAGES = ['English', 'Kiswahili', 'Sheng'];

const FEED_TABS = [
  { id: 'for-you', label: 'For you' },
  { id: 'following', label: 'Following' },
  { id: 'near-you', label: 'Near you' },
  { id: 'questions', label: 'Questions' },
  { id: 'latest', label: 'Latest' },
];

const FORM_TABS = [
  { id: 'post', label: 'Post', icon: 'pencil' },
  { id: 'question', label: 'Question', icon: 'circle-help' },
  { id: 'poll', label: 'Poll', icon: 'bar-chart-3' },
  { id: 'audio', label: 'Audio', icon: 'mic-2' },
];

const TRENDS = [
  { no: 1, title: 'Water-saving tips', desc: '2.4k readers \u00B7 Makueni' },
  { no: 2, title: 'Bursary deadlines', desc: '1.8k readers \u00B7 Education' },
  { no: 3, title: 'Mombasa port update', desc: '940 readers \u00B7 Mombasa' },
  { no: 4, title: 'New farming grants', desc: '720 readers \u00B7 Agriculture' },
  { no: 5, title: 'County clean-up drive', desc: '510 readers \u00B7 Nairobi' },
];

const SPACES_DATA = [
  { id: 's1', name: 'Kilimo Smart', icon: 'sprout', members: 3400 },
  { id: 's2', name: 'Mombasa Tech', icon: 'cpu', members: 1200 },
  { id: 's3', name: 'Elimu Hub', icon: 'graduation-cap', members: 2800 },
  { id: 's4', name: 'Afya na Jamii', icon: 'heart-handshake', members: 950 },
];

const MOCK_POSTS: Array<{
  id: string;
  variant: 'baraza' | 'inquiry' | 'audio' | 'poll';
  author: string;
  initials: string;
  ac: string;
  verified: boolean;
  username: string;
  time: string;
  title: string;
  body?: string;
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  bounty?: string;
  pollOptions?: string[];
  pollVotes?: number[];
  audioTitle?: string;
  audioDesc?: string;
}> = [
  {
    id: 'p1', variant: 'baraza',
    author: 'Grace Mwangi', initials: 'GM', ac: 'green', verified: true,
    username: '@gracemwangi', time: '2 hr ago',
    title: 'My sukuma wiki yield doubled after switching to drip irrigation \u2014 here\u2019s how.',
    body: 'I have been farming sukuma wiki on a quarter-acre plot in Kiambu for three years. Last season I switched from overhead watering to a simple drip kit I bought in town. Water usage dropped by 60% and my yield actually went up. Here are the numbers\u2026',
    tags: ['#KilimoSmart', '#DripIrrigation', '#UrbanFarming'],
    likes: 47, comments: 12, shares: 8,
  },
  {
    id: 'p2', variant: 'inquiry',
    author: 'Kiprop Rono', initials: 'KR', ac: 'earth', verified: false,
    username: '@kiproprono', time: '5 hr ago',
    title: 'Are there certified solar installers in Uasin Gishu who offer payment plans?',
    body: 'Looking to install a 3kW system for my poultry farm. Would appreciate recommendations from anyone who has done this recently.',
    tags: ['#Solar', '#UasinGishu', '#GreenEnergy'],
    likes: 23, comments: 9, shares: 3, bounty: '250 KES',
  },
  {
    id: 'p3', variant: 'audio',
    author: 'Nanjala Wepukhulu', initials: 'NW', ac: 'blue', verified: true,
    username: '@nanjalaw', time: '1 hr ago',
    title: 'Traditional seed-saving techniques from my grandmother \u2014 listen while you work.',
    tags: ['#Heritage', '#Seeds', '#Indigenous'],
    likes: 89, comments: 5, shares: 24,
    audioTitle: 'Grandma\u2019s seed-saving wisdom',
    audioDesc: '8 min \u00B7 Recorded in Bukusu',
  },
  {
    id: 'p4', variant: 'poll',
    author: 'Makena Space', initials: 'MS', ac: 'green', verified: true,
    username: '@makenaspae', time: '6 hr ago',
    title: 'Which market day works best for you?',
    tags: ['#Market', '#Poll'],
    likes: 34, comments: 18, shares: 7,
    pollOptions: ['Wednesday morning', 'Saturday morning', 'Sunday afternoon'],
    pollVotes: [124, 89, 55],
  },
  {
    id: 'p5', variant: 'baraza',
    author: 'James Otieno', initials: 'JO', ac: 'earth', verified: false,
    username: '@jamesotieno', time: '8 hr ago',
    title: 'Tunaanza mradi mpya wa kusoma pamoja kila Alhamisi.',
    body: 'Kila mtu anakaribishwa kujiunga nasi kujifunza na kubadilishana mawazo. Tunakutana Online kuanzia saa tatu jioni.',
    tags: ['#Elimu', '#Reading', '#Community'],
    likes: 31, comments: 7, shares: 15,
  },
];

export default function FeedView() {
  const { threads, spaces, loadThreads, loading } = useApp();
  const { user } = useAuth();
  const { contentLang, setContentLang, tr } = useLanguage();
  const { show } = useToast();

  const [feedTab, setFeedTab] = useState('for-you');
  const [county, setCounty] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [formTab, setFormTab] = useState('post');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCounty, setFormCounty] = useState('Nairobi');
  const [formLang, setFormLang] = useState('English');
  const [createOpen, setCreateOpen] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [pollSel, setPollSel] = useState<Record<string, number | null>>({});
  const [transLang, setTransLang] = useState<Record<string, boolean>>({});

  const cycleCounty = useCallback(() => setCounty(c => (c + 1) % COUNTIES.length), []);

  useEffect(() => {
    try {
      const l = localStorage.getItem('kikwetu_liked');
      if (l) setLiked(new Set(JSON.parse(l)));
      const s = localStorage.getItem('kikwetu_saved_feed');
      if (s) setSaved(new Set(JSON.parse(s)));
    } catch {}
  }, []);

  const toggleLike = useCallback((id: string) => {
    setLiked(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      localStorage.setItem('kikwetu_liked', JSON.stringify([...n]));
      return n;
    });
  }, []);

  const toggleSave = useCallback((id: string) => {
    setSaved(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      localStorage.setItem('kikwetu_saved_feed', JSON.stringify([...n]));
      show(n.has(id) ? 'Saved for later!' : 'Removed from saved');
      return n;
    });
  }, [show]);

  const toggleFollow = useCallback((id: string) => {
    setFollowing(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }, []);

  const selectPoll = useCallback((postId: string, idx: number) => {
    setPollSel(prev => ({ ...prev, [postId]: prev[postId] === idx ? null : idx }));
  }, []);

  const toggleTrans = useCallback((id: string) => {
    setTransLang(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handlePublish = useCallback(() => {
    if (!formTitle.trim() && !formContent.trim()) {
      show('Please fill in the title or content.');
      return;
    }
    show('Post published successfully!');
    setFormTitle('');
    setFormContent('');
    setFormCounty('Nairobi');
    setFormLang('English');
    setShowForm(false);
  }, [formTitle, formContent, show]);

  const selectCreateOption = useCallback((tab: string) => {
    setFormTab(tab);
    setShowForm(true);
    setCreateOpen(false);
    setTimeout(() => {
      document.getElementById('post-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
  }, []);

  const toggleLang = useCallback(() => {
    setContentLang(contentLang === 'en' ? 'sw' : 'en');
  }, [contentLang, setContentLang]);

  const displayedPosts = feedTab === 'following' ? MOCK_POSTS.slice(2) :
    feedTab === 'questions' ? MOCK_POSTS.filter(p => p.variant === 'inquiry') :
    feedTab === 'latest' ? [...MOCK_POSTS].reverse() :
    MOCK_POSTS;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Baraza feed</div>
          <h1 className="serif">Kenya, in conversation.</h1>
          <p>Maswali, mawazo na maarifa kutoka kwa watu walio karibu nawe.</p>
        </div>
        <button className="select-pill" onClick={cycleCounty}>
          <Icon name="map-pin" className="icon-sm" />
          {COUNTIES[county]}
        </button>
      </div>

      <section className="hero-banner">
        <div className="hero-content">
          <div className="eyebrow" style={{ color: 'oklch(90% .04 94)' }}>Community pulse</div>
          <h1 className="serif">Share what your county should know.</h1>
          <p>Post questions, tips, and local updates that matter to your community. Every voice makes us smarter.</p>
          <div className="hero-actions">
            <button className="gold" onClick={() => { setFormTab('question'); setShowForm(true); }}>
              <Icon name="circle-help" className="icon-sm" />
              Ask a question
            </button>
            <button onClick={() => { setFormTab('post'); setShowForm(true); }}>
              <Icon name="pencil" className="icon-sm" />
              Write a post
            </button>
          </div>
        </div>
      </section>

      <div className="feed-switch">
        {FEED_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setFeedTab(t.id)}
            className={cn('feed-tab', feedTab === t.id && 'active')}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className="section-card composer">
        <div className="composer-top">
          <div className="avatar">{user?.full_name?.[0]?.toUpperCase() || 'U'}</div>
          <button className="composer-input" onClick={() => setShowForm(true)}>
            Share something useful with your county...
          </button>
        </div>
        <div className="composer-actions">
          <button className="composer-action" onClick={() => { setFormTab('post'); setShowForm(true); }}>
            <Icon name="image" className="icon-sm" />
            Photo/video
          </button>
          <button className="composer-action" onClick={() => { setFormTab('question'); setShowForm(true); }}>
            <Icon name="circle-help" className="icon-sm" />
            Question
          </button>
          <button className="composer-action" onClick={() => { setFormTab('poll'); setShowForm(true); }}>
            <Icon name="bar-chart-3" className="icon-sm" />
            Poll
          </button>
          <button className="composer-action" onClick={() => { setFormTab('audio'); setShowForm(true); }}>
            <Icon name="mic-2" className="icon-sm" />
            Audio note
          </button>
        </div>
      </section>

      <section id="post-form" className="section-card" style={{ display: showForm ? 'block' : 'none', marginTop: 14 }}>
        <div className="form-tabs">
          {FORM_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setFormTab(t.id)}
              className={cn('form-tab', formTab === t.id && 'active')}
            >
              <Icon name={t.icon} className="icon-sm" />
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <input
            type="text"
            placeholder={formTab === 'question' ? 'Ask your question...' : 'Title'}
            value={formTitle}
            onChange={e => setFormTitle(e.target.value)}
            style={{ width: '100%', padding: '10px 11px', border: '1px solid var(--color-line)', borderRadius: 11, color: 'var(--color-text)', background: 'var(--color-bg)', outline: 0, marginBottom: 10 }}
          />
          <textarea
            placeholder={formTab === 'poll' ? 'What do you want to ask? (one per line)' : 'Provide more context...'}
            value={formContent}
            onChange={e => setFormContent(e.target.value)}
            rows={4}
            style={{ width: '100%', padding: '10px 11px', border: '1px solid var(--color-line)', borderRadius: 11, color: 'var(--color-text)', background: 'var(--color-bg)', outline: 0, resize: 'vertical', marginBottom: 10 }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <select
              value={formCounty}
              onChange={e => setFormCounty(e.target.value)}
              style={{ padding: '8px 10px', border: '1px solid var(--color-line)', borderRadius: 9, color: 'var(--color-text)', background: 'var(--color-bg)', fontSize: '.74rem', outline: 0 }}
            >
              {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={formLang}
              onChange={e => setFormLang(e.target.value)}
              style={{ padding: '8px 10px', border: '1px solid var(--color-line)', borderRadius: 9, color: 'var(--color-text)', background: 'var(--color-bg)', fontSize: '.74rem', outline: 0 }}
            >
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="secondary-btn" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="primary-btn" onClick={handlePublish}>Publish</button>
          </div>
        </div>
      </section>

      <section className="section-card" style={{ marginTop: 14 }}>
        {loading ? (
          <div style={{ padding: '19px 0', opacity: 0.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--color-surface-3)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 14, width: 120, borderRadius: 4, background: 'var(--color-surface-3)', marginBottom: 6 }} />
                <div style={{ height: 10, width: 80, borderRadius: 4, background: 'var(--color-surface-3)' }} />
              </div>
            </div>
            <div style={{ marginTop: 15 }}>
              <div style={{ height: 16, width: '70%', borderRadius: 4, background: 'var(--color-surface-3)', marginBottom: 8 }} />
              <div style={{ height: 12, width: '100%', borderRadius: 4, background: 'var(--color-surface-3)', marginBottom: 4 }} />
              <div style={{ height: 12, width: '85%', borderRadius: 4, background: 'var(--color-surface-3)' }} />
            </div>
          </div>
        ) : displayedPosts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Icon name="message-circle" className="icon-lg" /></div>
            <h3>{tr('Hakuna machapisho bado.', 'No posts yet.')}</h3>
            <p>{tr('Kuwa wa kwanza kushiriki!', 'Be the first to share!')}</p>
          </div>
        ) : (
          <div>
            {displayedPosts.map(p => {
              const isLiked = liked.has(p.id);
              const isSaved = saved.has(p.id);
              const transShowing = transLang[p.id];

              return (
                <article key={p.id} className="post">
                  <div className="post-head">
                    <div className={cn('avatar', p.ac === 'earth' ? 'earth' : p.ac === 'blue' ? 'blue' : 'green')}>{p.initials}</div>
                    <div className="author">
                      <strong>{p.author} {p.verified && <span className="verified">{'\u2713'}</span>}</strong>
                      <div className="meta">
                        <span>{p.username}</span>
                        <span>{'\u00B7'}</span>
                        <time>{p.time}</time>
                      </div>
                    </div>
                    <button className="icon-btn post-menu" style={{ width: 31, height: 31, fontSize: '.62rem' }}>
                      <Icon name="ellipsis" className="icon-sm" />
                    </button>
                  </div>

                  <div className="post-body">
                    {p.variant === 'baraza' && (
                      <>
                        <div className="post-type">
                          <Icon name="file-text" className="icon-sm" />
                          Baraza post
                        </div>
                        <h3>{p.title}</h3>
                        {p.body && <p>{p.body}</p>}
                        <div className="translation-box" onClick={() => toggleTrans(p.id)}>
                          {transShowing ? (
                            <><strong>Kiswahili:</strong> {p.body || p.title}</>
                          ) : (
                            <><strong>English:</strong> {p.body || p.title}</>
                          )}
                          <span style={{ float: 'right', fontSize: '.59rem', color: 'var(--color-text-3)', cursor: 'pointer' }}>
                            {transShowing ? 'Show English' : 'Tafsiri kwa Kiswahili'}
                          </span>
                        </div>
                        <div className="tags">
                          {p.tags.map(t => <span key={t} className="tag">{t}</span>)}
                        </div>
                      </>
                    )}

                    {p.variant === 'inquiry' && (
                      <>
                        <div className="post-type" style={{ color: 'var(--color-blue)', background: 'var(--color-blue-soft)' }}>
                          <Icon name="circle-help" className="icon-sm" />
                          Deep-dive inquiry
                        </div>
                        <div className="question-box">
                          <h4>{p.title}</h4>
                          {p.body && <p>{p.body}</p>}
                          {p.bounty && (
                            <div className="bounty">
                              <Icon name="badge-dollar-sign" className="icon-sm" />
                              {p.bounty}
                            </div>
                          )}
                        </div>
                        <div className="tags">
                          {p.tags.map(t => <span key={t} className="tag">{t}</span>)}
                        </div>
                      </>
                    )}

                    {p.variant === 'audio' && (
                      <>
                        <div className="post-type">
                          <Icon name="mic-2" className="icon-sm" />
                          Audio note
                        </div>
                        <h3>{p.title}</h3>
                        <div className="media">
                          <button className="play">
                            <Icon name="play" style={{ marginLeft: 2 }} />
                          </button>
                          <div className="media-copy">
                            <strong>{p.audioTitle}</strong>
                            <span>{p.audioDesc}</span>
                          </div>
                        </div>
                        <div className="tags">
                          {p.tags.map(t => <span key={t} className="tag">{t}</span>)}
                        </div>
                      </>
                    )}

                    {p.variant === 'poll' && (
                      <>
                        <div className="post-type">
                          <Icon name="bar-chart-3" className="icon-sm" />
                          Community poll
                        </div>
                        <h3>{p.title}</h3>
                        <div className="poll">
                          {p.pollOptions?.map((opt, idx) => {
                            const total = p.pollVotes?.reduce((a, b) => a + b, 0) || 1;
                            const pct = Math.round(((p.pollVotes?.[idx] || 0) / total) * 100);
                            const selected = pollSel[p.id] === idx;
                            return (
                              <button
                                key={idx}
                                onClick={() => selectPoll(p.id, idx)}
                                className={cn('poll-option', selected && 'selected')}
                              >
                                <span>{opt}</span>
                                <span className="poll-count">{pct}%</span>
                              </button>
                            );
                          })}
                        </div>
                        <div className="tags">
                          {p.tags.map(t => <span key={t} className="tag">{t}</span>)}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="post-actions">
                    <button
                      onClick={() => toggleLike(p.id)}
                      className={cn('action-btn', isLiked && 'liked')}
                    >
                      <Icon name="thumbs-up" className="icon-sm" />
                      <span>{isLiked ? p.likes + 1 : p.likes}</span>
                    </button>
                    <button className="action-btn">
                      <Icon name="message-circle" className="icon-sm" />
                      <span>{p.comments}</span>
                    </button>
                    <button className="action-btn">
                      <Icon name="share-2" className="icon-sm" />
                      <span>{p.shares}</span>
                    </button>
                    <button
                      onClick={() => toggleSave(p.id)}
                      className={cn('action-btn', isSaved && 'saved')}
                    >
                      <Icon name="bookmark" className="icon-sm" />
                    </button>
                    <button className="action-btn" style={{ fontSize: '.61rem', fontWeight: 800, color: 'var(--color-green)' }}>
                      Open thread
                    </button>
                  </div>

                  <div className="engagement">
                    <span>{isLiked ? p.likes + 1 : p.likes} likes</span>
                    <span style={{ margin: '0 5px' }}>{'\u00B7'}</span>
                    <span>{p.comments} comments</span>
                    <span style={{ margin: '0 5px' }}>{'\u00B7'}</span>
                    <span>{p.shares} shares</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <aside className="sidebar right-sidebar" style={{ display: 'grid', gap: 15, position: 'fixed', right: 24, top: 98, width: 270, zIndex: 5 }}>
        <section className="right-block">
          <div className="eyebrow">County pulse</div>
          <h3 className="serif">Worth your attention.</h3>
          <div className="trend-list">
            {TRENDS.map(t => (
              <div key={t.no} className="trend">
                <span className="trend-no">{'0' + t.no}</span>
                <div className="trend-copy">
                  <strong>{t.title}</strong>
                  <span>{t.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="right-block">
          <div className="eyebrow">Live now</div>
          <h3 className="serif">Happening right now.</h3>
          <div style={{ marginTop: 12 }}>
            <div className="live">
              <div className="live-icon">
                <Icon name="radio" className="icon-sm" />
              </div>
              <div className="live-copy">
                <strong>Nairobi townhall</strong>
                <span>342 listening</span>
              </div>
              <button>Join</button>
            </div>
          </div>
        </section>

        <section className="right-block">
          <div className="eyebrow">Your spaces</div>
          <h3 className="serif">Communities you follow.</h3>
          <div className="space-list">
            {(spaces?.length > 0 ? spaces : SPACES_DATA).slice(0, 4).map((s: any) => (
              <div key={s.id} className="space">
                <div className="space-icon">
                  <Icon name={s.icon || 'layers-3'} className="icon-sm" />
                </div>
                <div className="space-copy">
                  <strong>{s.name}</strong>
                  <span>{typeof s.members === 'number' ? `${s.members.toLocaleString()} members` : ''}</span>
                </div>
                <button
                  onClick={() => toggleFollow(s.id)}
                  className={cn('follow', following.has(s.id) && 'following')}
                >
                  {following.has(s.id) ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="right-block">
          <div className="tip-card">
            <div className="eyebrow" style={{ color: 'var(--color-earth)' }}>Good guidance is mutual</div>
            <h3 className="serif">Need a sharper answer?</h3>
            <p>Connect with verified experts across Kenya for one-on-one guidance. Students get special rates.</p>
            <button>Open Students Area</button>
          </div>
        </section>
      </aside>

      <nav className="mobile-nav">
        <button className="active">
          <Icon name="house" />
          <span>Home</span>
        </button>
        <button>
          <Icon name="compass" />
          <span>Explore</span>
        </button>
        <button className="create-main" onClick={() => setCreateOpen(true)}>
          <Icon name="plus" className="icon-lg" />
          <span>Create</span>
        </button>
        <button>
          <Icon name="graduation-cap" />
          <span>Learn</span>
        </button>
        <button>
          <Icon name="user-round" />
          <span>Profile</span>
        </button>
      </nav>

      {createOpen && (
        <div onClick={() => setCreateOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'transparent' }} />
      )}
      <div className={cn('create-panel', createOpen && 'open')}>
        <button className="icon-btn create-close" onClick={() => setCreateOpen(false)}>
          <Icon name="x" />
        </button>
        <div className="eyebrow">Create</div>
        <h3 className="serif">Share with your county.</h3>
        <p>Choose what kind of contribution you want to make.</p>
        <div className="create-options">
          <button className="create-option" onClick={() => selectCreateOption('post')}>
            <Icon name="pencil" />
            Post
          </button>
          <button className="create-option" onClick={() => selectCreateOption('question')}>
            <Icon name="circle-help" />
            Question
          </button>
          <button className="create-option" onClick={() => selectCreateOption('poll')}>
            <Icon name="bar-chart-3" />
            Poll
          </button>
          <button className="create-option" onClick={() => selectCreateOption('audio')} style={{ gridColumn: 'span 3' }}>
            <Icon name="mic-2" />
            Audio note
          </button>
        </div>
      </div>
    </>
  );
}
