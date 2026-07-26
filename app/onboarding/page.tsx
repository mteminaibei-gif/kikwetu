'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/components/AppLayout';
import { MapPin, Globe, Sparkles, ChevronRight, Check } from 'lucide-react';

const counties = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale',
  'Garissa', 'Kakamega', 'Nyeri', 'Meru', 'Machakos', 'Kisii', 'Narok', 'Busia',
];

const languages = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'sw', label: 'Kiswahili', native: 'Kiswahili' },
  { code: 'sheng', label: 'Sheng', native: 'Sheng' },
];

const interests = [
  { label: 'Agriculture', icon: '🌾' },
  { label: 'Technology', icon: '💻' },
  { label: 'Health', icon: '🏥' },
  { label: 'Education', icon: '📚' },
  { label: 'Business', icon: '💼' },
  { label: 'Environment', icon: '🌿' },
  { label: 'Culture', icon: '🎭' },
  { label: 'Rights', icon: '⚖️' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { showToast } = useApp();
  const [step, setStep] = useState(1);
  const [county, setCounty] = useState('');
  const [language, setLanguage] = useState('en');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleInterest = (label: string) => {
    setSelectedInterests(prev =>
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  };

  const handleComplete = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({
            county,
            language,
          })
          .eq('user_id', user.id);
      }
    } catch (err) {
      console.log('Profile update skipped:', err);
    }

    showToast('Welcome to Kikwetu!');
    router.push('/');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Progress */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ height: 4, flex: 1, borderRadius: 99, background: step >= s ? 'var(--green)' : 'var(--line)', transition: 'background .3s ease' }} />
          ))}
        </div>

        <div className="section" style={{ padding: 32 }}>
          {step === 1 && (
            <>
              <div className="eyebrow" style={{ textAlign: 'center' }}>Step 1 of 3</div>
              <h1 className="serif" style={{ fontSize: '1.8rem', textAlign: 'center', marginTop: 8 }}>Where are you based?</h1>
              <p style={{ color: 'var(--text2)', textAlign: 'center', marginTop: 8, fontSize: '.86rem' }}>
                We&apos;ll show you local content and connect you with nearby people.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 24 }}>
                {counties.map(c => (
                  <button
                    key={c}
                    onClick={() => setCounty(c)}
                    style={{
                      padding: '12px 14px',
                      border: county === c ? '2px solid var(--green)' : '1px solid var(--line)',
                      borderRadius: 11,
                      background: county === c ? 'var(--greenSoft)' : 'var(--bg)',
                      color: county === c ? 'var(--green2)' : 'var(--text)',
                      fontSize: '.82rem',
                      fontWeight: county === c ? 800 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all .18s ease',
                    }}
                  >
                    <MapPin size={14} style={{ marginRight: 6, verticalAlign: '-2px' }} />
                    {c}
                  </button>
                ))}
              </div>

              <button
                onClick={() => county && setStep(2)}
                disabled={!county}
                className="primary"
                style={{ width: '100%', marginTop: 24, minHeight: 44, fontSize: '.82rem', opacity: county ? 1 : .5 }}
              >
                Continue <ChevronRight size={16} />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="eyebrow" style={{ textAlign: 'center' }}>Step 2 of 3</div>
              <h1 className="serif" style={{ fontSize: '1.8rem', textAlign: 'center', marginTop: 8 }}>Choose your language</h1>
              <p style={{ color: 'var(--text2)', textAlign: 'center', marginTop: 8, fontSize: '.86rem' }}>
                You can switch anytime in settings.
              </p>

              <div style={{ display: 'grid', gap: 10, marginTop: 24 }}>
                {languages.map(l => (
                  <button
                    key={l.code}
                    onClick={() => setLanguage(l.code)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '16px 18px',
                      border: language === l.code ? '2px solid var(--green)' : '1px solid var(--line)',
                      borderRadius: 13,
                      background: language === l.code ? 'var(--greenSoft)' : 'var(--bg)',
                      color: language === l.code ? 'var(--green2)' : 'var(--text)',
                      fontSize: '.86rem',
                      fontWeight: language === l.code ? 800 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all .18s ease',
                    }}
                  >
                    <Globe size={18} />
                    <div>
                      <div>{l.label}</div>
                      <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{l.native}</div>
                    </div>
                    {language === l.code && <Check size={18} style={{ marginLeft: 'auto', color: 'var(--green)' }} />}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button onClick={() => setStep(1)} className="secondary" style={{ flex: 1, minHeight: 44, fontSize: '.82rem' }}>
                  Back
                </button>
                <button onClick={() => setStep(3)} className="primary" style={{ flex: 2, minHeight: 44, fontSize: '.82rem' }}>
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="eyebrow" style={{ textAlign: 'center' }}>Step 3 of 3</div>
              <h1 className="serif" style={{ fontSize: '1.8rem', textAlign: 'center', marginTop: 8 }}>What interests you?</h1>
              <p style={{ color: 'var(--text2)', textAlign: 'center', marginTop: 8, fontSize: '.86rem' }}>
                Pick at least 3 to personalize your feed.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 24 }}>
                {interests.map(int => (
                  <button
                    key={int.label}
                    onClick={() => toggleInterest(int.label)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '14px',
                      border: selectedInterests.includes(int.label) ? '2px solid var(--green)' : '1px solid var(--line)',
                      borderRadius: 11,
                      background: selectedInterests.includes(int.label) ? 'var(--greenSoft)' : 'var(--bg)',
                      color: selectedInterests.includes(int.label) ? 'var(--green2)' : 'var(--text)',
                      fontSize: '.82rem',
                      fontWeight: selectedInterests.includes(int.label) ? 800 : 500,
                      cursor: 'pointer',
                      transition: 'all .18s ease',
                    }}
                  >
                    <span style={{ fontSize: '1.3rem' }}>{int.icon}</span>
                    {int.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button onClick={() => setStep(2)} className="secondary" style={{ flex: 1, minHeight: 44, fontSize: '.82rem' }}>
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={loading || selectedInterests.length < 3}
                  className="primary"
                  style={{ flex: 2, minHeight: 44, fontSize: '.82rem', opacity: selectedInterests.length >= 3 ? 1 : .5 }}
                >
                  <Sparkles size={16} /> {loading ? 'Setting up...' : 'Complete setup'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
