'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import Icon from '@/components/Icon';
import { cn, getInitials, formatNumber } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

type ViewType = 'students' | 'professionals' | 'messages' | 'sessions' | 'wallet' | 'profile' | 'thread' | 'ask' | 'home' | 'baraza' | 'settings' | 'spaces' | 'mtaa' | 'nyumba' | 'radio' | 'quizzes';

interface MockQ {
  id: string; title: string; body: string; tags: string[];
  author: string; avatar?: string; time: string; upvotes: number; answers: number; resolved: boolean;
}

interface MockPro {
  id: string; name: string; title: string; avatar?: string; desc: string;
  expertise: string[]; rating: number; sessions: number; verified: boolean; following: boolean;
}

interface MockMsg {
  id: string; mine: boolean; text: string; time: string; read?: boolean; attachment?: { name: string; size: string };
}

const MOCK_QS: MockQ[] = [
  { id: 'q1', title: 'How do I solve quadratic equations using the formula method?', body: 'I am in Form 2 and struggling with the quadratic formula. Can someone explain step by step?', tags: ['Mathematics', 'Form 2'], author: 'James Kiprop', time: '2 hrs ago', upvotes: 12, answers: 3, resolved: true },
  { id: 'q2', title: 'What is the difference between aerobic and anaerobic respiration?', body: 'We covered this in Biology but I am confused about the energy yield differences.', tags: ['Biology', 'Form 1'], author: 'Mary Wanjiku', time: '5 hrs ago', upvotes: 8, answers: 2, resolved: false },
  { id: 'q3', title: 'Explain the theme of betrayal in "The River and the Source"', body: 'I need help analyzing how betrayal shapes the characters in the book.', tags: ['English', 'Form 3'], author: 'Brian Otieno', time: '1 day ago', upvotes: 15, answers: 5, resolved: true },
  { id: 'q4', title: 'Help with molar calculations in Chemistry', body: 'How do I calculate the number of moles from a given mass?', tags: ['Chemistry', 'Form 2'], author: 'Amina Hassan', time: '2 days ago', upvotes: 6, answers: 1, resolved: false },
  { id: 'q5', title: 'What causes land and sea breezes?', body: 'Geography question about local winds and their formation.', tags: ['Geography', 'Form 1'], author: 'Peter Kamau', time: '3 days ago', upvotes: 9, answers: 4, resolved: true },
  { id: 'q6', title: 'Kiswahili: Tofauti kati ya nomino na kivumishi', body: 'Nina changamoto kutofautisha nomino na kivumishi katika sentensi.', tags: ['Kiswahili', 'Form 1'], author: 'Grace Muthoni', time: '4 days ago', upvotes: 7, answers: 2, resolved: false },
];

const MOCK_PROS: MockPro[] = [
  { id: 'p1', name: 'Dr. Jane Mwangi', title: 'Mathematics Specialist', desc: 'Over 10 years teaching Mathematics and Physics at secondary level. KCSE examiner.', expertise: ['Mathematics', 'Physics'], rating: 4.9, sessions: 142, verified: true, following: false },
  { id: 'p2', name: 'Paul Ochieng', title: 'English & Literature', desc: 'Experienced English teacher specializing in literature analysis and composition writing.', expertise: ['English', 'Literature'], rating: 4.7, sessions: 98, verified: true, following: true },
  { id: 'p3', name: 'Sarah Chebet', title: 'Biology & Chemistry', desc: 'Passionate science educator with a focus on practical experiments and exam prep.', expertise: ['Biology', 'Chemistry'], rating: 4.8, sessions: 115, verified: true, following: false },
  { id: 'p4', name: 'David Kariuki', title: 'History & Geography', desc: 'Making humanities come alive with storytelling and map-based learning.', expertise: ['History', 'Geography'], rating: 4.6, sessions: 76, verified: true, following: false },
  { id: 'p5', name: 'Faith Nyambura', title: 'Kiswahili & CRE', desc: 'Native Kiswahili speaker with deep knowledge of East African literature.', expertise: ['Kiswahili', 'CRE'], rating: 4.9, sessions: 89, verified: true, following: false },
  { id: 'p6', name: 'Tom Odhiambo', title: 'Computer Studies', desc: 'Teaching programming basics, web design, and computer applications.', expertise: ['Computer Studies', 'ICT'], rating: 4.5, sessions: 53, verified: false, following: false },
];

const MOCK_MSGS: MockMsg[] = [
  { id: 'm1', mine: false, text: 'Hello! I saw your question about quadratic equations. I can help you with that.', time: '9:32 AM', read: true },
  { id: 'm2', mine: true, text: 'Thank you! I really struggle with the formula method.', time: '9:33 AM', read: true },
  { id: 'm3', mine: false, text: 'No problem. Let me share a step-by-step approach. First, always write down the coefficients a, b, and c from ax² + bx + c = 0', time: '9:34 AM', read: true },
  { id: 'm4', mine: false, text: 'Then substitute into the formula x = (-b ± √(b² - 4ac)) / 2a', time: '9:35 AM', read: true },
  { id: 'm5', mine: false, text: 'Here is a worked example I prepared for you.', time: '9:35 AM', read: true, attachment: { name: 'Quadratic_Formula_Guide.pdf', size: '2.4 MB' } },
  { id: 'm6', mine: true, text: 'This is so helpful! Can we go through one together?', time: '9:37 AM', read: false },
  { id: 'm7', mine: true, text: 'I think I understand the formula now but the square root part confuses me.', time: '9:39 AM', read: false },
];

const MOCK_SESSIONS = [
  { id: 's1', topic: 'Quadratic Equations Deep Dive', pro: 'Dr. Jane Mwangi', date: 'Tomorrow, 4:00 PM', status: 'upcoming', desc: 'Form 2 Mathematics - complete walkthrough' },
  { id: 's2', topic: 'Essay Writing Clinic', pro: 'Paul Ochieng', date: 'Fri, 10:00 AM', status: 'upcoming', desc: 'Improve your composition and summary writing' },
  { id: 's3', topic: 'Biology: Cell Division', pro: 'Sarah Chebet', date: '2 days ago', status: 'completed', desc: 'Mitosis and Meiosis comparison' },
  { id: 's4', topic: 'History: Mau Mau Rebellion', pro: 'David Kariuki', date: '5 days ago', status: 'completed', desc: 'Causes and effects of the uprising' },
];

