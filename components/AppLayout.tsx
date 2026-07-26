'use client';

import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  House, Compass, Search, Layers3, GraduationCap, BadgeCheck,
  MessagesSquare, WalletCards, Store, ShieldCheck, Radio, Brain,
  UserRound, Bookmark, Settings, LogOut, Bell, Moon, Sun, Plus,
  MapPin, TrendingUp, MoreHorizontal, Volume2, ChevronRight, X
} from 'lucide-react';

// ===== Types =====
interface Profile {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  county: string | null;
  language: string;
  role: string;
  heshima: number;
  is_verified: boolean;
  is_online: boolean;
  created_at: string;
  updated_at: string;
}

// ===== Context =====
interface AppContextType {
  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  // Language
  lang: 'EN' | 'SW';
  toggleLang: () => void;
  // Create Panel
  createOpen: boolean;
  setCreateOpen: (v: boolean) => void;
  // Toast
  toast: string;
  showToast: (msg: string) => void;
  // Auth
  user: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  // Notifications
  unreadCount: number;
}

export const AppContext = createContext<AppContextType>({
  theme: 'light',
  toggleTheme: () => {},
  lang: 'EN',
  toggleLang: () => {},
  createOpen: false,
  setCreateOpen: () => {},
  toast: '',
  showToast: () => {},
  user: null,
  loading: true,
  signOut: async () => {},
  unreadCount: 0,
});

export const useApp = () => useContext(AppContext);

// ===== Layout Props =====
interface AppLayoutProps {
  children: React.ReactNode;
  showRightSidebar?: boolean;
}

// ===== Navigation Config =====
const navSections = [
  {
    title: 'Main',
    items: [
      { icon: House, label: 'Home', href: '/' },
      { icon: Compass, label: 'Baraza feed', href: '/baraza', badge: 'New' },
      { icon: Search, label: 'Explore', href: '/explore' },
      { icon: Layers3, label: 'Spaces', href: '/spaces' },
    ],
  },
  {
    title: 'Learn & earn',
    items: [
      { icon: GraduationCap, label: 'Students Area', href: '/students', badge: '2' },
      { icon: BadgeCheck, label: 'Professionals', href: '/professionals' },
      { icon: MessagesSquare, label: 'Messages', href: '/messages', badge: '3' },
      { icon: WalletCards, label: 'Wallet & tips', href: '/wallet' },
    ],
  },
  {
    title: 'Local life',
    items: [
      { icon: Store, label: 'Mtaa Exchange', href: '/mtaa' },
      { icon: ShieldCheck, label: 'Nyumba Kumi', href: '/nyumba-kumi' },
      { icon: Radio, label: 'Live Radio', href: '/radio' },
      { icon: Brain, label: 'Quizzes', href: '/quizzes' },
    ],
  },
  {
    title: 'Your account',
    items: [
      { icon: UserRound, label: 'Profile', href: '/profile' },
      { icon: Bookmark, label: 'Saved', href: '/saved' },
      { icon: Settings, label: 'Settings', href: '/settings' },
    ],
  },
];

// ===== Topbar =====
function Topbar() {
  const { theme, toggleTheme, lang, toggleLang, user, unreadCount } = useApp();
  const [searchFocused, setSearchFocused] = useState(false);

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'GP';

  return (
    <header className="topbar">
      <Link href="/" className="wordmark">
        <span className="mark">k</span>
        <strong>kikwetu<span>.</span></strong>
      </Link>

      <label className={`search ${searchFocused ? 'focused' : ''}`}>
        <Search className="icon-sm" />
        <input
          placeholder="Search people, counties, topics"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </label>

      <div className="top-actions">
        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle dark mode">
          {theme === 'dark' ? <Sun className="icon" /> : <Moon className="icon" />}
        </button>
        <button className="icon-btn" onClick={toggleLang} aria-label="Change language">
          <span className="eyebrow" style={{ letterSpacing: '.05em' }}>{lang}</span>
        </button>
        <button className="icon-btn" aria-label="Notifications">
          <Bell className="icon" />
          {unreadCount > 0 && <span className="dot" />}
        </button>
        <Link href="/profile" className="profile-pill">
          <span>{user?.full_name || 'Grid Pulse'}</span>
          <span className="avatar sm">{initials}</span>
        </Link>
      </div>
    </header>
  );
}

