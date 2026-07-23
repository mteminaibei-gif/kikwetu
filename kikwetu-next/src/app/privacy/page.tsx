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
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-brand-orange hover:text-brand-lightOrange mb-8 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
          {tr('Rudi Nyumbani', 'Back to Home')}
        </Link>
        <img src="/logo-icon.svg" alt="" className="h-10 mb-6" />
        <h1 className="text-4xl font-black font-logo mb-8">{tr('Sera ya Faragha', 'Privacy Policy')}</h1>
        <p className="text-sm text-gray-500 mb-8">{tr('Ilisasishwa: Julai 2026', 'Last updated: July 2026')}</p>

        <div className="prose dark:prose-invert max-w-none space-y-8 text-gray-600 dark:text-gray-300">
          <section>
            <h2 className="text-xl font-bold text-brand-green dark:text-white mb-3">1. {tr('Utangulizi', 'Introduction')}</h2>
            <p className="leading-relaxed">{tr(
              'KikwetuConnect ("sisi," "yetu," au "platform") inajali faragha yako. Sera hii inaelezea jinsi tunavyokusanya, kutumia, na kulinda taarifa zako unapotumia huduma zetu.',
              'KikwetuConnect ("we," "our," or "the platform") cares about your privacy. This policy explains how we collect, use, and protect your information when you use our services.'
            )}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-green dark:text-white mb-3">2. {tr('Taarifa Tunazokusanya', 'Information We Collect')}</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>{tr('Jina lako, barua pepe, nambari ya simu, na kaunti unakoishi', 'Your name, email, phone number, and county')}</li>
              <li>{tr('Machapisho, maoni, na kura unazotoa kwenye mfumo', 'Posts, replies, and votes you make on the platform')}</li>
              <li>{tr('Data ya matumizi kama vile ukurasa uliotembelea na muda uliotumia', 'Usage data such as pages visited and time spent')}</li>
              <li>{tr('Taarifa za kifaa kama vile aina ya kifaa na mfumo wa uendeshaji', 'Device information such as device type and operating system')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-green dark:text-white mb-3">3. {tr('Jinsi Tunavyotumia Taarifa Zako', 'How We Use Your Information')}</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>{tr('Kukupa huduma zetu na kuboresha uzoefu wako', 'To provide our services and improve your experience')}</li>
              <li>{tr('Kukuunganisha na jamii na kaunti zako', 'To connect you with your communities and counties')}</li>
              <li>{tr('Kukutumia taarifa muhimu kuhusu mfumo', 'To send you important platform updates')}</li>
              <li>{tr('Kuzuia matumizi mabaya na kuhakikisha usalama', 'To prevent abuse and ensure safety')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-green dark:text-white mb-3">4. {tr('Haki Zako', 'Your Rights')}</h2>
            <p className="leading-relaxed">{tr(
              'Una haki ya kufikia, kurekebisha, au kufuta taarifa zako wakati wowote. Unaweza pia kukataa kupokea taarifa za utangazaji. Wasiliana nasi kupitia ukurasa wa Contact Us.',
              'You have the right to access, modify, or delete your information at any time. You can also opt out of marketing communications. Contact us through our Contact Us page.'
            )}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-green dark:text-white mb-3">5. {tr('Vidakuzi (Cookies)', 'Cookies')}</h2>
            <p className="leading-relaxed" id="cookies">{tr(
              'Tunatumia vidakuzi muhimu kwa ajili ya kukumbuka kipindi chako na mapendeleo yako. Hatuuzi data yako kwa watu wengine. Unaweza kuzima vidakuzi kwenye kivinjari chako lakini hii inaweza kuathiri utendaji wa mfumo.',
              'We use essential cookies to remember your session and preferences. We do not sell your data to third parties. You can disable cookies in your browser but this may affect platform functionality.'
            )}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-green dark:text-white mb-3">6. {tr('Wasiliana Nasi', 'Contact Us')}</h2>
            <p className="leading-relaxed">{tr(
              'Kwa maswali yoyote kuhusu sera hii, tafadhali tembelea ukurasa wetu wa Contact Us au tutumie barua pepe kwa privacy@kikwetucoat.com.',
              'For any questions about this policy, please visit our Contact Us page or email us at privacy@kikwetuconnect.com.'
            )}</p>
          </section>
        </div>
      </div>
      <AppFooter lang={lang} setLang={setLang} />
    </div>
  );
}
