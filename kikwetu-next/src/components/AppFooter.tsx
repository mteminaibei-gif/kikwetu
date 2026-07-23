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
                { icon: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z', href: '#', label: 'X' },
                { icon: 'M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z', href: '#', label: 'Facebook' },
                { icon: 'M12 2C6.477 2 2 6.477 2 12c0 4.237 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.182-.78 1.172-4.97 1.172-4.97s-.299-.6-.299-1.486c0-1.39.806-2.428 1.81-2.428.852 0 1.264.64 1.264 1.408 0 .858-.546 2.14-.828 3.33-.236.995.5 1.807 1.48 1.807 1.778 0 3.144-1.874 3.144-4.579 0-2.394-1.72-4.068-4.177-4.068-2.845 0-4.515 2.135-4.515 4.34 0 .859.331 1.78.744 2.282a.3.3 0 01.069.288l-.278 1.133c-.044.183-.145.223-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.527-2.29-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.622.937.29 1.931.446 2.96.446 5.523 0 10-4.477 10-10S17.523 2 12 2z', href: '#', label: 'Instagram' },
            ].map(s => (
              <a key={s.label} href={s.href} className="w-8 h-8 rounded-full bg-amber-50/50 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-brand-orange hover:text-white transition-all" aria-label={s.label}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={s.icon} /></svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
