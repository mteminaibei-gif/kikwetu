'use client';

import { useState, useEffect } from 'react';
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
import DesktopSidebar from '@/components/DesktopSidebar';
import RightSidebar from '@/components/RightSidebar';

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
      } catch { /* ignore */ }
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
  const isAuth = pathname?.startsWith('/auth') || pathname === '/onboarding';
  const isProfile = pathname?.startsWith('/profile');

  // Full-bleed layouts (landing, admin, auth, profile FB-style)
  if (isLanding || isAdmin || isAuth || isProfile) {
    return (
      <div className="flex flex-col min-h-screen">
        {!isAdmin && <Navbar />}
        <TutorialGate />
        <ConsentBanner />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        {!isAdmin && <MobileBottomNav />}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <TutorialGate />
      <ConsentBanner />

      <div className="flex-1 max-w-7xl mx-auto w-full flex justify-center gap-0 lg:gap-2">
        <DesktopSidebar />

        <main className="flex-1 min-w-0 max-w-[640px] w-full pb-24 md:pb-8 border-x border-gray-100/90 dark:border-gray-800/60 bg-white/40 dark:bg-brand-cardDark/40 backdrop-blur-[2px] min-h-[calc(100vh-64px)]">
          {children}
        </main>

        <RightSidebar />
      </div>

      <MobileBottomNav />
    </div>
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