const MOCK_THREAD = {
  id: 't1', title: 'How do I solve quadratic equations using the formula method?', body: 'I am in Form 2 and I am really struggling with the quadratic formula. I understand how to identify a, b, and c but when I substitute I get lost in the square root and the ± sign. Can someone please walk me through step by step?', author: 'James Kiprop', time: '2 hrs ago', upvotes: 12, answers: 3,
  replies: [
    { id: 'r1', author: 'Dr. Jane Mwangi', role: 'Mathematics Specialist', time: '1 hr ago', body: 'Great question. Start by writing the equation in standard form: ax² + bx + c = 0. Then identify a, b, c. The formula is x = (-b ± √(b² - 4ac)) / 2a. Compute the discriminant (b² - 4ac) first, then take the square root.', upvotes: 8, accepted: true },
    { id: 'r2', author: 'Paul Ochieng', role: 'English & Literature', time: '45 min ago', body: 'I am not a math specialist but I remember this trick: sing the formula to the tune of "Pop Goes the Weasel". It helps memorize it!', upvotes: 3, accepted: false },
    { id: 'r3', author: 'Faith Nyambura', role: 'Kiswahili & CRE', time: '30 min ago', body: 'Would you like me to offer a 1-on-1 session on this? I can walk you through 10 examples step by step until it clicks.', upvotes: 5, accepted: false, offering: true },
  ],
};

const TIP_AMOUNTS = [50, 100, 200, 500, 1000];

const NAV_ITEMS: { id: ViewType; label: string; icon: string }[] = [
  { id: 'students', label: 'Students', icon: 'graduation-cap' },
  { id: 'professionals', label: 'Professionals', icon: 'users-round' },
  { id: 'messages', label: 'Messages', icon: 'message-circle' },
  { id: 'sessions', label: 'Sessions', icon: 'calendar-days' },
  { id: 'wallet', label: 'Wallet', icon: 'wallet-cards' },
  { id: 'profile', label: 'Profile', icon: 'user-round' },
];

