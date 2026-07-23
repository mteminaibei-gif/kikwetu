'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppFooter from '@/components/AppFooter';

export default function ContactPage() {
  const [lang, setLang] = useState<'en' | 'sw'>('en');
  const [submitted, setSubmitted] = useState(false);
  const tr = (en: string, sw: string) => lang === 'sw' ? sw : en;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-brand-bgLight dark:bg-brand-bgDark">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-brand-orange hover:text-brand-lightOrange mb-8 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
          {tr('Rudi Nyumbani', 'Back to Home')}
        </Link>

        <div className="text-center space-y-4 mb-16">
          <img src="/logo-icon.svg" alt="" className="h-12 mx-auto mb-4" />
          <h1 className="text-4xl sm:text-5xl font-black font-logo">{tr('Wasiliana Nasi', 'Contact Us')}</h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            {tr('Tuna hamu ya kusikia kutoka kwako. Tutumie ujumbe na tutakujibu haraka.', 'We\'d love to hear from you. Send us a message and we\'ll respond quickly.')}
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-16 space-y-4 animate-scaleIn">
            <span className="text-6xl block">✅</span>
            <h2 className="text-2xl font-bold text-brand-green dark:text-white">{tr('Asante!', 'Thank You!')}</h2>
            <p className="text-gray-500">{tr('Ujumbe wako umetumwa. Tutakujibu ndani ya saa 24.', 'Your message has been sent. We\'ll get back to you within 24 hours.')}</p>
            <button onClick={() => setSubmitted(false)} className="text-sm text-brand-orange hover:underline">{tr('Tuma ujumbe mwingine', 'Send another message')}</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-brand-cardDark border border-gray-200 dark:border-gray-800 rounded-[32px] p-8 shadow-sm space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">{tr('Jina Lako', 'Your Name')} *</label>
                <input required className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/50" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">{tr('Barua Pepe', 'Email')} *</label>
                <input type="email" required className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/50" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">{tr('Kichwa', 'Subject')}</label>
              <select className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/50">
                <option>{tr('Swala la Jumla', 'General Inquiry')}</option>
                <option>{tr('Msaada wa Kiufundi', 'Technical Support')}</option>
                <option>{tr('Ripoti', 'Report')}</option>
                <option>{tr('Tangaza', 'Advertise')}</option>
                <option>{tr('Mengineyo', 'Other')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">{tr('Ujumbe Wako', 'Your Message')} *</label>
              <textarea required rows={5} className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/50 resize-none" />
            </div>
            <button type="submit" className="w-full bg-brand-orange hover:bg-brand-lightOrange text-white font-bold py-4 rounded-xl text-sm shadow-lg transition-all active:scale-[0.98]">
              {tr('Tuma Ujumbe', 'Send Message')}
              <svg className="w-4 h-4 inline ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        )}

        <div className="grid sm:grid-cols-3 gap-6 mt-12">
          {[
            { icon: '✉️', label: tr('Barua Pepe', 'Email'), value: 'hello@kikwetuconnect.com' },
            { icon: '📍', label: tr('Makao Makuu', 'Headquarters'), value: 'Nairobi, Kenya' },
            { icon: '⏰', label: tr('Saa za Kazi', 'Hours'), value: tr('Jumatatu-Ijumaa, 8AM-6PM EAT', 'Mon-Fri, 8AM-6PM EAT') },
          ].map(c => (
            <div key={c.label} className="text-center p-6 rounded-2xl bg-white dark:bg-brand-cardDark border border-gray-200 dark:border-gray-800 shadow-sm">
              <span className="text-2xl block mb-2">{c.icon}</span>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{c.label}</h4>
              <span className="text-sm font-semibold">{c.value}</span>
            </div>
          ))}
        </div>
      </div>
      <AppFooter lang={lang} setLang={setLang} />
    </div>
  );
}
