'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      if (!formData.fullName || !formData.email) {
        setError('Please fill in all fields');
        return;
      }
      setStep(2);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    const { data, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Create profile
      const username = formData.fullName.toLowerCase().replace(/\s+/g, '_').slice(0, 20);
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: data.user.id,
          username,
          full_name: formData.fullName,
          language: 'en',
          role: 'member',
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }

      router.push('/onboarding');
    }
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
          <div className="eyebrow" style={{ textAlign: 'center' }}>Join Kikwetu</div>
          <h1 className="serif" style={{ fontSize: '2rem', textAlign: 'center', marginTop: 8 }}>
            {step === 1 ? 'Create your account' : 'Set your password'}
          </h1>
          <p style={{ color: 'var(--text2)', textAlign: 'center', marginTop: 8, fontSize: '.86rem' }}>
            {step === 1 ? 'Start your learning journey today' : 'Choose a secure password'}
          </p>

          {/* Progress */}
          <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'center' }}>
            <div style={{ height: 4, width: 60, borderRadius: 99, background: step >= 1 ? 'var(--green)' : 'var(--line)' }} />
            <div style={{ height: 4, width: 60, borderRadius: 99, background: step >= 2 ? 'var(--green)' : 'var(--line)' }} />
          </div>

          {error && (
            <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, background: 'var(--redSoft)', color: 'var(--red)', fontSize: '.78rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
            {step === 1 ? (
              <>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '.72rem', fontWeight: 800, color: 'var(--text3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Full name</label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text3)' }} />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '12px 14px 12px 42px', border: '1px solid var(--line)', borderRadius: 11, background: 'var(--bg)', color: 'var(--text)', fontSize: '.86rem' }}
                    placeholder="Your full name"
                  />
                </div>

                <label style={{ display: 'block', marginTop: 16, marginBottom: 6, fontSize: '.72rem', fontWeight: 800, color: 'var(--text3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text3)' }} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '12px 14px 12px 42px', border: '1px solid var(--line)', borderRadius: 11, background: 'var(--bg)', color: 'var(--text)', fontSize: '.86rem' }}
                    placeholder="you@example.com"
                  />
                </div>

                <button type="submit" className="primary" style={{ width: '100%', marginTop: 20, minHeight: 44, fontSize: '.82rem' }}>
                  Continue
                </button>
              </>
            ) : (
              <>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '.72rem', fontWeight: 800, color: 'var(--text3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text3)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
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

                <label style={{ display: 'block', marginTop: 16, marginBottom: 6, fontSize: '.72rem', fontWeight: 800, color: 'var(--text3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Confirm password</label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text3)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '12px 14px 12px 42px', border: '1px solid var(--line)', borderRadius: 11, background: 'var(--bg)', color: 'var(--text)', fontSize: '.86rem' }}
                    placeholder="••••••••"
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button type="button" onClick={() => setStep(1)} className="secondary" style={{ flex: 1, minHeight: 44, fontSize: '.82rem' }}>
                    Back
                  </button>
                  <button type="submit" disabled={loading} className="primary" style={{ flex: 2, minHeight: 44, fontSize: '.82rem' }}>
                    {loading ? 'Creating account...' : 'Create account'}
                  </button>
                </div>
              </>
            )}
          </form>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: '.82rem', color: 'var(--text3)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--green)', fontWeight: 700, textDecoration: 'none' }}>
              Sign in
            </Link>
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: '.72rem', color: 'var(--text3)' }}>
          By signing up, you agree to our{' '}
          <Link href="/terms" style={{ color: 'var(--green)', textDecoration: 'none' }}>Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" style={{ color: 'var(--green)', textDecoration: 'none' }}>Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
