'use client';

import React, { useState, createContext, useContext, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { markNotificationRead, markAllNotificationsRead } from '@/lib/supabase-helpers';
import {
  House, Compass, Search, Layers3, GraduationCap, BadgeCheck,
  MessagesSquare, WalletCards, Store, ShieldCheck, Radio, Brain,
  UserRound, Bookmark, Settings, LogOut, Bell, Moon, Sun, Plus,
  MapPin, TrendingUp, MoreHorizontal, Volume2, ChevronRight, X, Camera,
  MessageCircle, ThumbsUp, AtSign, UserPlus, Award, Calendar,
  AlertTriangle, CheckCheck
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
  setUser: (user: Profile | null) => void;
  loading: boolean;
  signOut: () => Promise<void>;
  // Notifications
  unreadCount: number;
  setUnreadCount: (v: number | ((prev: number) => number)) => void;
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

// ===== Avatar Component =====
function Avatar({ src, initials, size = 'sm', className = '' }: {
  src?: string | null;
  initials: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizeMap = { xs: 24, sm: 32, md: 40, lg: 64, xl: 96 };
  const px = sizeMap[size];

  if (src) {
    return (
      <img
        src={src}
        alt={initials}
        className={`avatar ${size} avatar-img ${className}`}
        style={{ width: px, height: px, objectFit: 'cover', borderRadius: '50%' }}
      />
    );
  }

  return (
    <span className={`avatar ${size} ${className}`} style={{ width: px, height: px, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
      {initials}
    </span>
  );
}

// ===== Notification Types =====
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
      navigate(`/${n.target_type}/${n.target_id}`);
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
              transition: 'background .15s',
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'var(--greenSoft)'; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'none'; }}
          >
            <CheckCheck className="icon-sm" />
            Mark all read
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
                        transition: 'background .12s',
                        alignItems: 'flex-start',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface3)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = n.is_read ? 'transparent' : 'var(--surface2)'; }}
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

// ===== Topbar =====
const Topbar = React.memo(function Topbar() {
  const { theme, toggleTheme, lang, toggleLang, user, setUser, unreadCount, setUnreadCount, showToast, signOut } = useApp();
  const router = useRouter();
  const [searchFocused, setSearchFocused] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'GP';

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploading(true);

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `${user.user_id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.user_id);

      if (updateError) throw updateError;

      setUser({ ...user, avatar_url: publicUrl });
      showToast('Avatar updated');
    } catch (err) {
      showToast('Upload failed');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/landing');
    showToast('Signed out');
  };

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (!notifOpen || !user) return;
    const fetchNotifs = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setNotifications(data);
    };
    fetchNotifs();
  }, [notifOpen, user]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  const handleMarkRead = async (id: string, targetType?: string | null, targetId?: string | null) => {
    await markNotificationRead(id);
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, is_read: true } : n);
      return updated;
    });
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
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            aria-label="Notifications"
            onClick={() => setNotifOpen(prev => !prev)}
          >
            <Bell className="icon" />
            {unreadCount > 0 && <span className="dot" />}
          </button>
          <NotificationDropdown
            open={notifOpen}
            onClose={() => setNotifOpen(false)}
            notifications={notifications}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
            navigate={(path) => router.push(path)}
          />
        </div>
        <button className="icon-btn" onClick={handleLogout} aria-label="Logout">
          <LogOut className="icon" />
        </button>
        <Link href="/profile" className="profile-pill" style={{ position: 'relative' }}>
          <span>{user?.full_name || 'Grid Pulse'}</span>
          <span
            className="avatar-wrapper"
            style={{ position: 'relative', display: 'inline-flex', cursor: 'pointer' }}
            onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
            onMouseEnter={(e) => { const o = e.currentTarget.querySelector('.avatar-overlay') as HTMLElement; if (o) o.style.opacity = '1'; }}
            onMouseLeave={(e) => { const o = e.currentTarget.querySelector('.avatar-overlay') as HTMLElement; if (o) o.style.opacity = '0'; }}
          >
            <Avatar src={avatarSrc} initials={initials} size="sm" />
            <span
              className="avatar-overlay"
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity .15s',
              }}
            >
              <Camera className="icon-sm" style={{ color: '#fff' }} />
            </span>
          </span>
        </Link>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleAvatarChange}
        />
      </div>
    </header>
  );
});

// ===== Left Sidebar =====
const LeftSidebar = React.memo(function LeftSidebar({ activeRoute }: { activeRoute: string }) {
  const { user, signOut, showToast } = useApp();
  const router = useRouter();
  const heshima = user?.heshima || 740;
  const level = Math.floor(heshima / 100);

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'GP';

  const handleLogout = async () => {
    await signOut();
    router.push('/landing');
    showToast('Signed out');
  };

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

      <div style={{ marginTop: 16 }}>
        <Link href="/profile" className="profile-pill">
          <Avatar src={user?.avatar_url} initials={initials} size="md" />
          <div style={{ minWidth: 0, flex: 1 }}>
            <strong style={{ display: 'block', fontSize: '.82rem' }}>{user?.full_name || 'Grid Pulse'}</strong>
            <span style={{ display: 'block', color: 'var(--text3)', fontSize: '.68rem' }}>@{user?.username || 'gridpulse'}</span>
          </div>
          <Settings className="icon-sm" style={{ color: 'var(--text3)' }} />
        </Link>
        <button
          className="icon-btn"
          onClick={handleLogout}
          style={{ width: '100%', marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', fontSize: '.78rem', color: 'var(--text3)' }}
          aria-label="Logout"
        >
          <LogOut className="icon-sm" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
});

// ===== Right Sidebar =====
const RightSidebar = React.memo(function RightSidebar() {
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
});

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
      }, (payload) => {
        setUnreadCount(prev => prev + 1);
        const n = payload.new as Notification;
        showToast(n.title || 'New notification');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AppContext.Provider value={{
      theme, toggleTheme,
      lang, toggleLang,
      createOpen, setCreateOpen,
      toast, showToast,
      user, setUser, loading, signOut,
      unreadCount, setUnreadCount,
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
