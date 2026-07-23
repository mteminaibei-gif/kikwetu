'use client';

import { AuthProvider } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { ToastProvider } from '@/components/Toast';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { usePathname } from 'next/navigation';

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const isLanding = pathname === '/';
  return (
    <>
      {!isAdmin && <Navbar />}
      <main className={cn('flex-1', !isLanding && 'pb-20 md:pb-0')}>{children}</main>
      <MobileBottomNav />
    </>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
