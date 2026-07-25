'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function WelcomeNote() {
  const params = useSearchParams();
  const show = params.get('welcome') === 'true';
  const [visible, setVisible] = useState(show);

  if (!visible) return null;

  return (
    <div className="bg-gradient-to-r from-brand-terracotta/10 to-brand-red/10 border border-brand-terracotta/30 rounded-2xl p-5 mb-6 text-center relative">
      <button
        onClick={() => setVisible(false)}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
      <p className="text-lg font-black text-brand-red">Karibu KikwetuConnect!</p>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
        Your email is verified. Start exploring communities, share knowledge, and earn Heshima.
      </p>
    </div>
  );
}
