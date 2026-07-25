'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase';

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

const MAX_AVATAR_MB = 2;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function ProfileSettingsForm() {
  const { user, updateProfile, refreshProfile } = useAuth();
  const { show } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const [name, setName] = useState(user?.full_name || '');
  const [handle, setHandle] = useState(user?.username || '');
  const [phone, setPhone] = useState(user?.phone?.replace('+254', '') || '');
  const [county, setCounty] = useState(user?.county || '');
  const [prefLang, setPrefLang] = useState(user?.preferred_lang || 'en');
  const [interests, setInterests] = useState<string[]>(user?.interests || []);

  const toggleInterest = (i: string) => {
    setInterests(prev => (prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      show('Use JPEG, PNG, WebP, or GIF.');
      return;
    }
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      show(`Image must be under ${MAX_AVATAR_MB}MB.`);
      return;
    }

    // Local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    try {
      const sb = createClient();
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await sb.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        // Fallback: try public path style if bucket policy needs folder
        show(uploadError.message || 'Upload failed. Ensure avatars bucket exists and is public.');
        setPreview(null);
        return;
      }

      const { data: urlData } = sb.storage.from('avatars').getPublicUrl(path);
      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) {
        show('Could not get public URL for avatar.');
        setPreview(null);
        return;
      }

      const { error: profileError } = await updateProfile({ avatar_url: publicUrl });
      if (profileError) {
        show(profileError);
        setPreview(null);
        return;
      }
      await refreshProfile();
      show('Avatar updated!');
    } catch (err) {
      show(err instanceof Error ? err.message : 'Avatar upload failed');
      setPreview(null);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      show('Name is required.');
      return;
    }
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
    if (error) {
      show(error);
      return;
    }
    show('Profile updated!');
  };

  if (!user) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Please sign in to edit your profile.
      </div>
    );
  }

  const displayAvatar = preview || user.avatar_url;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="sun-card p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-terracotta/20 to-brand-red/20 flex items-center justify-center text-3xl font-black text-brand-red mx-auto shadow-sm border-4 border-brand-terracotta/20 overflow-hidden">
              {displayAvatar ? (
                <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                name ? name[0].toUpperCase() : '?'
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-brand-red text-white shadow-lg flex items-center justify-center hover:bg-brand-deep transition-colors active:scale-95 disabled:opacity-60"
              aria-label="Upload avatar"
            >
              {uploading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tap the camera to upload (max {MAX_AVATAR_MB}MB · JPEG/PNG/WebP)
          </p>
          <h1 className="text-2xl font-black text-brand-deep dark:text-[#FDE8C8]">Profile Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Update your personal details</p>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 transition-shadow min-h-[44px]"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Username</label>
          <div className="flex">
            <span className="flex items-center px-3.5 bg-gray-100 dark:bg-gray-800 border border-r-0 border-gray-200 dark:border-gray-700 rounded-l-xl text-sm font-bold text-gray-500 dark:text-gray-400">
              @
            </span>
            <input
              type="text"
              value={handle}
              onChange={e => setHandle(e.target.value)}
              className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-r-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 transition-shadow min-h-[44px]"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">
            Phone <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="flex">
            <span className="flex items-center px-3.5 bg-gray-100 dark:bg-gray-800 border border-r-0 border-gray-200 dark:border-gray-700 rounded-l-xl text-sm font-bold text-emerald-600 dark:text-emerald-400">
              +254
            </span>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="712 345 678"
              className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-r-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 transition-shadow min-h-[44px]"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Primary County</label>
          <select value={county} onChange={e => setCounty(e.target.value)}
            className="sun-select w-full p-3.5 rounded-xl text-sm transition-shadow">

            <option value="">Select your county...</option>
            {COUNTIES.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Preferred Language</label>
          <div className="flex gap-2">
            {['en', 'sw', 'both'].map(l => (
              <button
                key={l}
                type="button"
                onClick={() => setPrefLang(l)}
                className={`flex-1 py-3 border-2 rounded-xl text-sm font-bold transition-all active:scale-[0.97] min-h-[44px] ${
                  prefLang === l
                    ? 'border-brand-terracotta bg-brand-terracotta/10 text-brand-red shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {l === 'en' ? 'English' : l === 'sw' ? 'Kiswahili' : 'Both'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block">Interests</label>
          <div className="flex flex-wrap gap-2">
            {ALL_INTERESTS.map(i => (
              <button
                key={i}
                type="button"
                onClick={() => toggleInterest(i)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 ${
                  interests.includes(i)
                    ? 'bg-brand-terracotta text-white border-brand-terracotta shadow-sm'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-gradient-to-r from-brand-terracotta to-brand-red hover:from-brand-red hover:to-brand-terracotta text-white font-bold py-3.5 rounded-xl text-sm shadow-lg transition-all disabled:opacity-50 active:scale-[0.98] min-h-[48px]"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
