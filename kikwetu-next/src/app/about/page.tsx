'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppFooter from '@/components/AppFooter';

const TEAM = [
  { name: 'Wayne Nyamu', role: 'Founder & CEO', desc: 'Building East Africa\'s knowledge future.', emoji: '🚀' },
  { name: 'Mkulima Jane', role: 'Community Lead, Agronomy', desc: 'Farmer-first approach to agricultural knowledge sharing.', emoji: '🌾' },
  { name: 'Yonas Boley', role: 'Lead Engineer', desc: 'Full-stack developer building the platform.', emoji: '💻' },
];

export default function AboutPage() {
  const [lang, setLang] = useState<'en' | 'sw'>('en');
  const tr = (en: string, sw: string) => lang === 'sw' ? sw : en;

  return (
    <div className="min-h-screen bg-brand-bgLight dark:bg-brand-bgDark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-brand-orange hover:text-brand-lightOrange mb-8 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
          {tr('Rudi Nyumbani', 'Back to Home')}
        </Link>

        <div className="text-center space-y-4 mb-16">
          <img src="/logo-icon.svg" alt="" className="h-14 mx-auto mb-4" />
          <h1 className="text-4xl sm:text-5xl font-black font-logo">
            <span className="text-brand-green dark:text-white">Kikwetu</span><span className="text-brand-orange">Connect</span>
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-300 font-medium">{tr('Maarifa Yetu, Hadithi Zetu, Mustakabali Wetu', 'Our Knowledge, Our Stories, Our Future')}</p>
        </div>

        <div className="space-y-16">
          <section className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl font-black">{tr('Hadithi Yetu', 'Our Story')}</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {tr(
                'KikwetuConnect ilizaliwa kutokana na wazo rahisi: Kila Mkenya ana maarifa ya thamani ya kushiriki. Iwe ni mkulima anayejua mbinu bora za kilimo, mtengenezaji wa teknolojia anayejua programu, au mwalimu anayefundisha vizazi vijacho — sote tuna kitu cha kujifunza na kufundisha.',
                'KikwetuConnect was born from a simple idea: Every Kenyan has valuable knowledge to share. Whether a farmer who knows best agricultural practices, a tech developer who knows code, or a teacher educating the next generation — we all have something to learn and teach.'
              )}
            </p>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {tr(
                'Tunaamini kuwa mfumo wa digitali unaweza kuleta Wakenya wote pamoja, kuvuka kaunti na lugha, ili kuunda mustakabali bora wa pamoja.',
                'We believe that a digital platform can bring all Kenyans together, across counties and languages, to build a better shared future.'
              )}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-center mb-10">{tr('Thamani Zetu', 'Our Values')}</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { icon: '🤝', title: tr('Ushirikishwaji', 'Inclusivity'), desc: tr('Kila sauti inahesabiwa, kila lugha inakaribishwa.', 'Every voice counts, every language is welcome.') },
                { icon: '📚', title: tr('Maarifa', 'Knowledge'), desc: tr('Tunaamini katika nguvu ya maarifa ya pamoja.', 'We believe in the power of shared knowledge.') },
                { icon: '🌱', title: tr('Ukuaji', 'Growth'), desc: tr('Kutoka kaunti hadi kaunti, tunakua pamoja.', 'From county to county, we grow together.') },
              ].map((v, i) => (
                <div key={i} className="text-center p-6 rounded-2xl bg-white dark:bg-brand-cardDark border border-gray-200 dark:border-gray-800 shadow-sm">
                  <span className="text-4xl block mb-3">{v.icon}</span>
                  <h3 className="text-lg font-bold mb-2">{v.title}</h3>
                  <p className="text-sm text-gray-500">{v.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-center mb-10">{tr('Timu Yetu', 'Our Team')}</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {TEAM.map((t, i) => (
                <div key={i} className="text-center p-6 rounded-2xl bg-white dark:bg-brand-cardDark border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all">
                  <span className="text-5xl block mb-4">{t.emoji}</span>
                  <h3 className="text-lg font-bold">{t.name}</h3>
                  <p className="text-xs font-bold text-brand-orange uppercase tracking-wider mb-2">{t.role}</p>
                  <p className="text-sm text-gray-500">{t.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="text-center space-y-6">
            <h2 className="text-2xl font-black">{tr('Jiunge Nasi', 'Join Us')}</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              {tr('Uko tayari kuwa sehemu ya mustakabali wa Kenya? Jiunge na jamii yetu inayokua.', 'Ready to be part of Kenya\'s future? Join our growing community.')}
            </p>
            <Link href="/onboarding" className="inline-flex items-center gap-2 bg-brand-orange hover:bg-brand-lightOrange text-white px-8 py-4 rounded-full text-sm font-bold shadow-lg transition-all">
              {tr('Anza Sasa', 'Get Started Now')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </section>
        </div>
      </div>
      <AppFooter lang={lang} setLang={setLang} />
    </div>
  );
}
