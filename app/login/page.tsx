'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    setError('');

    const { error: magicError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (magicError) {
      setError(magicError.message);
    } else {
      setError('');
      alert('Check your email for the login link!');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 384, height: 384, background: 'var(--greenSoft)', borderRadius: '50%', filter: 'blur(80px)', opacity: .3 }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 384, height: 384, background: 'var(--goldSoft)', borderRadius: '50%', filter: 'blur(80px)', opacity: .2 }} />
      </div>

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 48, textDecoration: 'none', color: 'var(--text)' }}>
          <span className="mark" style={{ width: 42, height: 42, fontSize: '1.6rem' }}>k</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-.06em' }}>kikwetu<span style={{ color: 'var(--earth)' }}>.</span></span>
        </Link>

        <div className="section" style={{ padding: 32 }}>
          <div className="eyebrow" style={{ textAlign: 'center' }}>Welcome back</div>
          <h1 className="serif" style={{ fontSize: '2rem', textAlign: 'center', marginTop: 8 }}>Sign in to Kikwetu</h1>
          <p style={{ color: 'var(--text2)', textAlign: 'center', marginTop: 8, fontSize: '.86rem' }}>Continue your learning journey</p>

          {error && (
            <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, background: 'var(--redSoft)', color: 'var(--red)', fontSize: '.78rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: '.72rem', fontWeight: 800, color: 'var(--text3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text3)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '12px 14px 12px 42px', border: '1px solid var(--line)', borderRadius: 11, background: 'var(--bg)', color: 'var(--text)', fontSize: '.86rem' }}
                placeholder="you@example.com"
              />
            </div>

            <label style={{ display: 'block', marginTop: 16, marginBottom: 6, fontSize: '.72rem', fontWeight: 800, color: 'var(--text3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text3)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '12px 42px 12px 42px', border: '1px solid var(--line)', borderRadius: 11, background: 'var(--bg)', color: 'var(--text)', fontSize: '.86rem' }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="primary"
              style={{ width: '100%', marginTop: 20, minHeight: 44, fontSize: '.82rem' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            <span style={{ fontSize: '.72rem', color: 'var(--text3)' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </div>

          <button
            onClick={handleMagicLink}
            disabled={loading}
            className="secondary"
            style={{ width: '100%', minHeight: 44, fontSize: '.82rem' }}
          >
            <Mail size={18} /> Send magic link
          </button>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: '.82rem', color: 'var(--text3)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" style={{ color: 'var(--green)', fontWeight: 700, textDecoration: 'none' }}>
              Sign up
            </Link>
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: '.72rem', color: 'var(--text3)' }}>
          By signing in, you agree to our{' '}
          <Link href="/terms" style={{ color: 'var(--green)', textDecoration: 'none' }}>Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" style={{ color: 'var(--green)', textDecoration: 'none' }}>Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
