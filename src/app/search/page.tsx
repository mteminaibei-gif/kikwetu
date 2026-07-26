'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import Icon from '@/components/Icon';
import { cn } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import DesktopSidebar from '@/components/DesktopSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';

interface SearchResult {
  id: string;
  title: string;
  desc: string;
  meta: string;
  category: string;
}

interface TrendingItem {
  no: string;
  title: string;
  desc: string;
}

interface LiveRoom {
  host: string;
  title: string;
  listeners: string;
}

interface QuizItem {
  title: string;
  desc: string;
  score: string;
}

interface SpaceItem {
  name: string;
  icon: string;
  members: string;
  category: string;
}

const chips = ['solar for small business', '#KilimoSmart', 'Nairobi bursaries', 'Swahili craft'];

const topics = [
  { label: 'Agriculture', sub: 'Farming, livestock, crops', icon: 'sprout' },
  { label: 'Tech & startups', sub: 'Innovation, digital skills', icon: 'cpu' },
  { label: 'Biashara', sub: 'Business, markets, trade', icon: 'store' },
  { label: 'Culture', sub: 'Music, art, traditions', icon: 'music-2' },
];

const trendingData: TrendingItem[] = [
  { no: '01', title: 'Mombasa county launches free Wi-Fi in 12 markets', desc: '2.4k readers · Digital inclusion' },
  { no: '02', title: 'Solar irrigation grants open for Kiambu farmers', desc: '1.8k readers · Agriculture' },
  { no: '03', title: 'Nairobi youth fund disburses KES 45M in Q1', desc: '3.2k readers · Youth & entrepreneurship' },
];

const mockResults: Record<string, SearchResult[]> = {
  all: [
    { id: 'r1', title: 'Best drought-resistant crops for Eastern Kenya?', desc: 'Looking for recommendations on crops that thrive in semi-arid conditions…', meta: 'Thread · Agriculture · 24 replies · 2h ago', category: 'thread' },
    { id: 'r2', title: 'Jane Mwende — Agricultural Extension Officer', desc: '15 years experience in dryland farming. Verified expert in Makueni county.', meta: 'Professional · Makueni · ★ 4.9', category: 'professional' },
    { id: 'r3', title: 'KilimoSmart Hub — Knowledge Space', desc: 'A community for smart farming techniques, irrigation tips, and market links.', meta: 'Space · 3.2k members · 148 threads', category: 'space' },
    { id: 'r4', title: 'Grace Akinyi — Urban farming specialist', desc: 'Vertical farming, hydroponics, and kitchen garden setups.', meta: 'Professional · Nairobi · ★ 4.8', category: 'professional' },
    { id: 'r5', title: 'Where to find certified seeds in Western Kenya?', desc: 'I need guidance on certified maize and bean seed suppliers…', meta: 'Thread · Agriculture · 12 replies · 5h ago', category: 'thread' },
  ],
  threads: [
    { id: 't1', title: 'Best drought-resistant crops for Eastern Kenya?', desc: 'Looking for recommendations on crops that thrive in semi-arid conditions…', meta: 'Agriculture · 24 replies · 2h ago', category: 'thread' },
    { id: 't2', title: 'Where to find certified seeds in Western Kenya?', desc: 'I need guidance on certified maize and bean seed suppliers…', meta: 'Agriculture · 12 replies · 5h ago', category: 'thread' },
    { id: 't3', title: 'M-Pesa transaction fees — are they too high for small businesses?', desc: 'Comparing M-Pesa, Airtel Money, and bank transfer costs for daily operations.', meta: 'Business · 31 replies · 1d ago', category: 'thread' },
  ],
  professionals: [
    { id: 'p1', title: 'Jane Mwende — Agricultural Extension Officer', desc: '15 years experience in dryland farming. Verified expert in Makueni county.', meta: 'Makueni · ★ 4.9', category: 'professional' },
    { id: 'p2', title: 'Grace Akinyi — Urban farming specialist', desc: 'Vertical farming, hydroponics, and kitchen garden setups.', meta: 'Nairobi · ★ 4.8', category: 'professional' },
    { id: 'p3', title: 'Dr. Kevin Ochieng — Agronomist', desc: 'Soil science and crop nutrition. PhD in Sustainable Agriculture.', meta: 'Kisumu · ★ 4.9', category: 'professional' },
  ],
  spaces: [
    { id: 's1', title: 'KilimoSmart Hub — Knowledge Space', desc: 'A community for smart farming techniques, irrigation tips, and market links.', meta: '3.2k members · 148 threads', category: 'space' },
    { id: 's2', title: 'Biashara Network — Business Space', desc: 'Connect with entrepreneurs, find investors, and share market insights.', meta: '2.1k members · 94 threads', category: 'space' },
    { id: 's3', title: 'Tech Bora — Innovation Space', desc: 'Kenyan tech community discussing software, hardware, and digital skills.', meta: '5.7k members · 312 threads', category: 'space' },
  ],
  people: [
    { id: 'u1', title: 'Peter Kamau', desc: 'Agricultural researcher · Makueni', meta: '@peterkamau', category: 'people' },
    { id: 'u2', title: 'Faith Njoki', desc: 'Urban farmer & content creator · Nairobi', meta: '@faithnjoki', category: 'people' },
    { id: 'u3', title: 'Samuel Omondi', desc: 'Agri-tech entrepreneur · Kisumu', meta: '@samomondi', category: 'people' },
  ],
};

