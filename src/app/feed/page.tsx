'use client';

import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/LoadingSpinner';
import WelcomeNote from '@/components/WelcomeNote';

const FeedView = dynamic(() => import('@/components/FeedView'), { loading: () => <LoadingSpinner /> });

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const { loadThreads, loadSpaces } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) { router.push('/onboarding'); }
    if (user) { loadThreads(); loadSpaces(); }
  }, [user, authLoading, router, loadThreads, loadSpaces]);

  if (authLoading) return <LoadingSpinner />;
  return (
    <>
      <WelcomeNote />
      <FeedView />
    </>
  );
}
