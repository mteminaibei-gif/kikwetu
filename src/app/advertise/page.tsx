'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppFooter from '@/components/AppFooter';

const PACKAGES = [
  { name: 'Mkulima', price: 'KES 5,000/mo', desc: 'For small businesses and local brands.', features: ['100K impressions/mo', 'County-level targeting', 'Basic analytics', 'Social media promotion'] },
  { name: 'Mtaalamu', price: 'KES 15,000/mo', desc: 'For growing businesses and organizations.', features: ['500K impressions/mo', 'National reach', 'Full analytics dashboard', 'Priority support', 'Sponsored Spaces'] },
  { name: 'Taifa', price: 'KES 50,000/mo', desc: 'For enterprises and government agencies.', features: ['2M+ impressions/mo', 'All 47 counties', 'Custom campaigns', 'Dedicated account manager', 'Sponsored audio rooms', 'Marketplace featured listing'] },
];

export default function AdvertisePage() {
  const [lang, setLang] = useState<'en' | 'sw'>('en');
  const tr = (en: string, sw: string) => lang === 'sw' ? sw : en;

  return (
    <div className="min-h-screen bg-brand-bgLight dark:bg-brand-bgDark">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-brand-red hover:text-brand-red mb-8 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
          {tr('Rudi Nyumbani', 'Back to Home')}
        </Link>

        <div className="text-center space-y-4 mb-16">
          <img src="/logo-icon.svg" alt="" className="h-12 mx-auto mb-4" />
          <h1 className="text-4xl sm:text-5xl font-black font-logo text-brand-deep dark:text-white">{tr('Tangaza Nasi', 'Advertise with Us')}</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
            {tr('Fikia Wakenya 12,000+ wanaotumia KikwetuConnect kila mwezi. Tangaza bidhaa au huduma zako kwa hadhira inayolengwa.', 'Reach 12,000+ active Kenyans on KikwetuConnect every month. Promote your products or services to a targeted audience.')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {PACKAGES.map((pkg, i) => (
            <div key={i} className={`sun-card p-6 flex flex-col ${i === 1 ? 'ring-2 ring-brand-terracotta scale-105 relative' : ''}`}>
              {i === 1 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-terracotta text-white text-[10px] font-bold px-3 py-1 rounded-full">{tr('Inapendekezwa', 'Recommended')}</div>}
              <h3 className="text-xl font-bold text-brand-deep dark:text-white mb-1">{pkg.name}</h3>
              <p className="text-3xl font-black text-brand-red mb-2">{pkg.price}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{pkg.desc}</p>
              <ul className="space-y-3 mb-8 flex-1">
                {pkg.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="block w-full text-center sun-btn font-bold py-3.5 rounded-xl text-sm transition-all">
                {tr('Wasiliana Nasi', 'Contact Us')}
              </Link>
            </div>
          ))}
        </div>

        <div className="rounded-[32px] p-10 text-white text-center space-y-4 relative overflow-hidden sun-cta-warm-sm">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-brand-terracotta/20 to-transparent rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
          <div className="relative z-10">
            <h2 className="text-2xl font-black">{tr('Je, Una Maswali?', 'Have Questions?')}</h2>
            <p className="text-white/80 max-w-lg mx-auto">{tr('Timu yetu ya matangazo iko tayari kukusaidia. Tuma ujumbe kupitia ukurasa wa Contact.', 'Our advertising team is ready to help. Send a message through our Contact page.')}</p>
            <Link href="/contact" className="inline-flex items-center gap-2 sun-btn px-6 py-3 rounded-full text-sm font-bold mt-4 shadow-lg">
              {tr('Tuma Ujumbe', 'Send a Message')}
            </Link>
          </div>
        </div>
      </div>
      <AppFooter lang={lang} setLang={setLang} />
    </div>
  );
}