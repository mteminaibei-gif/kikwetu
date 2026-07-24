'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppFooter from '@/components/AppFooter';

export default function PrivacyPage() {
  const [lang, setLang] = useState<'en' | 'sw'>('en');
  const tr = (en: string, sw: string) => lang === 'sw' ? sw : en;

  return (
    <div className="min-h-screen bg-brand-bgLight dark:bg-brand-bgDark">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-brand-red hover:text-brand-red mb-8 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
          {tr('Rudi Nyumbani', 'Back to Home')}
        </Link>

        <div className="flex items-center gap-4 mb-2">
          <img src="/logo-icon.svg" alt="" className="h-10" />
          <h1 className="text-4xl font-black font-logo text-brand-deep dark:text-white">{tr('Sera ya Faragha', 'Privacy Policy')}</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 ml-14">{tr('Ilisasishwa: Julai 2026', 'Last updated: July 2026')}</p>

        <div className="sun-card p-8 sm:p-10 space-y-8 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-xl font-bold text-brand-deep dark:text-white mb-3">1. {tr('Utangulizi', 'Introduction')}</h2>
            <p className="leading-relaxed">{tr(
              'KikwetuConnect ("sisi," "yetu," au "platform") inajali faragha yako. Sera hii inaelezea jinsi tunavyokusanya, kutumia, na kulinda taarifa zako unapotumia huduma zetu. Hatujawahi kuuza data yako, na hatutauza kamwe.',
              'KikwetuConnect ("we," "our," or "the platform") cares about your privacy. This policy explains how we collect, use, and protect your information when you use our services. We have never sold your data, and we never will.'
            )}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-deep dark:text-white mb-3">2. {tr('Taarifa Tunazokusanya', 'Information We Collect')}</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>{tr('Jina lako, barua pepe, nambari ya simu, na kaunti unakoishi — muhimu tu kwa akaunti yako', 'Your name, email, phone number, and county — only what\'s essential for your account')}</li>
              <li>{tr('Machapisho, maoni, na kura unazotoa kwenye mfumo', 'Posts, replies, and votes you make on the platform')}</li>
              <li>{tr('Data ya matumizi kama vile kurasa ulizotembelea na muda uliotumia — haitumiki kamwe kwa ufuatiliaji wa watu wengine', 'Usage data like pages visited and time spent — never used for third-party tracking')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-deep dark:text-white mb-3">3. {tr('Jinsi Tunavyotumia Taarifa Zako', 'How We Use Your Information')}</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>{tr('Kukupa huduma zetu na kuboresha uzoefu wako', 'To provide our services and improve your experience')}</li>
              <li>{tr('Kukuunganisha na jamii na kaunti zako', 'To connect you with your communities and counties')}</li>
              <li>{tr('Kukutumia taarifa muhimu kuhusu mfumo — kamwe si barua taka', 'To send you important platform updates — never spam')}</li>
              <li>{tr('Kuzuia matumizi mabaya na kuhakikisha usalama wa jamii', 'To prevent abuse and ensure community safety')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-deep dark:text-white mb-3">4. {tr('Haki Zako', 'Your Rights')}</h2>
            <p className="leading-relaxed">{tr(
              'Una haki kamili ya kufikia, kurekebisha, au kufuta taarifa zako wakati wowote. Unaweza pia kukataa kupokea taarifa za utangazaji. Data yako ni yako — hatuikodi, hatuui, wala hatuishirikishi na watu wengine. Wasiliana nasi kupitia ukurasa wa Contact Us.',
              'You have full rights to access, modify, or delete your information at any time. You can also opt out of marketing communications. Your data is yours — we do not rent, sell, or share it with third parties. Contact us through our Contact Us page.'
            )}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-deep dark:text-white mb-3">5. {tr('Vidakuzi na Usalama', 'Cookies & Security')}</h2>
            <p className="leading-relaxed" id="cookies">{tr(
              'Tunatumia vidakuzi muhimu tu kwa ajili ya kukumbuka kipindi chako na mapendeleo yako. Hatuuzi data yako kwa watu wengine. Mfumo wetu unatumia usimbaji fiche wa kiwango cha juu (SSL/TLS) na kutoficha nywila zako. Tunachunguza mara kwa mara ili kuhakikisha hakuna uvujaji wa data.',
              'We use only essential cookies to remember your session and preferences. We do not sell your data. Our platform uses enterprise-grade encryption (SSL/TLS) and never stores passwords in plain text. We conduct regular security audits to ensure no data leakage.'
            )}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-deep dark:text-white mb-3">6. {tr('Wasiliana Nasi', 'Contact Us')}</h2>
            <p className="leading-relaxed">{tr(
              'Kwa maswali yoyote kuhusu sera hii au usalama wa data yako, tafadhali tembelea ukurasa wetu wa Contact Us au tutumie barua pepe kwa privacy@kikwetuconnect.com.',
              'For any questions about this policy or your data security, please visit our Contact Us page or email us at privacy@kikwetuconnect.com.'
            )}</p>
          </section>
        </div>
      </div>
      <AppFooter lang={lang} setLang={setLang} />
    </div>
  );
}