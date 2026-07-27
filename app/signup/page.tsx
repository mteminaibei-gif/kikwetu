'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Eye, EyeOff, Phone, ChevronLeft, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { analytics } from '@/lib/analytics';

const KENYAN_COUNTIES = [
  'Baringo','Bomet','Bungoma','Busia','Elgeyo Marakwet','Embu','Garissa','Homa Bay',
  'Isiolo','Kajiado','Kakamega','Kericho','Kiambu','Kilifi','Kirinyaga','Kisii',
  'Kisumu','Kitui','Kwale','Laikipia','Lamu','Machakos','Makueni','Mandera',
  'Marsabit','Meru','Migori','Mombasa','Muranga','Nairobi','Nakuru','Nandi',
  'Narok','Nyamira','Nyandarua','Nyeri','Samburu','Siaya','Taita Taveta',
  'Tana River','Tharaka Nithi','Trans Nzoia','Turkana','Uasin Gishu','Vihiga','Wajir','West Pokot',
];

const INTERESTS = [
  { id: 'agriculture', label: 'Agriculture', icon: '🌾' },
  { id: 'tech', label: 'Technology', icon: '💻' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'culture', label: 'Culture & Arts', icon: '🎭' },
  { id: 'education', label: 'Education', icon: '📚' },
  { id: 'health', label: 'Health', icon: '🏥' },
  { id: 'music', label: 'Music & Radio', icon: '🎵' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'cooking', label: 'Cooking & Food', icon: '🍲' },
  { id: 'fashion', label: 'Fashion', icon: '👗' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'safety', label: 'Community Safety', icon: '🛡️' },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    county: '',
  });
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const countyRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (step === 1) nameRef.current?.focus();
    else if (step === 2) passwordRef.current?.focus();
    else if (step === 3) countyRef.current?.focus();
  }, [step]);

  const getPasswordStrength = (pw: string) => {
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

  const getPasswordChecks = (pw: string) => [
    { label: '8+ characters', met: pw.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(pw) },
    { label: 'Lowercase letter', met: /[a-z]/.test(pw) },
    { label: 'Number', met: /[0-9]/.test(pw) },
    { label: 'Special character', met: /[^A-Za-z0-9]/.test(pw) },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (stepErrors[name]) setStepErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
    if (stepErrors.interests) setStepErrors((prev) => ({ ...prev, interests: '' }));
  };

  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.fullName || formData.fullName.trim().length < 2) {
      errors.fullName = 'Name must be at least 2 characters';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};
    if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      errors.password = 'Password must include uppercase, lowercase, and a number';
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.county) errors.county = 'Please select your county';
    if (selectedInterests.length < 3) errors.interests = 'Select at least 3 interests';
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setLoading(true);
    setError('');

    const { data, error: authError } = await supabase.auth.signUp({
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName.trim(),
          phone: formData.phone || undefined,
          county: formData.county,
          interests: selectedInterests,
        },
      },
    });

    if (authError) {
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
          county: formData.county,
          interests: selectedInterests,
          language: 'en',
          role: 'member',
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }

      router.push('/onboarding');
      router.refresh();
      analytics.signup('email');
    }

    setLoading(false);
  };

  const pwStrength = getPasswordStrength(formData.password);
  const pwChecks = getPasswordChecks(formData.password);

  const inputBaseStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px 12px 42px',
    border: '1px solid var(--line)',
    borderRadius: 14,
    background: 'var(--bg)',
    color: 'var(--text)',
    fontSize: '.86rem',
    transition: 'border-color .2s ease, box-shadow .2s ease',
    outline: 'none',
  };

  const primaryBtnStyle: React.CSSProperties = {
    fontWeight: 800,
    border: 0,
    borderRadius: 14,
    background: 'var(--gold)',
    color: 'oklch(31% .1 158)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'transform .18s ease, opacity .18s ease',
  };

  const secondaryBtnStyle: React.CSSProperties = {
    fontWeight: 800,
    borderRadius: 14,
    border: '1px solid var(--line)',
    background: 'var(--bg)',
    color: 'var(--text)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'transform .18s ease, background .18s ease',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: 6,
    fontSize: '.72rem',
    fontWeight: 800,
    color: 'var(--text3)',
    letterSpacing: '.08em',
    textTransform: 'uppercase' as const,
  };

  const focusCSS = `
    .signup-input:focus {
      border-color: var(--gold) !important;
      box-shadow: 0 0 0 4px oklch(73% .145 78 / .15);
    }
    .signup-select:focus {
      border-color: var(--gold) !important;
      box-shadow: 0 0 0 4px oklch(73% .145 78 / .15);
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .step-content {
      animation: fadeInUp .3s ease forwards;
    }
  `;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative' }}>
      <style>{focusCSS}</style>

      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 384, height: 384, background: 'var(--greenSoft)', borderRadius: '50%', filter: 'blur(80px)', opacity: .3 }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 384, height: 384, background: 'var(--goldSoft)', borderRadius: '50%', filter: 'blur(80px)', opacity: .2 }} />
      </div>

      <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>
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
            {step === 1 && 'Create your account'}
            {step === 2 && 'Set your password'}
            {step === 3 && 'Personalize your experience'}
          </h1>
          <p style={{ color: 'var(--text2)', textAlign: 'center', marginTop: 8, fontSize: '.86rem' }}>
            {step === 1 && 'Start your learning journey today'}
            {step === 2 && 'Choose a secure password'}
            {step === 3 && 'Tell us about yourself'}
          </p>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'center', alignItems: 'center' }}>
            {[1, 2, 3].map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: step >= s ? 'var(--gold)' : 'var(--line)',
                  transition: 'background .3s ease',
                }} />
                {i < 2 && (
                  <div style={{ width: 24, height: 2, borderRadius: 1, background: step > s ? 'var(--gold)' : 'var(--line)', transition: 'background .3s ease' }} />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, background: 'var(--redSoft)', color: 'var(--red)', fontSize: '.78rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={step === 3 ? handleSubmit : handleContinue} style={{ marginTop: 24 }}>
            {/* STEP 1: Name, Email, Phone */}
            {step === 1 && (
              <div className="step-content">
                <label style={labelStyle}>Full name</label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text3)' }} />
                  <input
                    ref={nameRef}
                    className="signup-input"
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    style={{
                      ...inputBaseStyle,
                      borderColor: stepErrors.fullName ? 'var(--red)' : undefined,
                    }}
                    placeholder="Your full name"
                  />
                </div>
                {stepErrors.fullName && (
                  <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 8, background: 'var(--redSoft)', color: 'var(--red)', fontSize: '.74rem' }}>
                    {stepErrors.fullName}
                  </div>
                )}

                <label style={{ ...labelStyle, marginTop: 16 }}>Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text3)' }} />
                  <input
                    ref={emailRef}
                    className="signup-input"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    style={{
                      ...inputBaseStyle,
                      borderColor: stepErrors.email ? 'var(--red)' : undefined,
                    }}
                    placeholder="you@example.com"
                  />
                </div>
                {stepErrors.email && (
                  <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 8, background: 'var(--redSoft)', color: 'var(--red)', fontSize: '.74rem' }}>
                    {stepErrors.email}
                  </div>
                )}

                <label style={{ ...labelStyle, marginTop: 16 }}>Phone number <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text3)', fontSize: '.74rem' }}>(optional, for M-Pesa)</span></label>
                <div style={{ position: 'relative' }}>
                  <Phone style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text3)' }} />
                  <input
                    className="signup-input"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    style={inputBaseStyle}
                    placeholder="0712 345 678"
                  />
                </div>

                <button
                  type="submit"
                  style={{ width: '100%', marginTop: 20, minHeight: 46, fontSize: '.84rem', ...primaryBtnStyle }}
                  onMouseOver={(e) => { (e.currentTarget).style.transform = 'translateY(-2px)'; }}
                  onMouseOut={(e) => { (e.currentTarget).style.transform = 'translateY(0)'; }}
                >
                  Continue
                </button>
              </div>
            )}

            {/* STEP 2: Password + Strength */}
            {step === 2 && (
              <div className="step-content">
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text3)' }} />
                  <input
                    ref={passwordRef}
                    className="signup-input"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    style={{
                      ...inputBaseStyle,
                      paddingRight: 42,
                      borderColor: stepErrors.password ? 'var(--red)' : undefined,
                    }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color .2s' }}
                    onMouseOver={(e) => { (e.currentTarget).style.color = 'var(--text)'; }}
                    onMouseOut={(e) => { (e.currentTarget).style.color = 'var(--text3)'; }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {stepErrors.password && (
                  <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 8, background: 'var(--redSoft)', color: 'var(--red)', fontSize: '.74rem' }}>
                    {stepErrors.password}
                  </div>
                )}

                {/* Strength bar */}
                {formData.password && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', marginBottom: 5 }}>
                      <span style={{ color: 'var(--text3)' }}>Password strength</span>
                      <span style={{ color: pwStrength.color, fontWeight: 700 }}>{pwStrength.label}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--line)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(pwStrength.score / 6) * 100}%`, background: pwStrength.color, borderRadius: 2, transition: 'all .3s ease' }} />
                    </div>

                    {/* Requirements checklist */}
                    <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                      {pwChecks.map((check) => (
                        <div key={check.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.72rem' }}>
                          <div style={{
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            display: 'grid',
                            placeItems: 'center',
                            background: check.met ? 'var(--green)' : 'var(--line)',
                            transition: 'background .2s ease',
                            flexShrink: 0,
                          }}>
                            {check.met && <Check size={9} color="white" strokeWidth={3} />}
                          </div>
                          <span style={{ color: check.met ? 'var(--green)' : 'var(--text3)', fontWeight: check.met ? 600 : 400, transition: 'color .2s ease' }}>{check.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <label style={{ ...labelStyle, marginTop: 16 }}>Confirm password</label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text3)' }} />
                  <input
                    className="signup-input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    style={{
                      ...inputBaseStyle,
                      paddingRight: 42,
                      borderColor: stepErrors.confirmPassword ? 'var(--red)' : undefined,
                    }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color .2s' }}
                    onMouseOver={(e) => { (e.currentTarget).style.color = 'var(--text)'; }}
                    onMouseOut={(e) => { (e.currentTarget).style.color = 'var(--text3)'; }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {stepErrors.confirmPassword && (
                  <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 8, background: 'var(--redSoft)', color: 'var(--red)', fontSize: '.74rem' }}>
                    {stepErrors.confirmPassword}
                  </div>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && !stepErrors.confirmPassword && (
                  <div style={{ marginTop: 6, fontSize: '.74rem', color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Check size={14} /> Passwords match
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(''); setStepErrors({}); }}
                    style={{ flex: 1, minHeight: 46, fontSize: '.84rem', ...secondaryBtnStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    onMouseOver={(e) => { (e.currentTarget).style.transform = 'translateY(-2px)'; }}
                    onMouseOut={(e) => { (e.currentTarget).style.transform = 'translateY(0)'; }}
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button
                    type="submit"
                    style={{ flex: 2, minHeight: 46, fontSize: '.84rem', ...primaryBtnStyle }}
                    onMouseOver={(e) => { (e.currentTarget).style.transform = 'translateY(-2px)'; }}
                    onMouseOut={(e) => { (e.currentTarget).style.transform = 'translateY(0)'; }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: County + Interests */}
            {step === 3 && (
              <div className="step-content">
                <label style={labelStyle}>County</label>
                <div style={{ position: 'relative' }}>
                  <select
                    ref={countyRef}
                    className="signup-select"
                    name="county"
                    value={formData.county}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: `1px solid ${stepErrors.county ? 'var(--red)' : 'var(--line)'}`,
                      borderRadius: 14,
                      background: 'var(--bg)',
                      color: formData.county ? 'var(--text)' : 'var(--text3)',
                      fontSize: '.86rem',
                      transition: 'border-color .2s ease, box-shadow .2s ease',
                      outline: 'none',
                      appearance: 'none' as const,
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">Select your county</option>
                    {KENYAN_COUNTIES.sort().map((county) => (
                      <option key={county} value={county}>{county}</option>
                    ))}
                  </select>
                  <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text3)' }}>
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
                {stepErrors.county && (
                  <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 8, background: 'var(--redSoft)', color: 'var(--red)', fontSize: '.74rem' }}>
                    {stepErrors.county}
                  </div>
                )}

                <label style={{ ...labelStyle, marginTop: 20 }}>
                  Interests <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text3)', fontSize: '.74rem' }}>(select at least 3)</span>
                </label>
                {stepErrors.interests && (
                  <div style={{ marginBottom: 8, padding: '6px 10px', borderRadius: 8, background: 'var(--redSoft)', color: 'var(--red)', fontSize: '.74rem' }}>
                    {stepErrors.interests}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {INTERESTS.map((interest) => {
                    const selected = selectedInterests.includes(interest.id);
                    return (
                      <button
                        key={interest.id}
                        type="button"
                        onClick={() => toggleInterest(interest.id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                          padding: '12px 6px',
                          borderRadius: 14,
                          border: `1.5px solid ${selected ? 'var(--gold)' : 'var(--line)'}`,
                          background: selected ? 'oklch(73% .145 78 / .1)' : 'var(--bg)',
                          cursor: 'pointer',
                          transition: 'all .2s ease',
                          transform: selected ? 'scale(1.03)' : 'scale(1)',
                          position: 'relative',
                          fontFamily: 'inherit',
                        }}
                        onMouseOver={(e) => { if (!selected) (e.currentTarget).style.borderColor = 'oklch(73% .145 78 / .4)'; }}
                        onMouseOut={(e) => { if (!selected) (e.currentTarget).style.borderColor = 'var(--line)'; }}
                      >
                        <span style={{ fontSize: '1.3rem' }}>{interest.icon}</span>
                        <span style={{ fontSize: '.7rem', fontWeight: 600, color: selected ? 'var(--gold)' : 'var(--text2)', lineHeight: 1.2, textAlign: 'center' }}>{interest.label}</span>
                        {selected && (
                          <div style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%', background: 'var(--gold)', display: 'grid', placeItems: 'center' }}>
                            <Check size={10} color="white" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 8, fontSize: '.72rem', color: 'var(--text3)', textAlign: 'center' }}>
                  {selectedInterests.length} of {INTERESTS.length} selected
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                  <button
                    type="button"
                    onClick={() => { setStep(2); setError(''); setStepErrors({}); }}
                    style={{ flex: 1, minHeight: 46, fontSize: '.84rem', ...secondaryBtnStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    onMouseOver={(e) => { (e.currentTarget).style.transform = 'translateY(-2px)'; }}
                    onMouseOut={(e) => { (e.currentTarget).style.transform = 'translateY(0)'; }}
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ flex: 2, minHeight: 46, fontSize: '.84rem', ...primaryBtnStyle, opacity: loading ? .7 : 1 }}
                    onMouseOver={(e) => { if (!loading) (e.currentTarget).style.transform = 'translateY(-2px)'; }}
                    onMouseOut={(e) => { (e.currentTarget).style.transform = 'translateY(0)'; }}
                  >
                    {loading ? 'Creating account...' : 'Create account'}
                  </button>
                </div>
              </div>
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
