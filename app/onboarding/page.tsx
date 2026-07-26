'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { updateProfile } from '@/lib/supabase-helpers';
import { useApp } from '@/components/AppLayout';
import {
  MapPin, Globe, Sparkles, ChevronRight, Check, ChevronLeft,
  Camera, Briefcase, GraduationCap, Star,
  MessageCircle, AtSign, ThumbsUp, CalendarClock,
  ShieldAlert, Lightbulb, ShoppingBag, PartyPopper
} from 'lucide-react';

const KENYAN_COUNTIES = [
  'Baringo','Bomet','Bungoma','Busia','Elgeyo Marakwet','Embu','Garissa','Homa Bay',
  'Isiolo','Kajiado','Kakamega','Kericho','Kiambu','Kilifi','Kirinyaga','Kisii',
  'Kisumu','Kitui','Kwale','Laikipia','Lamu','Machakos','Makueni','Mandera',
  'Marsabit','Meru','Migori','Mombasa','Muranga','Nairobi','Nakuru','Nandi',
  'Narok','Nyamira','Nyandarua','Nyeri','Samburu','Siaya','Taita Taveta',
  'Tana River','Tharaka Nithi','Trans Nzoia','Turkana','Uasin Gishu','Vihiga','Wajir','West Pokot',
];

const INTERESTS = [
  { label: 'Agriculture', icon: '🌾' },
  { label: 'Tech', icon: '💻' },
  { label: 'Biashara', icon: '💼' },
  { label: 'Culture', icon: '🎭' },
  { label: 'Education', icon: '📚' },
  { label: 'Legal Rights', icon: '⚖️' },
  { label: 'Health', icon: '🏥' },
  { label: 'Environment', icon: '🌿' },
  { label: 'County Politics', icon: '🏛️' },
  { label: 'Sports', icon: '⚽' },
  { label: 'Music', icon: '🎵' },
  { label: 'Food', icon: '🍽️' },
  { label: 'Fashion', icon: '👗' },
];

const TEACHING_LEVELS = ['Primary', 'Secondary', 'University', 'Professional'];

const TOTAL_STEPS = 6;

