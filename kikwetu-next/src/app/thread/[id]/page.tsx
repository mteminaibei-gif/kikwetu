'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ThreadView from '@/components/ThreadView';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ThreadPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  useEffect(() => {
    if (!authLoading && !user) router.push('/onboarding');
  }, [user, authLoading, router]);

  if (authLoading) return <LoadingSpinner />;
  return <ThreadView threadId={id} />;
}
