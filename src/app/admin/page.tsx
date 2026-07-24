'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import AdminDashboard from '@/components/AdminDashboard';

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin) {
      router.push('/feed');
    }
  }, [user, isAdmin, loading, router]);

  if (loading) return null;
  if (!user || !isAdmin) return null;

  return <AdminDashboard />;
}
