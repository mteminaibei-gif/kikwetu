'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import Icon from '@/components/Icon';

export default function MobileBottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  if (!user) return null;

  const isActive = (href: string) => {
    if (href === '/feed' && (pathname === '/feed' || pathname === '/')) return true;
    if (href === '/students' && (pathname === '/students' || pathname?.startsWith('/students'))) return true;
    if (href === '/chat' && pathname?.startsWith('/chat')) return true;
    if (href === '/profile' && pathname?.startsWith('/profile')) return true;
    if (href === '/home' && pathname === '/') return true;
    return false;
  };

  return (
    <nav className="mobile-nav">
      <Link href="/feed" className={cn(isActive('/feed') && 'active')}>
        <Icon name="house" className="icon" />
        <span>Home</span>
      </Link>
      <Link href="/students" className={cn(isActive('/students') && 'active')}>
        <Icon name="graduation-cap" className="icon" />
        <span>Learn</span>
      </Link>
      <button className="create-main" aria-label="Create">
        <Icon name="plus" className="icon-lg" />
        <span>Create</span>
      </button>
      <Link href="/chat" className={cn(isActive('/chat') && 'active')}>
        <Icon name="messages-square" className="icon" />
        <span>Chat</span>
      </Link>
      <Link href={`/profile/${user.id}`} className={cn(isActive('/profile') && 'active')}>
        <Icon name="user-round" className="icon" />
        <span>Profile</span>
      </Link>
    </nav>
  );
}
