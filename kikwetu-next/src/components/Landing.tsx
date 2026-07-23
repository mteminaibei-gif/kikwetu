'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AppFooter from '@/components/AppFooter';

function CountUp({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const start = performance.now();
        const step = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          setCount(Math.floor(p * end));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{count}{suffix}</span>;
}

function RevealSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}>
      {children}
    </div>
  );
}

const HOW_IT_WORKS = [
  { step: 1, title: 'Jiunge (Join)', desc: 'Sign up in seconds, pick your county and interests — farming, tech, education, or culture.', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
  { step: 2, title: 'Uliza (Ask)', desc: 'Post questions, share knowledge, or start a Mjadala (debate) in your language — English or Swahili.', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { step: 3, title: 'Jenga Heshima (Earn)', desc: 'Get upvoted by peers, earn Heshima (karma), unlock badges and become a Mtaalamu (expert).', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { step: 4, title: 'Kuza (Grow)', desc: 'Access markets on Mtaa Exchange, join live audio rooms, and connect county-to-county.', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
];

const FEATURES = [
  { title: 'Baraza', desc: 'Community discussions with Q&A, polls, and expert-verified answers across every Kenyan county.', color: 'from-emerald-500 to-emerald-700', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { title: 'Spaces', desc: 'Themed communities like #KilimoSmart, Nairobi Tech, and Swahili Folklore — find your people.', color: 'from-brand-orange to-amber-600', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z' },
  { title: 'Heshima', desc: 'Earn karma points and badges. Top contributors get weekly rewards and recognition.', color: 'from-purple-500 to-purple-700', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { title: 'Sauti (Audio)', desc: 'Live audio rooms for real-time Mjadala (debates), expert panels, and county-level discussions.', color: 'from-red-500 to-red-700', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z' },
  { title: 'Mtaa Exchange', desc: 'Local marketplace for farm produce, tech services, and handmade goods — county-to-county trade.', color: 'from-cyan-500 to-cyan-700', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z' },
  { title: 'Leaderboard', desc: 'Compete county vs county. Who has the top Mwalimu (educator) this week?', color: 'from-yellow-500 to-yellow-700', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
];

const TESTIMONIALS = [
  { name: 'Mkulima Jane', county: 'Trans-Nzoia', text: 'Nimejifunza kilimo bora kupitia #KilimoSmart. Mazao yangu yameongezeka maradufu!', textEn: 'I learned better farming through #KilimoSmart. My harvest doubled!', avatar: '🌾' },
  { name: 'Yonas Boley', county: 'Nairobi', text: 'KikwetuConnect helped me find Flutter devs for my startup. The community is gold.', textEn: 'KikwetuConnect helped me find Flutter devs for my startup. The community is gold.', avatar: '💻' },
  { name: 'Amina Baraka', county: 'Mombasa', text: 'Nimeuza bidhaa zangu kwenye Mtaa Exchange. Sasa sina shida ya soko.', textEn: 'I sold my goods on Mtaa Exchange. Market access is no longer a problem.', avatar: '🚢' },
];

export default function Landing() {
  const [lang, setLang] = useState<'en' | 'sw'>('en');
  const [activeHowTo, setActiveHowTo] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  const tr = (en: string, sw: string) => lang === 'sw' ? sw : en;

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveHowTo(prev => (prev + 1) % HOW_IT_WORKS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-brand-bgLight dark:bg-brand-bgDark">
      {/* HERO */}
      <section ref={heroRef} className="relative overflow-hidden min-h-[90vh] flex items-center savannah-pattern dark:savannah-pattern-dark">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-brand-bgLight dark:from-brand-bgDark to-transparent z-10" />
          <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-amber-600/10 to-transparent" />
          <svg className="absolute bottom-0 left-0 w-full h-auto opacity-30 dark:opacity-20" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="#D96B27" d="M0,224L60,213.3C120,203,240,181,360,176C480,171,600,181,720,197.3C840,213,960,235,1080,229.3C1200,224,1320,192,1380,176L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"/>
            <path fill="#C4956A" d="M0,256L60,250.7C120,245,240,235,360,240C480,245,600,267,720,272C840,277,960,267,1080,250.7C1200,235,1320,213,1380,202.7L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"/>
          </svg>
          <div className="absolute bottom-8 left-[15%] text-6xl animate-giraffeWalk opacity-20 dark:opacity-10 select-none">🦒</div>
          <div className="absolute bottom-4 right-[20%] text-6xl opacity-20 dark:opacity-10 animate-float select-none" style={{animationDelay: '1s'}}>🌳</div>
          <div className="absolute bottom-12 left-[40%] text-5xl opacity-15 dark:opacity-10 animate-float select-none" style={{animationDelay: '2s'}}>🦁</div>
          <div className="absolute bottom-6 right-[35%] text-6xl opacity-15 dark:opacity-10 animate-giraffeWalk select-none" style={{animationDelay: '0.5s'}}>🦏</div>
          <div className="absolute top-[15%] right-[10%] w-32 h-32 rounded-full bg-gradient-to-br from-amber-300/30 via-orange-400/20 to-transparent blur-3xl animate-sunGlow" />
          <div className="absolute top-[20%] left-[8%] w-24 h-24 rounded-full bg-gradient-to-br from-brand-orange/20 to-transparent blur-2xl animate-float" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-white/80 dark:bg-brand-cardDark/80 backdrop-blur-sm border border-amber-200 dark:border-amber-900/50 px-4 py-2 rounded-full text-xs font-bold text-brand-orange shadow-sm animate-fadeInUp">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {tr('Jamii Inakua — 12,000+ Wakenya', 'Community Growing — 12,000+ Kenyans')}
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black font-logo tracking-tight leading-[1.1] animate-fadeInUp animate-delay-100">
                <span className="text-brand-green dark:text-white">{tr('Kikwetu', 'Kikwetu')}</span>
                <span className="text-brand-orange">Connect</span>
                <br />
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-600 dark:text-gray-300">
                  {tr('Maarifa Yetu, Hadithi Zetu, Mustakabali Wetu', 'Our Knowledge, Our Stories, Our Future')}
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg animate-fadeInUp animate-delay-200">
                {tr(
                  'East Africa\'s premier knowledge platform. Share what you know, learn what you don\'t, and grow with a community that speaks your language.',
                  'Jukwaa la maarifa Afrika Mashariki. Shiriki unachojua, jifunze usichojua, na kua na jamii inayozungumza lugha yako.'
                )}
              </p>

              <div className="flex flex-wrap gap-4 animate-fadeInUp animate-delay-300">
                <Link href="/onboarding" className="group relative inline-flex items-center gap-2 bg-brand-orange hover:bg-brand-lightOrange text-white px-8 py-4 rounded-full text-sm font-bold shadow-xl transition-all active:scale-95 overflow-hidden">
                  <span className="relative z-10">{tr('Anza Bure', 'Get Started Free')}</span>
                  <svg className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                </Link>
                <Link href="/feed" className="inline-flex items-center gap-2 border-2 border-gray-300 dark:border-gray-600 hover:border-brand-orange text-gray-700 dark:text-gray-200 hover:text-brand-orange px-8 py-4 rounded-full text-sm font-bold transition-all group">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                  {tr('Chunguza Baraza', 'Explore Baraza')}
                </Link>
                <button onClick={() => setLang(l => l === 'en' ? 'sw' : 'en')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white/80 dark:bg-brand-cardDark/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-orange transition-all">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                  {lang === 'en' ? 'Kiswahili' : 'English'}
                </button>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 animate-fadeInUp animate-delay-400">
                <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{tr('Bila Malipo', 'Free')}</span>
                <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>{tr('Salama', 'Secure')}</span>
                <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{tr('Kaunti Zote', 'All Counties')}</span>
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center animate-scaleIn animate-delay-200">
              <div className="relative w-full max-w-md aspect-square">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-green/20 via-brand-orange/10 to-transparent rounded-[40px] rotate-6" />
                <div className="absolute inset-0 bg-gradient-to-tr from-brand-orange/20 via-transparent to-amber-400/20 rounded-[40px] -rotate-3" />
                <div className="relative w-full h-full rounded-[32px] shadow-2xl overflow-hidden savannah-card">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
                      <div className="w-10 h-10 rounded-full bg-brand-green flex items-center justify-center text-white font-bold">K</div>
                      <div className="flex-1">
                        <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded-full" />
                        <div className="h-2 w-24 bg-gray-100 dark:bg-gray-800 rounded-full mt-1.5" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="flex gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                          <div className="w-8 h-8 rounded-full bg-brand-orange/20 flex items-center justify-center">{['🌾','💻','📖'][i-1]}</div>
                          <div className="flex-1">
                            <div className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded-full" />
                            <div className="h-2 w-40 bg-gray-100 dark:bg-gray-800 rounded-full mt-1.5" />
                          </div>
                          <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                            {i === 1 ? '24' : i === 2 ? '18' : '9'}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                      <span className="text-xs font-bold text-brand-orange">#KilimoSmart · Trending</span>
                      <span className="text-xs text-gray-400">12.4k posts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BRAND STORY */}
      <RevealSection>
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-block px-4 py-1.5 bg-brand-green/10 dark:bg-brand-green/20 rounded-full text-xs font-bold text-brand-green uppercase tracking-wider">
                {tr('Hadithi Yetu', 'Our Story')}
              </div>
              <h2 className="text-4xl sm:text-5xl font-black font-logo leading-tight">
                {tr('Nini Maana ya', 'What Does')}{' '}
                <span className="text-brand-green">Kikwetu</span>
                <span className="text-brand-orange">Connect</span>
                {' '}{tr('?', 'Mean?')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                {tr(
                  '"Kikwetu" means "Our Place" in Swahili. We\'re building a digital home where every Kenyan — from the maize farmer in Trans-Nzoia to the developer in Nairobi — can share knowledge, grow together, and shape our collective future.',
                  '"Kikwetu" maana yake ni "Nyumbani Kwetu" kwa Kiswahili. Tunajenga nyumba ya digitali ambapo kila Mkenya — kutoka kwa mkulima wa mahindi Trans-Nzoia hadi mwendelezaji wa Nairobi — anaweza kushiriki maarifa, kukua pamoja, na kuunda mustakabali wetu wa pamoja.'
                )}
              </p>
              <div className="grid grid-cols-3 gap-6 pt-4">
                {[
                  { label: tr('Watumiaji', 'Users'), value: '12K+' },
                  { label: tr('Kaunti', 'Counties'), value: '47' },
                  { label: tr('Majibu', 'Answers'), value: '85K+' },
                ].map(s => (
                  <div key={s.label} className="text-center p-4 rounded-2xl savannah-card shadow-sm">
                    <span className="block text-2xl font-black text-brand-orange">{s.value}</span>
                    <span className="text-xs text-gray-500 font-medium">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-brand-orange/10 rounded-3xl -z-10" />
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-brand-green/10 rounded-3xl -z-10" />
              <div className="bg-gradient-to-br from-brand-green to-brand-darkGreen p-8 rounded-[40px] text-white space-y-6 shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl">🌍</div>
                  <div>
                    <h4 className="font-black text-lg">{tr('Dira Yetu', 'Our Vision')}</h4>
                    <p className="text-sm text-white/70">{tr('Kuunganisha Kila Mkenya', 'Connecting Every Kenyan')}</p>
                  </div>
                </div>
                <p className="text-white/80 text-sm leading-relaxed">
                  {tr(
                    'A digitally inclusive Kenya where knowledge flows freely between counties, generations, and languages. Where a farmer in Kilifi learns from a tech innovator in Nairobi, and a student in Kisumu gets mentored by a professional in Mombasa.',
                    'Kenya yenye ushirikishwaji wa digitali ambapo maarifa yanapita kwa uhuru kati ya kaunti, vizazi, na lugha. Ambapo mkulima Kilifi anajifunza kutoka kwa mvumbuzi wa teknolojia Nairobi, na mwanafunzi Kisumu anapata mwongozo kutoka kwa mtaalamu Mombasa.'
                  )}
                </p>
                <div className="flex gap-2">
                  {['Kilimo', 'Tech', 'Elimu', 'Utamaduni', 'Afya'].map(t => (
                    <span key={t} className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* HOW IT WORKS */}
      <RevealSection>
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-brand-cardDark/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-4 mb-16">
              <div className="inline-block px-4 py-1.5 bg-brand-orange/10 rounded-full text-xs font-bold text-brand-orange uppercase tracking-wider">
                {tr('Jinsi Inavyofanya Kazi', 'How It Works')}
              </div>
              <h2 className="text-4xl sm:text-5xl font-black font-logo">
                {tr('Anza kwa Hatua Nne', 'Get Started in 4 Steps')}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                {tr(
                  'From signing up to earning Heshima, here\'s how KikwetuConnect works.',
                  'Kuanzia kujiandikisha hadi kupata Heshima, hivi ndivyo KikwetuConnect inavyofanya kazi.'
                )}
              </p>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
              {HOW_IT_WORKS.map((item, i) => (
                <div key={i}
                  onMouseEnter={() => setActiveHowTo(i)}
                  className={`relative p-6 rounded-2xl transition-all duration-500 cursor-pointer border-2 ${
                    activeHowTo === i
                      ? 'border-brand-orange bg-gradient-to-b from-brand-orange/5 to-transparent shadow-xl scale-105'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-brand-cardDark hover:border-brand-orange/50'
                  }`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black mb-4 ${
                    activeHowTo === i ? 'bg-brand-orange text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}>{item.step}</div>
                  <svg className={`w-8 h-8 mb-3 ${activeHowTo === i ? 'text-brand-orange' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} /></svg>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-2 mt-8">
              {HOW_IT_WORKS.map((_, i) => (
                <button key={i} onClick={() => setActiveHowTo(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    activeHowTo === i ? 'w-8 bg-brand-orange' : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      {/* FEATURES */}
      <RevealSection>
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-block px-4 py-1.5 bg-brand-green/10 rounded-full text-xs font-bold text-brand-green uppercase tracking-wider">
              {tr('Vipengele', 'Features')}
            </div>
            <h2 className="text-4xl sm:text-5xl font-black font-logo">
              {tr('Kila Kitu Mahali Pamoja', 'Everything in One Place')}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="group relative savannah-card p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${f.color} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:opacity-10 transition-opacity`} />
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={f.icon} /></svg>
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </RevealSection>

      {/* STATS */}
      <RevealSection>
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-brand-green/10 via-brand-orange/5 to-brand-green/10 dark:from-brand-darkGreen dark:via-brand-cardDark dark:to-brand-darkGreen">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { icon: '👥', value: 12, suffix: 'K+', label: tr('Watumiaji', 'Users') },
                { icon: '🌾', value: 85, suffix: 'K+', label: tr('Machapisho', 'Posts') },
                { icon: '🗺️', value: 47, suffix: '', label: tr('Kaunti', 'Counties') },
                { icon: '🏆', value: 3, suffix: 'K+', label: tr('Heshima Earned', 'Heshima Imepatikana') },
              ].map((s, i) => (
                <div key={i} className="text-center p-6 rounded-2xl bg-white/80 dark:bg-brand-cardDark/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all">
                  <span className="text-4xl block mb-3">{s.icon}</span>
                  <span className="text-3xl sm:text-4xl font-black text-brand-orange block">
                    <CountUp end={s.value} suffix={s.suffix} />
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      {/* TESTIMONIALS */}
      <RevealSection>
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-block px-4 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              {tr('Walio Tuchunguza', 'Testimonials')}
            </div>
            <h2 className="text-4xl sm:text-5xl font-black font-logo">
              {tr('Wanachama Wetu Wanasema', 'What Our Members Say')}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="savannah-card p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{t.avatar}</span>
                  <div>
                    <h4 className="text-sm font-bold">{t.name}</h4>
                    <span className="text-xs text-gray-400">{t.county}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">
                  &ldquo;{lang === 'sw' ? t.text : t.textEn}&rdquo;
                </p>
                <div className="flex gap-0.5 mt-4">
                  {[1,2,3,4,5].map(s => <span key={s} className="text-amber-400 text-sm">★</span>)}
                </div>
              </div>
            ))}
          </div>
        </section>
      </RevealSection>

      {/* CTA */}
      <RevealSection>
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto relative overflow-hidden rounded-[40px] bg-gradient-to-br from-brand-green via-brand-darkGreen to-brand-green p-12 sm:p-16 text-center text-white shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl sm:text-5xl font-black font-logo">
                {tr('Uko Tayari Kuungana?', 'Ready to Connect?')}
              </h2>
              <p className="text-white/80 max-w-2xl mx-auto text-lg">
                {tr(
                  'Jiunge na Wakenya 12,000+ wanaoshiriki maarifa, hadithi, na mustakabali wao.',
                  'Join 12,000+ Kenyans sharing their knowledge, stories, and future.'
                )}
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Link href="/onboarding" className="inline-flex items-center gap-2 bg-brand-orange hover:bg-brand-lightOrange text-white px-8 py-4 rounded-full text-sm font-bold shadow-xl transition-all active:scale-95">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                  {tr('Jiunge Bure', 'Join Free')}
                </Link>
                <Link href="/feed" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 hover:border-white/50 px-8 py-4 rounded-full text-sm font-bold transition-all backdrop-blur-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                  {tr('Tazama Baraza', 'View Baraza')}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      <AppFooter lang={lang} setLang={setLang} />
    </div>
  );
}
