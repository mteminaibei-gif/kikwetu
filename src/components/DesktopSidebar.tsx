'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import Icon from '@/components/Icon';

interface NavItem { label: string; href: string; icon: string; badge?: string; isProfile?: boolean; }

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Main',
    items: [
      { label: 'Home', href: '/feed', icon: 'house' },
      { label: 'Baraza feed', href: '/feed', icon: 'compass' },
      { label: 'Explore', href: '/search', icon: 'search' },
      { label: 'Spaces', href: '/feed?view=spaces', icon: 'layers-3' },
    ],
  },
  {
    title: 'Learn & earn',
    items: [
      { label: 'Students Area', href: '/students', icon: 'graduation-cap', badge: '2' },
      { label: 'Professionals', href: '/professionals', icon: 'badge-check' },
      { label: 'Messages', href: '/chat', icon: 'messages-square', badge: '3' },
      { label: 'Wallet & tips', href: '/wallet', icon: 'wallet-cards' },
    ],
  },
  {
    title: 'Local life',
    items: [
      { label: 'Mtaa Exchange', href: '/mtaa', icon: 'store' },
      { label: 'Nyumba Kumi', href: '/nyumba-kumi', icon: 'shield-check' },
      { label: 'Live Radio', href: '/radio', icon: 'radio' },
      { label: 'Quizzes', href: '/quizzes', icon: 'brain' },
    ],
  },
  {
    title: 'Your account',
    items: [
      { label: 'Profile', href: '/profile', icon: 'user-round', isProfile: true },
      { label: 'Settings', href: '/settings', icon: 'settings-2' },
    ],
  },
];

export default function DesktopSidebar() {
  const { user, isAdmin } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const isActive = (href: string, isProfile?: boolean) => {
    if (isProfile && pathname?.startsWith('/profile')) return true;
    if (href === '/feed' && (pathname === '/feed' || pathname === '/')) return true;
    if (href === '/search' && pathname === '/search') return true;
    if (href === '/students' && pathname === '/students') return true;
    if (href === '/nyumba-kumi' && pathname === '/nyumba-kumi') return true;
    if (href === '/professionals' && pathname?.startsWith('/professionals')) return true;
    if (href === '/mtaa' && pathname === '/mtaa') return true;
    if (href === '/quizzes' && pathname === '/quizzes') return true;
    if (href === '/radio' && pathname === '/radio') return true;
    if (href === '/settings' && pathname === '/settings') return true;
    if (href.includes('view=') && pathname === '/feed') return true;
    if (pathname?.startsWith('/chat')) return true;
    return false;
  };

  return (
    <aside className="sidebar left-sidebar">
      {NAV_SECTIONS.map(section => (
        <div key={section.title} className="nav-section">
          <div className="nav-title">{section.title}</div>
          {section.items.map(item => (
            <Link
              key={item.label}
              href={item.isProfile ? `/profile/${user.id}` : item.href}
              className={cn('nav-item', isActive(item.href, item.isProfile) && 'active')}
            >
              <Icon name={item.icon} className="icon" />
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </Link>
          ))}
        </div>
      ))}

      {isAdmin && (
        <div className="nav-section">
          <div className="nav-title">Admin</div>
          <Link
            href="/admin"
            className={cn('nav-item', pathname?.startsWith('/admin') && 'active')}
          >
            <Icon name="shield" className="icon" />
            <span>Dashboard</span>
          </Link>
        </div>
      )}

      <div className="heshima-widget">
        <div className="heshima-ring">{user.heshima_score || 0}</div>
        <div>
          <strong>Heshima rating</strong>
          <span>Top contributor</span>
        </div>
      </div>
    </aside>
  );
}
