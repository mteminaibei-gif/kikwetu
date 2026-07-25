'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { useRouter, useSearchParams } from 'next/navigation';

const ALL_INTERESTS = [
  '#KilimoSmart', 'Tech Kenya', 'Education', 'Health',
  'Culture', 'Business', 'Sports', 'Politics',
];

const COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Trans-Nzoia', 'Uasin Gishu',
  'Kiambu', 'Kilifi', 'Meru', 'Nyeri', 'Machakos', 'Kajiado', 'Bungoma',
  'Kakamega', 'Siaya', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira', 'Kericho',
  'Bomet', 'Nandi', 'Elgeyo-Marakwet', 'Turkana', 'West Pokot', 'Samburu',
  'Marsabit', 'Isiolo', 'Garissa', 'Wajir', 'Mandera', 'Lamu', 'Tana River',
  'Taita-Taveta', 'Kwale', 'Makueni', 'Kitui', 'Embu', 'Tharaka-Nithi',
  'Kirinyaga', 'Muranga', 'Nyandarua', 'Laikipia', 'Narok', 'Vihiga', 'Busia',
  'Baringo',
];

export default function OnboardingForm() {
  const { signUp, signIn, signInWithGoogle } = useAuth();
  const { show } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<'login' | 'signup'>(searchParams.get('tab') === 'login' ? 'login' : 'signup');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [phone, setPhone] = useState('');
  const [county, setCounty] = useState('');
  const [prefLang, setPrefLang] = useState('en');
  const [interests, setInterests] = useState<string[]>([]);

  const toggleInterest = (i: string) => {
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  const handleSignUp = async () => {
    if (!email || !password || password.length < 6) {
      show('Email and password (min 6 chars) are required.');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, {
      full_name: name,
      username: handle || name.toLowerCase().replace(/\s+/g, ''),
      phone,
      county,
      preferred_lang: prefLang,
      interests,
    });
    setLoading(false);
    if (error) { show(error); return; }
    show('Karibu KikwetuConnect!');
    router.push('/feed');
  };

  const handleLogin = async () => {
    if (!email || !password) { show('Please enter email and password.'); return; }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) { show(error); return; }
    show('Karibu back!');
    router.push('/feed');
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-8 bg-gradient-to-b from-brand-bgLight to-white dark:from-brand-bgDark dark:to-brand-cardDark">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <img src="/logo-icon.svg" alt="KikwetuConnect" className="h-14 mx-auto" />
          <h2 className="text-2xl font-black">
            {mode === 'login' ? 'Welcome Back' : 'Join KikwetuConnect'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {mode === 'login' ? 'Enter your details to continue' : 'Create your account to start sharing'}
          </p>
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1.5">
          <button onClick={() => { setMode('signup'); setStep(1); }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${mode === 'signup' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-red' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            Sign Up
          </button>
          <button onClick={() => { setMode('login'); setStep(1); }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${mode === 'login' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-red' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            Log In
          </button>
        </div>

        {mode === 'login' ? (
          <div className="space-y-4 sun-card p-6">
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 transition-shadow" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Your password" onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 transition-shadow" />
            </div>
            <button onClick={handleLogin} disabled={loading}
              className="w-full bg-gradient-to-r from-brand-deep to-brand-deep/90 hover:from-brand-deep/90 hover:to-brand-deep text-white font-bold py-3.5 rounded-xl text-sm shadow-lg transition-all disabled:opacity-50 active:scale-[0.98]">
              {loading ? 'Loading...' : 'Log In'}
            </button>
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-white dark:bg-gray-900 px-3 text-gray-400">or</span></div>
            </div>
            <button onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-sm font-medium active:scale-[0.98]">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
          </div>
        ) : step === 1 ? (
          <div className="space-y-4 sun-card p-6">
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Samwel Nyamu"
                className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 transition-shadow" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Email <span className="text-brand-red">*</span></label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 transition-shadow" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Password <span className="text-brand-red">*</span></label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Min 6 characters" minLength={6}
                className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 transition-shadow" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
              <div className="flex">
                <span className="flex items-center px-3.5 bg-gray-100 dark:bg-gray-800 border border-r-0 border-gray-200 dark:border-gray-700 rounded-l-xl text-sm font-bold text-emerald-600 dark:text-emerald-400">+254</span>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="712 345 678"
                  className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-r-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 transition-shadow" />
              </div>
            </div>
            <button onClick={() => setStep(2)}
              className="w-full bg-gradient-to-r from-brand-terracotta to-brand-red hover:from-brand-red hover:to-brand-terracotta text-white font-bold py-3.5 rounded-xl text-sm shadow-lg transition-all active:scale-[0.98]">
              Continue
            </button>
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-white dark:bg-gray-900 px-3 text-gray-400">or</span></div>
            </div>
            <button onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-sm font-medium active:scale-[0.98]">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
          </div>
        ) : step === 2 ? (
          <div className="space-y-4 sun-card p-6">
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Primary County</label>
              <select value={county} onChange={e => setCounty(e.target.value)}
                className="sun-select w-full p-3.5 rounded-xl text-sm">
                <option value="">Select your county...</option>
                {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Language</label>
              <div className="flex gap-2">
                {['en', 'sw', 'both'].map(l => (
                  <button key={l} onClick={() => setPrefLang(l)}
                    className={`flex-1 py-3 border-2 rounded-xl text-sm font-bold transition-all active:scale-[0.97] ${
                      prefLang === l ? 'border-brand-terracotta bg-brand-terracotta/10 text-brand-red shadow-sm' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}>
                    {l === 'en' ? 'English' : l === 'sw' ? 'Kiswahili' : 'Both'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block">Interests</label>
              <div className="flex flex-wrap gap-2">
                {ALL_INTERESTS.map(i => (
                  <button key={i} onClick={() => toggleInterest(i)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 ${
                      interests.includes(i) ? 'bg-brand-terracotta text-white border-brand-terracotta shadow-sm' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}>
                    {i}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setStep(1)}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-[0.98]">
                Back
              </button>
              <button onClick={() => setStep(3)}
                className="flex-1 bg-gradient-to-r from-brand-terracotta to-brand-red hover:from-brand-red hover:to-brand-terracotta text-white font-bold py-3.5 rounded-xl text-sm shadow-lg transition-all active:scale-[0.98]">
                Continue
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sun-card p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-terracotta/20 to-brand-red/20 flex items-center justify-center text-4xl font-black text-brand-red border-4 border-brand-terracotta/30 shadow-sm">
                {name ? name[0].toUpperCase() : '?'}
              </div>
              <div className="w-full">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Username</label>
                <div className="flex">
                  <span className="flex items-center px-3.5 bg-gray-100 dark:bg-gray-800 border border-r-0 border-gray-200 dark:border-gray-700 rounded-l-xl text-sm font-bold text-gray-500 dark:text-gray-400">@</span>
                  <input type="text" value={handle} onChange={e => setHandle(e.target.value)}
                    placeholder={name.toLowerCase().replace(/\s+/g, '')}
                    onKeyDown={e => e.key === 'Enter' && handleSignUp()}
                    className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-r-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 transition-shadow" />
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center">Your Heshima starts at 100. Earn more by helping the community!</p>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setStep(2)}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-[0.98]">
                Back
              </button>
              <button onClick={handleSignUp} disabled={loading}
                className="flex-1 bg-gradient-to-r from-brand-deep to-brand-deep/90 hover:from-brand-deep/90 hover:to-brand-deep text-white font-bold py-3.5 rounded-xl text-sm shadow-lg transition-all disabled:opacity-50 active:scale-[0.98]">
                {loading ? 'Creating...' : 'Enter Kikwetu'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