export default function OnboardingPage() {
  const router = useRouter();
  const { showToast, user, setUser } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  // Step 1
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('en');

  // Step 2
  const [countySearch, setCountySearch] = useState('');
  const [countyDropdownOpen, setCountyDropdownOpen] = useState(false);
  const [county, setCounty] = useState('');
  const [role, setRole] = useState('');
  const [bio, setBio] = useState('');

  // Step 3
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Step 4
  const [notifications, setNotifications] = useState({
    replies: true, mentions: true, upvotes: true,
    sessionReminders: true, nyumbaKumi: true, tips: true, marketplace: true,
  });

  // Step 5
  const [expertiseAreas, setExpertiseAreas] = useState('');
  const [teachingLevels, setTeachingLevels] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState('');
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);

  const filteredCounties = KENYAN_COUNTIES.filter(c =>
    c.toLowerCase().includes(countySearch.toLowerCase())
  );

  const toggleInterest = (label: string) => {
    setSelectedInterests(prev =>
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  };

  const toggleTeachingLevel = (level: string) => {
    setTeachingLevels(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;
    try {
      const ext = avatarFile.name.split('.').pop() || 'jpg';
      const filePath = `${userId}.${ext}`;
      const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      return data.publicUrl;
    } catch {
      return null;
    }
  };

  const goNext = () => {
    setTransitioning(true);
    setTimeout(() => {
      setStep(s => Math.min(s + 1, TOTAL_STEPS));
      setTransitioning(false);
    }, 200);
  };

  const goBack = () => {
    setTransitioning(true);
    setTimeout(() => {
      setStep(s => Math.max(s - 1, 1));
      setTransitioning(false);
    }, 200);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const avatarUrl = await uploadAvatar(authUser.id);

      const updates: Record<string, any> = {
        full_name: fullName,
        username,
        county,
        language,
        role,
        bio: bio || null,
        interests: selectedInterests,
        notification_preferences: notifications,
      };

      if (avatarUrl) updates.avatar_url = avatarUrl;

      if (role === 'Professional') {
        updates.expertise_areas = expertiseAreas;
        updates.teaching_levels = teachingLevels;
        updates.hourly_rate = hourlyRate ? Number(hourlyRate) : null;
        updates.mpesa_number = mpesaNumber || null;
      }

      const { error } = await updateProfile(authUser.id, updates);
      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (profile && setUser) setUser(profile);
    } catch (err) {
      console.log('Onboarding save:', err);
    }

    showToast('Welcome to Kikwetu!');
    setLoading(false);
    router.push('/');
  };

  const step1Valid = fullName.trim().length > 0 && username.trim().length > 0;
  const step2Valid = county.length > 0 && role.length > 0;
  const step3Valid = selectedInterests.length >= 3;
  const step5Valid = role !== 'Professional' || (expertiseAreas.trim().length > 0 && teachingLevels.length > 0 && agreedTerms);

  const canProceed = () => {
    switch (step) {
      case 1: return step1Valid;
      case 2: return step2Valid;
      case 3: return step3Valid;
      case 4: return true;
      case 5: return step5Valid;
      default: return true;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        {/* Progress */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              style={{
                height: 4,
                flex: 1,
                borderRadius: 99,
                background: step > i ? 'var(--green)' : step === i ? 'var(--gold)' : 'var(--line)',
                transition: 'background .3s ease',
              }}
            />
          ))}
        </div>

        <div
          className="section"
          style={{
            padding: 32,
            opacity: transitioning ? 0.5 : 1,
            transform: transitioning ? 'translateY(6px)' : 'translateY(0)',
            transition: 'opacity .2s ease, transform .2s ease',
          }}
        >
          {/* ============ STEP 1: Welcome & Identity ============ */}
          {step === 1 && (
            <div className="animate-rise">
              <div className="eyebrow" style={{ textAlign: 'center' }}>Step 1 of {TOTAL_STEPS}</div>
              <h1 className="serif" style={{ fontSize: '1.8rem', textAlign: 'center', marginTop: 8 }}>
                Who are you?
              </h1>
              <p style={{ color: 'var(--text2)', textAlign: 'center', marginTop: 8, fontSize: '.86rem' }}>
                Let&apos;s set up your Kikwetu identity.
              </p>

              {/* Avatar upload */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: '50%',
                    background: avatarPreview ? 'none' : 'var(--greenSoft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: '3px dashed var(--green)',
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'border-color .18s ease',
                  }}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Camera size={28} style={{ color: 'var(--green)' }} />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
              </div>
              <p style={{ textAlign: 'center', marginTop: 8, fontSize: '.72rem', color: 'var(--text3)' }}>
                Add a photo (optional)
              </p>

              {/* Full name */}
              <div style={{ marginTop: 20 }}>
                <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 800, color: 'var(--text2)', marginBottom: 6, letterSpacing: '.05em', textTransform: 'uppercase' }}>
                  Full name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Amina Wanjiku"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  style={{ minHeight: 44 }}
                />
              </div>

              {/* Username */}
              <div style={{ marginTop: 14 }}>
                <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 800, color: 'var(--text2)', marginBottom: 6, letterSpacing: '.05em', textTransform: 'uppercase' }}>
                  Username
                </label>
                <input
                  type="text"
                  placeholder="e.g. amina_w"
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  style={{ minHeight: 44 }}
                />
              </div>

              {/* Language */}
              <div style={{ marginTop: 20 }}>
                <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 800, color: 'var(--text2)', marginBottom: 10, letterSpacing: '.05em', textTransform: 'uppercase' }}>
                  Preferred language
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { code: 'en', label: 'English' },
                    { code: 'sw', label: 'Kiswahili' },
                    { code: 'sheng', label: 'Sheng' },
                  ].map(l => (
                    <button
                      key={l.code}
                      onClick={() => setLanguage(l.code)}
                      style={{
                        padding: '12px 8px',
                        border: language === l.code ? '2px solid var(--green)' : '1px solid var(--line)',
                        borderRadius: 11,
                        background: language === l.code ? 'var(--greenSoft)' : 'var(--bg)',
                        color: language === l.code ? 'var(--green2)' : 'var(--text)',
                        fontSize: '.82rem',
                        fontWeight: language === l.code ? 800 : 500,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all .18s ease',
                      }}
                    >
                      {l.label}
                      {language === l.code && <Check size={14} style={{ marginLeft: 4, verticalAlign: '-2px' }} />}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={goNext} disabled={!step1Valid} className="primary"
                style={{ width: '100%', marginTop: 24, minHeight: 44, fontSize: '.82rem', opacity: step1Valid ? 1 : .5 }}
              >
                Continue <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ============ STEP 2: Location & Role ============ */}
          {step === 2 && (
            <div className="animate-rise">
              <div className="eyebrow" style={{ textAlign: 'center' }}>Step 2 of {TOTAL_STEPS}</div>
              <h1 className="serif" style={{ fontSize: '1.8rem', textAlign: 'center', marginTop: 8 }}>
                Where & who?
              </h1>
              <p style={{ color: 'var(--text2)', textAlign: 'center', marginTop: 8, fontSize: '.86rem' }}>
                We&apos;ll connect you with the right community.
              </p>

              {/* County dropdown */}
              <div style={{ marginTop: 24, position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 800, color: 'var(--text2)', marginBottom: 6, letterSpacing: '.05em', textTransform: 'uppercase' }}>
                  County
                </label>
                <div
                  onClick={() => setCountyDropdownOpen(!countyDropdownOpen)}
                  style={{
                    padding: '12px 14px',
                    border: countyDropdownOpen ? '2px solid var(--green)' : '1px solid var(--line)',
                    borderRadius: 11,
                    background: 'var(--bg)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: 44,
                  }}
                >
                  <span style={{ color: county ? 'var(--text)' : 'var(--text3)', fontSize: '.86rem' }}>
                    <MapPin size={14} style={{ marginRight: 6, verticalAlign: '-2px' }} />
                    {county || 'Select your county'}
                  </span>
                  <ChevronRight size={16} style={{
                    color: 'var(--text3)',
                    transform: countyDropdownOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform .2s ease',
                  }} />
                </div>

                {countyDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    border: '1px solid var(--line)',
                    borderRadius: 11,
                    background: 'var(--surface)',
                    boxShadow: 'var(--shadow2)',
                    zIndex: 20,
                    maxHeight: 220,
                    overflow: 'auto',
                  }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--line)' }}>
                      <input
                        type="text"
                        placeholder="Search counties..."
                        value={countySearch}
                        onChange={e => setCountySearch(e.target.value)}
                        style={{ fontSize: '.82rem', padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 8 }}
                        autoFocus
                      />
                    </div>
                    {filteredCounties.map(c => (
                      <div
                        key={c}
                        onClick={() => { setCounty(c); setCountyDropdownOpen(false); setCountySearch(''); }}
                        style={{
                          padding: '10px 14px',
                          fontSize: '.82rem',
                          cursor: 'pointer',
                          background: county === c ? 'var(--greenSoft)' : 'transparent',
                          color: county === c ? 'var(--green2)' : 'var(--text)',
                          fontWeight: county === c ? 800 : 500,
                          borderBottom: '1px solid var(--line)',
                          transition: 'background .15s ease',
                        }}
                        onMouseEnter={e => { if (county !== c) e.currentTarget.style.background = 'var(--bg)'; }}
                        onMouseLeave={e => { if (county !== c) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {c}
                      </div>
                    ))}
                    {filteredCounties.length === 0 && (
                      <div style={{ padding: '16px 14px', fontSize: '.82rem', color: 'var(--text3)', textAlign: 'center' }}>
                        No counties found
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Role selector */}
              <div style={{ marginTop: 20 }}>
                <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 800, color: 'var(--text2)', marginBottom: 10, letterSpacing: '.05em', textTransform: 'uppercase' }}>
                  I am a...
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {[
                    { value: 'Student', icon: GraduationCap, label: 'Student' },
                    { value: 'Professional', icon: Briefcase, label: 'Professional' },
                    { value: 'Parent', icon: Star, label: 'Parent' },
                    { value: 'General Member', icon: Globe, label: 'General' },
                  ].map(r => {
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.value}
                        onClick={() => setRole(r.value)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '14px',
                          border: role === r.value ? '2px solid var(--green)' : '1px solid var(--line)',
                          borderRadius: 11,
                          background: role === r.value ? 'var(--greenSoft)' : 'var(--bg)',
                          color: role === r.value ? 'var(--green2)' : 'var(--text)',
                          fontSize: '.82rem',
                          fontWeight: role === r.value ? 800 : 500,
                          cursor: 'pointer',
                          transition: 'all .18s ease',
                        }}
                      >
                        <Icon size={18} />
                        {r.label}
                        {role === r.value && <Check size={16} style={{ marginLeft: 'auto' }} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bio */}
              <div style={{ marginTop: 20 }}>
                <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 800, color: 'var(--text2)', marginBottom: 6, letterSpacing: '.05em', textTransform: 'uppercase' }}>
                  Bio (optional)
                </label>
                <textarea
                  placeholder="Tell us a little about yourself..."
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={3}
                  style={{ resize: 'none', fontSize: '.86rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button onClick={goBack} className="secondary" style={{ flex: 1, minHeight: 44, fontSize: '.82rem' }}>
                  <ChevronLeft size={16} /> Back
                </button>
                <button onClick={goNext} disabled={!step2Valid} className="primary"
                  style={{ flex: 2, minHeight: 44, fontSize: '.82rem', opacity: step2Valid ? 1 : .5 }}
                >
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ============ STEP 3: Interests ============ */}
          {step === 3 && (
            <div className="animate-rise">
              <div className="eyebrow" style={{ textAlign: 'center' }}>Step 3 of {TOTAL_STEPS}</div>
              <h1 className="serif" style={{ fontSize: '1.8rem', textAlign: 'center', marginTop: 8 }}>
                What interests you?
              </h1>
              <p style={{ color: 'var(--text2)', textAlign: 'center', marginTop: 8, fontSize: '.86rem' }}>
                Pick at least 3 to personalize your feed.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24 }}>
                {INTERESTS.map(int => {
                  const selected = selectedInterests.includes(int.label);
                  return (
                    <button
                      key={int.label}
                      onClick={() => toggleInterest(int.label)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 16px',
                        border: selected ? '2px solid var(--green)' : '1px solid var(--line)',
                        borderRadius: 99,
                        background: selected ? 'var(--greenSoft)' : 'var(--bg)',
                        color: selected ? 'var(--green2)' : 'var(--text)',
                        fontSize: '.82rem',
                        fontWeight: selected ? 800 : 500,
                        cursor: 'pointer',
                        transition: 'all .18s ease',
                      }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>{int.icon}</span>
                      {int.label}
                      {selected && <Check size={14} />}
                    </button>
                  );
                })}
              </div>

              {selectedInterests.length > 0 && selectedInterests.length < 3 && (
                <p style={{ marginTop: 12, fontSize: '.78rem', color: 'var(--gold)', textAlign: 'center' }}>
                  Select at least {3 - selectedInterests.length} more
                </p>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button onClick={goBack} className="secondary" style={{ flex: 1, minHeight: 44, fontSize: '.82rem' }}>
                  <ChevronLeft size={16} /> Back
                </button>
                <button onClick={goNext} disabled={!step3Valid} className="primary"
                  style={{ flex: 2, minHeight: 44, fontSize: '.82rem', opacity: step3Valid ? 1 : .5 }}
                >
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ============ STEP 4: Notification Preferences ============ */}
          {step === 4 && (
            <div className="animate-rise">
              <div className="eyebrow" style={{ textAlign: 'center' }}>Step 4 of {TOTAL_STEPS}</div>
              <h1 className="serif" style={{ fontSize: '1.8rem', textAlign: 'center', marginTop: 8 }}>
                Stay in the loop
              </h1>
              <p style={{ color: 'var(--text2)', textAlign: 'center', marginTop: 8, fontSize: '.86rem' }}>
                Choose what you want to be notified about.
              </p>

              <div style={{ marginTop: 24, display: 'grid', gap: 6 }}>
                {[
                  { key: 'replies' as const, icon: MessageCircle, label: 'Replies', desc: 'When someone replies to your posts' },
                  { key: 'mentions' as const, icon: AtSign, label: 'Mentions', desc: 'When someone @mentions you' },
                  { key: 'upvotes' as const, icon: ThumbsUp, label: 'Upvotes', desc: 'When your content gets upvoted' },
                  { key: 'sessionReminders' as const, icon: CalendarClock, label: 'Session reminders', desc: 'Upcoming learning sessions' },
                  { key: 'nyumbaKumi' as const, icon: ShieldAlert, label: 'Nyumba Kumi alerts', desc: 'Local safety and community alerts' },
                  { key: 'tips' as const, icon: Lightbulb, label: 'Tips', desc: 'Tips and helpful suggestions' },
                  { key: 'marketplace' as const, icon: ShoppingBag, label: 'Marketplace messages', desc: 'Messages from Mtaa Exchange' },
                ].map(item => {
                  const Icon = item.icon;
                  const on = notifications[item.key];
                  return (
                    <div
                      key={item.key}
                      onClick={() => toggleNotif(item.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '14px 16px',
                        border: '1px solid var(--line)',
                        borderRadius: 13,
                        background: 'var(--bg)',
                        cursor: 'pointer',
                        transition: 'background .15s ease',
                      }}
                    >
                      <Icon size={20} style={{ color: on ? 'var(--green)' : 'var(--text3)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '.86rem', fontWeight: 700 }}>{item.label}</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{item.desc}</div>
                      </div>
                      <div
                        style={{
                          width: 44,
                          height: 26,
                          borderRadius: 99,
                          background: on ? 'var(--green)' : 'var(--line)',
                          position: 'relative',
                          transition: 'background .2s ease',
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: '#fff',
                            position: 'absolute',
                            top: 3,
                            left: on ? 21 : 3,
                            transition: 'left .2s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,.15)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button onClick={goBack} className="secondary" style={{ flex: 1, minHeight: 44, fontSize: '.82rem' }}>
                  <ChevronLeft size={16} /> Back
                </button>
                <button onClick={goNext} className="primary" style={{ flex: 2, minHeight: 44, fontSize: '.82rem' }}>
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ============ STEP 5: Professional Application ============ */}
          {step === 5 && (
            <div className="animate-rise">
              <div className="eyebrow" style={{ textAlign: 'center' }}>Step 5 of {TOTAL_STEPS}</div>
              <h1 className="serif" style={{ fontSize: '1.8rem', textAlign: 'center', marginTop: 8 }}>
                Professional details
              </h1>
              <p style={{ color: 'var(--text2)', textAlign: 'center', marginTop: 8, fontSize: '.86rem' }}>
                Tell us about your expertise so students can find you.
              </p>

              <div style={{ marginTop: 24, display: 'grid', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 800, color: 'var(--text2)', marginBottom: 6, letterSpacing: '.05em', textTransform: 'uppercase' }}>
                    Expertise areas
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Data Science, Law, Farming"
                    value={expertiseAreas}
                    onChange={e => setExpertiseAreas(e.target.value)}
                    style={{ minHeight: 44 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 800, color: 'var(--text2)', marginBottom: 10, letterSpacing: '.05em', textTransform: 'uppercase' }}>
                    Teaching levels
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {TEACHING_LEVELS.map(level => {
                      const active = teachingLevels.includes(level);
                      return (
                        <button
                          key={level}
                          onClick={() => toggleTeachingLevel(level)}
                          style={{
                            padding: '10px 18px',
                            border: active ? '2px solid var(--green)' : '1px solid var(--line)',
                            borderRadius: 99,
                            background: active ? 'var(--greenSoft)' : 'var(--bg)',
                            color: active ? 'var(--green2)' : 'var(--text)',
                            fontSize: '.82rem',
                            fontWeight: active ? 800 : 500,
                            cursor: 'pointer',
                            transition: 'all .18s ease',
                          }}
                        >
                          {level}
                          {active && <Check size={14} style={{ marginLeft: 4 }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 800, color: 'var(--text2)', marginBottom: 6, letterSpacing: '.05em', textTransform: 'uppercase' }}>
                      Hourly rate (KES)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 1500"
                      value={hourlyRate}
                      onChange={e => setHourlyRate(e.target.value)}
                      style={{ minHeight: 44 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 800, color: 'var(--text2)', marginBottom: 6, letterSpacing: '.05em', textTransform: 'uppercase' }}>
                      M-Pesa number
                    </label>
                    <input
                      type="tel"
                      placeholder="0712345678"
                      value={mpesaNumber}
                      onChange={e => setMpesaNumber(e.target.value)}
                      style={{ minHeight: 44 }}
                    />
                  </div>
                </div>

                <div
                  onClick={() => setAgreedTerms(!agreedTerms)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '14px 16px',
                    border: agreedTerms ? '2px solid var(--green)' : '1px solid var(--line)',
                    borderRadius: 13,
                    background: agreedTerms ? 'var(--greenSoft)' : 'var(--bg)',
                    cursor: 'pointer',
                    transition: 'all .18s ease',
                  }}
                >
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    border: agreedTerms ? '2px solid var(--green)' : '2px solid var(--line)',
                    background: agreedTerms ? 'var(--green)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 1,
                    transition: 'all .18s ease',
                  }}>
                    {agreedTerms && <Check size={14} style={{ color: '#fff' }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '.82rem', fontWeight: 700 }}>I agree to the Professional Code of Conduct</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginTop: 2 }}>
                      I commit to providing quality, ethical, and respectful mentorship.
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button onClick={goBack} className="secondary" style={{ flex: 1, minHeight: 44, fontSize: '.82rem' }}>
                  <ChevronLeft size={16} /> Back
                </button>
                <button onClick={goNext} disabled={!step5Valid} className="primary"
                  style={{ flex: 2, minHeight: 44, fontSize: '.82rem', opacity: step5Valid ? 1 : .5 }}
                >
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ============ STEP 6: Complete ============ */}
          {step === 6 && (
            <div className="animate-rise" style={{ textAlign: 'center' }}>
              {/* Confetti CSS */}
              <style>{`
                @keyframes confetti-fall {
                  0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
                  100% { transform: translateY(300px) rotate(720deg); opacity: 0; }
                }
                @keyframes confetti-sway {
                  0%, 100% { transform: translateX(0); }
                  25% { transform: translateX(15px); }
                  75% { transform: translateX(-15px); }
                }
                .confetti-piece {
                  position: absolute;
                  width: 8px;
                  height: 8px;
                  border-radius: 2px;
                  animation: confetti-fall 2.5s ease-in forwards, confetti-sway 1.5s ease-in-out infinite;
                }
              `}</style>

              <div style={{ position: 'relative', height: 60, overflow: 'hidden', marginBottom: 8 }}>
                {Array.from({ length: 24 }, (_, i) => (
                  <div
                    key={i}
                    className="confetti-piece"
                    style={{
                      left: `${(i / 24) * 100}%`,
                      top: -10,
                      background: ['var(--green)', 'var(--gold)', 'var(--red)', 'var(--blue)', 'var(--earth)', 'var(--greenSoft)', 'var(--goldSoft)'][i % 7],
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: `${2 + Math.random() * 1.5}s, ${1 + Math.random()}s`,
                    }}
                  />
                ))}
              </div>

              <div style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'var(--greenSoft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
              }}>
                <PartyPopper size={36} style={{ color: 'var(--green)' }} />
              </div>

              <h1 className="serif" style={{ fontSize: '1.8rem', marginTop: 16 }}>
                You&apos;re all set!
              </h1>
              <p style={{ color: 'var(--text2)', marginTop: 8, fontSize: '.86rem', maxWidth: 380, margin: '8px auto 0' }}>
                Here&apos;s a quick summary of your profile.
              </p>

              {/* Summary */}
              <div style={{
                textAlign: 'left',
                marginTop: 24,
                padding: 20,
                border: '1px solid var(--line)',
                borderRadius: 14,
                background: 'var(--bg)',
              }}>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem' }}>
                    <span style={{ color: 'var(--text3)' }}>Name</span>
                    <span style={{ fontWeight: 700 }}>{fullName || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem' }}>
                    <span style={{ color: 'var(--text3)' }}>Username</span>
                    <span style={{ fontWeight: 700 }}>@{username || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem' }}>
                    <span style={{ color: 'var(--text3)' }}>County</span>
                    <span style={{ fontWeight: 700 }}>{county || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem' }}>
                    <span style={{ color: 'var(--text3)' }}>Language</span>
                    <span style={{ fontWeight: 700 }}>{language === 'en' ? 'English' : language === 'sw' ? 'Kiswahili' : 'Sheng'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem' }}>
                    <span style={{ color: 'var(--text3)' }}>Role</span>
                    <span style={{ fontWeight: 700 }}>{role || '—'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text3)', fontSize: '.82rem' }}>Interests</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      {selectedInterests.map(i => (
                        <span key={i} style={{
                          padding: '4px 10px',
                          borderRadius: 99,
                          background: 'var(--greenSoft)',
                          color: 'var(--green2)',
                          fontSize: '.72rem',
                          fontWeight: 700,
                        }}>
                          {i}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button onClick={goBack} className="secondary" style={{ flex: 1, minHeight: 44, fontSize: '.82rem' }}>
                  <ChevronLeft size={16} /> Back
                </button>
                <button onClick={handleComplete} disabled={loading} className="primary"
                  style={{ flex: 2, minHeight: 44, fontSize: '.82rem' }}
                >
                  <Sparkles size={16} /> {loading ? 'Setting up...' : 'Start Exploring'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