export default function StudentPlatform() {
  const { user } = useAuth();
  const { show: toastShow } = useToast();
  const { tr, contentLang, setContentLang } = useLanguage();

  const [view, setView] = useState<ViewType>('students');
  const [showCreate, setShowCreate] = useState(false);

  const [questions, setQuestions] = useState<MockQ[]>(MOCK_QS);
  const [newQ, setNewQ] = useState({ title: '', body: '', tags: '' });
  const [pros, setPros] = useState<MockPro[]>(MOCK_PROS);
  const [proFilter, setProFilter] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<MockMsg[]>(MOCK_MSGS);
  const [chatInput, setChatInput] = useState('');
  const [sessions] = useState(MOCK_SESSIONS);
  const [tipAmount, setTipAmount] = useState<number | null>(null);
  const [starRating, setStarRating] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const d = document.documentElement.getAttribute('data-theme');
      setTheme(d === 'dark' ? 'dark' : 'light');
    }
  }, []);
  const navigate = useCallback((v: ViewType) => {
    setView(v);
    setShowCreate(false);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  }, []);

  const toggleLang = useCallback(() => {
    setContentLang(contentLang === 'en' ? 'sw' : 'en');
  }, [contentLang, setContentLang]);

  const handlePublish = useCallback(() => {
    if (!newQ.title.trim()) return;
    const q: MockQ = {
      id: 'q' + Date.now(), title: newQ.title, body: newQ.body, tags: newQ.tags.split(',').map(t => t.trim()).filter(Boolean),
      author: user?.full_name || 'You', time: 'Just now', upvotes: 0, answers: 0, resolved: false,
    };
    setQuestions(prev => [q, ...prev]);
    setNewQ({ title: '', body: '', tags: '' });
    setShowCreate(false);
    toastShow('Question published!');
  }, [newQ, user, toastShow]);

  const handleFollow = useCallback((id: string) => {
    setPros(prev => prev.map(p => p.id === id ? { ...p, following: !p.following } : p));
  }, []);

  const handleSend = useCallback(() => {
    if (!chatInput.trim()) return;
    const msg: MockMsg = { id: 'm' + Date.now(), mine: true, text: chatInput, time: 'Just now', read: false };
    setMsgs(prev => [...prev, msg]);
    setChatInput('');
    setTimeout(() => {
      setMsgs(prev => [...prev, { id: 'm' + Date.now(), mine: false, text: 'Great point! Let me help you with that.', time: 'Just now', read: true }]);
    }, 1200);
  }, [chatInput]);

  const handleQuickReply = useCallback((text: string) => {
    setChatInput(text);
  }, []);

  const handleTipSelect = useCallback((amt: number) => {
    setTipAmount(amt);
  }, []);

  const handleStar = useCallback((n: number) => {
    setStarRating(n);
  }, []);

  const handleTipSend = useCallback(() => {
    if (!tipAmount || starRating === 0) return;
    toastShow('Tip of KES ' + tipAmount + ' sent via M-Pesa!');
    setTipAmount(null);
    setStarRating(0);
  }, [tipAmount, starRating, toastShow]);

  const handleAcceptOffer = useCallback(() => {
    toastShow('Session requested with Faith Nyambura');
  }, [toastShow]);

  const allExpertise = [...new Set(pros.flatMap(p => p.expertise))].sort();

  const renderPageHead = () => {
    const config: Record<string, { eyebrow: string; title: string; desc: string }> = {
      students: { eyebrow: tr('Your Learning Hub', 'Kituo Chako cha Kujifunza'), title: tr('Students Area', 'Eneo la Wanafunzi'), desc: tr('Ask questions, book sessions with verified professionals, and track your learning journey.', 'Uliza maswali, weka kikao na wataalamu walio thibitishwa, na fuatilia safari yako ya kujifunza.') },
      professionals: { eyebrow: tr('Verified Experts', 'Wataalamu Walio Thibitishwa'), title: tr('Approved Professionals', 'Wataalamu Waliokubaliwa'), desc: tr('Connect with Kenya\'s best teachers for 1-on-1 learning sessions.', 'Ungana na walimu bora wa Kenya kwa vipindi vya kujifunza ana kwa ana.') },
      messages: { eyebrow: tr('Private Chat', 'Mazungumzo ya Kibinafsi'), title: tr('Messages', 'Ujumbe'), desc: tr('Chat with your professional in real-time.', 'Zungumza na mtaalamu wako kwa wakati halisi.') },
      sessions: { eyebrow: tr('Your Schedule', 'Ratiba Yako'), title: tr('Learning Sessions', 'Vipindi vya Kujifunza'), desc: tr('Upcoming and past sessions with your professionals.', 'Vipindi vijavyo na vilivyopita na wataalamu wako.') },
      wallet: { eyebrow: tr('Tip & Rate', 'Toa Kitu Kidogo & Kadiria'), title: tr('Wallet', 'Pochi'), desc: tr('Show appreciation with a tip and rate your session.', 'Onyesha shukrani kwa kutoa kitu kidogo na kadiria kikao chako.') },
      profile: { eyebrow: tr('Your Profile', 'Wasifu Wako'), title: tr('Profile', 'Wasifu'), desc: tr('Manage your stats, badges, and learning activity.', 'Dhibiti takwimu zako, beji, na shughuli zako za kujifunza.') },
      thread: { eyebrow: tr('Question Thread', 'Mjadala wa Swali'), title: tr('Thread', 'Mjadala'), desc: tr('View answers and guidance offers.', 'Tazama majibu na ofa za mwongozo.') },
      ask: { eyebrow: tr('New Question', 'Swali Jipya'), title: tr('Ask a Question', 'Uliza Swali'), desc: tr('Get help from verified professionals.', 'Pata msaada kutoka kwa wataalamu walio thibitishwa.') },
    };
    const c = config[view];
    if (!c) {
      const names: Record<string, string> = { home: 'Home', baraza: 'Baraza', settings: 'Settings', spaces: 'Spaces', mtaa: 'Mtaa', nyumba: 'Nyumba Kumi', radio: 'Radio', quizzes: 'Quizzes' };
      return (
        <div className="page-head">
          <div>
            <span className="eyebrow">{tr('Navigate', 'Nenda')}</span>
            <h1 className="serif">{names[view] || view}</h1>
            <p className="muted">{tr('Explore and engage with the community.', 'Chunguza na shirikiana na jamii.')}</p>
          </div>
        </div>
      );
    }
    return (
      <div className="page-head">
        <div>
          <span className="eyebrow">{c.eyebrow}</span>
          <h1 className="serif">{c.title}</h1>
          <p className="muted">{c.desc}</p>
        </div>
        {view === 'students' && (
          <div className="flex gap-2 shrink-0">
            <button className="primary-btn" onClick={() => navigate('ask')}><Icon name="plus" /> {tr('Ask', 'Uliza')}</button>
            <button className="secondary-btn" onClick={() => navigate('professionals')}>{tr('Find Teacher', 'Tafuta Mwalimu')}</button>
          </div>
        )}
        {view === 'professionals' && (
          <button className="primary-btn" onClick={() => toastShow(tr('Application submitted!', 'Ombi limetumwa!'))}><Icon name="badge-check" /> {tr('Apply as Professional', 'Omba Kuwa Mtaalamu')}</button>
        )}
      </div>
    );
  };

  const renderStudents = () => (
    <>
      <div className="hero-banner">
        <div className="hero-content">
          <span className="eyebrow" style={{ color: 'oklch(88% .08 94)' }}>{tr('Your Learning Hub', 'Kituo Chako cha Kujifunza')}</span>
          <h1 className="serif">{tr('Welcome to the Students Area', 'Karibu Kwenye Eneo la Wanafunzi')}</h1>
          <p>{tr('Get personalized help from Kenya\'s best teachers. Ask questions, book sessions, earn badges, and track your progress — all in one place.', 'Pata msaada wa kibinafsi kutoka kwa walimu bora wa Kenya. Uliza maswali, weka kikao, pata beji, na fuatilia maendeleo yako — yote mahali pamoja.')}</p>
          <div className="hero-actions">
            <button className="gold" onClick={() => navigate('ask')}><Icon name="plus" /> {tr('Ask a Question', 'Uliza Swali')}</button>
            <button onClick={() => navigate('professionals')}><Icon name="users-round" /> {tr('Find a Teacher', 'Tafuta Mwalimu')}</button>
            <button onClick={() => navigate('sessions')}><Icon name="calendar-days" /> {tr('My Sessions', 'Vipindi Vyangu')}</button>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-head">
          <div>
            <span className="eyebrow">{tr('Progress', 'Maendeleo')}</span>
            <h2>{tr('Learning Stats', 'Takwimu za Kujifunza')}</h2>
          </div>
        </div>
        <div className="stats-grid">
          <div className="stat-box">
            <strong>{formatNumber(24)}</strong>
            <span>{tr('Sessions Completed', 'Vipindi Vilivyokamilishwa')}</span>
          </div>
          <div className="stat-box">
            <strong>{formatNumber(18)}</strong>
            <span>{tr('Questions Asked', 'Maswali Yaliyoulizwa')}</span>
          </div>
          <div className="stat-box">
            <strong>{formatNumber(7)}</strong>
            <span>{tr('Badges Earned', 'Beji Zilizopatikana')}</span>
          </div>
        </div>
        <div className="progress-block">
          <div className="progress-label">
            <span>{tr('Course Completion', 'Ukamilishaji wa Kozi')}</span>
            <span>68%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: '68%' }} />
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="section-card">
          <div className="section-head">
            <div>
              <span className="eyebrow">{tr('Next Up', 'Kijacho')}</span>
              <h2>{tr('Upcoming Session', 'Kikao Kijacho')}</h2>
            </div>
          </div>
          <div className="offer">
            <div className="quick-icon"><Icon name="graduation-cap" /></div>
            <div className="offer-copy">
              <strong>{tr('Quadratic Equations Deep Dive', 'Mchanganuo wa Milinganyo ya Quadratic')}</strong>
              <p>{tr('Tomorrow at 4:00 PM with Dr. Jane Mwangi', 'Kesho saa 10:00 jioni na Dr. Jane Mwangi')}</p>
              <span><Icon name="calendar-days" className="icon-sm" /> {tr('45 min session', 'Kikao cha dakika 45')}</span>
            </div>
            <button className="primary-btn" onClick={() => toastShow(tr('Joining session...', 'Unaingia kikaoni...'))}>{tr('Join', 'Ingia')}</button>
          </div>
        </div>

        <div className="section-card">
          <div className="section-head">
            <div>
              <span className="eyebrow">{tr('Quick Access', 'Ufikiaji wa Haraka')}</span>
              <h2>{tr('Shortcuts', 'Njia za Mkato')}</h2>
            </div>
          </div>
          <div className="quick-list">
            <div className="quick-item" onClick={() => navigate('messages')} style={{ cursor: 'pointer' }}>
              <div className="quick-icon"><Icon name="message-circle" /></div>
              <div className="quick-copy">
                <strong>{tr('Messages', 'Ujumbe')}</strong>
                <span>{tr('2 unread', '2 ambazo hazijasomwa')}</span>
              </div>
              <Icon name="arrow-up-right" className="arrow icon-sm" />
            </div>
            <div className="quick-item" onClick={() => navigate('wallet')} style={{ cursor: 'pointer' }}>
              <div className="quick-icon"><Icon name="wallet-cards" /></div>
              <div className="quick-copy">
                <strong>{tr('Tip & Rate', 'Toa Kitu Kidogo & Kadiria')}</strong>
                <span>{tr('Show appreciation', 'Onyesha shukrani')}</span>
              </div>
              <Icon name="arrow-up-right" className="arrow icon-sm" />
            </div>
            <div className="quick-item" onClick={() => navigate('sessions')} style={{ cursor: 'pointer' }}>
              <div className="quick-icon"><Icon name="calendar-days" /></div>
              <div className="quick-copy">
                <strong>{tr('Sessions', 'Vipindi')}</strong>
                <span>{tr('View schedule', 'Tazama ratiba')}</span>
              </div>
              <Icon name="arrow-up-right" className="arrow icon-sm" />
            </div>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-head">
          <div>
            <span className="eyebrow">{tr('Recent', 'Hivi Karibuni')}</span>
            <h2>{tr('Questions', 'Maswali')}</h2>
          </div>
          <button className="select-pill" onClick={() => navigate('ask')}><Icon name="plus" className="icon-sm" /> {tr('Ask', 'Uliza')}</button>
        </div>
        {questions.slice(0, 3).map(q => (
          <div key={q.id} className="question-card">
            <div className="question-top">
              <div className="avatar sm">{getInitials(q.author)}</div>
              <div className="question-top-copy">
                <strong>{q.author}</strong>
                <span>{q.time}</span>
              </div>
              {q.resolved && <span className="badge"><Icon name="check" className="icon-sm" /> {tr('Resolved', 'Imejibiwa')}</span>}
            </div>
            <h3>{q.title}</h3>
            <p>{q.body}</p>
            <div className="tags">
              {q.tags.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
            <div className="question-footer">
              <button><Icon name="thumbs-up" className="icon-sm" /> {formatNumber(q.upvotes)}</button>
              <button><Icon name="message-circle" className="icon-sm" /> {formatNumber(q.answers)}</button>
              <span className="spacer" />
              <button onClick={() => { navigate('thread'); }}>{tr('View', 'Angalia')}</button>
            </div>
          </div>
        ))}
      </div>

      <div className="section-card">
        <div className="section-head">
          <div>
            <span className="eyebrow">{tr('Verified Teachers', 'Walimu Walio Thibitishwa')}</span>
            <h2>{tr('Approved Professionals', 'Wataalamu Waliokubaliwa')}</h2>
          </div>
          <button className="select-pill" onClick={() => navigate('professionals')}>{tr('View All', 'Angalia Zote')}</button>
        </div>
        <div className="pro-list">
          {pros.slice(0, 3).map(p => (
            <div key={p.id} className="pro-card">
              <div className="avatar">{getInitials(p.name)}</div>
              <div className="pro-copy">
                <strong>{p.name} {p.verified && <Icon name="badge-check" className="icon-sm" style={{ color: 'var(--color-green)' }} />}</strong>
                <p>{p.title} &middot; {p.rating} <Icon name="star" className="icon-sm" /> &middot; {p.sessions} {tr('sessions', 'vipindi')}</p>
                <span>{p.desc}</span>
              </div>
              <div className="pro-actions">
                <button className={cn('follow-btn', p.following && 'following')} onClick={() => handleFollow(p.id)}>
                  {p.following ? tr('Following', 'Unafuata') : tr('Follow', 'Fuata')}
                </button>
                <button className="primary-btn" onClick={() => navigate('messages')}>{tr('Request', 'Omba')}</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section-card wide">
        <div className="section-head">
          <div>
            <span className="eyebrow">{tr('Guide', 'Mwongozo')}</span>
            <h2>{tr('How It Works', 'Jinsi Inavyofanya Kazi')}</h2>
          </div>
        </div>
        <div className="quick-list">
          <div className="quick-item">
            <div className="quick-icon"><Icon name="search" /></div>
            <div className="quick-copy">
              <strong>{tr('1. Find a Professional', '1. Tafuta Mtaalamu')}</strong>
              <span>{tr('Browse verified teachers by subject and level', 'Vinjali walimu walio thibitishwa kwa somo na kiwango')}</span>
            </div>
          </div>
          <div className="quick-item">
            <div className="quick-icon"><Icon name="calendar-check" /></div>
            <div className="quick-copy">
              <strong>{tr('2. Book a Session', '2. Weka Kikao')}</strong>
              <span>{tr('Schedule 1-on-1 learning at your convenience', 'Panga kikao cha kujifunza ana kwa ana kwa wakati unaofaa')}</span>
            </div>
          </div>
          <div className="quick-item">
            <div className="quick-icon"><Icon name="sparkles" /></div>
            <div className="quick-copy">
              <strong>{tr('3. Learn & Earn', '3. Jifunze na Pata')}</strong>
              <span>{tr('Complete sessions, earn badges and heshima points', 'Kamilisha vipindi, pata beji na pointi za heshima')}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderProfessionals = () => (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        <button className={cn('select-pill', !proFilter && 'primary-btn')} onClick={() => setProFilter(null)}>{tr('All', 'Zote')}</button>
        {allExpertise.map(e => (
          <button key={e} className={cn('select-pill', proFilter === e && 'primary-btn')} onClick={() => setProFilter(e)}>{e}</button>
        ))}
      </div>
      <div className="pro-list">
        {(proFilter ? pros.filter(p => p.expertise.includes(proFilter)) : pros).map(p => (
          <div key={p.id} className="pro-card">
            <div className="avatar">{getInitials(p.name)}</div>
            <div className="pro-copy">
              <strong>{p.name} {p.verified && <Icon name="badge-check" className="icon-sm" style={{ color: 'var(--color-green)' }} />}</strong>
              <p>{p.title}</p>
              <span>{p.desc}</span>
              <div className="tags" style={{ marginTop: 6 }}>
                {p.expertise.map(e => <span key={e} className="tag">{e}</span>)}
              </div>
            </div>
            <div className="pro-actions">
              <button className={cn('follow-btn', p.following && 'following')} onClick={() => handleFollow(p.id)}>
                {p.following ? tr('Following', 'Unafuata') : tr('Follow', 'Fuata')}
              </button>
              <button className="primary-btn" onClick={() => navigate('messages')}>{tr('Request Session', 'Omba Kikao')}</button>
            </div>
          </div>
        ))}
      </div>
      <div className="section-card wide" style={{ marginTop: 14 }}>
        <div className="section-head">
          <div>
            <span className="eyebrow">{tr('Join', 'Jiunge')}</span>
            <h2>{tr('Become a Professional', 'Kuwa Mtaalamu')}</h2>
            <p className="muted">{tr('Share your knowledge and earn from teaching.', 'Shiriki maarifa yako na upate mapato kutokana na kufundisha.')}</p>
          </div>
          <button className="primary-btn" onClick={() => toastShow(tr('Application submitted! Check your email.', 'Ombi limetumwa! Angalia barua pepe yako.'))}>
            <Icon name="badge-check" /> {tr('Apply Now', 'Omba Sasa')}
          </button>
        </div>
      </div>
    </>
  );

  const renderMessages = () => (
    <div className="chat-layout">
      <div className="chat-list">
        <div className="chat-head-list">
          <h2>{tr('Messages', 'Ujumbe')}</h2>
          <div className="chat-search-bar">
            <Icon name="search" className="icon-sm" />
            <input placeholder={tr('Search messages...', 'Tafuta ujumbe...')} />
          </div>
        </div>
        {[
          { name: 'Dr. Jane Mwangi', msg: 'Let me share a step-by-step approach...', time: '9:35 AM', active: true, unread: 0 },
          { name: 'Paul Ochieng', msg: 'Your essay draft looks great!', time: 'Yesterday', active: false, unread: 2 },
          { name: 'Sarah Chebet', msg: 'The cell diagram is attached.', time: '2 days ago', active: false, unread: 0 },
          { name: 'David Kariuki', msg: 'See you on Friday for the session.', time: '3 days ago', active: false, unread: 0 },
        ].map((c, i) => (
          <button key={i} className={cn('chat-thread-item', c.active && 'active')}>
            <div className="avatar sm">{getInitials(c.name)}</div>
            <div className="chat-thread-copy">
              <strong>{c.name}</strong>
              <span>{c.msg}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <time>{c.time}</time>
              {c.unread > 0 && <div className="notice-dot" style={{ position: 'static', marginTop: 4 }} />}
            </div>
          </button>
        ))}
      </div>
      <div className="chat-main">
        <div className="chat-top">
          <div className="avatar sm">{getInitials('Dr. Jane Mwangi')}</div>
          <div className="chat-top-copy">
            <strong>Dr. Jane Mwangi</strong>
            <span><span className="live-dot" /> {tr('Online', 'Mtandaoni')}</span>
          </div>
        </div>
        <div className="chat-body">
          {msgs.map(m => (
            <div key={m.id} className={cn('message', m.mine ? 'mine' : 'theirs')}>
              <p>{m.text}</p>
              {m.attachment && (
                <div className="attachment">
                  <div className="attachment-icon"><Icon name="file-text" /></div>
                  <div className="attachment-copy">
                    <strong>{m.attachment.name}</strong>
                    <span>{m.attachment.size}</span>
                  </div>
                </div>
              )}
              <div className="message-time">
                <time>{m.time}</time>
                {m.mine && <span className={cn('read', !m.read && 'muted')}><Icon name="check" className="icon-sm" /></span>}
              </div>
            </div>
          ))}
        </div>
        <div className="quick-reply">
          {['Show me an example', 'I understand now', 'Can we practice more?'].map((s, i) => (
            <button key={i} className="suggestion" onClick={() => handleQuickReply(s)}>{s}</button>
          ))}
        </div>
        <div className="chat-form">
          <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={tr('Type a message...', 'Andika ujumbe...')} />
          <button className="send-btn" onClick={handleSend}><Icon name="send" /></button>
        </div>
      </div>
      <div className="context">
        <div className="context-block">
          <div className="context-head">
            <h3 className="serif">{tr('Session', 'Kikao')}</h3>
            <span className="status ready">{tr('Active', 'Inayoendelea')}</span>
          </div>
          <p>{tr('Quadratic Equations Deep Dive', 'Mchanganuo wa Milinganyo ya Quadratic')}</p>
          <div className="goal" style={{ marginTop: 12 }}>
            <strong>{tr('Progress', 'Maendeleo')}</strong>
            <span>{tr('3 of 5 topics completed', 'Mada 3 kati ya 5 zimekamilishwa')}</span>
            <div className="goal-progress">
              <div className="goal-value" style={{ width: '60%' }} />
            </div>
          </div>
          <div className="checklist" style={{ marginTop: 12 }}>
            <div className="check"><div className="check-icon"><Icon name="check" /></div> {tr('Identify a, b, c', 'Tambua a, b, c')}</div>
            <div className="check"><div className="check-icon"><Icon name="check" /></div> {tr('Compute discriminant', 'Kokotoa kibainishi')}</div>
            <div className="check pending"><div className="check-icon" /> {tr('Apply the formula', 'Tumia fomula')}</div>
            <div className="check pending"><div className="check-icon" /> {tr('Check solutions', 'Angalia majibu')}</div>
            <div className="check pending"><div className="check-icon" /> {tr('Practice problems', 'Fanya mazoezi')}</div>
          </div>
        </div>
        <div className="context-block">
          <div className="note">
            <strong><Icon name="circle-help" className="icon-sm" /> {tr('Tip', 'Kidokezo')}</strong>
            <p>{tr('Write down each step as you go. This helps avoid errors with signs.', 'Andika kila hatua unapoendelea. Hii husaidia kuepuka makosa ya alama.')}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSessions = () => (
    <>
      <div className="section-card">
        <div className="section-head">
          <div>
            <span className="eyebrow">{tr('Coming Up', 'Zinazokuja')}</span>
            <h2>{tr('Upcoming Sessions', 'Vipindi Vijavyo')}</h2>
          </div>
        </div>
        {sessions.filter(s => s.status === 'upcoming').map(s => (
          <div key={s.id} className="offer">
            <div className="quick-icon"><Icon name="calendar-days" /></div>
            <div className="offer-copy">
              <strong>{s.topic}</strong>
              <p>{s.desc}</p>
              <span><Icon name="user-round" className="icon-sm" /> {s.pro} &middot; {s.date}</span>
            </div>
            <div className="pro-actions">
              <span className="status ready">{tr('Upcoming', 'Linakuja')}</span>
              <button className="primary-btn" onClick={() => toastShow(tr('Joining session...', 'Unaingia kikaoni...'))}>{tr('Join', 'Ingia')}</button>
            </div>
          </div>
        ))}
        {sessions.filter(s => s.status === 'upcoming').length === 0 && (
          <div className="empty-state">
            <div className="empty-icon"><Icon name="calendar-check" /></div>
            <h3>{tr('No upcoming sessions', 'Hakuna vipindi vijavyo')}</h3>
            <p>{tr('Book a session with a professional to get started.', 'Weka kikao na mtaalamu ili kuanza.')}</p>
          </div>
        )}
      </div>
      <div className="section-card">
        <div className="section-head">
          <div>
            <span className="eyebrow">{tr('History', 'Historia')}</span>
            <h2>{tr('Completed Sessions', 'Vipindi Vilivyokamilishwa')}</h2>
          </div>
        </div>
        {sessions.filter(s => s.status === 'completed').map(s => (
          <div key={s.id} className="offer">
            <div className="quick-icon"><Icon name="badge-check" /></div>
            <div className="offer-copy">
              <strong>{s.topic}</strong>
              <p>{s.desc}</p>
              <span>{s.pro} &middot; {s.date}</span>
            </div>
            <div className="pro-actions">
              <span className="status ready">{tr('Completed', 'Imekamilishwa')}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const renderWallet = () => (
    <div className="grid-2">
      <div className="section-card">
        <div className="section-head">
          <div>
            <span className="eyebrow">{tr('Tip', 'Kitu Kidogo')}</span>
            <h2>{tr('Send a Tip', 'Tuma Kitu Kidogo')}</h2>
            <p className="muted">{tr('Show appreciation for a great session.', 'Onyesha shukrani kwa kikao kizuri.')}</p>
          </div>
        </div>
        <div className="tip-choices">
          {TIP_AMOUNTS.map(amt => (
            <button key={amt} className={cn('tip-choice', tipAmount === amt && 'selected')} onClick={() => handleTipSelect(amt)}>
              KES {amt}
            </button>
          ))}
        </div>
        <div className="stars">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} className={cn('star', starRating >= n && 'on')} onClick={() => handleStar(n)}>★</button>
          ))}
        </div>
        <div className="money-box" style={{ marginTop: 16 }}>
          <div className="money-row">
            <span>{tr('Tip Amount', 'Kiasi cha Kitu Kidogo')}</span>
            <strong>KES {tipAmount || 0}</strong>
          </div>
          <div className="money-row fee">
            <span>{tr('Platform Fee (10%)', 'Ada ya Jukwaa (10%)')}</span>
            <strong>KES {Math.round((tipAmount || 0) * 0.1)}</strong>
          </div>
          <div className="money-row total">
            <span>{tr('Total Charged', 'Jumla ya KutoZwa')}</span>
            <strong>KES {(tipAmount || 0) + Math.round((tipAmount || 0) * 0.1)}</strong>
          </div>
        </div>
        <div className="mpesa-box">
          <div className="mpesa-mark">M</div>
          <span>{tr('Paid via M-Pesa', 'Imelipwa kupitia M-Pesa')}</span>
          <span className="status ready" style={{ marginLeft: 'auto' }}>{tr('Secured', 'Salama')}</span>
        </div>
        <button className="primary-btn" style={{ marginTop: 14, width: '100%' }} onClick={handleTipSend} disabled={!tipAmount || starRating === 0}>
          <Icon name="send" /> {tr('Send Tip', 'Tuma Kitu Kidogo')}
        </button>
      </div>
      <div className="section-card">
        <div className="section-head">
          <div>
            <span className="eyebrow">{tr('Balance', 'Salio')}</span>
            <h2>{tr('Your Wallet', 'Pochi Yako')}</h2>
          </div>
        </div>
        <div className="wallet-hero-card">
          <small>{tr('Available Balance', 'Salio Linalopatikana')}</small>
          <strong>KES 0.00</strong>
          <div className="wallet-actions-row">
            <button onClick={() => toastShow(tr('Deposit via M-Pesa', 'Weka kupitia M-Pesa'))}>{tr('Deposit', 'Weka')}</button>
            <button onClick={() => toastShow(tr('Withdraw to M-Pesa', 'Toa kwa M-Pesa'))}>{tr('Withdraw', 'Toa')}</button>
          </div>
        </div>
        <div className="wallet-grid-2" style={{ marginTop: 14 }}>
          <div className="wallet-stat-box">
            <strong>KES 0</strong>
            <span>{tr('Tips Sent', 'Vitu Vidogo Vilivyotumwa')}</span>
          </div>
          <div className="wallet-stat-box">
            <strong>KES 0</strong>
            <span>{tr('Tips Received', 'Vitu Vidogo Vilivyopokelewa')}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="profile-hero">
      <div className="cover-photo">
        <span className="cover-label">{tr('Student Profile', 'Wasifu wa Mwanafunzi')}</span>
      </div>
      <div className="hero-body">
        <div className="hero-avatar">
          <div className="avatar lg">{getInitials(user?.full_name || 'Student')}</div>
        </div>
        <div className="hero-top-actions">
          <button className="hero-btn" onClick={() => toastShow(tr('Edit profile', 'Hariri wasifu'))}><Icon name="pencil" /> {tr('Edit', 'Hariri')}</button>
        </div>
        <h1 className="profile-name-text serif">{user?.full_name || 'Student User'}</h1>
        <p className="handle-text">@{user?.username || 'student'} &middot; {user?.county || 'Nairobi'}</p>
        <p className="bio-text">{user?.bio || tr('Passionate learner exploring new frontiers in education.', 'Mwanafunzi mwenye shauku ya kuchunguza mipaka mipya katika elimu.')}</p>
        <div className="profile-meta">
          <span><Icon name="map-pin" className="icon-sm" /> {user?.county || 'Nairobi'}</span>
          <span><Icon name="calendar-days" className="icon-sm" /> {tr('Joined 2025', 'Alijiunga 2025')}</span>
          <span><Icon name="badge-dollar-sign" className="icon-sm" /> {tr('Heshima', 'Heshima')}: {formatNumber(user?.heshima_score || 420)}</span>
        </div>
        <div className="profile-stats-grid">
          <div className="profile-stat-box"><strong>{formatNumber(24)}</strong><span>{tr('Sessions', 'Vipindi')}</span></div>
          <div className="profile-stat-box"><strong>{formatNumber(18)}</strong><span>{tr('Questions', 'Maswali')}</span></div>
          <div className="profile-stat-box"><strong>{formatNumber(42)}</strong><span>{tr('Answers', 'Majibu')}</span></div>
          <div className="profile-stat-box"><strong>{formatNumber(7)}</strong><span>{tr('Badges', 'Beji')}</span></div>
        </div>
        <div className="badge-row" style={{ marginTop: 18 }}>
          <div className="badge-item"><div className="badge-icon"><Icon name="star" /></div><span>{tr('Quick Learner', 'Mwanafunzi Mwepesi')}</span></div>
          <div className="badge-item"><div className="badge-icon"><Icon name="message-circle" /></div><span>{tr('Top Question', 'Swali Bora')}</span></div>
          <div className="badge-item"><div className="badge-icon"><Icon name="calendar-check" /></div><span>{tr('5 Sessions', 'Vipindi 5')}</span></div>
          <div className="badge-item"><div className="badge-icon"><Icon name="thumbs-up" /></div><span>{tr('Helpful', 'Msaada')}</span></div>
        </div>
      </div>
    </div>
  );

  const renderThread = () => (
    <div>
      <button className="back-btn" onClick={() => navigate('students')}><Icon name="arrow-left" /> {tr('Back', 'Nyuma')}</button>
      <div className="thread-head">
        <h1 className="serif">{MOCK_THREAD.title}</h1>
        <p>{MOCK_THREAD.body}</p>
        <div className="thread-meta">
          <div className="avatar sm">{getInitials(MOCK_THREAD.author)}</div>
          <div className="thread-copy">
            <strong>{MOCK_THREAD.author}</strong>
            <span>{MOCK_THREAD.time} &middot; <Icon name="thumbs-up" className="icon-sm" /> {MOCK_THREAD.upvotes} &middot; <Icon name="message-circle" className="icon-sm" /> {MOCK_THREAD.answers}</span>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <span className="eyebrow">{tr('Answers', 'Majibu')}</span>
        <h2 className="serif" style={{ fontSize: '1.3rem', marginTop: 4 }}>{tr('Guidance & Offers', 'Mwongozo na Ofa')}</h2>
      </div>
      {MOCK_THREAD.replies.map(r => (
        <div key={r.id} className="answer">
          <div className="answer-head">
            <div className="avatar sm">{getInitials(r.author)}</div>
            <div className="answer-copy">
              <strong>{r.author} {r.accepted && <span className="badge" style={{ marginLeft: 6 }}><Icon name="check" className="icon-sm" /> {tr('Accepted', 'ImeKubaliwa')}</span>}</strong>
              <span>{r.role} &middot; {r.time}</span>
            </div>
          </div>
          <p>{r.body}</p>
          <div className="answer-foot">
            <button onClick={() => toastShow(tr('Upvoted!', 'Umepiga kura!'))}><Icon name="thumbs-up" className="icon-sm" /> {r.upvotes}</button>
            {r.accepted && <button className="active"><Icon name="badge-check" className="icon-sm" /> {tr('Accepted', 'ImeKubaliwa')}</button>}
            {'offering' in r && r.offering && (
              <button className="primary-btn" style={{ marginLeft: 'auto' }} onClick={handleAcceptOffer}>
                <Icon name="calendar-check" /> {tr('Accept Offer', 'Kubali Ofa')}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderAsk = () => (
    <div className="section-card">
      <div className="section-head">
        <div>
          <span className="eyebrow">{tr('New', 'Mpya')}</span>
          <h2>{tr('Ask a Question', 'Uliza Swali')}</h2>
        </div>
      </div>
      <div className="form-field" style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-3)' }}>{tr('Question Title', 'Kichwa Cha Swali')}</label>
        <input value={newQ.title} onChange={e => setNewQ(p => ({ ...p, title: e.target.value }))} placeholder={tr('e.g. How do I solve quadratic equations?', 'mf. Ninawezaje kutatua milinganyo ya quadratic?')} style={{ width: '100%', padding: '10px 11px', border: '1px solid var(--color-line)', borderRadius: 11, background: 'var(--color-bg)', color: 'var(--color-text)', outline: 0 }} />
      </div>
      <div className="form-field" style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-3)' }}>{tr('Details', 'Maelezo')}</label>
        <textarea value={newQ.body} onChange={e => setNewQ(p => ({ ...p, body: e.target.value }))} rows={5} placeholder={tr('Explain your question in detail...', 'Eleza swali lako kwa kina...')} style={{ width: '100%', padding: '10px 11px', border: '1px solid var(--color-line)', borderRadius: 11, background: 'var(--color-bg)', color: 'var(--color-text)', outline: 0, resize: 'vertical' }} />
      </div>
      <div className="form-field" style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-3)' }}>{tr('Tags', 'Vitambulisho')}</label>
        <input value={newQ.tags} onChange={e => setNewQ(p => ({ ...p, tags: e.target.value }))} placeholder={tr('e.g. Mathematics, Form 2', 'mf. Hisabati, Kidato cha 2')} style={{ width: '100%', padding: '10px 11px', border: '1px solid var(--color-line)', borderRadius: 11, background: 'var(--color-bg)', color: 'var(--color-text)', outline: 0 }} />
        <span className="muted" style={{ fontSize: '0.62rem', marginTop: 4, display: 'block' }}>{tr('Separate tags with commas', 'Tenganisha vitambulisho na koma')}</span>
      </div>
      <div className="choice-row">
        {['Mathematics', 'English', 'Kiswahili', 'Science', 'History', 'Other'].map(s => (
          <button key={s} className={cn('choice')} onClick={() => setNewQ(p => ({ ...p, tags: p.tags ? p.tags + ', ' + s : s }))}>{s}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <button className="secondary-btn" onClick={() => navigate('students')} style={{ flex: 1 }}>{tr('Cancel', 'Ghairi')}</button>
        <button className="primary-btn" onClick={handlePublish} style={{ flex: 1 }} disabled={!newQ.title.trim()}>
          <Icon name="send" /> {tr('Publish Question', 'Chapisha Swali')}
        </button>
      </div>
    </div>
  );

  const renderPlaceholder = () => (
    <div className="empty-state">
      <div className="empty-icon"><Icon name="compass" /></div>
      <h3>{tr('Coming Soon', 'Inakuja Hivi Karibuni')}</h3>
      <p>{tr('This section is under development. Check back soon!', 'Sehemu hii inaendelezwa. Angalia tena hivi karibuni!')}</p>
    </div>
  );

  const renderContent = () => {
    switch (view) {
      case 'students': return renderStudents();
      case 'professionals': return renderProfessionals();
      case 'messages': return renderMessages();
      case 'sessions': return renderSessions();
      case 'wallet': return renderWallet();
      case 'profile': return renderProfile();
      case 'thread': return renderThread();
      case 'ask': return renderAsk();
      default: return renderPlaceholder();
    }
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} data-view={item.id}
            className={cn('select-pill', view === item.id && 'primary-btn')}
            onClick={() => navigate(item.id)}>
            <Icon name={item.icon} className="icon-sm" /> {item.label}
          </button>
        ))}
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          <button className="icon-btn" onClick={toggleTheme} title={tr('Toggle theme', 'Badilisha mandhari')}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          <button className={cn('select-pill')} onClick={toggleLang} style={{ minHeight: 36 }}>
            {contentLang === 'en' ? 'EN' : 'SW'}
          </button>
          <button className="icon-btn" onClick={() => setShowCreate(true)} title={tr('Create', 'Unda')}>
            <Icon name="plus" />
          </button>
        </div>
      </div>

      {renderPageHead()}
      {renderContent()}

      <div className={cn('create-panel', showCreate && 'open')}>
        <button className="create-close icon-btn" onClick={() => setShowCreate(false)}><Icon name="x" /></button>
        <h3 className="serif">{tr('Create', 'Unda')}</h3>
        <p className="muted">{tr('Choose what to share or ask.', 'Chagua unachotaka kushiriki au kuuliza.')}</p>
        <div className="create-options">
          <button className="create-option" onClick={() => { navigate('ask'); }}>
            <Icon name="message-circle-question" />
            <span>{tr('Ask Question', 'Uliza Swali')}</span>
          </button>
          <button className="create-option" onClick={() => toastShow(tr('Post composer opened', 'Kichungi cha kuchapisha kimefunguliwa'))}>
            <Icon name="pen-line" />
            <span>{tr('Share Post', 'Shiriki Chapisho')}</span>
          </button>
          <button className="create-option" onClick={() => navigate('sessions')}>
            <Icon name="calendar-check" />
            <span>{tr('Offer Session', 'Toa Kikao')}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
