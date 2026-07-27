'use client';

import React, { useState, createContext, useContext, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { markNotificationRead, markAllNotificationsRead, createThread } from '@/lib/supabase-helpers';
import {
  Compass, Search, Layers3, GraduationCap, BadgeCheck,
  MessagesSquare, WalletCards, Store, ShieldCheck, Radio, Brain,
  UserRound, Bookmark, Settings, LogOut, Bell, Moon, Sun, Plus,
  TrendingUp, MoreHorizontal, Volume2, X, Camera,
  MessageCircle, ThumbsUp, AtSign, UserPlus, Award, Calendar,
  AlertTriangle, CheckCheck, HelpCircle, FileText, BarChart3, Mic, Menu
} from 'lucide-react';

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

interface AppContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  lang: 'EN' | 'SW';
  toggleLang: () => void;
  createOpen: boolean;
  setCreateOpen: (v: boolean) => void;
  toast: string;
  showToast: (msg: string) => void;
  user: Profile | null;
  setUser: (user: Profile | null) => void;
  loading: boolean;
  signOut: () => Promise<void>;
  unreadCount: number;
  setUnreadCount: (v: number | ((prev: number) => number)) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
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
  setUser: () => {},
  loading: true,
  signOut: async () => {},
  unreadCount: 0,
  setUnreadCount: () => {},
  sidebarOpen: false,
  setSidebarOpen: () => {},
});

export const useApp = () => useContext(AppContext);

interface AppLayoutProps {
  children: React.ReactNode;
}

const navSections = (isAdmin: boolean) => [
  {
    title: 'Main',
    color: 'var(--green)',
    items: [
      { icon: Compass, label: 'Baraza Feed', href: '/baraza', badge: 'New' },
      { icon: Search, label: 'Explore', href: '/explore' },
      { icon: Layers3, label: 'Spaces', href: '/spaces' },
    ],
  },
  {
    title: 'Learn & Earn',
    color: 'var(--gold)',
    items: [
      { icon: GraduationCap, label: 'Students Area', href: '/students', badge: '2' },
      { icon: BadgeCheck, label: 'Professionals', href: '/professionals' },
      { icon: MessagesSquare, label: 'Messages', href: '/messages', badge: '3' },
      { icon: WalletCards, label: 'Wallet & Tips', href: '/wallet' },
    ],
  },
  {
    title: 'Local Life',
    color: 'var(--earth)',
    items: [
      { icon: Store, label: 'Mtaa Exchange', href: '/mtaa' },
      { icon: ShieldCheck, label: 'Nyumba Kumi', href: '/nyumba-kumi' },
      { icon: Radio, label: 'Live Radio', href: '/radio' },
      { icon: Brain, label: 'Quizzes', href: '/quizzes' },
    ],
  },
  {
    title: 'Your Account',
    color: 'var(--blue)',
    items: [
      { icon: UserRound, label: 'Profile', href: '/profile' },
      { icon: Bookmark, label: 'Saved', href: '/saved' },
      { icon: Settings, label: 'Settings', href: '/settings' },
      ...(isAdmin ? [{ icon: ShieldCheck, label: 'Admin', href: '/admin' }] : []),
    ],
  },
];

