'use client';

import Link from 'next/link';
import AppFooter from '@/components/AppFooter';
import { useLanguage } from '@/context/LanguageContext';

export default function TermsPage() {
  const { contentLang, setContentLang, tr } = useLanguage();

  return (
    <div className="min-h-screen bg-brand-bgLight dark:bg-brand-bgDark">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-brand-red hover:text-brand-red mb-8 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
          {tr('Rudi Nyumbani', 'Back to Home')}
        </Link>

        <div className="flex items-center gap-4 mb-2">
          <img src="/logo-icon.svg" alt="" className="h-10" />
          <h1 className="text-4xl font-black font-logo text-brand-deep dark:text-white">{tr('Masharti ya Huduma', 'Terms of Service')}</h1>
        </div>
        <p className="text-sm text-gray-500 mb-8 ml-14">{tr('Ilisasishwa: Julai 2026', 'Last updated: July 2026')}</p>

        <div className="sun-card p-8 sm:p-10 space-y-8 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-xl font-bold text-brand-deep dark:text-white mb-3">1. {tr('Kukubali', 'Acceptance')}</h2>
            <p className="leading-relaxed">{tr(
              'Kwa kutumia KikwetuConnect, unakubali masharti haya. Usipotaka kukubali, tafadhali usitumie huduma zetu. KikwetuConnect ni jukwaa salama na la heshima kwa Wakenya wote.',
              'By using KikwetuConnect, you agree to these terms. If you do not agree, please do not use our services. KikwetuConnect is a safe and respectful platform for all Kenyans.'
            )}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-deep dark:text-white mb-3">2. {tr('Tabia za Mtumiaji', 'User Conduct')}</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>{tr('Heshimu wanachama wengine — usitume matusi au vitisho (ukiukaji husababisha kusimamishwa mara moja)', 'Respect other members — no harassment or threats (violations result in immediate suspension)')}</li>
              <li>{tr('Usichapishe taarifa za uongo au potofu', 'Do not post false or misleading information')}</li>
              <li>{tr('Usitumie mfumo kwa shughuli haramu', 'Do not use the platform for illegal activities')}</li>
              <li>{tr('Usivunje hakimiliki za watu wengine', 'Do not infringe on others\' copyright')}</li>
              <li>{tr('Usijaribu kuvunja usalama wa mfumo au kupata data ya watumiaji wengine', 'Do not attempt to breach platform security or access other users\' data')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-deep dark:text-white mb-3">3. {tr('Usalama wa Akaunti', 'Account Security')}</h2>
            <p className="leading-relaxed">{tr(
              'Wewe ndiye unawajibika kwa usalama wa akaunti yako. Tumia nywila thabiti na usharinge hati zako za kuingia. KikwetuConnect hutumia usimbaji fiche wa kiwango cha juu (encryption) na kamwe haihifadhi nywila zako kwa maandishi wazi. Ukiona shughuli ya kutiliwa shaka kwenye akaunti yako, tafadhali wasiliana nasi mara moja kupitia ukurasa wa Contact Us.',
              'You are responsible for the security of your account. Use a strong password and never share your login credentials. KikwetuConnect uses enterprise-grade encryption and never stores passwords in plain text. If you notice suspicious activity on your account, please contact us immediately through our Contact Us page.'
            )}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-deep dark:text-white mb-3" id="guidelines">4. {tr('Miongozo ya Jamii', 'Community Guidelines')}</h2>
            <p className="leading-relaxed">{tr(
              'Tunajenga jamii yenye heshima, ushirikishwaji, na usalama. Machapisho yote lazima yazingatie miongozo hii. Ukiukaji unaweza kusababisha akaunti yako kusimamishwa au kufutwa.',
              'We build a community of respect, inclusion, and safety. All posts must follow these guidelines. Violations may result in account suspension or termination.'
            )}</p>
            <ul className="list-disc pl-6 mt-3 space-y-1 text-sm">
              <li>{tr('Chapisha kwa lugha ya heshima daima', 'Always post respectfully')}</li>
              <li>{tr('Toa chanzo cha taarifa zako unapowezekana', 'Cite your sources when possible')}</li>
              <li>{tr('Usijihusishe na ubaguzi wa aina yoyote', 'Do not engage in discrimination of any kind')}</li>
              <li>{tr('Ripoti tabia mbaya unayoiona — usalama ni jukumu la kila mtu', 'Report bad behavior when you see it — safety is everyone\'s responsibility')}</li>
              <li>{tr('Usichapishe taarifa za kibinafsi za watu wengine bila ridhaa yao', 'Do not post others\' personal information without their consent')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-deep dark:text-white mb-3">5. {tr('Mabadiliko ya Masharti', 'Changes to Terms')}</h2>
            <p className="leading-relaxed">{tr(
              'Tunaweza kubadilisha masharti haya wakati wowote. Mabadiliko yataanza kutumika mara tu yanapochapishwa. Endelea kutumia mfumo kunamaanisha unakubali mabadiliko hayo. Tutakujulisha kuhusu mabadiliko muhimu kupitia barua pepe au taarifa kwenye mfumo.',
              'We may change these terms at any time. Changes take effect immediately upon posting. Continued use of the platform means you accept the changes. We will notify you of material changes via email or platform notification.'
            )}</p>
          </section>

          <section className="bg-brand-terracotta/5 dark:bg-brand-terracotta/10 rounded-xl p-4 border border-brand-terracotta/20">
            <p className="text-sm font-semibold text-brand-red">
              🔒 {tr('Tunachukua usalama wako kwa uzito. Ikiwa unaona hitilafu yoyote ya usalama, tafadhali ripoti mara moja kupitia ukurasa wetu wa Contact.', 'We take your security seriously. If you notice any security vulnerability, please report it immediately through our Contact page.')}
            </p>
          </section>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}