'use client';

import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/LoadingSpinner';

const StudentPlatform = dynamic(() => import('@/components/StudentPlatform'), { loading: () => <LoadingSpinner /> });

export default function StudentsPage() {
  return <StudentPlatform />;
}
