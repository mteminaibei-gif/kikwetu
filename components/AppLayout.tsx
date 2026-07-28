'use client';

import React, { useState, createContext, useContext, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { markNotificationRead, markAllNotificationsRead, createThread } from '@/lib/supabase-helpers';
import {
  Compass, Search, Layers3, GraduationCap, BadgeCheck,
  MessagesSquare, WalletCards, Store, ShieldCheck, Radio, Brain,
  UserRound, Bookmark, Settings, LogOut, Bell, Moon, Sun, Plus,
  TrendingUp, MoreHorizontal, Volume2, X, Camera, Zap, Users,
  MessageCircle, ThumbsUp, AtSign, UserPlus, Award, Calendar,
  AlertTriangle, CheckCheck, HelpCircle, FileText, BarChart3, Mic, Menu,
  Clock, Newspaper, Eye, Home
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
      { icon: Home, label: 'Home', href: '/' },
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
    <span className="avatar-wrap">
      {src ? (
        <img
          src={src}
          alt={initials}
          className={`avatar ${size} avatar-img ${className}`}
          style={{ width: px, height: px, objectFit: 'cover' }}
        />
      ) : (
        <span className={`avatar ${size} ${className}`} style={{ width: px, height: px }}>
          {initials}
        </span>
      )}
      {isOnline && <span className={`online-dot ${size}`} />}
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
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 172800) return 'Yesterday';
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
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

interface OnlineUser {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  last_seen: string;
}

interface RecentFeed {
  id: string;
  title: string;
  type: string;
  author_name: string;
  author_avatar: string | null;
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
    <div className={`notification-dropdown ${open ? 'open' : ''}`}>
      <div className="notif-header">
        <strong>Notifications</strong>
        {notifications.some(n => !n.is_read) && (
          <button type="button" onClick={onMarkAllRead} className="notif-mark-all">
            <CheckCheck className="icon-sm" />
            Mark all read
          </button>
        )}
      </div>
      <div className="notif-body">
        {notifications.length === 0 ? (
          <div className="notif-empty">
            <Bell className="icon-lg" />
            <span>No notifications yet</span>
          </div>
        ) : (
          (['today', 'yesterday', 'earlier'] as const).map(group => {
            const items = grouped[group];
            if (!items || items.length === 0) return null;
            return (
              <div key={group}>
                <div className="notif-group-label">
                  {group === 'today' ? 'Today' : group === 'yesterday' ? 'Yesterday' : 'Earlier'}
                </div>
                {items.map(n => {
                  const IconComp = NOTIFICATION_ICONS[n.type] || Bell;
                  const color = NOTIFICATION_COLORS[n.type] || 'var(--text3)';
                  return (
                    <button type="button" key={n.id} onClick={() => handleClick(n)} className={`notif-item ${!n.is_read ? 'unread' : ''}`}>
                      <div className="notif-icon" style={{ color, background: `${color}18` }}>
                        <IconComp className="icon-sm" />
                        {!n.is_read && <span className="notif-dot" />}
                      </div>
                      <div className="notif-copy">
                        <div className="notif-title">{n.title}</div>
                        {n.body && <div className="notif-body-text">{n.body}</div>}
                        <div className="notif-time">{timeAgo(n.created_at)}</div>
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
        <button type="button" className="icon-btn lang-btn" onClick={toggleLang}>
          {lang}
        </button>
        <div className="icon-btn notif-trigger" ref={notifRef} onClick={() => setNotifOpen(!notifOpen)}>
          <Bell className="icon" />
          {unreadCount > 0 && <span className="dot" />}
          <NotificationDropdown
            open={notifOpen}
            onClose={() => setNotifOpen(false)}
            notifications={notifications}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
            navigate={(path) => router.push(path)}
          />
        </div>
        <Link href="/profile" className="profile-pill">
          <span className="profile-name">{user?.full_name || 'Member'}</span>
          <span className="avatar-wrap" onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}>
            <Avatar src={avatarSrc} initials={initials} size="sm" isOnline={user?.is_online} />
          </span>
        </Link>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => void handleAvatarChange(e)} />
      </div>
    </header>
  );
});

const LeftSidebar = React.memo(function LeftSidebar({ activeRoute }: { activeRoute: string }) {
  const { user, showToast } = useApp();
  const router = useRouter();
  const heshima = user?.heshima || 740;
  const level = Math.floor(heshima / 100);
  const toNext = 100 - (heshima % 100);

  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [recentFeeds, setRecentFeeds] = useState<RecentFeed[]>([]);
  const [loadingFeeds, setLoadingFeeds] = useState(true);

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

  useEffect(() => {
    const fetchRecentFeeds = async () => {
      setLoadingFeeds(true);
      const { data } = await supabase
        .from('threads')
        .select('id, title, type, created_at, profiles:author_id(full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) {
        setRecentFeeds(data.map((t: any) => ({
          id: t.id,
          title: t.title,
          type: t.type || 'post',
          author_name: t.profiles?.full_name || 'Unknown',
          author_avatar: t.profiles?.avatar_url || null,
          created_at: t.created_at,
        })));
      }
      setLoadingFeeds(false);
    };
    fetchRecentFeeds();

    const channel = supabase.channel('sidebar-feeds').on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'threads',
    }, (payload) => {
      const t = payload.new as any;
      setRecentFeeds(prev => [{
        id: t.id,
        title: t.title,
        type: t.type || 'post',
        author_name: 'New post',
        author_avatar: null,
        created_at: t.created_at,
      }, ...prev].slice(0, 5));
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('online-users', {
      config: { presence: { key: user.user_id } },
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users: OnlineUser[] = [];
      Object.values(state).forEach((presences: any) => {
        presences.forEach((p: any) => {
          if (p.user_id !== user.user_id) {
            users.push({
              user_id: p.user_id,
              username: p.username || '',
              full_name: p.full_name || '',
              avatar_url: p.avatar_url || null,
              last_seen: new Date().toISOString(),
            });
          }
        });
      });
      setOnlineUsers(users);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: user.user_id,
          username: user.username,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          online_at: new Date().toISOString(),
        });
      }
    });

    return () => { void supabase.removeChannel(channel); };
  }, [user?.user_id]);

  const spacesList = useMemo(() => [
    { name: 'KilimoSmart', emoji: '🌾', members: 2800, color: 'var(--greenSoft)' },
    { name: 'NairobiTech', emoji: '💻', members: 1500, color: 'var(--blueSoft)' },
    { name: 'Health Warriors', emoji: '🏥', members: 980, color: 'var(--redSoft)' },
    { name: 'Sheng Lounge', emoji: '🎭', members: 620, color: 'var(--goldSoft)' },
  ], []);

  return (
    <aside className="sidebar left-sidebar">
      {navSections(user?.role === 'admin').map((section) => (
        <div key={section.title} className="nav-section">
          <div className="nav-title">{section.title}</div>
          {section.items.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.href;
            return (
              <Link key={item.href} href={item.href} className={`nav-item ${isActive ? 'active' : ''}`}>
                <Icon className="icon" style={{ color: isActive ? section.color : undefined }} />
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

      <div className="sidebar-section">
        <div className="sidebar-section-head">
          <Newspaper className="icon-sm" style={{ color: 'var(--green)' }} />
          <h4>Recent Feeds</h4>
        </div>
        <div className="sidebar-feed-list">
          {loadingFeeds ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="sidebar-feed-item skeleton-shimmer" style={{ height: 48 }} />
            ))
          ) : recentFeeds.length === 0 ? (
            <div className="sidebar-empty">No recent feeds</div>
          ) : recentFeeds.map(feed => (
            <Link key={feed.id} href="/baraza" className="sidebar-feed-item">
              <div className="feed-dot" />
              <div className="sidebar-feed-copy">
                <strong>{feed.title}</strong>
                <span>{feed.author_name} · {timeAgo(feed.created_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-head">
          <Layers3 className="icon-sm" style={{ color: 'var(--blue)' }} />
          <h4>Your Spaces</h4>
        </div>
        <div className="sidebar-spaces">
          {spacesList.map(space => (
            <Link key={space.name} href="/spaces" className="sidebar-space-item">
              <span className="sidebar-space-emoji" style={{ background: space.color }}>{space.emoji}</span>
              <div className="sidebar-feed-copy">
                <strong>{space.name}</strong>
                <span>{space.members.toLocaleString()} members</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-head">
          <Users className="icon-sm" style={{ color: 'var(--earth)' }} />
          <h4>Online Now</h4>
          <span className="online-count">{onlineUsers.length + 1}</span>
        </div>
        <div className="sidebar-online-list">
          {onlineUsers.length === 0 ? (
            <div className="sidebar-empty">No one else online</div>
          ) : (
            onlineUsers.slice(0, 8).map(u => (
              <Link key={u.user_id} href={`/profile?id=${u.user_id}`} className="sidebar-online-item">
                <Avatar src={u.avatar_url} initials={u.full_name ? u.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??'} size="xs" isOnline />
                <span>{u.full_name?.split(' ')[0] || 'User'}</span>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-ad-card">
          <span className="sidebar-ad-badge">Ad</span>
          <div className="sidebar-ad-content">
            <strong>Grow with Kikwetu</strong>
            <span>Join KilimoSmart and learn from 2.8k farmers across Kenya</span>
          </div>
        </div>
      </div>

      <div className="profile-pill sidebar-profile">
        <Link href="/profile" style={{ display: 'contents' }}>
          <Avatar src={user?.avatar_url} initials={initials} size="md" isOnline={user?.is_online} />
          <div className="sidebar-profile-copy">
            <strong>{user?.full_name || 'Member'}</strong>
            <span>@{user?.username || 'user'}</span>
          </div>
          <Settings className="icon-sm" style={{ color: 'var(--text3)' }} />
        </Link>
      </div>
      <button type="button" className="icon-btn sidebar-signout" onClick={() => void handleLogout()}>
        <LogOut className="icon-sm" />
        <span>Sign out</span>
      </button>
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
  { name: 'Amina Hassan', initials: 'AH', bio: 'Agronomist · KilimoSmart', color: 'var(--greenSoft)', textColor: 'var(--green)' },
  { name: 'Brian Kiprop', initials: 'BK', bio: 'Software Engineer · NairobiTech', color: 'var(--blueSoft)', textColor: 'var(--blue)' },
  { name: 'Wanjiku Mwangi', initials: 'WM', bio: 'Nurse · Health Warriors', color: 'var(--redSoft)', textColor: 'var(--red)' },
  { name: 'Otieno Ouma', initials: 'OO', bio: 'Environmentalist · Green Kenya', color: 'var(--greenSoft)', textColor: 'var(--green)' },
  { name: 'Fatuma Osman', initials: 'FO', bio: 'Content Creator · Sheng Lounge', color: 'var(--goldSoft)', textColor: 'var(--earth)' },
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
      {(isHome || isBaraza || isExplore || isProfile) && (
        <div className="right-block">
          <div className="right-block-head">
            <div className="right-block-title">
              <TrendingUp className="icon" style={{ color: 'var(--gold)' }} />
              <h3>Trending in Kenya</h3>
            </div>
            <button className="icon-btn sm" onClick={() => showToast('View all trending')}>
              <MoreHorizontal className="icon-sm" />
            </button>
          </div>
          <div className="right-list">
            {TRENDING_TOPICS.map((topic) => (
              <div key={topic.tag} className="right-item" onClick={() => showToast(`Viewing ${topic.tag}`)}>
                <div className="right-copy">
                  <strong style={{ color: topic.color }}>{topic.tag}</strong>
                  <span>{topic.posts} posts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(isHome || isBaraza || isRadio) && (
        <div className="right-block">
          <div className="right-block-head">
            <div className="right-block-title">
              <div className="live-dot" />
              <h3>Live Audio Baraza</h3>
            </div>
            <button className="icon-btn sm" onClick={() => showToast('View all live audio')}>
              <MoreHorizontal className="icon-sm" />
            </button>
          </div>
          <div className="right-list">
            {LIVE_AUDIO.map((audio, i) => (
              <div key={i} className="right-item audio-item" onClick={() => showToast(`Joining ${audio.title}`)}>
                <div className="avatar sm" style={{ background: i === 0 ? 'var(--greenSoft)' : i === 1 ? 'var(--blueSoft)' : 'var(--goldSoft)', color: i === 0 ? 'var(--green)' : i === 1 ? 'var(--blue)' : 'var(--earth)' }}>
                  <Volume2 className="icon-sm" />
                </div>
                <div className="right-copy">
                  <strong>{audio.title}</strong>
                  <span>{audio.host} · {audio.listeners} listening</span>
                </div>
                {audio.live && <span className="live-badge">LIVE</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {(isHome || isExplore || isSpaces) && (
        <div className="right-block">
          <div className="right-block-head">
            <h3>Suggested spaces</h3>
            <button className="icon-btn sm" onClick={() => showToast('Browse all spaces')}>
              <MoreHorizontal className="icon-sm" />
            </button>
          </div>
          <div className="right-list">
            {SUGGESTED_SPACES.map((space) => (
              <div key={space.name} className="right-item">
                <div className="avatar sm" style={{ background: space.color, color: space.textColor, fontSize: '1rem' }}>
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

      <AdBanner variant="sidebar" index={0} />

      {(isExplore || isProfile || isStudents || isProfessionals) && (
        <div className="right-block">
          <div className="right-block-head">
            <h3>People you may know</h3>
            <button className="icon-btn sm" onClick={() => showToast('Find more people')}>
              <MoreHorizontal className="icon-sm" />
            </button>
          </div>
          <div className="right-list">
            {SUGGESTED_PEOPLE.map((person) => (
              <div key={person.name} className="right-item">
                <div className="avatar sm" style={{ background: person.color, color: person.textColor, fontSize: '.7rem' }}>
                  {person.initials}
                </div>
                <div className="right-copy">
                  <strong>{person.name}</strong>
                  <span>{person.bio}</span>
                </div>
                <button type="button" className="follow sm" onClick={() => showToast(`Following ${person.name}`)}>Follow</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isQuizzes && (
        <div className="right-block">
          <h3>Your Subject Heshima</h3>
          <div className="subject-list">
            {['Agriculture', 'Culture', 'Rights & Law', 'Health', 'Tech', 'Environment'].map((subject) => (
              <div key={subject} className="subject-row">
                <span>{subject}</span>
                <strong>0</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {isMtaa && (
        <div className="right-block">
          <h3>Featured listings</h3>
          <div className="right-list">
            {[
              { title: 'Fresh Sukuma Wiki', price: 'KES 150', location: 'Ruiru', emoji: '🥬' },
              { title: 'Solar Cleaning', price: 'KES 2,000', location: 'Nakuru', emoji: '☀️' },
              { title: 'Handwoven Baskets', price: 'KES 800', location: 'Kisumu', emoji: '🧺' },
            ].map((item, i) => (
              <div key={i} className="right-item listing-item" onClick={() => showToast(`Viewing ${item.title}`)}>
                <span className="listing-emoji">{item.emoji}</span>
                <div className="right-copy">
                  <strong>{item.title}</strong>
                  <span>{item.location}</span>
                </div>
                <span className="listing-price">{item.price}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isNyumbaKumi && (
        <div className="right-block">
          <h3>Emergency contacts</h3>
          <div className="right-list">
            {[
              { name: 'Police', number: '999', emoji: '🚓' },
              { name: 'Ambulance', number: '1199', emoji: '🚑' },
              { name: 'Fire', number: '112', emoji: '🚒' },
              { name: 'Childline', number: '116', emoji: '📞' },
              { name: 'Red Cross', number: '0800 721 111', emoji: '➕' },
            ].map((item, i) => (
              <div key={i} className="right-item emergency-item">
                <span className="listing-emoji">{item.emoji}</span>
                <div className="right-copy">
                  <strong>{item.name}</strong>
                  <span className="mono">{item.number}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isRadio && (
        <div className="right-block">
          <h3>Upcoming shows</h3>
          <div className="right-list">
            {[
              { time: '6:00 AM', show: 'Jambo Kenya', station: 'Citizen Radio' },
              { time: '10:00 AM', show: 'The Drive Show', station: 'NRG Radio' },
              { time: '2:00 PM', show: 'Afternoon Vibe', station: 'Kiss FM' },
              { time: '6:00 PM', show: 'Evening Talk', station: 'Spice FM' },
            ].map((item, i) => (
              <div key={i} className="right-item schedule-item">
                <div className="right-copy">
                  <span className="schedule-time">{item.time}</span>
                  <strong>{item.show}</strong>
                  <span>{item.station}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
      <div className="create-panel-inner">
        <div className="create-panel-head">
          <h3>Create a new post</h3>
          <button type="button" className="icon-btn sm" onClick={() => setCreateOpen(false)}>
            <X className="icon-sm" />
          </button>
        </div>
        <div className="create-type-row">
          {['post', 'question', 'poll', 'audio'].map(t => (
            <button key={t} onClick={() => setType(t)} className={`create-type-btn ${type === t ? 'active' : ''}`}>
              {t}
            </button>
          ))}
        </div>
        <input
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea
          placeholder="What's on your mind?"
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={4}
        />
        <input
          placeholder="Tags (comma separated)"
          value={tagsInput}
          onChange={e => setTagsInput(e.target.value)}
        />
        <div className="create-panel-actions">
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
        <RightSidebar pathname={pathname} />
      </div>
      {sidebarOpen && (
        <>
          <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
          <aside className="sidebar left-sidebar sidebar-overlay open">
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
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="icon" style={isActive ? { color: section.color } : undefined} />
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
                <span>Level {Math.floor((user?.heshima || 740) / 100)} · {100 - ((user?.heshima || 740) % 100)} to next</span>
              </div>
            </div>
            <div className="sidebar-profile">
              <Link href="/profile" onClick={() => setSidebarOpen(false)}>
                <Avatar src={user?.avatar_url} initials={overlayInitials} size="md" isOnline={user?.is_online} />
                <div className="sidebar-profile-copy">
                  <strong>{user?.full_name || 'Member'}</strong>
                  <span>@{user?.username || 'user'}</span>
                </div>
                <Settings className="icon-sm" style={{ color: 'var(--text3)' }} />
              </Link>
            </div>
            <button type="button" className="icon-btn sidebar-signout" onClick={() => { void signOut(); setSidebarOpen(false); }}>
              <LogOut className="icon" />
              <span>Sign out</span>
            </button>
          </aside>
        </>
      )}
      <MobileNav activeRoute={pathname} />
      <CreatePanel />
      <Toast />
    </AppContext.Provider>
  );
}
