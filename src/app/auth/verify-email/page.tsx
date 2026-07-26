'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const emailParam = searchParams.get('email') || '';
  const [email, setEmail] = useState(emailParam);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [message, setMessage] = useState('');

  const resend = async () => {
    if (!email.trim()) {
      setMessage('Enter the email you signed up with.');
      return;
    }
    setStatus('sending');
    setMessage('');
    try {
      const sb = createClient();
      const { error: err } = await sb.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/feed`,
        },
      });
      if (err) {
        setStatus('failed');
        setMessage(err.message);
        return;
      }
      setStatus('sent');
      setMessage('Verification email sent. Check your inbox and spam folder.');
    } catch (e) {
      setStatus('failed');
      setMessage(e instanceof Error ? e.message : 'Could not resend email');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-brand-bgLight dark:bg-brand-bgDark">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg space-y-5 text-center">
        <span className="text-4xl block">📧</span>
        <h1 className="text-xl font-black text-gray-900 dark:text-white">Verify your email</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          We sent a confirmation link to your inbox. Click it to activate your KikwetuConnect account.
        </p>

        {error === 'invalid' && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
            That verification link is invalid or expired. Request a new one below.
          </p>
        )}

        <div className="text-left space-y-2">
          <label className="text-xs font-bold text-gray-500">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
          />
        </div>

        <button
          onClick={resend}
          disabled={status === 'sending'}
          className="w-full bg-brand-red text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50"
        >
          {status === 'sending' ? 'Sending…' : 'Resend verification email'}
        </button>

        {message && (
          <p className={`text-xs ${status === 'failed' ? 'text-red-600' : 'text-emerald-600'}`}>{message}</p>
        )}

        <Link href="/onboarding" className="block text-sm font-bold text-brand-red hover:underline">
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-gray-500">Loading…</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