function Avatar({ src, initials, size = 'sm', className = '', isOnline = false }: {
  src?: string | null;
  initials: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isOnline?: boolean;
}) {
  const sizeMap = { xs: 24, sm: 32, md: 40, lg: 64, xl: 96 };
  const px = sizeMap[size];

  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      {src ? (
        <img
          src={src}
          alt={initials}
          className={`avatar ${size} avatar-img ${className}`}
          style={{ width: px, height: px, objectFit: 'cover', borderRadius: '50%' }}
        />
      ) : (
        <span className={`avatar ${size} ${className}`} style={{ width: px, height: px, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
          {initials}
        </span>
      )}
      {isOnline && (
        <span style={{
          position: 'absolute',
          bottom: size === 'xs' ? 0 : 1,
          right: size === 'xs' ? 0 : 1,
          width: size === 'xs' ? 6 : 8,
          height: size === 'xs' ? 6 : 8,
          borderRadius: '50%',
          background: 'var(--green)',
          border: '2px solid var(--surface)',
          zIndex: 1,
        }} />
      )}
    </span>
  );
}

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  reply: MessageCircle,
  upvote: ThumbsUp,
  mention: AtSign,
  follow: UserPlus,
  badge: Award,
  session: Calendar,
  tip: WalletCards,
  alert: AlertTriangle,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  reply: 'var(--blue)',
  upvote: 'var(--gold)',
  mention: 'var(--green)',
  follow: 'var(--earth)',
  badge: 'var(--gold)',
  session: 'var(--blue)',
  tip: 'var(--green)',
  alert: 'var(--red)',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'Yesterday';
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
}

function dateGroup(dateStr: string): 'today' | 'yesterday' | 'earlier' {
  const now = new Date();
  const d = new Date(dateStr);
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (d.toDateString() === now.toDateString()) return 'today';
  if (diffDays < 2) return 'yesterday';
  return 'earlier';
}

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  target_type: string | null;
  target_id: string | null;
  is_read: boolean;
  created_at: string;
}

