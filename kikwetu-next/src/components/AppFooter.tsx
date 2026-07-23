'use client';

import Link from 'next/link';

const footerLinks = {
  platform: [
    { label: 'About Us', href: '/about' },
    { label: 'Baraza (Feed)', href: '/feed' },
    { label: 'Spaces', href: '/feed?view=spaces' },
    { label: 'Leaderboard', href: '/feed?view=leaderboard' },
  ],
  resources: [
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Advertise', href: '/advertise' },
    { label: 'Blog', href: '#' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/privacy#cookies' },
    { label: 'Community Guidelines', href: '/terms#guidelines' },
  ],
};

export default function AppFooter({ lang, setLang }: { lang: 'en' | 'sw'; setLang: (l: 'en' | 'sw') => void }) {
  const tr = (en: string, sw: string) => lang === 'sw' ? sw : en;

  return (
    <footer className="bg-white dark:bg-brand-cardDark border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo-icon.svg" alt="KikwetuConnect" className="h-8 w-auto" />
              <span className="text-lg font-bold text-brand-green dark:text-white">Kikwetu<span className="text-brand-orange">Connect</span></span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {tr(
                'Maarifa Yetu, Hadithi Zetu, Mustakabali Wetu. East Africa\'s platform for knowledge, community, and growth.',
                'Maarifa Yetu, Hadithi Zetu, Mustakabali Wetu. Jukwaa la Afrika Mashariki kwa maarifa, jamii, na ukuaji.'
              )}
            </p>
            <button onClick={() => setLang(lang === 'en' ? 'sw' : 'en')} className="flex items-center gap-2 text-xs font-semibold text-brand-orange hover:text-brand-lightOrange transition-colors bg-brand-orange/10 px-3 py-1.5 rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
              {lang === 'en' ? 'Switch to Kiswahili' : 'Badilisha kwa English'}
            </button>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">{tr('Platform', 'Jukwaa')}</h4>
            <ul className="space-y-3">
              {footerLinks.platform.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-600 dark:text-gray-300 hover:text-brand-orange transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">{tr('Resources', 'Rasilimali')}</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-600 dark:text-gray-300 hover:text-brand-orange transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">{tr('Legal', 'Kisheria')}</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-600 dark:text-gray-300 hover:text-brand-orange transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} KikwetuConnect. {tr('Haki Zote Zimehifadhiwa.', 'All rights reserved.')}
          </p>
          <div className="flex items-center gap-4">
            {[
              { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', href: '#', label: 'Twitter' },
              { icon: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3V2z', href: '#', label: 'Facebook' },
              { icon: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z', href: '#', label: 'X' },
            ].map(s => (
              <a key={s.label} href={s.href} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-brand-orange hover:text-white transition-all" aria-label={s.label}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={s.icon} /></svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
