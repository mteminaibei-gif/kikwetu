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
  'Wajir County', 'Mandera County', 'Marsabit County', 'Mandera County',
  'Marsabit County', 'Mandera County',
];

const purposes = [
  'Learn from people with context',
  'Share local knowledge',
  'Find community and safety updates',
  'Buy and sell locally',
];

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
      <style jsx global>{`
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
        .l-header { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; gap: 15px; padding: 22px clamp(18px, 5vw, 68px); }
        .l-brand { display: inline-flex; align-items: center; gap: 10px; color: var(--cream, oklch(96% .025 94)); text-decoration: none; font-weight: 800; letter-spacing: -.06em; }
        .l-mark { display: grid; place-items: center; width: 35px; height: 35px; border-radius: 12px 12px 12px 4px; background: var(--green, oklch(43% .12 158)); color: var(--cream, oklch(96% .025 94)); font-family: Fraunces, Georgia, serif; font-size: 1.3rem; box-shadow: 4px 5px 0 var(--gold, oklch(75% .15 78)); transform: rotate(-4deg); }
        .l-brand-name { font-size: 1.12rem; }
        .l-brand-name span { color: var(--gold, oklch(75% .15 78)); }
        .l-nav { display: flex; align-items: center; gap: 18px; }
        .l-nav a { color: oklch(97% .02 94 / .86); text-decoration: none; font-size: .78rem; font-weight: 700; }
        .l-nav a:hover { color: var(--gold, oklch(75% .15 78)); }
        .l-nav-button { display: inline-flex; align-items: center; gap: 7px; min-height: 36px; padding: 0 12px; border: 1px solid oklch(98% .02 94 / .2); border-radius: 99px; color: var(--cream, oklch(96% .025 94)); background: oklch(20% .05 158 / .24); font-size: .72rem; font-weight: 800; cursor: pointer; font-family: inherit; }
        .l-nav-button:hover { background: oklch(20% .05 158 / .42); }

        /* ===== Hero ===== */
        .l-hero { display: grid; grid-template-columns: minmax(0, 640px) minmax(260px, 360px); align-items: center; gap: clamp(24px, 6vw, 92px); max-width: 1180px; min-height: calc(100vh - 82px); margin: 0 auto; padding: 36px clamp(18px, 5vw, 68px) 116px; }
        .l-copy { animation: lrise .8s var(--ease, cubic-bezier(.16,1,.3,1)) both; }
        .l-copy h1 { max-width: 11ch; margin-top: 13px; font-size: clamp(3.35rem, 8vw, 7.7rem); line-height: .9; color: var(--cream, oklch(96% .025 94)); font-family: Fraunces, Georgia, serif; letter-spacing: -.055em; }
        .l-copy h1 span { color: var(--gold, oklch(75% .15 78)); }
        .l-copy p { max-width: 56ch; margin-top: 23px; color: oklch(94% .025 94 / .9); font-size: clamp(.95rem, 1.35vw, 1.12rem); line-height: 1.65; }
        .l-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 28px; }
        .l-primary, .l-secondary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 0 16px; border-radius: 11px; font-size: .76rem; font-weight: 800; transition: transform .18s var(--ease, cubic-bezier(.16,1,.3,1)), background .18s var(--ease); cursor: pointer; font-family: inherit; }
        .l-primary { border: 0; color: oklch(31% .1 158); background: var(--gold, oklch(75% .15 78)); }
        .l-primary:hover { transform: translateY(-2px); background: oklch(82% .13 78); }
        .l-secondary { border: 1px solid oklch(98% .02 94 / .2); color: var(--cream, oklch(96% .025 94)); background: oklch(20% .05 158 / .24); }
        .l-secondary:hover { transform: translateY(-2px); background: oklch(20% .05 158 / .42); }
        .l-fine { margin-top: 14px; color: oklch(92% .025 94 / .72); font-size: .68rem; }
        .l-eyebrow { font-size: .68rem; font-weight: 800; letter-spacing: .15em; text-transform: uppercase; color: var(--gold, oklch(75% .15 78)); }

        /* ===== Signal Card ===== */
        .l-signal { animation: lrise .8s .16s var(--ease, cubic-bezier(.16,1,.3,1)) both; }
        .l-signal-card { padding: 19px; border: 1px solid oklch(98% .02 94 / .24); border-radius: 20px; background: oklch(20% .05 158 / .22); box-shadow: 0 20px 40px oklch(20% .04 158 / .18); }
        .l-signal-card h2 { margin-top: 5px; font-size: 1.5rem; color: var(--cream, oklch(96% .025 94)); font-family: Fraunces, Georgia, serif; letter-spacing: -.055em; }
        .l-signal-card p { margin-top: 8px; color: oklch(91% .025 94 / .8); font-size: .74rem; }
        .l-signal-list { display: grid; gap: 10px; margin-top: 17px; }
        .l-signal-row { display: flex; align-items: center; gap: 9px; padding: 10px 0; border-top: 1px solid oklch(98% .02 94 / .16); }
        .l-signal-row:first-child { border-top: 0; }
        .l-signal-icon { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 10px; color: oklch(96% .025 94); background: var(--gold, oklch(75% .15 78)); flex-shrink: 0; }
        .l-signal-row strong { display: block; font-size: .72rem; color: var(--cream, oklch(96% .025 94)); }
        .l-signal-row span { display: block; color: oklch(88% .025 94 / .75); font-size: .63rem; }

        /* ===== Floating Note ===== */
        .l-floating { position: absolute; right: 7%; bottom: 7%; z-index: 2; display: inline-flex; align-items: center; gap: 7px; padding: 9px 11px; border: 1px solid oklch(98% .02 94 / .2); border-radius: 99px; color: var(--cream, oklch(96% .025 94)); background: oklch(20% .05 158 / .3); font-size: .66rem; font-weight: 800; animation: lfloat 5s ease-in-out infinite; }
        .l-floating svg { color: var(--gold, oklch(75% .15 78)); }
        @keyframes lfloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }

        /* ===== Value Strip ===== */
        .l-value-strip { position: absolute; left: 50%; bottom: 18px; z-index: 2; display: grid; grid-template-columns: repeat(3, 1fr); width: min(920px, calc(100% - 36px)); border: 1px solid oklch(98% .02 94 / .18); border-radius: 15px; background: oklch(20% .05 158 / .26); transform: translateX(-50%); backdrop-filter: blur(6px); }
        .l-value { padding: 12px 15px; border-right: 1px solid oklch(98% .02 94 / .14); }
        .l-value:last-child { border-right: 0; }
        .l-value strong { display: block; color: var(--gold, oklch(75% .15 78)); font-size: .78rem; }
        .l-value span { display: block; margin-top: 2px; color: oklch(90% .025 94 / .78); font-size: .63rem; }

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

        @media (max-width: 820px) {
          .l-header { padding: 16px 16px; }
          .l-nav { gap: 7px; }
          .l-nav a { display: none; }
          .l-nav-button { min-height: 33px; padding: 0 9px; font-size: .65rem; }
          .l-hero { display: block; min-height: calc(100vh - 64px); padding: 55px 18px 148px; }
          .l-copy h1 { font-size: clamp(3.25rem, 16vw, 5.4rem); }
          .l-copy p { font-size: .9rem; }
          .l-signal { margin-top: 34px; }
          .l-signal-card { max-width: 430px; }
          .l-floating { right: auto; left: 18px; bottom: 108px; }
          .l-value-strip { bottom: 16px; grid-template-columns: 1fr; }
          .l-value { padding: 9px 12px; border-right: 0; border-bottom: 1px solid oklch(98% .02 94 / .14); }
          .l-value:last-child { border-bottom: 0; }
          .l-value strong { font-size: .7rem; }
          .l-value span { font-size: .59rem; }
        }
      `}</style>

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
          <Link href="/landing" className="l-brand">
            <span className="l-mark">k</span>
            <span className="l-brand-name">kikwetu<span>.</span></span>
          </Link>
          <nav className="l-nav">
            <a href="#features">Features</a>
            <a href="#community">Community</a>
            <button className="l-nav-button" onClick={() => router.push('/login')}>
              <LogIn size={14} /> Sign in
            </button>
          </nav>
        </header>

        {/* ===== Hero ===== */}
        <main className="l-hero">
          <section className="l-copy">
            <div className="l-eyebrow">Kenya, in conversation</div>
            <h1>Our place.<br /><span>Our voice.</span></h1>
            <p>KikwetuConnect brings local knowledge, trusted people, and useful community action into one place. Ask a better question, learn from someone who has done the work, and keep your county in the conversation.</p>
            <div className="l-actions">
              <button className="l-primary" onClick={() => setDialogOpen(true)}>
                <ArrowUpRight size={16} /> Join Kikwetu
              </button>
              <button className="l-secondary" onClick={() => document.getElementById('community')?.scrollIntoView({ behavior: 'smooth' })}>
                <Compass size={16} /> Explore the community
              </button>
            </div>
            <div className="l-fine">English · Kiswahili · Sheng curious · built for all 47 counties</div>
          </section>

          <aside className="l-signal">
            <div className="l-signal-card">
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
            </div>
          </aside>
        </main>

        {/* ===== Floating Note ===== */}
        <div className="l-floating">
          <MapPin size={14} /> From Nairobi to Turkana
        </div>

        {/* ===== Value Strip ===== */}
        <section className="l-value-strip" id="community">
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
              <button type="button" className="l-dcancel" onClick={() => { (document.getElementById('joinDialog') as HTMLDialogElement)?.close(); setDialogOpen(false); showToast('You can join whenever you are ready'); }}>Maybe later</button>
              <button type="submit" className="l-dsubmit">Create my space</button>
            </div>
          </form>
        </div>
      </dialog>

      {/* ===== Toast ===== */}
      <div className={`l-toast ${toastVisible ? 'show' : ''}`} role="status">{toast}</div>
    </>
  );
}