function NotificationDropdown({
  open,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  navigate,
}: {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkRead: (id: string, targetType?: string | null, targetId?: string | null) => void;
  onMarkAllRead: () => void;
  navigate: (path: string) => void;
}) {
  const grouped = notifications.reduce<Record<string, Notification[]>>((acc, n) => {
    const g = dateGroup(n.created_at);
    (acc[g] = acc[g] || []).push(n);
    return acc;
  }, {});

  const handleClick = (n: Notification) => {
    onMarkRead(n.id, n.target_type, n.target_id);
    if (n.target_type && n.target_id) {
      const routeMap: Record<string, string> = {
        thread: '/baraza',
        reply: '/baraza',
        space: '/spaces',
        follow: '/profile',
        tip: '/profile',
        professional: '/students',
        quiz: '/quizzes',
        marketplace: '/mtaa',
        reaction: '/baraza',
        mention: '/baraza',
      };
      navigate(routeMap[n.target_type] || '/baraza');
    }
    onClose();
  };

  return (
    <div
      className="notification-dropdown"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: 380,
        maxHeight: 480,
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 16,
        boxShadow: 'var(--shadow2)',
        zIndex: 1000,
        opacity: open ? 1 : 0,
        transform: open ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(.97)',
        pointerEvents: open ? 'auto' : 'none',
        transition: 'all .2s var(--ease)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <strong style={{ fontSize: '.88rem' }}>Notifications</strong>
        {notifications.some(n => !n.is_read) && (
          <button
            type="button"
            onClick={onMarkAllRead}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--green)',
              fontSize: '.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              borderRadius: 8,
            }}
          >
            <CheckCheck className="icon-sm" />
            Mark all as read
          </button>
        )}
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text3)', fontSize: '.82rem' }}>
            <Bell className="icon-lg" style={{ margin: '0 auto 10px', opacity: .35 }} />
            <div>No notifications yet</div>
          </div>
        ) : (
          (['today', 'yesterday', 'earlier'] as const).map(group => {
            const items = grouped[group];
            if (!items || items.length === 0) return null;
            return (
              <div key={group}>
                <div style={{ padding: '8px 16px 4px', fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text3)' }}>
                  {group === 'today' ? 'Today' : group === 'yesterday' ? 'Yesterday' : 'Earlier'}
                </div>
                {items.map(n => {
                  const IconComp = NOTIFICATION_ICONS[n.type] || Bell;
                  const color = NOTIFICATION_COLORS[n.type] || 'var(--text3)';
                  return (
                    <button
                      type="button"
                      key={n.id}
                      onClick={() => handleClick(n)}
                      style={{
                        display: 'flex',
                        gap: 12,
                        padding: '10px 16px',
                        width: '100%',
                        textAlign: 'left',
                        border: 'none',
                        background: n.is_read ? 'transparent' : 'var(--surface2)',
                        cursor: 'pointer',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div style={{ position: 'relative', flexShrink: 0, marginTop: 2 }}>
                        <div style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: `${color}18`,
                          display: 'grid',
                          placeItems: 'center',
                        }}>
                          <IconComp style={{ width: 16, height: 16, color }} />
                        </div>
                        {!n.is_read && (
                          <span style={{
                            position: 'absolute',
                            top: 0,
                            right: -2,
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: 'var(--green)',
                            border: '2px solid var(--surface)',
                          }} />
                        )}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '.78rem', lineHeight: 1.35, color: 'var(--text)' }}>
                          <strong style={{ fontWeight: 700 }}>{n.title}</strong>
                        </div>
                        {n.body && (
                          <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {n.body}
                          </div>
                        )}
                        <div style={{ fontSize: '.64rem', color: 'var(--text3)', marginTop: 3, opacity: .75 }}>
                          {timeAgo(n.created_at)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const Topbar = React.memo(function Topbar() {
  const { theme, toggleTheme, lang, toggleLang, user, setUser, unreadCount, setUnreadCount, showToast, signOut, setSidebarOpen } = useApp();
  const router = useRouter();
  const [searchFocused, setSearchFocused] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() || 'U';

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5MB');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', user.id);
      if (updateError) throw updateError;
      setUser({ ...user, avatar_url: urlData.publicUrl });
      showToast('Avatar updated');
    } catch {
      showToast('Upload failed');
      setPreviewUrl(null);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      router.push('/landing');
      showToast('Signed out');
    }
  };

  useEffect(() => {
    if (!notifOpen || !user) return;
    void (async () => {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
      if (data) setNotifications(data);
    })();
  }, [notifOpen, user?.id]);

  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const avatarSrc = previewUrl || user?.avatar_url;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button type="button" className="icon-btn hamburger" onClick={() => setSidebarOpen(true)} aria-label="Menu">
          <Menu className="icon" />
        </button>
        <Link href="/baraza" className="wordmark">
        <span className="mark">k</span>
        <strong>kikwetu<span>.</span></strong>
      </Link>
      </div>

      <label className={`search ${searchFocused ? 'focused' : ''}`}>
        <Search className="icon-sm" />
        <input
          placeholder="Search people, counties, topics"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </label>

      <div className="top-actions">
        <button type="button" className="icon-btn" onClick={toggleTheme} aria-label="Toggle dark mode">
          {theme === 'dark' ? <Sun className="icon" /> : <Moon className="icon" />}
        </button>
        <div className="icon-btn" style={{ position: 'relative' }}>
          <Bell className="icon" />
          {unreadCount > 0 && <span className="dot" style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%', background: 'var(--red)' }} />}
        </div>
        <Link href="/profile" className="profile-pill" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '.78rem', fontWeight: 600 }}>{user?.full_name || 'Member'}</span>
          <span
            className="avatar-wrapper"
            style={{ position: 'relative', display: 'inline-flex', cursor: 'pointer' }}
            onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
          >
            <Avatar src={avatarSrc} initials={initials} size="sm" isOnline={user?.is_online} />
          </span>
        </Link>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => void handleAvatarChange(e)} />
      </div>
    </header>
  );
});

const LeftSidebar = React.memo(function LeftSidebar({ activeRoute }: { activeRoute: string }) {
  const { user, signOut, showToast } = useApp();
  const router = useRouter();
  const heshima = user?.heshima || 740;
  const level = Math.floor(heshima / 100);
  const toNext = 100 - (heshima % 100);

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() || 'U';

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      router.push('/landing');
      showToast('Signed out');
    }
  };

  return (
    <aside className="sidebar left-sidebar">
      {navSections(user?.role === 'admin').map((section) => (
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
                style={isActive ? { color: section.color } : undefined}
              >
                <Icon className="icon" style={!isActive ? { color: section.color, opacity: 0.7 } : undefined} />
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
          <strong>Heshima rating</strong>
          <span>Level {level} &middot; {toNext} to next level</span>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <Link href="/profile" className="profile-pill">
          <Avatar src={user?.avatar_url} initials={initials} size="md" isOnline={user?.is_online} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <strong style={{ display: 'block', fontSize: '.82rem' }}>{user?.full_name || 'Member'}</strong>
            <span style={{ display: 'block', color: 'var(--text3)', fontSize: '.68rem' }}>@{user?.username || 'user'}</span>
          </div>
          <Settings className="icon-sm" style={{ color: 'var(--text3)' }} />
        </Link>
        <button
          type="button"
          className="icon-btn"
          onClick={() => void handleLogout()}
          style={{ width: '100%', marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', fontSize: '.78rem', color: 'var(--text3)' }}
          aria-label="Sign out"
        >
          <LogOut className="icon-sm" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
});

import AdBanner from '@/components/AdBanner';

const TRENDING_TOPICS = [
  { tag: '#KilimoSmart', posts: '12.4k', color: 'var(--green)' },
  { tag: '#NairobiTech', posts: '10.9k', color: 'var(--blue)' },
  { tag: '#ShengLife', posts: '8.2k', color: 'var(--earth)' },
  { tag: '#HealthKE', posts: '7.8k', color: 'var(--red)' },
  { tag: '#StartupKE', posts: '6.5k', color: 'var(--gold)' },
  { tag: '#BarazaTalks', posts: '5.3k', color: 'var(--green)' },
  { tag: '#MtaaExchange', posts: '4.1k', color: 'var(--blue)' },
];

const LIVE_AUDIO = [
  { title: 'Kilimo Roundtable', host: 'Amina & James', listeners: 320, live: true },
  { title: 'Nairobi Tech AMA', host: 'Sarah Mutua', listeners: 180, live: true },
  { title: 'Sheng Dictionary Live', host: 'Dj Ochieng', listeners: 450, live: true },
];

const SUGGESTED_SPACES = [
  { name: 'KilimoSmart', emoji: '🌾', members: '2.8k', color: 'var(--greenSoft)', textColor: 'var(--green)' },
  { name: 'NairobiTech', emoji: '💻', members: '1.5k', color: 'var(--blueSoft)', textColor: 'var(--blue)' },
  { name: 'Health Warriors', emoji: '🏥', members: '980', color: 'var(--redSoft)', textColor: 'var(--red)' },
  { name: 'Green Kenya', emoji: '🌿', members: '760', color: 'var(--greenSoft)', textColor: 'var(--green)' },
  { name: 'Sheng Lounge', emoji: '🎭', members: '620', color: 'var(--goldSoft)', textColor: 'var(--earth)' },
];

const SUGGESTED_PEOPLE = [
  { name: 'Amina Hassan', initials: 'AH', bio: 'Agronomist • KilimoSmart', color: 'var(--greenSoft)', textColor: 'var(--green)' },
  { name: 'Brian Kiprop', initials: 'BK', bio: 'Software Engineer • NairobiTech', color: 'var(--blueSoft)', textColor: 'var(--blue)' },
  { name: 'Wanjiku Mwangi', initials: 'WM', bio: 'Nurse • Health Warriors', color: 'var(--redSoft)', textColor: 'var(--red)' },
  { name: 'Otieno Ouma', initials: 'OO', bio: 'Environmentalist • Green Kenya', color: 'var(--greenSoft)', textColor: 'var(--green)' },
  { name: 'Fatuma Osman', initials: 'FO', bio: 'Content Creator • Sheng Lounge', color: 'var(--goldSoft)', textColor: 'var(--earth)' },
];

interface RightSidebarProps {
  pathname: string;
}

const RightSidebar = React.memo(function RightSidebar({ pathname }: RightSidebarProps) {
  const { showToast } = useApp();

  const isHome = pathname === '/';
  const isBaraza = pathname === '/baraza';
  const isExplore = pathname === '/explore';
  const isSpaces = pathname === '/spaces' || pathname.startsWith('/spaces/');
  const isStudents = pathname === '/students';
  const isProfessionals = pathname === '/professionals';
  const isMessages = pathname === '/messages';
  const isQuizzes = pathname === '/quizzes';
  const isMtaa = pathname === '/mtaa';
  const isNyumbaKumi = pathname === '/nyumba-kumi';
  const isRadio = pathname === '/radio';
  const isProfile = pathname === '/profile';

  return (
    <aside className="right-sidebar">
      {/* Trending Topics - Home, Baraza, Explore, Profile */}
      {(isHome || isBaraza || isExplore || isProfile) && (
        <div className="right-block">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp className="icon" style={{ color: 'var(--gold)' }} />
              <h3>Trending in Kenya</h3>
            </div>
            <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => showToast('View all trending')}>
              <MoreHorizontal className="icon-sm" />
            </button>
          </div>
          <div className="right-list">
            {TRENDING_TOPICS.map((topic, i) => (
              <div key={topic.tag} className="right-item" style={{ cursor: 'pointer' }} onClick={() => showToast(`Viewing ${topic.tag}`)}>
                <div className="right-copy">
                  <strong style={{ color: topic.color }}>{topic.tag}</strong>
                  <span>{topic.posts} posts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Audio Baraza - Home, Baraza, Radio */}
      {(isHome || isBaraza || isRadio) && (
        <div className="right-block">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--red)', animation: 'pulse 1.5s infinite' }} />
              <h3>Live Audio Baraza</h3>
            </div>
            <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => showToast('View all live audio')}>
              <MoreHorizontal className="icon-sm" />
            </button>
          </div>
          <div className="right-list">
            {LIVE_AUDIO.map((audio, i) => (
              <div key={i} className="right-item" style={{ cursor: 'pointer', padding: '10px', borderRadius: 10 }} onClick={() => showToast(`Joining ${audio.title}`)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="avatar" style={{ background: i === 0 ? 'var(--greenSoft)' : i === 1 ? 'var(--blueSoft)' : 'var(--goldSoft)', color: i === 0 ? 'var(--green)' : i === 1 ? 'var(--blue)' : 'var(--earth)', fontSize: '.9rem' }}>
                    <Volume2 className="icon-sm" />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <strong style={{ fontSize: '.78rem', display: 'block' }}>{audio.title}</strong>
                    <span style={{ fontSize: '.65rem', color: 'var(--text3)' }}>{audio.host} · {audio.listeners} listening</span>
                  </div>
                  {audio.live && (
                    <span style={{ fontSize: '.55rem', fontWeight: 800, padding: '2px 6px', borderRadius: 99, background: 'var(--red)', color: 'var(--surface)', animation: 'pulse 1.5s infinite' }}>LIVE</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Spaces - Home, Explore, Spaces */}
      {(isHome || isExplore || isSpaces) && (
        <div className="right-block">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3>Suggested spaces</h3>
            <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => showToast('Browse all spaces')}>
              <MoreHorizontal className="icon-sm" />
            </button>
          </div>
          <div className="right-list">
            {SUGGESTED_SPACES.map((space, i) => (
              <div key={space.name} className="right-item">
                <div className="avatar" style={{ background: space.color, color: space.textColor, fontSize: '1rem' }}>
                  {space.emoji}
                </div>
                <div className="right-copy">
                  <strong>{space.name}</strong>
                  <span>{space.members} members</span>
                </div>
                <button type="button" className="follow" onClick={() => showToast(`Joined ${space.name}`)}>Join</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ad Banner - All pages (rotating) */}
      <AdBanner variant="sidebar" index={0} />

      {/* Suggested People - Explore, Profile, Students, Professionals */}
      {(isExplore || isProfile || isStudents || isProfessionals) && (
        <div className="right-block">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3>People you may know</h3>
            <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => showToast('Find more people')}>
              <MoreHorizontal className="icon-sm" />
            </button>
          </div>
          <div className="right-list">
            {SUGGESTED_PEOPLE.map((person, i) => (
              <div key={person.name} className="right-item">
                <div className="avatar" style={{ background: person.color, color: person.textColor, fontSize: '.7rem' }}>
                  {person.initials}
                </div>
                <div className="right-copy">
                  <strong style={{ fontSize: '.78rem' }}>{person.name}</strong>
                  <span style={{ fontSize: '.62rem' }}>{person.bio}</span>
                </div>
                <button type="button" className="follow" style={{ fontSize: '.6rem', padding: '4px 8px' }} onClick={() => showToast(`Following ${person.name}`)}>Follow</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz-specific: Subject Heshima & Daily Challenge */}
      {isQuizzes && (
        <div className="right-block">
          <h3>Your Subject Heshima</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {['Agriculture', 'Culture', 'Rights & Law', 'Health', 'Tech', 'Environment'].map((subject) => (
              <div key={subject} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ fontSize: '.72rem', color: 'var(--text2)' }}>{subject}</span>
                <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--gold)' }}>0</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mtaa-specific: Featured Listings */}
      {isMtaa && (
        <div className="right-block">
          <h3>Featured listings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            {[
              { title: 'Fresh Sukuma Wiki', price: 'KES 150', location: 'Ruiru', emoji: '🥬' },
              { title: 'Solar Cleaning', price: 'KES 2,000', location: 'Nakuru', emoji: '☀️' },
              { title: 'Handwoven Baskets', price: 'KES 800', location: 'Kisumu', emoji: '🧺' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '10px', borderRadius: 10, background: 'var(--bg)', cursor: 'pointer' }} onClick={() => showToast(`Viewing ${item.title}`)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.2rem' }}>{item.emoji}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <strong style={{ fontSize: '.76rem' }}>{item.title}</strong>
                    <span style={{ fontSize: '.62rem', color: 'var(--text3)' }}>{item.location}</span>
                  </div>
                  <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--green)' }}>{item.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nyumba Kumi-specific: Emergency Contacts */}
      {isNyumbaKumi && (
        <div className="right-block">
          <h3>Emergency contacts</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {[
              { name: 'Police', number: '999', icon: '🚓' },
              { name: 'Ambulance', number: '1199', icon: '🚑' },
              { name: 'Fire', number: '112', icon: '🚒' },
              { name: 'Childline', number: '116', icon: '📞' },
              { name: 'Red Cross', number: '0800 721 111', icon: '➕' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px', borderRadius: 10, background: 'var(--bg)' }}>
                <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong style={{ fontSize: '.74rem' }}>{item.name}</strong>
                  <span style={{ fontSize: '.7rem', fontFamily: 'monospace', color: 'var(--text2)' }}>{item.number}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Radio-specific: Schedule */}
      {isRadio && (
        <div className="right-block">
          <h3>Upcoming shows</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {[
              { time: '6:00 AM', show: 'Jambo Kenya', station: 'Citizen Radio' },
              { time: '10:00 AM', show: 'The Drive Show', station: 'NRG Radio' },
              { time: '2:00 PM', show: 'Afternoon Vibe', station: 'Kiss FM' },
              { time: '6:00 PM', show: 'Evening Talk', station: 'Spice FM' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '8px', borderRadius: 10, background: 'var(--bg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.7rem' }}>
                  <span style={{ color: 'var(--text3)' }}>{item.time}</span>
                  <span style={{ color: 'var(--green)', fontWeight: 700 }}>{item.show}</span>
                </div>
                <div style={{ fontSize: '.62rem', color: 'var(--text3)' }}>{item.station}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ad Banner - second ad on longer pages */}
      <AdBanner variant="sidebar" index={1} />
    </aside>
  );
});

function MobileNav({ activeRoute }: { activeRoute: string }) {
  const { setCreateOpen } = useApp();
  const items = [
    { icon: Compass, label: 'Baraza', href: '/baraza' },
    { icon: Search, label: 'Explore', href: '/explore' },
    null,
    { icon: MessagesSquare, label: 'Chat', href: '/messages' },
    { icon: UserRound, label: 'Me', href: '/profile' },
  ];

  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {items.map((item) => {
        if (!item) {
          return (
            <button key="create" type="button" className="create-main" onClick={() => setCreateOpen(true)} aria-label="Create">
              <Plus className="icon-lg" />
            </button>
          );
        }
        const Icon = item.icon;
        const isActive = activeRoute === item.href || (item.href !== '/baraza' && activeRoute.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} className={isActive ? 'active' : ''}>
            <Icon className="icon" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function CreatePanel() {
  const { createOpen, setCreateOpen, user, showToast } = useApp();
  const router = useRouter();

  if (!createOpen || !user) {
    return null;
  }

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('post');
  const [tagsInput, setTagsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    if (!user) {
      showToast('Please sign in to post');
      return;
    }
    setSubmitting(true);
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    try {
      const { data, error } = await createThread(user.id, title.trim(), body.trim(), type, tags);
      if (error || !data) {
        showToast(error?.message || 'Failed to create post');
        console.error(error);
      } else {
        setTitle('');
        setBody('');
        setTagsInput('');
        setType('post');
        setCreateOpen(false);
        showToast('Posted successfully!');
        router.refresh();
      }
    } catch (err) {
      showToast('Failed to create post');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-panel open">
      <div style={{ padding: 20 }}>
        <h3>Create a new post</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {['post', 'question', 'poll', 'audio'].map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: `1px solid ${type === t ? 'var(--green)' : 'var(--line)'}`,
                background: type === t ? 'var(--greenSoft)' : 'transparent',
                color: type === t ? 'var(--green)' : 'var(--text3)',
                fontSize: '.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ marginBottom: 10 }}
        />
        <textarea
          placeholder="What's on your mind?"
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={4}
          style={{ marginBottom: 10 }}
        />
        <input
          placeholder="Tags (comma separated)"
          value={tagsInput}
          onChange={e => setTagsInput(e.target.value)}
          style={{ marginBottom: 14 }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="secondary" onClick={() => setCreateOpen(false)}>Cancel</button>
          <button className="primary" onClick={() => void handleSubmit()} disabled={submitting || !title.trim()}>
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast() {
  const { toast } = useApp();
  return (
    <div className={`toast ${toast ? 'show' : ''}`} role="status">
      {toast}
    </div>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<'EN' | 'SW'>('EN');
  const [createOpen, setCreateOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [toastTimer, setToastTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const showToast = useCallback((msg: string) => {
    if (toastTimer) clearTimeout(toastTimer);
    setToast(msg);
    const t = setTimeout(() => setToast(''), 2200);
    setToastTimer(t);
  }, [toastTimer]);

  useEffect(() => {
    const saved = localStorage.getItem('kikwetu-theme') as 'light' | 'dark' | null;
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const toggleLang = useCallback(() => {
    const next = lang === 'EN' ? 'SW' : 'EN';
    setLang(next);
    showToast(next === 'SW' ? 'Kiswahili helper on' : 'English view on');
  }, [lang, showToast]);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setLoading(false);
          return;
        }
        const authUser = session.user;
          const meta = authUser.user_metadata || {};
let { data: profile } = await supabase.from('profiles').select('*').eq('user_id', authUser.id).single();
          if (!profile) {
            const fullName = meta.full_name || meta.name || authUser.email?.split('@')[0] || 'Member';
            const username = meta.username || authUser.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') || `user_${authUser.id.slice(0, 8)}`;
            const avatarUrl = meta.avatar_url || null;
            const { data: newProfile, error } = await supabase.from('profiles').insert({
              user_id: authUser.id,
              username,
              full_name: fullName,
              avatar_url: avatarUrl,
              language: meta.language || 'en',
              role: 'member',
            }).select().single();
            if (!error && newProfile) profile = newProfile;
          }
          if (profile) {
            const updates: Record<string, string> = {};
            if (!profile.full_name && meta.full_name) updates.full_name = meta.full_name;
            if (!profile.username && meta.username) updates.username = meta.username;
            if (Object.keys(updates).length > 0) {
              await supabase.from('profiles').update(updates).eq('id', profile.id);
              profile = { ...profile, ...updates };
            }
          }
          setUser(profile);
        } catch (err) {
        console.log('Auth check skipped:', err);
      } finally {
        setLoading(false);
      }
    };
    void getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const authUser = session.user;
        const meta = authUser.user_metadata || {};
        let { data: profile } = await supabase.from('profiles').select('*').eq('user_id', authUser.id).single();
        if (!profile) {
          const fullName = meta.full_name || meta.name || authUser.email?.split('@')[0] || 'Member';
          const username = meta.username || authUser.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') || `user_${authUser.id.slice(0, 8)}`;
          const avatarUrl = meta.avatar_url || null;
          const { data: newProfile, error } = await supabase.from('profiles').insert({
            user_id: authUser.id,
            username,
            full_name: fullName,
            avatar_url: avatarUrl,
            language: meta.language || 'en',
            role: 'member',
          }).select().single();
          if (!error && newProfile) profile = newProfile;
        }
        setUser(profile);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.user_id).eq('is_read', false);
      setUnreadCount(count || 0);
    };
    void fetchNotifications();
    const channel = supabase.channel('notifications').on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${user.id}`,
    }, (payload) => {
      setUnreadCount(prev => prev + 1);
      const n = payload.new as Notification;
      showToast(n.title || 'New notification');
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user?.id]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    try {
      Object.keys(localStorage).filter(k => k.startsWith('sb-') || k.includes('supabase')).forEach(k => localStorage.removeItem(k));
    } catch {}
    setUser(null);
  }, []);

  const overlayInitials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() || 'U';

  return (
    <AppContext.Provider value={{
      theme, toggleTheme,
      lang, toggleLang,
      createOpen, setCreateOpen,
      toast, showToast,
      user, setUser, loading, signOut,
      unreadCount, setUnreadCount,
      sidebarOpen, setSidebarOpen,
    }}>
      <Topbar />
      <div className="layout">
        <LeftSidebar activeRoute={pathname} />
        <main className="page">{children}</main>
      </div>
      {sidebarOpen && (
        <>
          <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
          <aside className={`sidebar left-sidebar sidebar-overlay${sidebarOpen ? ' open' : ''}`}>
            {navSections(user?.role === 'admin').map((section) => (
              <div key={section.title} className="nav-section">
                <div className="nav-title">{section.title}</div>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`nav-item ${isActive ? 'active' : ''}`}
                      style={isActive ? { color: section.color } : undefined}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="icon" style={!isActive ? { color: section.color, opacity: 0.7 } : undefined} />
                      <span>{item.label}</span>
                      {item.badge && <span className="nav-badge">{item.badge}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
            <div className="heshima">
              <div className="ring">{user?.heshima || 740}</div>
              <div>
                <strong>Heshima rating</strong>
                <span>Level {Math.floor((user?.heshima || 740) / 100)} &middot; {100 - ((user?.heshima || 740) % 100)} to next level</span>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <Link href="/profile" className="profile-pill" onClick={() => setSidebarOpen(false)}>
                <Avatar src={user?.avatar_url} initials={overlayInitials} size="md" isOnline={user?.is_online} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: '.82rem' }}>{user?.full_name || 'Member'}</strong>
                  <span style={{ display: 'block', color: 'var(--text3)', fontSize: '.68rem' }}>@{user?.username || 'user'}</span>
                </div>
                <Settings className="icon-sm" style={{ color: 'var(--text3)' }} />
              </Link>
              <button type="button" className="icon-btn" onClick={() => { void signOut(); setSidebarOpen(false); }} aria-label="Sign out">
                <LogOut className="icon" />
              </button>
            </div>
          </aside>
        </>
      )}
      <MobileNav activeRoute={pathname} />
      <CreatePanel />
      <Toast />
    </AppContext.Provider>
  );
}
