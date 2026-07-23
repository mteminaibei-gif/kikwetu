'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppFooter from '@/components/AppFooter';

const FAQS = [
  {
    q: 'What is KikwetuConnect?',
    qs: 'KikwetuConnect ni nini?',
    a: 'KikwetuConnect is East Africa\'s knowledge platform where you can ask questions, share expertise, join communities (Spaces), participate in live audio rooms (Sauti), earn karma (Heshima), and trade on the marketplace (Mtaa Exchange).',
    as: 'KikwetuConnect ni jukwaa la maarifa Afrika Mashariki ambapo unaweza kuuliza maswali, kushiriki utaalamu, kujiunga na jamii (Spaces), kushiriki kwenye vyumba vya sauti (Sauti), kupata Heshima, na kufanya biashara kwenye Mtaa Exchange.',
  },
  {
    q: 'Is KikwetuConnect free?',
    qs: 'Je, KikwetuConnect ni bure?',
    a: 'Yes! KikwetuConnect is completely free to join and use. You can ask questions, answer, join spaces, and participate in audio rooms at no cost.',
    as: 'Ndiyo! KikwetuConnect ni bure kabisa kujiunga na kutumia. Unaweza kuuliza maswali, kujibu, kujiunga na spaces, na kushiriki kwenye vyumba vya sauti bila malipo.',
  },
  {
    q: 'What is Heshima (karma)?',
    qs: 'Heshima ni nini?',
    a: 'Heshima is your reputation score on KikwetuConnect. You earn it when other users upvote your questions, answers, and posts. Higher Heshima unlocks badges like Mtaalamu (Expert) and Mwalimu (Educator).',
    as: 'Heshima ni alama ya sifa yako kwenye KikwetuConnect. Unaipata wakati watumiaji wengine wanakupigia kura machapisho yako. Heshima ya juu inafungua bidhaa kama Mtaalamu na Mwalimu.',
  },
  {
    q: 'Which counties are supported?',
    qs: 'Je, ni kaunti zipi zinaungwa mkono?',
    a: 'All 47 counties of Kenya are supported. You can join or create county-specific discussions and connect with people from your region.',
    as: 'Kaunti zote 47 za Kenya zinaungwa mkono. Unaweza kujiunga au kuunda majadiliano maalum ya kaunti yako na kuungana na watu kutoka eneo lako.',
  },
  {
    q: 'Can I use both English and Swahili?',
    qs: 'Naweza kutumia English na Kiswahili?',
    a: 'Absolutely! KikwetuConnect supports both English and Swahili. You can toggle between languages using the button on any page. Posts appear in your preferred language.',
    as: 'Kabisa! KikwetuConnect inasaidia English na Kiswahili. Unaweza kubadilisha lugha kwa kutumia kitufe kilicho kwenye kila ukurasa. Machapisho yanaonekana kwa lugha unayopendelea.',
  },
  {
    q: 'How do I earn badges?',
    qs: 'Ninawezaje kupata bidhaa (badges)?',
    a: 'Badges are awarded automatically based on your Heshima score and contributions. Reach 500 Heshima to become Mwananchi, 2000 for Mtaalamu, and 5000+ for Mwalimu Mkuu.',
    as: 'Bidhaa hutolewa kiotomatiki kulingana na alama zako za Heshima na michango yako. Fikia Heshima 500 kuwa Mwananchi, 2000 kuwa Mtaalamu, na 5000+ kuwa Mwalimu Mkuu.',
  },
  {
    q: 'What are Sauti (Audio Rooms)?',
    qs: 'Sauti ni nini?',
    a: 'Sauti are live audio rooms where members can host real-time discussions, debates (Mjadala), expert panels, and county meetings. You can join as a listener or request to speak.',
    as: 'Sauti ni vyumba vya sauti vya moja kwa moja ambapo wanachama wanaweza kuwa na majadiliano, mijadala, paneli za wataalamu, na mikutano ya kaunti. Unaweza kujiunga kama msikilizaji au kuomba kuzungumza.',
  },
  {
    q: 'How do I report inappropriate content?',
    qs: 'Ninawezaje kuripoti maudhui yasiyofaa?',
    a: 'Click the flag/report button on any post or reply. Our moderation team reviews reports within 24 hours. You can also contact us directly through the Contact page.',
    as: 'Bonyeza kitufe cha kuripoti kwenye chapisho lolote. Timu yetu ya usimamizi hukagua ripoti ndani ya saa 24. Unaweza pia kuwasiliana nasi moja kwa moja kupitia ukurasa wa Contact.',
  },
  {
    q: 'What is Mtaa Exchange?',
    qs: 'Mtaa Exchange ni nini?',
    a: 'Mtaa Exchange is the marketplace within KikwetuConnect where members can buy and sell farm produce, tech services, handmade goods, and more — county to county.',
    as: 'Mtaa Exchange ni soko la ndani ya KikwetuConnect ambapo wanachama wanaweza kununua na kuuza mazao ya shamba, huduma za teknolojia, bidhaa za mikono, na zaidi — kaunti hadi kaunti.',
  },
  {
    q: 'Is my data safe?',
    qs: 'Je, data yangu iko salama?',
    a: 'Yes. We use industry-standard encryption and security practices. Your data is never sold to third parties. Read our Privacy Policy for more details.',
    as: 'Ndiyo. Tunatumia teknolojia za kiwango cha juu za usalama na usimbaji fiche. Data yako haiuzwi kamwe kwa watu wengine. Soma Sera yetu ya Faragha kwa maelezo zaidi.',
  },
];

export default function FAQPage() {
  const [lang, setLang] = useState<'en' | 'sw'>('en');
  const [open, setOpen] = useState<number | null>(null);
  const tr = (en: string, sw: string) => lang === 'sw' ? sw : en;

  return (
    <div className="min-h-screen bg-brand-bgLight dark:bg-brand-bgDark">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-brand-orange hover:text-brand-lightOrange mb-8 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
          {tr('Rudi Nyumbani', 'Back to Home')}
        </Link>
        <div className="text-center space-y-4 mb-16">
          <img src="/logo-icon.svg" alt="" className="h-12 mx-auto mb-4" />
          <h1 className="text-4xl sm:text-5xl font-black font-logo">
            {tr('Maswali Yanayoulizwa Mara kwa Mara', 'Frequently Asked Questions')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            {tr('Majibu ya maswali ya kawaida kuhusu KikwetuConnect.', 'Answers to common questions about KikwetuConnect.')}
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-white dark:bg-brand-cardDark border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden transition-all hover:shadow-md">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                <span className="text-sm font-bold pr-4">{lang === 'sw' ? faq.qs : faq.q}</span>
                <svg className={`w-4 h-4 shrink-0 text-gray-400 transition-transform ${open === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-4">
                  {lang === 'sw' ? faq.as : faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <AppFooter lang={lang} setLang={setLang} />
    </div>
  );
}
