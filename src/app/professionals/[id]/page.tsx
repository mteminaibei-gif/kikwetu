'use client';

import { useParams } from 'next/navigation';
import ProfessionalProfile from '@/components/ProfessionalProfile';

export default function ProfessionalProfilePage() {
  const params = useParams();
  return <ProfessionalProfile professionalId={params.id as string} />;
}
