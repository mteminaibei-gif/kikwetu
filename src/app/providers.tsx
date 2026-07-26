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
import DesktopSidebar from '@/components/DesktopSidebar';
import RightSidebar from '@/components/RightSidebar';

function TutorialGate() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user) { setChecked(true); return; }
    setChecked(true);
  }, [user]);

  if (!checked || !show || !user) return null;

  return <InteractiveTutorial onComplete={async () => { setShow(false); }} />;
}

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const isLanding = pathname === '/';

  if (isLanding || isAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {!isAdmin && <Navbar />}
        <TutorialGate />
        <ConsentBanner />
        <main style={{ flex: 1 }}>{children}</main>
        {!isAdmin && <MobileBottomNav />}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <TutorialGate />
      <ConsentBanner />
      <div className="app-layout">
        <DesktopSidebar />
        <main className="page">{children}</main>
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
