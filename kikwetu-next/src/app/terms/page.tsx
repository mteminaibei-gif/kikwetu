'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppFooter from '@/components/AppFooter';

export default function TermsPage() {
  const [lang, setLang] = useState<'en' | 'sw'>('en');
  const tr = (en: string, sw: string) => lang === 'sw' ? sw : en;

  return (
    <div className="min-h-screen bg-brand-bgLight dark:bg-brand-bgDark">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-brand-orange hover:text-brand-lightOrange mb-8 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
          {tr('Rudi Nyumbani', 'Back to Home')}
        </Link>
        <img src="/logo-icon.svg" alt="" className="h-10 mb-6" />
        <h1 className="text-4xl font-black font-logo mb-8">{tr('Masharti ya Huduma', 'Terms of Service')}</h1>
        <p className="text-sm text-gray-500 mb-8">{tr('Ilisasishwa: Julai 2026', 'Last updated: July 2026')}</p>

        <div className="space-y-8 text-gray-600 dark:text-gray-300">
          <section>
            <h2 className="text-xl font-bold text-brand-green dark:text-white mb-3">1. {tr('Kukubali', 'Acceptance')}</h2>
            <p className="leading-relaxed">{tr(
              'Kwa kutumia KikwetuConnect, unakubali masharti haya. Usipotaka kukubali, tafadhali usitumie huduma zetu.',
              'By using KikwetuConnect, you agree to these terms. If you do not agree, please do not use our services.'
            )}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-green dark:text-white mb-3">2. {tr('Tabia za Mtumiaji', 'User Conduct')}</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>{tr('Heshimu wanachama wengine — usitume matusi au vitisho', 'Respect other members — no harassment or threats')}</li>
              <li>{tr('Usichapishe taarifa za uongo au potofu', 'Do not post false or misleading information')}</li>
              <li>{tr('Usitumie mfumo kwa shughuli haramu', 'Do not use the platform for illegal activities')}</li>
              <li>{tr('Usivunje hakimiliki za watu wengine', 'Do not infringe on others\' copyright')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-green dark:text-white mb-3">3. {tr('Akaunti Zako', 'Your Account')}</h2>
            <p className="leading-relaxed">{tr(
              'Wewe ndiye unawajibika kwa usalama wa akaunti yako. Taarifa zako ni sahihi na zimesasishwa. Unaweza kufuta akaunti yako wakati wowote kwa kuwasiliana nasi.',
              'You are responsible for the security of your account. Your information is accurate and up-to-date. You can delete your account at any time by contacting us.'
            )}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-green dark:text-white mb-3" id="guidelines">4. {tr('Miongozo ya Jamii', 'Community Guidelines')}</h2>
            <p className="leading-relaxed">{tr(
              'Tunajenga jamii yenye heshima na ushirikishwaji. Machapisho yote lazima yazingatie miongozo hii. Ukiukaji unaweza kusababisha akaunti yako kusimamishwa.',
              'We build a community of respect and inclusion. All posts must follow these guidelines. Violations may result in account suspension.'
            )}</p>
            <ul className="list-disc pl-6 mt-3 space-y-1 text-sm">
              <li>{tr('Chapisha kwa lugha ya heshima daima', 'Always post respectfully')}</li>
              <li>{tr('Toa chanzo cha taarifa zako unapowezekana', 'Cite your sources when possible')}</li>
              <li>{tr('Usijihusishe na ubaguzi wa aina yoyote', 'Do not engage in discrimination of any kind')}</li>
              <li>{tr('Ripoti tabia mbaya unayoiona', 'Report bad behavior when you see it')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-green dark:text-white mb-3">5. {tr('Mabadiliko ya Masharti', 'Changes to Terms')}</h2>
            <p className="leading-relaxed">{tr(
              'Tunaweza kubadilisha masharti haya wakati wowote. Mabadiliko yataanza kutumika mara tu yanapochapishwa. Endelea kutumia mfumo kunamaanisha unakubali mabadiliko hayo.',
              'We may change these terms at any time. Changes take effect immediately upon posting. Continued use of the platform means you accept the changes.'
            )}</p>
          </section>
        </div>
      </div>
      <AppFooter lang={lang} setLang={setLang} />
    </div>
  );
}
