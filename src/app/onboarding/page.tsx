import { Suspense } from 'react';
import OnboardingForm from '@/components/OnboardingForm';

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingForm />
    </Suspense>
  );
}
