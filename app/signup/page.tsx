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
  const [signupAttempts, setSignupAttempts] = useState(0);
  const [signupLockedUntil, setSignupLockedUntil] = useState<number | null>(null);
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 60000;

  const validatePassword = (pw: string): string[] => {
    const errors: string[] = [];
    if (pw.length < 8) errors.push('at least 8 characters');
    if (!/[A-Z]/.test(pw)) errors.push('one uppercase letter');
    if (!/[a-z]/.test(pw)) errors.push('one lowercase letter');
    if (!/[0-9]/.test(pw)) errors.push('one number');
    return errors;
  };

  const getPasswordStrength = (pw: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 2) return { score, label: 'Weak', color: 'var(--red)' };
    if (score <= 4) return { score, label: 'Fair', color: 'var(--gold)' };
    return { score, label: 'Strong', color: 'var(--green)' };
  };

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

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }

      setStep(2);
      return;
    }

    if (signupLockedUntil && Date.now() < signupLockedUntil) {
      const seconds = Math.ceil((signupLockedUntil - Date.now()) / 1000);
      setError(`Too many attempts. Try again in ${seconds}s`);
      setLoading(false);
      return;
    }

    if (signupAttempts >= MAX_ATTEMPTS) {
      const unlockTime = Date.now() + LOCKOUT_DURATION;
      setSignupLockedUntil(unlockTime);
      setError('Too many failed attempts. Please wait 1 minute.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const pwErrors = validatePassword(formData.password);
    if (pwErrors.length > 0) {
      setError(`Password needs ${pwErrors.join(', ')}`);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const { data, error: authError } = await supabase.auth.signUp({
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName.trim(),
        },
      },
    });

    if (authError) {
      setSignupAttempts(prev => prev + 1);
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const username = formData.fullName.toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .replace(/\s+/g, '_')
        .slice(0, 20);
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: data.user.id,
          username,
          full_name: formData.fullName.trim(),
          language: 'en',
          role: 'member',
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }

      router.push('/onboarding');
    }
  };

  const inputStyle = {
    width: '100%' as const,
    padding: '12px 14px 12px 42px',
    border: '1px solid var(--line)',
    borderRadius: 11,
    background: 'var(--bg)',
    color: 'var(--text)',
    fontSize: '.86rem',
    transition: 'border-color .2s ease, box-shadow .2s ease',
    outline: 'none',
  };

  const inputFocusCSS = `
    .signup-input:focus {
      border-color: var(--gold) !important;
      box-shadow: 0 0 0 4px oklch(73% .145 78 / .15);
    }
  `;

  const primaryBtnStyle = {
    fontWeight: 800 as const,
    border: 0,
    borderRadius: 11,
    background: 'var(--gold)',
    color: 'oklch(31% .1 158)',
    cursor: 'pointer' as const,
    fontFamily: 'inherit' as const,
    transition: 'transform .18s ease, background .18s ease',
  };

  const pwStrength = getPasswordStrength(formData.password);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative' }}>
      <style>{inputFocusCSS}</style>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 384, height: 384, background: 'var(--greenSoft)', borderRadius: '50%', filter: 'blur(80px)', opacity: .3 }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 384, height: 384, background: 'var(--goldSoft)', borderRadius: '50%', filter: 'blur(80px)', opacity: .2 }} />
      </div>

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        <Link href="/landing" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 32, textDecoration: 'none' }}>
          <span style={{
            display: 'inline-grid',
            placeItems: 'center',
            width: 40,
            height: 40,
            borderRadius: '13px 13px 13px 4px',
            background: 'oklch(31% .1 158)',
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: '1.7rem',
            color: 'oklch(98% .01 94)',
            boxShadow: '5px 6px 0 oklch(75% .15 78)',
            transform: 'rotate(-4deg)',
            lineHeight: 1,
            flexShrink: 0,
          }}>k</span>
          <span style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: '1.6rem',
            letterSpacing: '-.06em',
            fontWeight: 700,
            color: 'var(--text)',
            lineHeight: 1,
          }}>kikwetu<span style={{ color: 'var(--gold)' }}>.</span></span>
        </Link>

        <div style={{ padding: '32px 36px', borderRadius: 20, background: 'var(--surface)', boxShadow: '0 8px 32px oklch(24% .034 158 / .08), 0 1px 3px oklch(24% .034 158 / .06)', border: '1px solid var(--line)' }}>
          <div style={{ fontSize: '.72rem', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--gold)', textAlign: 'center' }}>Join Kikwetu</div>
          <h1 style={{ fontSize: '1.8rem', fontFamily: 'Fraunces, Georgia, serif', textAlign: 'center', marginTop: 8, fontWeight: 700 }}>
            {step === 1 ? 'Create your account' : 'Set your password'}
          </h1>
          <p style={{ color: 'var(--text2)', textAlign: 'center', marginTop: 8, fontSize: '.86rem' }}>
            {step === 1 ? 'Start your learning journey today' : 'Choose a secure password'}
          </p>

          {/* Step indicator dots */}
          <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'center', alignItems: 'center' }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: step >= 1 ? 'var(--gold)' : 'var(--line)',
              transition: 'background .3s ease',
            }} />
            <div style={{ width: 24, height: 2, borderRadius: 1, background: step >= 2 ? 'var(--gold)' : 'var(--line)', transition: 'background .3s ease' }} />
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: step >= 2 ? 'var(--gold)' : 'var(--line)',
              transition: 'background .3s ease',
            }} />
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
                    className="signup-input"
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                    placeholder="Your full name"
                  />
                </div>

                <label style={{ display: 'block', marginTop: 16, marginBottom: 6, fontSize: '.72rem', fontWeight: 800, color: 'var(--text3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text3)' }} />
                  <input
                    className="signup-input"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                    placeholder="you@example.com"
                  />
                </div>

                <button
                  type="submit"
                  className="signup-input"
                  style={{ width: '100%', marginTop: 20, minHeight: 44, fontSize: '.82rem', ...primaryBtnStyle }}
                  onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.background = 'oklch(82% .13 78)'; }}
                  onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--gold)'; }}
                >
                  Continue
                </button>
              </>
            ) : (
              <>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '.72rem', fontWeight: 800, color: 'var(--text3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text3)' }} />
                  <input
                    className="signup-input"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    style={{ ...inputStyle, paddingRight: 42 }}
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

                {formData.password && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', marginBottom: 4 }}>
                      <span style={{ color: 'var(--text3)' }}>Password strength</span>
                      <span style={{ color: pwStrength.color, fontWeight: 600 }}>{pwStrength.label}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--line)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(pwStrength.score / 6) * 100}%`, background: pwStrength.color, borderRadius: 2, transition: 'all .3s ease' }} />
                    </div>
                  </div>
                )}

                <label style={{ display: 'block', marginTop: 16, marginBottom: 6, fontSize: '.72rem', fontWeight: 800, color: 'var(--text3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Confirm password</label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text3)' }} />
                  <input
                    className="signup-input"
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                    placeholder="••••••••"
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                      flex: 1,
                      minHeight: 44,
                      fontSize: '.82rem',
                      fontWeight: 800,
                      borderRadius: 11,
                      border: '1px solid var(--line)',
                      background: 'var(--bg)',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'transform .18s ease, background .18s ease',
                    }}
                    onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; }}
                    onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ flex: 2, minHeight: 44, fontSize: '.82rem', ...primaryBtnStyle }}
                    onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.background = 'oklch(82% .13 78)'; }}
                    onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--gold)'; }}
                  >
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

        <p style={{ marginTop: 16, textAlign: 'center', fontFamily: 'Fraunces, Georgia, serif', fontSize: '.82rem', color: 'var(--text3)', fontStyle: 'italic' }}>Kenya in conversation</p>

        <div style={{ marginTop: 16, textAlign: 'center', fontSize: '.72rem', color: 'var(--text3)' }}>
          By signing up, you agree to our{' '}
          <Link href="/terms" style={{ color: 'var(--green)', textDecoration: 'none' }}>Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" style={{ color: 'var(--green)', textDecoration: 'none' }}>Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
