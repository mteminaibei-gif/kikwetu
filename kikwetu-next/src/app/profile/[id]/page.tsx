'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProfileView from '@/components/ProfileView';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  useEffect(() => {
    if (!authLoading && !user) router.push('/onboarding');
  }, [user, authLoading, router]);

  if (authLoading) return <LoadingSpinner />;
  return <ProfileView profileId={id} />;
}
