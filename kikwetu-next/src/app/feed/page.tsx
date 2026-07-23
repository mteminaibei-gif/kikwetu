'use client';

import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FeedView from '@/components/FeedView';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const { loadThreads, loadSpaces } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) { router.push('/onboarding'); return; }
    loadThreads();
    loadSpaces();
  }, [user, authLoading, router, loadThreads, loadSpaces]);

  if (authLoading) return <LoadingSpinner />;
  return <FeedView />;
}
