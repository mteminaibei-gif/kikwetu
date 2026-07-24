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

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); o.disconnect(); } }, { threshold: 0.08 });
    o.observe(el);
    return () => o.disconnect();
  }, []);
  return <div ref={ref} className={`transition-all duration-700 ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}>{children}</div>;
}

const FOCUS_AREAS = [
  { emoji: '🌾', label: '#KilimoSmart', desc: 'Modern agronomy, soil health, market prices — in every county' },
  { emoji: '💻', label: 'Tech & Biz', desc: 'Startups, coding, digital skills across Kenya' },
  { emoji: '📚', label: 'Elimu', desc: 'School resources, tutoring, and lifelong learning' },
  { emoji: '🎭', label: 'Utamaduni', desc: 'Stories, poetry, folklore in Swahili & English' },
  { emoji: '🏥', label: 'Afya', desc: 'Health tips, telemedicine, and community wellness' },
];

const HOW = [
  { step: 1, title: 'Jiunge (Join)', desc: 'Sign up in seconds, pick your county and interests — farming, tech, education, or culture.', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
  { step: 2, title: 'Uliza (Ask)', desc: 'Post questions, share knowledge, or start a Mjadala (debate) in English or Swahili.', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { step: 3, title: 'Jenga Heshima (Earn)', desc: 'Get upvoted by peers, earn Heshima (karma), unlock badges and become a Mtaalamu (expert).', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { step: 4, title: 'Kuza (Grow)', desc: 'Access markets on Mtaa Exchange, join live audio rooms, and connect county-to-county.', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
];

const FEATURES = [
  { title: 'Baraza', desc: 'Community discussions with Q&A, polls, and expert-verified answers across every Kenyan county.', emoji: '💬', gradient: 'from-brand-deep to-brand-deep' },
  { title: 'Spaces', desc: 'Themed communities like #KilimoSmart, Nairobi Tech, and Swahili Folklore.', emoji: '🏘️', gradient: 'from-brand-terracotta to-brand-red' },
  { title: 'Heshima', desc: 'Earn karma points and badges. Top contributors get weekly rewards and recognition.', emoji: '⚡', gradient: 'from-purple-500 to-purple-700' },
  { title: 'Sauti (Audio)', desc: 'Live audio rooms for real-time Mjadala (debates), expert panels, and county-level discussions.', emoji: '🎙️', gradient: 'from-red-500 to-red-700' },
  { title: 'Mtaa Exchange', desc: 'Local marketplace for farm produce, tech services, and handmade goods.', emoji: '🛒', gradient: 'from-cyan-500 to-cyan-700' },
  { title: 'Leaderboard', desc: 'Compete county vs county. Who has the top Mwalimu (educator) this week?', emoji: '🏆', gradient: 'from-yellow-500 to-yellow-700' },
];

const REVIEWS = [
  { name: 'Mkulima Jane', county: 'Trans-Nzoia', text: 'Nimejifunza kilimo bora kupitia #KilimoSmart. Mazao yangu yameongezeka maradufu!', textEn: 'I learned better farming through #KilimoSmart. My harvest doubled!', avatar: '🌾' },
  { name: 'Yonas Boley', county: 'Nairobi', text: 'KikwetuConnect helped me find Flutter devs for my startup. The community is gold.', textEn: 'KikwetuConnect helped me find Flutter devs for my startup. The community is gold.', avatar: '💻' },
  { name: 'Amina Baraka', county: 'Mombasa', text: 'Nimeuza bidhaa zangu kwenye Mtaa Exchange. Sasa sina shida ya soko.', textEn: 'I sold my goods on Mtaa Exchange. Market access is no longer a problem.', avatar: '🚢' },
];

export default function Landing() {
  const [lang, setLang] = useState<'en' | 'sw'>('en');
  const [activeStep, setActiveStep] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);
  const [featurePaused, setFeaturePaused] = useState(false);
  const tr = (e: string, s: string) => lang === 'sw' ? s : e;

  const EDU_FEATURES = [
    { emoji: '🎓', title: tr('Uliza Mwalimu', 'Ask a Teacher'), desc: tr('Pata mwongozo kutoka kwa wataalamu walio thibitishwa. Maswali yako yanajibiwa na walimu wenye sifa.', 'Get guidance from verified professionals. Your questions answered by qualified teachers.'), color: 'from-brand-deep/10 to-brand-deep/5', border: 'border-brand-deep/30' },
    { emoji: '💬', title: tr('Somo Moja kwa Moja', 'One-on-One Learning'), desc: tr('Jiandikie kikao cha kibinafsi na mtaalamu. Jifunze kwa chat kwa wakati halisi.', 'Book a private session with an expert. Learn through real-time chat.'), color: 'from-brand-terracotta/10 to-brand-red/5', border: 'border-brand-terracotta/30' },
    { emoji: '⭐', title: tr('Kadiria na Tuma Bahshishi', 'Rate & Tip'), desc: tr('Baada ya somo, kadiria huduma na tuma bahshishi kwa M-Pesa kwa mwalimu aliyekusaidia.', 'After a session, rate the service and send a tip via M-Pesa to the teacher who helped you.'), color: 'from-amber-500/10 to-yellow-500/5', border: 'border-amber-500/30' },
    { emoji: '🛡️', title: tr('Walimu Walio Thibitishwa', 'Verified Professionals'), desc: tr('Wataalamu wote wanapaswa kuthibitisha sifa zao. Wanafunzi wanajua wanapata mwongozo wa uhakika.', 'All professionals must prove their qualifications. Students get trusted guidance.'), color: 'from-emerald-500/10 to-green-500/5', border: 'border-emerald-500/30' },
  ];

  useEffect(() => {
    const interval = setInterval(() => setActiveStep(p => (p + 1) % HOW.length), 4500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (featurePaused) return;
    const interval = setInterval(() => setActiveFeature(p => (p + 1) % 4), 4000);
    return () => clearInterval(interval);
  }, [featurePaused]);

  return (
    <div className="min-h-screen">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-brand-deep/6 to-transparent blur-3xl animate-glowPulse" />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-brand-terracotta/6 to-transparent blur-3xl animate-glowPulse" style={{ animationDelay: '2s' }} />
          {/* Savannah sunset glow */}
          <div className="absolute bottom-8 right-[12%] w-72 h-72 rounded-full bg-gradient-to-br from-brand-warm/8 via-brand-amber/5 to-transparent blur-2xl" />
          {/* Acacia tree silhouette */}
          <div className="sun-acacia" />
          <svg className="absolute bottom-0 left-0 w-full h-auto" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="#cc5b47" opacity="0.06" d="M0,192L60,181.3C120,171,240,149,360,144C480,139,600,149,720,165.3C840,181,960,203,1080,197.3C1200,192,1320,160,1380,144L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"/>
            <path fill="#d28156" opacity="0.04" d="M0,256L60,245.3C120,235,240,219,360,208C480,197,600,192,720,197.3C840,203,960,219,1080,213.3C1200,208,1320,181,1380,170.7L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"/>
          </svg>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-brand-cardDark/70 backdrop-blur-sm border border-white/50 dark:border-brand-terracotta/30 px-4 py-2 rounded-full text-xs font-bold text-brand-red shadow-sm animate-fadeUp">
                <span className="w-2 h-2 rounded-full bg-brand-terracotta animate-pulse" />
                {tr('Kaunti Zote 47 — Jumuiya Moja', 'All 47 Counties — One Community')}
              </div>

              <h1 className="font-logo tracking-tight leading-[1.05] animate-fadeUp delay-100">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white">
                  {tr('Kikwetu', 'Kikwetu')}
                </span>
                <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-brand-red">Connect</span>
                <br />
                <span className="text-base sm:text-lg lg:text-xl font-bold text-brand-terracotta dark:text-amber-400">
                  {tr('Jifunze, Shiriki, Kua — Kwa Mwongozo wa Wataalamu Walio Thibitishwa', 'Learn, Share, Grow — Guided by Verified Professionals')}
                </span>
              </h1>

              <p className="text-lg text-gray-800 dark:text-gray-300 leading-relaxed max-w-lg animate-fadeUp delay-200">
                {tr(
                  'East Africa\'s knowledge platform connecting all 47 counties. Share farming tips, tech skills, Swahili stories, and grow with Kenyans who speak your language.',
                  'Jukwaa la maarifa Afrika Mashariki linalounganisha kaunti zote 47. Shiriki vidokezo vya kilimo, ujuzi wa teknolojia, hadithi za Kiswahili, na kua na Wakenya wanaozungumza lugha yako.'
                )}
              </p>

              {/* Focus Area Pills */}
              <div className="flex flex-wrap gap-2 animate-fadeUp delay-200">
                {FOCUS_AREAS.map(f => (
                  <span key={f.label} className="inline-flex items-center gap-1.5 bg-white/60 dark:bg-brand-cardDark/60 backdrop-blur-sm border border-white/40 dark:border-brand-terracotta/20 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-900 dark:text-gray-200 shadow-sm">
                    <span>{f.emoji}</span>
                    {f.label}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 animate-fadeUp delay-300">
                <Link href="/onboarding" className="sun-btn inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-bold shadow-xl active:scale-95">
                  <span>{tr('Anza Bure', 'Get Started Free')}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
                <Link href="/students" className="inline-flex items-center gap-2 border-2 border-brand-terracotta hover:bg-brand-terracotta hover:text-white text-brand-red px-6 py-4 rounded-full text-sm font-bold transition-all group">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  {tr('Tafuta Mtaalamu', 'Find an Expert')}
                </Link>
                <Link href="/feed" className="inline-flex items-center gap-2 border-2 border-gray-300 dark:border-gray-600 hover:border-brand-terracotta text-gray-900 dark:text-gray-200 hover:text-brand-red px-6 py-4 rounded-full text-sm font-bold transition-all group">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                  {tr('Baraza', 'Baraza')}
                </Link>
                <button onClick={() => setLang(l => l === 'en' ? 'sw' : 'en')} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold bg-white/80 dark:bg-brand-cardDark/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-300 hover:border-brand-terracotta transition-all">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                  {lang === 'en' ? 'Kiswahili' : 'English'}
                </button>
              </div>

              <div className="flex items-center gap-5 text-sm text-gray-700 dark:text-gray-400 animate-fadeUp delay-400">
                <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{tr('Bila Malipo', 'Free')}</span>
                <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{tr('Kaunti Zote 47', 'All 47 Counties')}</span>
                <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>{tr('Lugha Mbili', 'English & Swahili')}</span>
              </div>
            </div>

            <div className="hidden lg:block animate-scalePop delay-300">
              <div className="relative max-w-md mx-auto">
                <div className="absolute -inset-4 bg-gradient-to-br from-brand-deep/10 via-brand-terracotta/6 to-brand-deep/8 rounded-[48px] blur-xl animate-sunPulse" />
                <div className="relative sun-card p-6 space-y-5 overflow-hidden">
                  <div className="flex items-center gap-2 sun-tag w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-terracotta animate-pulse" />
                    {tr('Dira Yetu', 'Our Purpose')}
                  </div>

                  <div className="relative min-h-[280px]">
                    {[
                      {
                        emoji: '🌱', title: tr('Jifunze', 'Learn'), desc: tr('Pata maarifa ya kilimo, tech, afya na elimu kutoka kwa Wakenya wenzako.', 'Get knowledge on farming, tech, health and education from fellow Kenyans.'),
                        color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/30'
                      },
                      {
                        emoji: '💬', title: tr('Shiriki', 'Share'), desc: tr('Uliza maswali, jibu, na jenga Heshima kwa kusaidia jamii yako.', 'Ask questions, answer, and earn Heshima by helping your community.'),
                        color: 'from-brand-terracotta/20 to-brand-red/10', border: 'border-brand-terracotta/30'
                      },
                      {
                        emoji: '🌍', title: tr('Unganisha', 'Connect'), desc: tr('Kaunti zote 47 zimeunganishwa. Kutoka Kilifi hadi Kisumu, tuko pamoja.', 'All 47 counties connected. From Kilifi to Kisumu, we are together.'),
                        color: 'from-blue-500/20 to-cyan-500/10', border: 'border-blue-500/30'
                      },
                      {
                        emoji: '🚀', title: tr('Kua', 'Grow'), desc: tr('Jenga ujuzi, pata soko, na uwe mtaalamu katika jamii yako.', 'Build skills, find markets, and become an expert in your community.'),
                        color: 'from-purple-500/20 to-pink-500/10', border: 'border-purple-500/30'
                      },
                    ].map((item, i) => (
                      <div key={i}
                        className={`absolute inset-0 transition-all duration-700 ease-in-out p-5 rounded-2xl border bg-gradient-to-br ${item.color} ${item.border} ${activeFeature === i ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-8 scale-95 pointer-events-none'}`}
                        onMouseEnter={() => setFeaturePaused(true)}
                        onMouseLeave={() => setFeaturePaused(false)}>
                        <span className="text-4xl block mb-3">{item.emoji}</span>
                        <h4 className="text-lg font-black text-brand-deep dark:text-white mb-2">{item.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{item.desc}</p>
                        <div className="mt-4 flex items-center gap-2 text-xs text-brand-red font-semibold">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                          {tr('Jifunze Zaidi', 'Learn More')}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-2">
                    {[0, 1, 2, 3].map(i => (
                      <button key={i} onClick={() => { setActiveFeature(i); setFeaturePaused(true); setTimeout(() => setFeaturePaused(false), 4000); }}
                        className={`h-1.5 rounded-full transition-all duration-500 ${activeFeature === i ? 'w-8 bg-brand-terracotta' : 'w-1.5 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BRAND STORY ===== */}
      <Reveal>
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 sun-tag">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-terracotta" />
                {tr('Hadithi Yetu', 'Our Story')}
              </div>
              <h2 className="text-4xl sm:text-5xl font-black font-logo leading-tight">
                {tr('Nini Maana ya', 'What Does')}{' '}
                <span className="text-brand-deep">Kikwetu</span>
                <span className="text-brand-red">Connect</span>
                {' '}{tr('?', 'Mean?')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                {tr(
                  '"Kikwetu" means "Our Place" in Swahili. We\'re building a digital home where every Kenyan — from the maize farmer in Trans-Nzoia to the developer in Nairobi — can share knowledge, grow together, and shape our collective future.',
                  '"Kikwetu" maana yake ni "Nyumbani Kwetu" kwa Kiswahili. Tunajenga nyumba ya digitali ambapo kila Mkenya — kutoka kwa mkulima wa mahindi Trans-Nzoia hadi mwendelezaji wa Nairobi — anaweza kushiriki maarifa, kukua pamoja, na kuunda mustakabali wetu wa pamoja.'
                )}
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: tr('Watumiaji', 'Users'), value: '12K+' },
                  { label: tr('Kaunti', 'Counties'), value: '47' },
                  { label: tr('Majibu', 'Answers'), value: '85K+' },
                ].map(s => (
                  <div key={s.label} className="text-center p-4 rounded-2xl sun-card shadow-sm">
                    <span className="block text-2xl font-black text-brand-red">{s.value}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-28 h-28 bg-gradient-to-br from-brand-deep/10 to-transparent rounded-3xl -z-10" />
              <div className="absolute -bottom-4 -right-4 w-36 h-36 bg-gradient-to-br from-brand-terracotta/10 to-transparent rounded-3xl -z-10" />
              <div className="bg-gradient-to-br from-brand-deep via-brand-deep to-brand-deep p-8 rounded-[40px] text-white space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-brand-terracotta/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-3xl border border-white/10">🌍</div>
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
                  <div className="flex flex-wrap gap-2">
                    {['Kilimo', 'Tech', 'Elimu', 'Utamaduni', 'Afya'].map(t => (
                      <span key={t} className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium border border-white/5">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ===== STUDENT & PROFESSIONAL AREA ===== */}
      <Reveal>
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 sun-tag">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-terracotta" />
              {tr('Jifunze na Wataalamu', 'Learn from Professionals')}
            </div>
            <h2 className="text-4xl sm:text-5xl font-black font-logo">
              {tr('Pata Mwongozo wa Mtaalamu', 'Get Expert Guidance')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              {tr(
                'Una swali? Tafuta mwalimu aliye thibitishwa, panga kikao cha kibinafsi, na jifunze kupitia chat. Baada ya somo, kadiria na tuma bahshishi kwa M-Pesa.',
                'Have a question? Find a verified teacher, book a private session, and learn through chat. After the lesson, rate and send a tip via M-Pesa.'
              )}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {EDU_FEATURES.map((f, i) => (
              <div key={i} className={`group p-6 rounded-2xl border bg-gradient-to-br ${f.color} ${f.border} transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default`}>
                <span className="text-3xl block mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 inline-block">{f.emoji}</span>
                <h3 className="text-base font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <Link href="/students" className="sun-btn inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-bold shadow-lg active:scale-95">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              {tr('Tafuta Mwalimu', 'Find a Teacher')}
            </Link>
            <Link href="/professionals/request" className="inline-flex items-center gap-2 border-2 border-brand-terracotta/50 hover:border-brand-terracotta text-brand-red hover:bg-brand-terracotta/5 px-6 py-3.5 rounded-full text-sm font-bold transition-all active:scale-95">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              {tr('Kuwa Mwalimu (Mtaalamu)', 'Become a Teacher (Pro)')}
            </Link>
          </div>
        </section>
      </Reveal>

      {/* ===== HOW IT WORKS ===== */}
      <Reveal>
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white/40 to-white dark:from-brand-cardDark/30 dark:to-transparent">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-4 mb-16">
              <div className="inline-flex items-center gap-2 sun-tag">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-terracotta" />
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

            <div className="grid lg:grid-cols-4 gap-5">
              {HOW.map((item, i) => (
                <button key={i}
                  onMouseEnter={() => setActiveStep(i)}
                  onClick={() => setActiveStep(i)}
                  className={`relative p-6 rounded-2xl text-left transition-all duration-500 border-2 ${
                    activeStep === i
                      ? 'border-brand-terracotta bg-white dark:bg-brand-cardDark shadow-xl scale-[1.02]'
                      : 'border-gray-200/60 dark:border-gray-700 bg-white/70 dark:bg-brand-cardDark/50 hover:border-brand-terracotta/50 hover:shadow-md'
                  }`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black mb-4 transition-all duration-300 ${
                    activeStep === i ? 'bg-gradient-to-br from-brand-terracotta to-brand-red text-white shadow-lg scale-110' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}>{item.step}</div>
                  <svg className={`w-7 h-7 mb-3 transition-colors duration-300 ${activeStep === i ? 'text-brand-red' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} /></svg>
                  <h3 className="text-base font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 mt-8">
              {HOW.map((_, i) => (
                <button key={i} onClick={() => setActiveStep(i)}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    activeStep === i ? 'w-10 bg-brand-terracotta' : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                  }`} />
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ===== FEATURES ===== */}
      <Reveal>
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 sun-tag">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-terracotta" />
              {tr('Vipengele', 'Features')}
            </div>
            <h2 className="text-4xl sm:text-5xl font-black font-logo">
              {tr('Kila Kitu Mahali Pamoja', 'Everything in One Place')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              {tr('From discussions to marketplace — KikwetuConnect has everything you need to learn, earn, and grow.', 'Kutoka kwenye majadiliano hadi soko — KikwetuConnect ina kila kitu unachohitaji kujifunza, kupata, na kukua.')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="group sun-card p-5 transition-all duration-300 hover:-translate-y-1 cursor-default">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-xl mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  {f.emoji}
                </div>
                <h3 className="text-base font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ===== STATS ===== */}
      <Reveal>
        <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[
                { icon: '👥', value: 12, suffix: 'K+', label: tr('Watumiaji', 'Users') },
                { icon: '🌾', value: 85, suffix: 'K+', label: tr('Machapisho', 'Posts') },
                { icon: '🗺️', value: 47, suffix: '', label: tr('Kaunti', 'Counties') },
                { icon: '🏆', value: 3, suffix: 'K+', label: tr('Heshima', 'Karma Earned') },
              ].map((s, i) => (
                <div key={i} className="text-center p-6 rounded-2xl bg-white/80 dark:bg-brand-cardDark/80 backdrop-blur-sm border border-black/5 dark:border-brand-terracotta/30 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5">
                  <span className="text-4xl block mb-3">{s.icon}</span>
                  <span className="text-3xl sm:text-4xl font-black text-brand-red block">
                    <CountUp end={s.value} suffix={s.suffix} />
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ===== TESTIMONIALS ===== */}
      <Reveal>
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 sun-tag">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-terracotta" />
              {tr('Walio Tuchunguza', 'Testimonials')}
            </div>
            <h2 className="text-4xl sm:text-5xl font-black font-logo">
              {tr('Wanachama Wetu Wanasema', 'What Our Members Say')}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {REVIEWS.map((t, i) => (
              <div key={i} className="sun-card p-6 transition-all duration-300 hover:-translate-y-1">
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
                <div className="flex gap-0.5 mt-3">
                  {[1,2,3,4,5].map(s => <span key={s} className="text-brand-red text-sm">★</span>)}
                </div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ===== CTA ===== */}
      <Reveal>
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto relative overflow-hidden rounded-[40px] p-12 sm:p-16 text-center text-white sun-cta-warm">
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-brand-terracotta/20 to-transparent rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 animate-glowPulse" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-to-tr from-brand-terracotta/10 to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 animate-glowPulse" style={{ animationDelay: '2s' }} />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 50%, rgba(255,102,0,0.06) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(0,135,81,0.04) 0%, transparent 50%)' }} />
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
                <Link href="/onboarding" className="sun-btn inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-bold shadow-xl">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                  {tr('Jiunge Bure', 'Join Free')}
                </Link>
                <Link href="/feed" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-2 border-white/20 hover:border-white/40 px-8 py-4 rounded-full text-sm font-bold transition-all backdrop-blur-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                  {tr('Tazama Baraza', 'View Baraza')}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <AppFooter lang={lang} setLang={setLang} />
    </div>
  );
}