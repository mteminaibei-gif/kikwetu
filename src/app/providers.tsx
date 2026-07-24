'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { ToastProvider } from '@/components/Toast';
import InteractiveTutorial from '@/components/InteractiveTutorial';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase';

function TutorialGate() {
  const { user } = useAuth();
  if (!user || user.heshima_score > 100) return null;
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (user && user.heshima_score === 100) {
      setShow(true);
    }
  }, [user]);

  if (!show) return null;

  return (
    <InteractiveTutorial onComplete={async () => {
      setShow(false);
      const sb = createClient();
      await sb.from('profiles').update({ tutorial_completed: true }).eq('id', user.id);
    }} />
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const isLanding = pathname === '/';
  return (
    <>
      {!isAdmin && <Navbar />}
      <TutorialGate />
      <main className={cn('flex-1', !isLanding && 'pb-20 md:pb-0')}>{children}</main>
      <MobileBottomNav />
    </>
  );
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