const liveRoom: LiveRoom = {
  host: 'Mama Linda',
  title: 'Growing vegetables in sacks — live from Kibera',
  listeners: '312 listening',
};

const quiz: QuizItem = {
  title: 'KilimoSmart Quiz',
  desc: 'Test your knowledge on smart farming techniques',
  score: 'Best: 8/10',
};

const popularSpaces: SpaceItem[] = [
  { name: 'KilimoSmart Hub', icon: 'sprout', members: '3.2k', category: 'Agriculture' },
  { name: 'Biashara Network', icon: 'store', members: '2.1k', category: 'Business' },
  { name: 'Tech Bora', icon: 'cpu', members: '5.7k', category: 'Technology' },
];

type Tab = 'all' | 'threads' | 'professionals' | 'spaces' | 'people';

export default function SearchPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { show } = useToast();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [countyOpen, setCountyOpen] = useState(true);
  const [lang, setLang] = useState<'EN' | 'SW'>('EN');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const html = document.documentElement;
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored === 'dark' || (!stored && prefersDark);
    setTheme(isDark ? 'dark' : 'light');
    html.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('lang');
    if (stored === 'SW' || stored === 'EN') setLang(stored);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }, [theme]);

  const toggleLang = useCallback(() => {
    const next = lang === 'EN' ? 'SW' : 'EN';
    setLang(next);
    localStorage.setItem('lang', next);
    show(`Language switched to ${next}`);
  }, [lang, show]);

  const runSearch = useCallback((q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setHasSearched(true);
    const all = mockResults.all.filter(r =>
      r.title.toLowerCase().includes(q.toLowerCase()) ||
      r.desc.toLowerCase().includes(q.toLowerCase())
    );
    const filtered = tab === 'all' ? all : mockResults[tab].filter(r =>
      r.title.toLowerCase().includes(q.toLowerCase()) ||
      r.desc.toLowerCase().includes(q.toLowerCase())
    );
    setResults(filtered.length > 0 ? filtered : all.slice(0, 3));
  }, [tab]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    runSearch(query);
  }, [query, router, runSearch]);

  const handleChip = useCallback((chip: string) => {
    setQuery(chip);
    runSearch(chip);
  }, [runSearch]);

  const handleTopic = useCallback((topic: string) => {
    const q = topic.toLowerCase();
    setQuery(q);
    runSearch(q);
  }, [runSearch]);

  const handleTabChange = useCallback((t: Tab) => {
    setTab(t);
    if (hasSearched) {
      runSearch(query);
    }
  }, [hasSearched, query, runSearch]);

  const handleCountyToggle = useCallback(() => {
    setCountyOpen(prev => !prev);
  }, []);

  const handleJoin = useCallback(() => {
    show('Joined the live room!');
  }, [show]);

  const handleQuiz = useCallback(() => {
    show('Starting quiz...');
  }, [show]);

  const handleOpenTrend = useCallback((item: TrendingItem) => {
    show(`Opening: ${item.title}`);
  }, [show]);

  const handleOpenResult = useCallback((r: SearchResult) => {
    show(`Opening: ${r.title}`);
  }, [show]);

  const handleExpertCTA = useCallback(() => {
    show('Find an expert near you');
    router.push('/professionals');
  }, [show, router]);

  const displayResults = hasSearched && results.length > 0 ? results : [];
  const resultCount = displayResults.length;

  const allTabs: Tab[] = ['all', 'threads', 'professionals', 'spaces', 'people'];

  return (
    <div className="min-h-screen bg-brand-bgLight dark:bg-brand-bgDark">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6 pt-4 pb-24 md:pb-8">
        <DesktopSidebar />
        <main className="flex-1 min-w-0 max-w-3xl mx-auto w-full space-y-6">
          <div className="page-head">
            <div>
              <div className="eyebrow">Baraza / Explore</div>
              <h1 className="serif text-3xl font-black text-gray-900 dark:text-white leading-tight">
                Find your next useful conversation.
              </h1>
              <p className="muted">
                Search across discussions, professionals, spaces, people, live rooms, marketplace, quizzes
              </p>
            </div>
          </div>

          <section className="hero-search">
            <div className="eyebrow" style={{ color: 'oklch(85% .025 94)' }}>Search KikwetuConnect</div>
            <h2 className="serif">What are you curious about?</h2>
            <p>Discover knowledge shared by communities across Kenya.</p>
            <form className="search-form" onSubmit={handleSubmit}>
              <div className="search-field">
                <Icon name="search" className="icon-sm" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="e.g. solar, #KilimoSmart, Nairobi..."
                />
              </div>
              <button type="submit" className="search-submit" aria-label="Search">
                <Icon name="arrow-up-right" />
              </button>
            </form>
            <div className="chips">
              {chips.map(chip => (
                <button
                  key={chip}
                  type="button"
                  className={cn('chip', query === chip && 'selected')}
                  onClick={() => handleChip(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
          </section>

          <section className="section">
            <div className="section-head">
              <div>
                <div className="eyebrow">Browse by interest</div>
                <h2 className="serif">Find your community.</h2>
              </div>
            </div>
            <div className="topic-grid">
              {topics.map(topic => (
                <button
                  key={topic.label}
                  type="button"
                  className="topic"
                  onClick={() => handleTopic(topic.label)}
                >
                  <div>
                    <strong>{topic.label}</strong>
                    <span>{topic.sub}</span>
                  </div>
                  <div className="topic-icon">
                    <Icon name={topic.icon} className="icon-lg" />
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="section">
            <div className="section-head">
              <div>
                <div className="eyebrow">County pulse</div>
                <h2 className="serif">Worth your attention.</h2>
              </div>
              <button
                type="button"
                className="select-pill"
                onClick={handleCountyToggle}
              >
                {countyOpen ? 'Trending' : 'Hidden'}
              </button>
            </div>
            {countyOpen && (
              <div className="trend-list">
                {trendingData.map(item => (
                  <div key={item.no} className="trend">
                    <span className="trend-no">{item.no}</span>
                    <div className="trend-copy">
                      <strong>{item.title}</strong>
                      <span>{item.desc}</span>
                    </div>
                    <button
                      type="button"
                      className="result-action"
                      onClick={() => handleOpenTrend(item)}
                    >
                      Open
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="section">
            <div className="section-head">
              <div>
                <div className="eyebrow">Search results</div>
                <h2 className="serif">
                  {hasSearched ? `Results for "${query}"` : 'Discover something new.'}
                </h2>
              </div>
            </div>
            <div className="result-tabs">
              {allTabs.map(t => (
                <button
                  key={t}
                  type="button"
                  className={cn('result-tab', tab === t && 'active')}
                  onClick={() => handleTabChange(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            {hasSearched && resultCount > 0 && (
              <div className="result-count">{resultCount} result{resultCount !== 1 ? 's' : ''} found</div>
            )}
            {hasSearched && resultCount === 0 && (
              <div className="empty-state">
                <div className="empty-icon">
                  <Icon name="search-x" className="icon-lg" />
                </div>
                <p>No results found for &ldquo;{query}&rdquo;. Try a different search term.</p>
              </div>
            )}
            {!hasSearched && (
              <div className="empty-state">
                <div className="empty-icon">
                  <Icon name="compass" className="icon-lg" />
                </div>
                <p>Use the search bar above to explore discussions, professionals, spaces, and more.</p>
              </div>
            )}
            <div>
              {displayResults.map(r => (
                <div key={r.id} className="result">
                  <div className="result-copy">
                    <h3 className="serif">{r.title}</h3>
                    <p>{r.desc}</p>
                    <div className="result-meta">
                      <span>{r.meta}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="result-action"
                    onClick={() => handleOpenResult(r)}
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="live">
            <div className="live-icon">
              <Icon name="radio" />
            </div>
            <div className="live-copy">
              <strong>{liveRoom.title}</strong>
              <span>Hosted by {liveRoom.host} · {liveRoom.listeners}</span>
            </div>
            <button type="button" onClick={handleJoin}>Join room</button>
          </section>

          <section className="section">
            <div className="section-head">
              <div>
                <div className="eyebrow">Test yourself</div>
                <h2 className="serif">Weekly quiz.</h2>
              </div>
            </div>
            <div className="quiz">
              <div className="quiz-icon">
                <Icon name="graduation-cap" />
              </div>
              <div className="quiz-copy">
                <strong>{quiz.title}</strong>
                <span>{quiz.desc}</span>
              </div>
              <span className="score">{quiz.score}</span>
              <button type="button" className="result-action" onClick={handleQuiz}>
                Take quiz
              </button>
            </div>
          </section>
        </main>

        <aside className="hidden lg:block w-64 shrink-0 space-y-4">
          <div className="right-block">
            <div className="section-head">
              <div>
                <div className="eyebrow">Popular spaces</div>
                <h2 className="serif" style={{ fontSize: '1rem' }}>Join the conversation.</h2>
              </div>
            </div>
            <div className="right-list">
              {popularSpaces.map(s => (
                <div key={s.name} className="right-item">
                  <div className="space-icon">
                    <Icon name={s.icon} className="icon-sm" />
                  </div>
                  <div className="right-copy">
                    <strong>{s.name}</strong>
                    <span>{s.members} members · {s.category}</span>
                  </div>
                  <button
                    type="button"
                    className="result-action"
                    onClick={() => show(`Joining ${s.name}`)}
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="right-block">
            <div className="tip-card">
              <div className="eyebrow" style={{ color: 'var(--color-earth)' }}>Useful shortcut</div>
              <h3 className="serif">Talk to an expert.</h3>
              <p>Get personalised advice from verified professionals across Kenya.</p>
              <button type="button" onClick={handleExpertCTA}>
                Find an expert
              </button>
            </div>
          </div>

          <div className="right-block">
            <div className="section-head">
              <div>
                <div className="eyebrow">Appearance</div>
              </div>
            </div>
            <div className="mode">
              <button
                type="button"
                className={cn(theme === 'light' && 'active')}
                onClick={() => theme !== 'light' && toggleTheme()}
                aria-label="Light mode"
              >
                <Icon name="sun" className="icon-sm" />
              </button>
              <button
                type="button"
                className={cn(theme === 'dark' && 'active')}
                onClick={() => theme !== 'dark' && toggleTheme()}
                aria-label="Dark mode"
              >
                <Icon name="moon" className="icon-sm" />
              </button>
            </div>
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                className="select-pill"
                onClick={toggleLang}
              >
                {lang}
              </button>
            </div>
          </div>
        </aside>
      </div>
      <MobileBottomNav />
    </div>
  );
}
