'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { AppProvider } from '@/context/AppContext';
import { ToastProvider } from '@/components/Toast';
import InteractiveTutorial from '@/components/InteractiveTutorial';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import ConsentBanner from '@/components/ConsentBanner';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase';

function TutorialGate() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const shouldShow = user && user.heshima_score === 100 && !show;

  if (!user || user.heshima_score > 100 || (!shouldShow && !show)) return null;

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
      <ConsentBanner />
      <main className={cn('flex-1', !isLanding && 'pb-20 md:pb-0')}>{children}</main>
      <MobileBottomNav />
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <LanguageProvider>
          <AppProvider>
            <AppShell>{children}</AppShell>
          </AppProvider>
        </LanguageProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