// ===== Left Sidebar =====
function LeftSidebar({ activeRoute }: { activeRoute: string }) {
  const { user } = useApp();
  const heshima = user?.heshima || 740;
  const level = Math.floor(heshima / 100);

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'GP';

  return (
    <aside className="sidebar left-sidebar">
      {navSections.map((section) => (
        <div key={section.title} className="nav-section">
          <div className="nav-title">{section.title}</div>
          {section.items.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="icon" />
                <span>{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </Link>
            );
          })}
        </div>
      ))}

      <div className="heshima">
        <div className="ring">{heshima}</div>
        <div>
          <strong>Heshima Rating</strong>
          <span>Level {level} &middot; {100 - (heshima % 100)} to next</span>
        </div>
      </div>

      <Link href="/profile" className="profile-pill" style={{ marginTop: 16 }}>
        <span className="avatar">{initials}</span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <strong style={{ display: 'block', fontSize: '.82rem' }}>{user?.full_name || 'Grid Pulse'}</strong>
          <span style={{ display: 'block', color: 'var(--text3)', fontSize: '.68rem' }}>@{user?.username || 'gridpulse'}</span>
        </div>
        <Settings className="icon-sm" style={{ color: 'var(--text3)' }} />
      </Link>
    </aside>
  );
}

// ===== Right Sidebar =====
function RightSidebar() {
  const { showToast } = useApp();

  return (
    <aside className="right-sidebar">
      <div className="right-block">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <TrendingUp className="icon" style={{ color: 'var(--gold)' }} />
          <h3>Trending in Kenya</h3>
        </div>
        <div className="right-list">
          {['#KilimoSmart', '#NairobiTech', '#ShengLife', '#HealthKE', '#StartupKE'].map((tag, i) => (
            <div key={i} className="right-item" style={{ cursor: 'pointer' }} onClick={() => showToast(`Viewing ${tag}`)}>
              <div className="right-copy">
                <strong style={{ color: 'var(--green)' }}>{tag}</strong>
                <span>{(12.4 - i * 1.5).toFixed(1)}k posts</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="right-block">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--red)', animation: 'pulse 1.5s infinite' }} />
          <h3>Live Audio Baraza</h3>
          <button className="icon-btn" style={{ marginLeft: 'auto', width: 28, height: 28 }}>
            <MoreHorizontal className="icon-sm" />
          </button>
        </div>
        <div className="tip">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Volume2 className="icon-sm" style={{ color: 'var(--earth)' }} />
            <span style={{ fontSize: '.68rem', color: 'var(--text3)' }}>Mie Audio</span>
          </div>
          <p>Tech-tomasa live video to livestream conversations</p>
          <button style={{ marginTop: 8 }} onClick={() => showToast('Joining live audio')}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
            {' '}Live Audio
          </button>
        </div>
      </div>

      <div className="right-block">
        <h3>Suggested Spaces</h3>
        <div className="right-list">
          {[
            { name: 'KilimoSmart', desc: 'Farming tips & climate smart agriculture', icon: '🌾', members: '2.8k' },
            { name: 'NairobiTech', desc: 'Tech community in Nairobi', icon: '💻', members: '1.5k' },
          ].map((space, i) => (
            <div key={i} className="right-item">
              <div className="avatar" style={{ background: i === 0 ? 'var(--greenSoft)' : 'var(--blueSoft)', color: i === 0 ? 'var(--green)' : 'var(--blue)', fontSize: '1rem' }}>
                {space.icon}
              </div>
              <div className="right-copy">
                <strong>{space.name}</strong>
                <span>{space.members} members</span>
              </div>
              <button className="follow" onClick={() => showToast(`Joined ${space.name}`)}>Join</button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

// ===== Mobile Nav =====
function MobileNav({ activeRoute }: { activeRoute: string }) {
  const { setCreateOpen } = useApp();

  const items = [
    { icon: House, label: 'Home', href: '/' },
    { icon: GraduationCap, label: 'Learn', href: '/students' },
    null, // create button placeholder
    { icon: MessagesSquare, label: 'Chat', href: '/messages' },
    { icon: UserRound, label: 'Profile', href: '/profile' },
  ];

  return (
    <nav className="mobile-nav">
      {items.map((item, i) => {
        if (!item) {
          return (
            <button
              key="create"
              className="create-main"
              onClick={() => setCreateOpen(true)}
              aria-label="Create"
            >
              <Plus className="icon-lg" />
            </button>
          );
        }
        const Icon = item.icon;
        const isActive = activeRoute === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={isActive ? 'active' : ''}
          >
            <Icon className="icon" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// ===== Create Panel =====
function CreatePanel() {
  const { createOpen, setCreateOpen, showToast } = useApp();

  const options = [
    { icon: MessagesSquare, label: 'Ask question', action: 'question' },
    { icon: Store, label: 'Share post', action: 'post' },
    { icon: BadgeCheck, label: 'Offer session', action: 'session' },
  ];

  return (
    <div className={`create-panel ${createOpen ? 'open' : ''}`}>
      <button className="icon-btn create-close" onClick={() => setCreateOpen(false)} aria-label="Close create panel">
        <X className="icon-sm" />
      </button>
      <div className="eyebrow">Make something useful</div>
      <h3>What do you want to add?</h3>
      <p>Ask clearly. Share locally. Leave people better off.</p>
      <div className="create-options">
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.action}
              className="create-option"
              onClick={() => {
                setCreateOpen(false);
                showToast(`${opt.action[0].toUpperCase() + opt.action.slice(1)} composer ready`);
              }}
            >
              <Icon className="icon" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ===== Toast =====
function Toast() {
  const { toast } = useApp();

  return (
    <div className={`toast ${toast ? 'show' : ''}`} role="status">
      {toast}
    </div>
  );
}

// ===== Main Layout =====
export default function AppLayout({ children, showRightSidebar = true }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<'EN' | 'SW'>('EN');
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [toastTimer, setToastTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Toast
  const showToast = useCallback((msg: string) => {
    if (toastTimer) clearTimeout(toastTimer);
    setToast(msg);
    const t = setTimeout(() => setToast(''), 2200);
    setToastTimer(t);
  }, [toastTimer]);

  // Theme
  useEffect(() => {
    const saved = localStorage.getItem('kikwetu-theme') as 'light' | 'dark' | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.dataset.theme = saved;
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem('kikwetu-theme', next);
    showToast(next === 'dark' ? 'Dark mode on' : 'Light mode on');
  }, [theme, showToast]);

  // Language
  const toggleLang = useCallback(() => {
    const next = lang === 'EN' ? 'SW' : 'EN';
    setLang(next);
    showToast(next === 'SW' ? 'Kiswahili helper on' : 'English view on');
  }, [lang, showToast]);

  // Auth
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          setUser(profile);
        }
      } catch (err) {
        console.log('Auth check skipped:', err);
      } finally {
        setLoading(false);
      }
    };
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        setUser(profile);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Notifications count
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      setUnreadCount(count || 0);
    };

    fetchNotifications();

    // Real-time notifications
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  }, [router]);

  return (
    <AppContext.Provider value={{
      theme, toggleTheme,
      lang, toggleLang,
      createOpen, setCreateOpen,
      toast, showToast,
      user, loading, signOut,
      unreadCount,
    }}>
      <Topbar />

      <div className="layout">
        <LeftSidebar activeRoute={pathname} />

        <main className="page">
          {children}
        </main>

        {showRightSidebar && <RightSidebar />}
      </div>

      <MobileNav activeRoute={pathname} />
      <CreatePanel />
      <Toast />
    </AppContext.Provider>
  );
}
