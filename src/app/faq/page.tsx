'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppFooter from '@/components/AppFooter';
import { useLanguage } from '@/context/LanguageContext';

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
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null);
  const { contentLang, setContentLang, tr } = useLanguage();

  return (
    <div className="min-h-screen bg-brand-bgLight dark:bg-brand-bgDark">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-brand-red hover:text-brand-red mb-8 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
          {tr('Rudi Nyumbani', 'Back to Home')}
        </Link>
        <div className="text-center space-y-4 mb-16">
          <img src="/logo-icon.svg" alt="" className="h-12 mx-auto mb-4" />
          <h1 className="text-4xl sm:text-5xl font-black font-logo text-brand-deep dark:text-white">
            {tr('Maswali Yanayoulizwa Mara kwa Mara', 'Frequently Asked Questions')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            {tr('Majibu ya maswali ya kawaida kuhusu KikwetuConnect.', 'Answers to common questions about KikwetuConnect.')}
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="sun-card overflow-hidden transition-all">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200 pr-4">{contentLang === 'sw' ? faq.qs : faq.q}</span>
                <svg className={`w-4 h-4 shrink-0 text-brand-red transition-transform ${open === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed border-t border-black/5 dark:border-gray-700 pt-4">
                  {contentLang === 'sw' ? faq.as : faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <AppFooter />
    </div>
  );
}