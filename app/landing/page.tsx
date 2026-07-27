'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight, Compass, LogIn, X, MapPin,
  MessageCircleQuestion, BadgeCheck, ShieldCheck,
} from 'lucide-react';

const counties = [
  'Nairobi County', 'Mombasa County', 'Kisumu County', 'Nakuru County',
  'Kiambu County', 'Turkana County', 'West Pokot County', 'Samburu County',
  'Trans-Nzoia County', 'Uasin Gishu County', 'Elgeyo-Marakwet County',
  'Nandi County', 'Baringo County', 'Laikipia County', 'Nyandarua County',
  'Nyeri County', 'Kirinyaga County', 'Murang\'a County', 'Embu County',
  'Tharaka-Nithi County', 'Meru County', 'Isiolo County', 'Machakos County',
  'Kitui County', 'Makueni County', 'Kajiado County', 'Narok County',
  'Homa Bay County', 'Migori County', 'Siaya County', 'Kakamega County',
  'Bungoma County', 'Vihiga County', 'Busia County', 'Kilifi County',
  'Kwale County', 'Taita-Taveta County', 'Lamu County', 'Garissa County',
  'Wajir County', 'Mandera County', 'Marsabit County', 'Tana River County',
];

const purposes = [
  'Learn from people with context',
  'Share local knowledge',
  'Find community and safety updates',
  'Buy and sell locally',
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "KikwetuConnect",
  "url": "https://kikwetuconnect.com",
  "description": "Kenya in conversation. Ask questions, share local knowledge, and connect with your community.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://kikwetuconnect.com/explore?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

export default function LandingPage() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (dialogOpen) {
      (document.getElementById('joinDialog') as HTMLDialogElement)?.showModal();
    }
  }, [dialogOpen]);

  function showToast(msg: string) {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2200);
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    (document.getElementById('joinDialog') as HTMLDialogElement)?.close();
    setDialogOpen(false);
    showToast('Welcome to KikwetuConnect');
    setTimeout(() => router.push('/signup'), 800);
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');

        .landing-page {
          position: relative; min-height: 100vh; isolation: isolate;
          font-family: "DM Sans", system-ui, sans-serif;
          background: var(--night, oklch(22% .065 158));
          color: var(--cream, oklch(96% .025 94));
        }
        .landing-page *, .landing-page *::before, .landing-page *::after {
          box-sizing: border-box; margin: 0;
        }

        /* ===== Savannah Background ===== */
        .savannah {
          position: absolute; inset: 0; z-index: -1; overflow: hidden;
          background: linear-gradient(180deg, oklch(42% .09 211) 0%, oklch(62% .12 77) 43%, oklch(73% .12 70) 68%, oklch(53% .1 50) 100%);
        }
        .savannah::before {
          content: ""; position: absolute; inset: 0;
          background: radial-gradient(circle at 82% 18%, oklch(90% .12 82 / .95) 0 6%, oklch(90% .12 82 / .45) 9%, transparent 18%),
            linear-gradient(180deg, oklch(22% .05 215 / .15), transparent 45%),
            linear-gradient(0deg, oklch(30% .08 42 / .22), transparent 32%);
        }
        .sky-haze {
          position: absolute; left: -10%; right: -10%; top: 39%; height: 20%;
          background: oklch(87% .08 82 / .22); filter: blur(18px);
        }
        .sun {
          position: absolute; top: 13%; right: 17%; width: 120px; height: 120px;
          border-radius: 50%; background: var(--gold, oklch(75% .15 78));
          box-shadow: 0 0 0 20px oklch(75% .15 78 / .14), 0 0 0 42px oklch(75% .15 78 / .08);
          animation: breath 6s ease-in-out infinite;
        }
        .sun::before, .sun::after {
          content: ""; position: absolute; left: 50%; top: 50%;
          width: 190px; height: 190px; border: 1px solid oklch(98% .02 94 / .2);
          border-radius: 50%; transform: translate(-50%, -50%);
        }
        .sun::after { width: 250px; height: 250px; border-color: oklch(98% .02 94 / .1); }
        @keyframes breath { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); } }

        .mountains {
          position: absolute; left: -5%; right: -5%; bottom: 27%; height: 35%;
          background: linear-gradient(145deg, transparent 18%, oklch(40% .06 158 / .42) 19% 34%, transparent 35% 48%, oklch(40% .07 158 / .35) 49% 64%, transparent 65%),
            linear-gradient(35deg, transparent 28%, oklch(34% .07 158 / .38) 29% 47%, transparent 48%);
          clip-path: polygon(0 70%, 12% 30%, 21% 55%, 32% 12%, 43% 55%, 58% 26%, 69% 58%, 80% 17%, 92% 53%, 100% 25%, 100% 100%, 0 100%);
        }
        .ground {
          position: absolute; left: -5%; right: -5%; bottom: -3%; height: 38%;
          background: linear-gradient(180deg, oklch(57% .11 68), oklch(43% .11 49));
          clip-path: polygon(0 20%, 11% 25%, 19% 13%, 28% 24%, 38% 11%, 49% 22%, 60% 10%, 71% 26%, 82% 12%, 92% 23%, 100% 16%, 100% 100%, 0 100%);
        }

        /* ===== Acacia Trees ===== */
        .acacia { position: absolute; bottom: 22%; filter: drop-shadow(0 10px 10px oklch(20% .04 42 / .15)); animation: sway 7s ease-in-out infinite; }
        .acacia.one { left: 7%; transform: scale(.95); }
        .acacia.two { right: 8%; transform: scale(.7); animation-delay: -3s; }
        .trunk { position: absolute; left: 50%; bottom: 0; width: 14px; height: 120px; background: oklch(28% .07 42); transform: translateX(-50%) rotate(4deg); transform-origin: bottom; border-radius: 50% 50% 10% 10%; }
        .branch { position: absolute; bottom: 74px; left: 50%; width: 110px; height: 7px; background: oklch(28% .07 42); border-radius: 99px; transform: translateX(-50%) rotate(-12deg); }
        .branch::before, .branch::after { content: ""; position: absolute; bottom: 2px; width: 6px; height: 60px; background: oklch(28% .07 42); border-radius: 99px; }
        .branch::before { left: 20px; transform: rotate(-35deg); }
        .branch::after { right: 18px; transform: rotate(32deg); }
        .canopy { position: absolute; bottom: 105px; left: 50%; width: 190px; height: 78px; transform: translateX(-50%); background: oklch(25% .08 100); border-radius: 50% 48% 50% 52%; box-shadow: -52px 13px 0 oklch(25% .08 100), 54px 11px 0 oklch(25% .08 100), -8px -17px 0 oklch(28% .09 100); }
        @keyframes sway { 0%, 100% { transform: rotate(-1deg); } 50% { transform: rotate(1.2deg); } }

        /* ===== Grass ===== */
        .grass { position: absolute; bottom: 5%; width: 160px; height: 70px; opacity: .5; }
        .grass.one { left: 22%; }
        .grass.two { right: 24%; transform: scale(.75); }
        .grass::before, .grass::after { content: ""; position: absolute; bottom: 0; left: 50%; width: 3px; height: 70px; background: oklch(33% .1 91); transform: rotate(-25deg); box-shadow: 18px 6px 0 oklch(33% .1 91), -18px 9px 0 oklch(33% .1 91), 38px 12px 0 oklch(33% .1 91), -40px 15px 0 oklch(33% .1 91); }
        .grass::after { transform: rotate(23deg); height: 54px; }

        /* ===== Birds ===== */
        .bird { position: absolute; width: 22px; height: 10px; border-top: 2px solid oklch(26% .04 158 / .55); border-radius: 50%; animation: fly 12s linear infinite; }
        .bird::after { content: ""; position: absolute; left: 16px; top: -2px; width: 22px; height: 10px; border-top: 2px solid oklch(26% .04 158 / .55); border-radius: 50%; }
        .bird.one { top: 25%; left: 30%; }
        .bird.two { top: 18%; left: 46%; transform: scale(.7); animation-delay: -6s; }
        @keyframes fly { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(20px, -8px); } }

        /* ===== Header ===== */
        .l-header { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px clamp(16px, 5vw, 68px); }
        .l-brand { display: inline-flex; align-items: center; gap: 10px; color: var(--cream, oklch(96% .025 94)); text-decoration: none; font-weight: 800; letter-spacing: -.06em; }
        .l-mark { display: grid; place-items: center; width: 35px; height: 35px; border-radius: 12px 12px 12px 4px; background: var(--green, oklch(43% .12 158)); color: var(--cream, oklch(96% .025 94)); font-family: Fraunces, Georgia, serif; font-size: 1.3rem; box-shadow: 4px 5px 0 var(--gold, oklch(75% .15 78)); transform: rotate(-4deg); }
        .l-brand-name { font-size: 1.12rem; }
        .l-brand-name span { color: var(--gold, oklch(75% .15 78)); }
        .l-nav { display: flex; align-items: center; gap: 10px; }
        .l-nav a { display: none; color: oklch(97% .02 94 / .86); text-decoration: none; font-size: .78rem; font-weight: 700; }
        .l-nav a:hover { color: var(--gold, oklch(75% .15 78)); }
        .l-nav-button { display: inline-flex; align-items: center; gap: 7px; min-height: 38px; padding: 0 14px; border: 1px solid oklch(98% .02 94 / .2); border-radius: 99px; color: var(--cream, oklch(96% .025 94)); background: oklch(20% .05 158 / .24); font-size: .75rem; font-weight: 800; cursor: pointer; font-family: inherit; transition: background .18s; }
        .l-nav-button:hover { background: oklch(20% .05 158 / .42); }

        /* ===== Hero ===== */
        .l-hero { display: flex; flex-direction: column; align-items: center; gap: 28px; max-width: 1180px; min-height: calc(100vh - 68px); margin: 0 auto; padding: 24px clamp(16px, 5vw, 68px) 120px; text-align: center; }
        .l-copy { max-width: 640px; }
        .l-copy h1 { margin-top: 13px; font-size: clamp(2.8rem, 10vw, 5.5rem); line-height: .9; color: var(--cream, oklch(96% .025 94)); font-family: Fraunces, Georgia, serif; letter-spacing: -.055em; font-weight: 700; text-shadow: 0 2px 24px oklch(10% .04 158 / .35), 0 1px 0 oklch(10% .04 158 / .2); }
        .l-copy h1 span { color: var(--gold, oklch(75% .15 78)); text-shadow: 0 2px 20px oklch(75% .15 78 / .25); }
        .l-copy p { max-width: 52ch; margin: 16px auto 0; color: oklch(96% .025 94 / 1); font-size: clamp(.88rem, 2.5vw, 1.05rem); line-height: 1.65; text-shadow: 0 1px 12px oklch(10% .04 158 / .2); }
        .l-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 28px; }
        .l-primary, .l-secondary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 46px; padding: 0 20px; border-radius: 11px; font-size: .82rem; font-weight: 800; transition: transform .18s var(--ease, cubic-bezier(.16,1,.3,1)), background .18s var(--ease); cursor: pointer; font-family: inherit; }
        .l-primary { border: 0; color: oklch(31% .1 158); background: var(--gold, oklch(75% .15 78)); }
        .l-primary:hover { transform: translateY(-2px); background: oklch(82% .13 78); }
        .l-secondary { border: 1px solid oklch(98% .02 94 / .2); color: var(--cream, oklch(96% .025 94)); background: oklch(20% .05 158 / .24); }
        .l-secondary:hover { transform: translateY(-2px); background: oklch(20% .05 158 / .42); }
        .l-fine { margin-top: 14px; color: oklch(94% .025 94 / .85); font-size: .72rem; text-shadow: 0 1px 8px oklch(10% .04 158 / .15); }
        .l-eyebrow { font-size: .74rem; font-weight: 800; letter-spacing: .15em; text-transform: uppercase; color: var(--gold, oklch(75% .15 78)); text-shadow: 0 1px 10px oklch(75% .15 78 / .2); }

        /* ===== Signal Card ===== */
        .l-signal { width: 100%; max-width: 440px; }
        .l-signal-card { padding: 19px; border: 1px solid oklch(98% .02 94 / .24); border-radius: 20px; background: oklch(20% .05 158 / .22); box-shadow: 0 20px 40px oklch(20% .04 158 / .18); text-align: left; }
        .l-signal-card h2 { margin-top: 5px; font-size: 1.4rem; color: var(--cream, oklch(96% .025 94)); font-family: Fraunces, Georgia, serif; letter-spacing: -.055em; }
        .l-signal-card p { margin-top: 8px; color: oklch(93% .025 94 / .9); font-size: .78rem; }
        .l-signal-list { display: grid; gap: 10px; margin-top: 17px; }
        .l-signal-row { display: flex; align-items: center; gap: 9px; padding: 10px 0; border-top: 1px solid oklch(98% .02 94 / .16); }
        .l-signal-row:first-child { border-top: 0; }
        .l-signal-icon { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 10px; color: oklch(96% .025 94); background: var(--gold, oklch(75% .15 78)); flex-shrink: 0; }
        .l-signal-row strong { display: block; font-size: .75rem; color: var(--cream, oklch(96% .025 94)); }
        .l-signal-row span { display: block; color: oklch(91% .025 94 / .85); font-size: .66rem; }

        /* ===== Value Strip ===== */
        .l-value-strip { display: grid; grid-template-columns: repeat(3, 1fr); width: 100%; max-width: 680px; border: 1px solid oklch(98% .02 94 / .18); border-radius: 15px; background: oklch(20% .05 158 / .26); backdrop-filter: blur(6px); }
        .l-value { padding: 14px 16px; border-right: 1px solid oklch(98% .02 94 / .14); text-align: center; }
        .l-value:last-child { border-right: 0; }
        .l-value strong { display: block; color: var(--gold, oklch(75% .15 78)); font-size: .82rem; }
        .l-value span { display: block; margin-top: 2px; color: oklch(93% .025 94 / .9); font-size: .66rem; }

        /* ===== Footer ===== */
        .l-footer { position: relative; z-index: 2; border-top: 1px solid oklch(98% .02 94 / .12); background: oklch(18% .04 158); padding: 28px clamp(16px, 5vw, 68px) 16px; margin-top: 0; }
        .l-footer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; max-width: 900px; margin: 0 auto; }
        .l-footer-brand { grid-column: 1 / -1; }
        .l-footer-brand p { margin-top: 6px; color: oklch(88% .025 94 / .7); font-size: .74rem; }
        .l-footer-col h4 { color: var(--gold); font-size: .68rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; margin-bottom: 8px; }
        .l-footer-col ul { list-style: none; padding: 0; }
        .l-footer-col li { margin-bottom: 6px; }
        .l-footer-col a { color: oklch(90% .025 94 / .8); text-decoration: none; font-size: .74rem; transition: color .2s; }
        .l-footer-col a:hover { color: var(--gold); }
        .l-footer-bottom { display: flex; align-items: center; justify-content: space-between; max-width: 900px; margin: 18px auto 0; padding-top: 12px; border-top: 1px solid oklch(98% .02 94 / .1); }
        .l-footer-copy { color: oklch(80% .025 94 / .6); font-size: .66rem; }
        .l-footer-social { display: flex; gap: 10px; }
        .l-footer-social a { color: oklch(80% .025 94 / .6); transition: color .2s; }
        .l-footer-social a:hover { color: var(--gold); }

        /* ===== Dialog ===== */
        .l-dialog { width: min(500px, calc(100% - 28px)); padding: 0; border: 1px solid oklch(84% .025 94); border-radius: 19px; color: oklch(24% .034 158); background: var(--cream, oklch(96% .025 94)); box-shadow: 0 24px 70px oklch(10% .04 158 / .4); }
        .l-dialog::backdrop { background: oklch(15% .04 158 / .45); }
        .l-dialog-inner { padding: 20px; }
        .l-dialog-head { display: flex; align-items: start; justify-content: space-between; gap: 10px; }
        .l-dialog-head h2 { font-size: 1.45rem; font-family: Fraunces, Georgia, serif; letter-spacing: -.055em; }
        .l-dialog-copy { margin-top: 7px; color: oklch(24% .034 158); opacity: .75; font-size: .76rem; }
        .l-dialog-form { display: grid; gap: 9px; margin-top: 16px; }
        .l-dialog-form label { display: grid; gap: 5px; color: oklch(24% .034 158); font-size: .65rem; font-weight: 800; }
        .l-dialog-form select { width: 100%; padding: 9px; border: 1px solid oklch(84% .025 94); border-radius: 9px; background: oklch(98% .01 94); color: oklch(24% .034 158); outline: 0; font-family: inherit; }
        .l-dialog-footer { display: flex; justify-content: end; gap: 7px; margin-top: 15px; }
        .l-dialog-footer .l-dcancel { color: oklch(24% .034 158); border: 1px solid oklch(84% .025 94); background: transparent; min-height: 36px; padding: 0 14px; border-radius: 11px; font-size: .76rem; font-weight: 800; cursor: pointer; font-family: inherit; }
        .l-dialog-footer .l-dsubmit { border: 0; color: oklch(31% .1 158); background: var(--gold, oklch(75% .15 78)); min-height: 36px; padding: 0 14px; border-radius: 11px; font-size: .76rem; font-weight: 800; cursor: pointer; font-family: inherit; }

        /* ===== Toast ===== */
        .l-toast { position: fixed; left: 50%; bottom: 25px; z-index: 80; padding: 10px 14px; border-radius: 99px; color: var(--cream, oklch(96% .025 94)); background: oklch(24% .034 158); box-shadow: 0 20px 50px oklch(10% .04 158 / .3); font-size: .72rem; transform: translate(-50%, 140%); transition: transform .25s var(--ease, cubic-bezier(.16,1,.3,1)); pointer-events: none; }
        .l-toast.show { transform: translate(-50%, 0); }

        @keyframes lrise { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

        /* ===== Mobile ===== */
        @media (max-width: 640px) {
          .l-header { padding: 14px 16px; }
          .l-nav { gap: 8px; }
          .l-nav-button { min-height: 36px; padding: 0 12px; font-size: .7rem; }
          .l-hero { padding: 20px 16px 100px; min-height: calc(100vh - 60px); }
          .l-copy h1 { font-size: clamp(2.6rem, 12vw, 4rem); }
          .l-copy p { font-size: .88rem; }
          .l-actions { flex-direction: column; align-items: center; width: 100%; }
          .l-primary, .l-secondary { width: 100%; max-width: 300px; }
          .l-signal-card { padding: 16px; }
          .l-value-strip { grid-template-columns: 1fr; }
          .l-value { padding: 10px 14px; border-right: 0; border-bottom: 1px solid oklch(98% .02 94 / .14); }
          .l-value:last-child { border-bottom: 0; }
          .l-value strong { font-size: .78rem; }
          .l-value span { font-size: .62rem; }
          .l-footer-grid { grid-template-columns: 1fr 1fr; gap: 16px; }
          .l-footer-bottom { flex-direction: column; gap: 10px; text-align: center; }
        }

        @media (min-width: 641px) and (max-width: 900px) {
          .l-hero { flex-direction: row; text-align: left; gap: 40px; padding: 40px clamp(20px, 5vw, 68px) 120px; }
          .l-copy { flex: 1; }
          .l-signal { flex: 1; }
          .l-value-strip { max-width: 680px; }
          .l-footer-grid { grid-template-columns: 1fr 1fr 1fr; }
        }

        @media (min-width: 901px) {
          .l-hero { flex-direction: row; text-align: left; gap: 60px; padding: 50px clamp(24px, 5vw, 68px) 130px; }
          .l-copy { flex: 1; }
          .l-signal { flex: 0 0 380px; }
          .l-nav a { display: inline-flex; }
          .l-footer-grid { grid-template-columns: 1.2fr repeat(3, 1fr); }
        }
      ` }} />

      <div className="landing-page">
        {/* ===== Savannah Background ===== */}
        <div className="savannah">
          <div className="sky-haze" />
          <div className="sun" />
          <div className="mountains" />
          <div className="ground" />
          <div className="acacia one">
            <div className="canopy" />
            <div className="branch" />
            <div className="trunk" />
          </div>
          <div className="acacia two">
            <div className="canopy" />
            <div className="branch" />
            <div className="trunk" />
          </div>
          <div className="grass one" />
          <div className="grass two" />
          <div className="bird one" />
          <div className="bird two" />
        </div>

        {/* ===== Header ===== */}
        <header className="l-header">
          <Link href="/landing" className="l-brand" aria-label="KikwetuConnect home">
            <span className="l-mark">k</span>
            <span className="l-brand-name">kikwetu<span>.</span></span>
          </Link>
          <nav className="l-nav" aria-label="Main navigation">
            <a href="#">Features</a>
            <a href="#">Community</a>
            <button className="l-nav-button" onClick={() => router.push('/login')} aria-label="Sign in to your account">
              <LogIn size={14} /> Sign in
            </button>
          </nav>
        </header>

        {/* ===== Hero ===== */}
        <main className="l-hero" role="main">
          <section className="l-copy">
            <div className="l-eyebrow">Kenya, in conversation</div>
            <h1>Our place.<br /><span>Our voice.</span></h1>
            <p>KikwetuConnect brings local knowledge, trusted people, and useful community action into one place. Ask a better question, learn from someone who has done the work, and keep your county in the conversation.</p>
            <div className="l-actions">
              <button className="l-primary" onClick={() => setDialogOpen(true)} aria-label="Join KikwetuConnect community">
                <ArrowUpRight size={16} /> Join Kikwetu
              </button>
              <button className="l-secondary" onClick={() => router.push('/explore')} aria-label="Explore community features">
                <Compass size={16} /> Explore the community
              </button>
            </div>
            <div className="l-fine">English · Kiswahili · Sheng curious · built for all 47 counties</div>
          </section>

          <aside className="l-signal">
            <article className="l-signal-card">
              <div className="l-eyebrow">The Kikwetu signal</div>
              <h2>Useful feels local.</h2>
              <p>Global platforms give you noise. Kikwetu gives context.</p>
              <div className="l-signal-list">
                <div className="l-signal-row">
                  <span className="l-signal-icon"><MessageCircleQuestion size={16} /></span>
                  <div>
                    <strong>Ask without shrinking the question</strong>
                    <span>Baraza posts, deep dives, polls, and audio notes</span>
                  </div>
                </div>
                <div className="l-signal-row">
                  <span className="l-signal-icon"><BadgeCheck size={16} /></span>
                  <div>
                    <strong>Find people with real context</strong>
                    <span>Approved professionals and trusted community voices</span>
                  </div>
                </div>
                <div className="l-signal-row">
                  <span className="l-signal-icon"><ShieldCheck size={16} /></span>
                  <div>
                    <strong>Keep the neighbourhood close</strong>
                    <span>Nyumba Kumi, Mtaa Exchange, and local spaces</span>
                  </div>
                </div>
              </div>
            </article>
          </aside>
        </main>

        {/* ===== Value Strip ===== */}
        <section className="l-value-strip" aria-label="Key features">
          <div className="l-value">
            <strong>47 counties</strong>
            <span>One local knowledge network</span>
          </div>
          <div className="l-value">
            <strong>Useful by design</strong>
            <span>Answers, guidance, and community trust</span>
          </div>
          <div className="l-value">
            <strong>Built for Kenya</strong>
            <span>Context before clicks</span>
          </div>
        </section>

        {/* ===== Footer ===== */}
        <footer className="l-footer">
          <div className="l-footer-grid">
            <div className="l-footer-brand">
              <Link href="/landing" className="l-brand" style={{ display: 'inline-flex' }}>
                <span className="l-mark" style={{ width: 28, height: 28, fontSize: '1.1rem' }}>k</span>
                <span className="l-brand-name" style={{ fontSize: '.95rem' }}>kikwetu<span>.</span></span>
              </Link>
              <p>Connecting Kenya, one community at a time</p>
            </div>
            <div className="l-footer-col">
              <h4>Product</h4>
              <ul>
                <li><Link href="/landing">Home</Link></li>
                <li><Link href="/explore">Explore</Link></li>
                <li><Link href="/baraza">Baraza Feed</Link></li>
                <li><Link href="/spaces">Spaces</Link></li>
              </ul>
            </div>
            <div className="l-footer-col">
              <h4>Learn</h4>
              <ul>
                <li><Link href="/students">Students Area</Link></li>
                <li><Link href="/professionals">Professionals</Link></li>
                <li><Link href="/quizzes">Quizzes</Link></li>
                <li><Link href="/radio">Live Radio</Link></li>
              </ul>
            </div>
            <div className="l-footer-col">
              <h4>Community</h4>
              <ul>
                <li><Link href="/mtaa">Mtaa Exchange</Link></li>
                <li><Link href="/nyumba-kumi">Nyumba Kumi</Link></li>
                <li><Link href="/about">About</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="l-footer-bottom">
            <span className="l-footer-copy">&copy; 2026 KikwetuConnect. All rights reserved.</span>
            <div className="l-footer-social">
              <a href="https://twitter.com" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              </a>
              <a href="https://linkedin.com" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
              <a href="https://facebook.com" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* ===== Join Dialog ===== */}
      <dialog id="joinDialog" className="l-dialog" onClick={(e) => { if (e.target === e.currentTarget) { (document.getElementById('joinDialog') as HTMLDialogElement)?.close(); setDialogOpen(false); } }}>
        <div className="l-dialog-inner">
          <div className="l-dialog-head">
            <div>
              <div className="l-eyebrow">Join Kikwetu</div>
              <h2>Start with where you are.</h2>
            </div>
            <button onClick={() => { (document.getElementById('joinDialog') as HTMLDialogElement)?.close(); setDialogOpen(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'oklch(24% .034 158)' }} aria-label="Close">
              <X size={16} />
            </button>
          </div>
          <p className="l-dialog-copy">Choose a county and the things you want to learn, share, or follow. You can change this later.</p>
          <form className="l-dialog-form" onSubmit={handleJoin}>
            <label>
              County
              <select>
                {counties.slice(0, 10).map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label>
              What brings you here?
              <select>
                {purposes.map(p => <option key={p}>{p}</option>)}
              </select>
            </label>
            <div className="l-dialog-footer">
              <button type="button" className="l-dcancel" onClick={() => { (document.getElementById('joinDialog') as HTMLDialogElement)?.close(); setDialogOpen(false); showToast('You can join whenever you are ready'); }} aria-label="Close join dialog">Maybe later</button>
              <button type="submit" className="l-dsubmit" aria-label="Create your account and join KikwetuConnect">Create my space</button>
            </div>
          </form>
        </div>
      </dialog>

      {/* ===== Toast ===== */}
      <div className={`l-toast ${toastVisible ? 'show' : ''}`} role="status">{toast}</div>
    </>
  );
}
