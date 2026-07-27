'use client';

import React, { useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const { user } = useApp();

  useEffect(() => {
    if (user) {
      router.replace('/baraza');
    } else {
      router.replace('/landing');
    }
  }, [user, router]);

  return (
    <AppLayout>
      <div className="page">
        <div className="skeleton" style={{ height: 400 }} />
      </div>
    </AppLayout>
  );
}
