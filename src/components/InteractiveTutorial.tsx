'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

const STEPS = [
  {
    title: 'Karibu KikwetuConnect!',
    titleSw: 'Welcome to KikwetuConnect!',
    desc: 'Your hub for learning, sharing, and growing with verified professionals across Kenya.',
    descSw: 'Kitovu chako cha kujifunza, kushiriki, na kukua pamoja na wataalamu waliothibitishwa kote Kenya.',
    icon: '🌅',
  },
  {
    title: 'Ask & Answer Questions',
    titleSw: 'Uliza na Jibu Maswali',
    desc: 'Post questions in Swahili or English, get answers from the community, and earn Heshima points.',
    descSw: 'Uliza maswali kwa Kiswahili au Kiingereza, pata majibu kutoka jamii, na upate alama za Heshima.',
    icon: '💬',
  },
  {
    title: 'Learn from Professionals',
    titleSw: 'Jifunze kutoka kwa Wataalamu',
    desc: 'Book 1-on-1 sessions with verified teachers. Chat, learn, and grow under expert guidance.',
    descSw: 'Weka miadi ya mkutano wa 1-on-1 na walimu waliothibitishwa. Ongea, jifunze, na kua.',
    icon: '👨‍🏫',
  },
  {
    title: 'Parent Mode (Mzazi)',
    titleSw: 'Hali ya Mzazi',
    desc: 'Register as a parent to manage your children\'s learning. Approve professionals and monitor progress.',
    descSw: 'Jiandikisha kama mzazi kusimamia masomo ya watoto wako. Idhinisha wataalamu na fuatilia maendeleo.',
    icon: '👨‍👩‍👧‍👦',
  },
  {
    title: 'Tip & Support Teachers',
    titleSw: 'Toa Ushuru na Saidia Walimu',
    desc: 'Show appreciation with M-Pesa tips. 70% goes to the teacher, 30% supports the platform.',
    descSw: 'Onyesha shukrani kwa ushuru wa M-Pesa. 70% kwa mwalimu, 30% kwa jukwaa.',
    icon: '💝',
  },
];

export default function InteractiveTutorial({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const { contentLang, setContentLang } = useLanguage();
  const current = STEPS[step];

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={onComplete} />
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <button onClick={onComplete}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
          aria-label="Close tutorial">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="p-8 text-center space-y-4">
          <div className="text-7xl mb-4 animate-bounce">{current.icon}</div>
          <h2 className="text-2xl font-black text-brand-deep dark:text-white">
            {contentLang === 'en' ? current.title : current.titleSw}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
            {contentLang === 'en' ? current.desc : current.descSw}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 pt-4">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-brand-red' : 'w-2 bg-gray-300 dark:bg-gray-700'}`} />
            ))}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button onClick={() => setContentLang(contentLang === 'en' ? 'sw' : 'en')}
              className="text-xs font-bold text-gray-400 hover:text-brand-red px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-brand-red/30 transition-all">
              {contentLang === 'en' ? 'Kiswahili' : 'English'}
            </button>
            <div className="flex gap-2">
              <button onClick={onComplete}
                className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors">
                {contentLang === 'en' ? 'Skip All' : 'Ruka Zote'}
              </button>
              <button onClick={handleNext}
                className="sun-btn px-6 py-2.5 rounded-full text-xs font-bold shadow-md transition-all active:scale-95">
                {step < STEPS.length - 1 ? (contentLang === 'en' ? 'Next' : 'Inayofuata') : (contentLang === 'en' ? 'Get Started!' : 'Anza!')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
