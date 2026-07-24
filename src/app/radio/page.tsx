'use client';

import { useState } from 'react';
import KenyanRadioPlayer from '@/components/KenyanRadioPlayer';

export default function RadioPage() {
  const [lang, setLang] = useState<'en' | 'sw'>('en');
  const tr = (en: string, sw: string) => lang === 'sw' ? sw : en;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-gradient-to-br from-brand-deep via-brand-red to-brand-terracotta p-6 sm:p-8 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">📻</span>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-black">{tr('Redio ya Kikwetu', 'Kikwetu Radio')}</h1>
              <p className="text-sm text-white/70">{tr('Sikiliza redio za Kenya moja kwa moja', 'Listen to Kenyan radio stations live')}</p>
            </div>
            <button onClick={() => setLang(l => l === 'en' ? 'sw' : 'en')}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white/80 hover:bg-white/20 transition-colors shrink-0">
              {lang === 'en' ? 'Kiswahili' : 'English'}
            </button>
          </div>
        </div>
      </div>

      <KenyanRadioPlayer />
    </div>
  );
}
