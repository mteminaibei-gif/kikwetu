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

import DesktopSidebar from '@/components/DesktopSidebar';
import RightSidebar from '@/components/RightSidebar';

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const isLanding = pathname === '/';
  
  if (isLanding || isAdmin) {
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
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0a0a0a]">
      <Navbar />
      <TutorialGate />
      <ConsentBanner />
      
      <div className="flex-1 max-w-7xl mx-auto w-full flex justify-center">
        <DesktopSidebar />
        
        <main className="flex-1 min-w-0 max-w-[600px] w-full pb-20 md:pb-0 px-0 md:px-4 lg:px-8 border-x-0 md:border-x border-gray-100 dark:border-gray-800/50 bg-white dark:bg-brand-cardDark min-h-[calc(100vh-64px)] shadow-sm">
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
