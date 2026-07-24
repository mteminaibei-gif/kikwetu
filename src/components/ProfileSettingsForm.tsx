'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';

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

export default function ProfileSettingsForm() {
  const { user, updateProfile } = useAuth();
  const { show } = useToast();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(user?.full_name || '');
  const [handle, setHandle] = useState(user?.username || '');
  const [phone, setPhone] = useState(user?.phone?.replace('+254', '') || '');
  const [county, setCounty] = useState(user?.county || '');
  const [prefLang, setPrefLang] = useState(user?.preferred_lang || 'en');
  const [interests, setInterests] = useState<string[]>(user?.interests || []);

  const toggleInterest = (i: string) => {
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  const handleSave = async () => {
    if (!name.trim()) { show('Name is required.'); return; }
    setLoading(true);
    const { error } = await updateProfile({
      full_name: name,
      username: handle.trim() || name.toLowerCase().replace(/\s+/g, ''),
      phone: phone ? `+254${phone}` : undefined,
      county,
      preferred_lang: prefLang,
      interests,
    });
    setLoading(false);
    if (error) { show(error); return; }
    show('Profile updated!');
  };

  if (!user) return (
    <div className="text-center py-12 text-gray-400">Please sign in to edit your profile.</div>
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="sun-card p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-terracotta/20 to-brand-red/20 flex items-center justify-center text-3xl font-black text-brand-red mx-auto shadow-sm border-4 border-brand-terracotta/20">
            {name ? name[0].toUpperCase() : '?'}
          </div>
          <h1 className="text-2xl font-black">Profile Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Update your personal details</p>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Full Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 transition-shadow" />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Username</label>
          <div className="flex">
            <span className="flex items-center px-3.5 bg-gray-100 dark:bg-gray-800 border border-r-0 border-gray-200 dark:border-gray-700 rounded-l-xl text-sm font-bold text-gray-500 dark:text-gray-400">@</span>
            <input type="text" value={handle} onChange={e => setHandle(e.target.value)}
              className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-r-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 transition-shadow" />
          </div>
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

        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Primary County</label>
          <select value={county} onChange={e => setCounty(e.target.value)}
            className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 transition-shadow">
            <option value="">Select your county...</option>
            {COUNTIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Preferred Language</label>
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

        <button onClick={handleSave} disabled={loading}
          className="w-full bg-gradient-to-r from-brand-terracotta to-brand-red hover:from-brand-red hover:to-brand-terracotta text-white font-bold py-3.5 rounded-xl text-sm shadow-lg transition-all disabled:opacity-50 active:scale-[0.98]">
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
