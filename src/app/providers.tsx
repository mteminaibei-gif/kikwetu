'use client';

import { useState, useEffect } from 'react';
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
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user) { setChecked(true); return; }
    const sb = createClient();
    (async () => {
      try {
        const { data } = await sb.from('profiles').select('tutorial_completed, heshima_score').eq('id', user.id).single();
        if (data && !data.tutorial_completed && data.heshima_score <= 100) {
          setShow(true);
        }
      } catch {}
      setChecked(true);
    })();
  }, [user]);

  if (!checked || !show || !user) return null;

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
  const showBottomPad = !isLanding && !isAdmin;

  return (
    <>
      {!isAdmin && <Navbar />}
      <TutorialGate />
      <ConsentBanner />
      <main className={cn('flex-1 min-w-0 overflow-x-hidden', showBottomPad && 'pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0')}>
        {children}
      </main>
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
