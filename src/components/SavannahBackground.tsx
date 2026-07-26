'use client';

import { useEffect, useState, useRef } from 'react';

export default function SavannahBackground() {
  const [time, setTime] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = (t: number) => {
      setTime(t / 1000);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Warm sunset horizon gradient */}
      <div className="absolute bottom-0 left-0 w-full h-[45vh] bg-gradient-to-t from-amber-200/20 via-orange-100/10 to-transparent dark:from-amber-900/10 dark:via-orange-900/5" />
      <div className="absolute bottom-0 left-0 w-full h-[30vh] bg-gradient-to-t from-amber-300/15 via-amber-200/5 to-transparent dark:from-amber-800/8 dark:via-amber-900/3" />

      {/* Sun disc — large warm glow near horizon */}
      <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2">
        <div className="w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] rounded-full bg-gradient-to-b from-amber-300/25 via-orange-400/15 to-red-400/5 dark:from-amber-500/10 dark:via-orange-500/6 dark:to-red-500/2 blur-2xl animate-sunPulse" />
      </div>

      {/* Distant mountain range */}
      <Mountains />

      {/* Ground plane — warm earth */}
      <div className="absolute bottom-0 left-0 w-full h-[18vh] bg-gradient-to-t from-amber-800/8 via-amber-700/4 to-transparent dark:from-amber-900/5 dark:via-amber-800/3" />

      {/* Savannah grass — natural tufts */}
      <GrassField time={time} />

      {/* Acacia trees — classic flat-top silhouettes */}
      <AcaciaTree x="5%" y={0} scale={1.4} time={time} delay={0} />
      <AcaciaTree x="15%" y={0} scale={0.9} time={time} delay={0.8} />
      <AcaciaTree x="75%" y={0} scale={1.2} time={time} delay={1.2} />
      <AcaciaTree x="88%" y={0} scale={0.7} time={time} delay={2} />
      <AcaciaTree x="50%" y={0} scale={0.5} time={time} delay={0.4} />

      {/* Wildlife silhouettes */}
      <Giraffe x="28%" y={0} scale={1} time={time} />
      <Elephant x="62%" y={0} scale={1.1} time={time} />
      <Zebra x="42%" y={0} scale={0.85} time={time} />

      {/* Birds in V-formation */}
      <BirdFlock time={time} />

      {/* Dust haze at horizon */}
      <div className="absolute bottom-[15%] left-0 w-full h-[8vh] bg-gradient-to-r from-amber-200/10 via-amber-100/15 to-amber-200/10 dark:from-amber-800/5 dark:via-amber-700/8 dark:to-amber-800/5 blur-xl" />
    </div>
  );
}

/* ─── Acacia Tree (flat-top silhouette) ─── */
function AcaciaTree({ x, y, scale = 1, time, delay = 0 }: { x: string; y: number; scale?: number; time: number; delay?: number }) {
  const sway = Math.sin((time + delay) * 0.3) * 1.5 * scale;
  return (
    <div className="absolute bottom-0" style={{ left: x, transform: `translateX(${sway}px)`, transformOrigin: 'bottom center' }}>
      <svg viewBox="0 0 120 160" width={120 * scale} height={160 * scale} style={{ opacity: 0.22 }}>
        <defs>
          <linearGradient id={`trunk-${x}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5C3A1E" />
            <stop offset="100%" stopColor="#3D2B1F" />
          </linearGradient>
        </defs>
        {/* Trunk — slightly curved */}
        <path d="M58 160 Q55 120 54 90 Q53 60 56 35 L60 35 Q63 60 62 90 Q61 120 58 160Z" fill={`url(#trunk-${x})`} />
        {/* Branch left */}
        <path d="M56 85 Q40 70 25 68" fill="none" stroke="#3D2B1F" strokeWidth="2.5" strokeLinecap="round" />
        {/* Branch right */}
        <path d="M60 75 Q78 60 92 58" fill="none" stroke="#3D2B1F" strokeWidth="2" strokeLinecap="round" />
        {/* Flat-top canopy — the iconic acacia umbrella */}
        <ellipse cx="60" cy="28" rx="52" ry="12" fill="#2D5A27" opacity="0.9" />
        <ellipse cx="58" cy="22" rx="44" ry="10" fill="#3A6B2E" opacity="0.8" />
        <ellipse cx="62" cy="18" rx="36" ry="8" fill="#4A7C3A" opacity="0.7" />
        {/* Leaf clusters hanging from branches */}
        <ellipse cx="25" cy="65" rx="12" ry="8" fill="#2D5A27" opacity="0.7" />
        <ellipse cx="92" cy="55" rx="10" ry="7" fill="#2D5A27" opacity="0.7" />
        <ellipse cx="40" cy="68" rx="15" ry="6" fill="#3A6B2E" opacity="0.6" />
      </svg>
    </div>
  );
}

/* ─── Giraffe Silhouette ─── */
function Giraffe({ x, y, scale = 1, time }: { x: string; y: number; scale?: number; time: number }) {
  const headBob = Math.sin(time * 0.4) * 1;
  return (
    <div className="absolute bottom-0" style={{ left: x }}>
      <svg viewBox="0 0 50 120" width={50 * scale} height={120 * scale} style={{ opacity: 0.16 }}>
        {/* Body */}
        <ellipse cx="25" cy="95" rx="14" ry="10" fill="#5C3A1E" />
        {/* Legs */}
        <line x1="15" y1="103" x2="13" y2="120" stroke="#5C3A1E" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="20" y1="105" x2="18" y2="120" stroke="#5C3A1E" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="30" y1="105" x2="32" y2="120" stroke="#5C3A1E" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="35" y1="103" x2="37" y2="120" stroke="#5C3A1E" strokeWidth="2.5" strokeLinecap="round" />
        {/* Neck — long and graceful */}
        <path d="M24 88 Q22 60 24 35 Q25 25 25 20" fill="none" stroke="#5C3A1E" strokeWidth="4" strokeLinecap="round" />
        {/* Head */}
        <ellipse cx={25 + headBob * 0.3} cy={18 + headBob} rx="5" ry="3.5" fill="#5C3A1E" />
        {/* Ossicones (horns) */}
        <line x1={23 + headBob * 0.2} y1={15 + headBob} x2={22 + headBob * 0.1} y2={11 + headBob} stroke="#5C3A1E" strokeWidth="1.5" strokeLinecap="round" />
        <line x1={27 + headBob * 0.2} y1={15 + headBob} x2={28 + headBob * 0.1} y2={11 + headBob} stroke="#5C3A1E" strokeWidth="1.5" strokeLinecap="round" />
        {/* Tail */}
        <path d="M39 93 Q44 90 46 88" fill="none" stroke="#5C3A1E" strokeWidth="1.5" strokeLinecap="round" />
        {/* Spots pattern */}
        <circle cx="20" cy="92" r="2" fill="#3D2B1F" opacity="0.5" />
        <circle cx="28" cy="90" r="1.8" fill="#3D2B1F" opacity="0.5" />
        <circle cx="24" cy="98" r="2" fill="#3D2B1F" opacity="0.5" />
        <circle cx="32" cy="96" r="1.5" fill="#3D2B1F" opacity="0.5" />
      </svg>
    </div>
  );
}

/* ─── Elephant Silhouette ─── */
function Elephant({ x, y, scale = 1, time }: { x: string; y: number; scale?: number; time: number }) {
  const trunkSwing = Math.sin(time * 0.3) * 3;
  return (
    <div className="absolute bottom-0" style={{ left: x }}>
      <svg viewBox="0 0 90 70" width={90 * scale} height={70 * scale} style={{ opacity: 0.14 }}>
        {/* Body — large rounded mass */}
        <ellipse cx="45" cy="38" rx="28" ry="22" fill="#4A3728" />
        {/* Head */}
        <circle cx="20" cy="28" r="14" fill="#4A3728" />
        {/* Ear */}
        <path d="M10 22 Q2 15 6 28 Q8 35 14 32" fill="#3D2B1F" opacity="0.8" />
        {/* Trunk — swinging */}
        <path d={`M14 38 Q10 50 ${8 + trunkSwing} 62 Q${6 + trunkSwing} 66 ${5 + trunkSwing} 68`} fill="none" stroke="#4A3728" strokeWidth="4" strokeLinecap="round" />
        {/* Tusks */}
        <path d="M16 40 Q12 50 14 56" fill="none" stroke="#D4C0B0" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        {/* Legs */}
        <rect x="28" y="52" width="6" height="16" rx="3" fill="#3D2B1F" />
        <rect x="38" y="54" width="6" height="14" rx="3" fill="#3D2B1F" />
        <rect x="50" y="54" width="6" height="14" rx="3" fill="#3D2B1F" />
        <rect x="60" y="52" width="6" height="16" rx="3" fill="#3D2B1F" />
        {/* Tail */}
        <path d="M72 32 Q78 28 80 25" fill="none" stroke="#3D2B1F" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* ─── Zebra Silhouette ─── */
function Zebra({ x, y, scale = 1, time }: { x: string; y: number; scale?: number; time: number }) {
  const tailFlick = Math.sin(time * 1.2) * 2;
  return (
    <div className="absolute bottom-0" style={{ left: x }}>
      <svg viewBox="0 0 70 55" width={70 * scale} height={55 * scale} style={{ opacity: 0.15 }}>
        {/* Body */}
        <ellipse cx="38" cy="30" rx="20" ry="13" fill="#2A1A18" />
        {/* Zebra stripes on body */}
        <path d="M24 22 Q30 18 36 22" fill="none" stroke="#FFF9F0" strokeWidth="1.2" opacity="0.3" />
        <path d="M30 20 Q36 16 42 20" fill="none" stroke="#FFF9F0" strokeWidth="1" opacity="0.25" />
        <path d="M36 21 Q42 17 48 21" fill="none" stroke="#FFF9F0" strokeWidth="1.2" opacity="0.3" />
        <path d="M26 28 Q32 24 38 28" fill="none" stroke="#FFF9F0" strokeWidth="1" opacity="0.2" />
        <path d="M34 27 Q40 23 46 27" fill="none" stroke="#FFF9F0" strokeWidth="1" opacity="0.2" />
        {/* Neck */}
        <path d="M22 25 Q16 15 14 8" fill="none" stroke="#2A1A18" strokeWidth="5" strokeLinecap="round" />
        {/* Head */}
        <ellipse cx="12" cy="6" rx="5" ry="3.5" fill="#2A1A18" />
        {/* Ears */}
        <path d="M10 3 Q8 0 9 2" fill="#2A1A18" />
        <path d="M14 3 Q16 0 15 2" fill="#2A1A18" />
        {/* Mane */}
        <path d="M14 4 Q16 2 18 5 Q20 8 22 12" fill="none" stroke="#2A1A18" strokeWidth="2" strokeLinecap="round" />
        {/* Legs */}
        <line x1="26" y1="40" x2="24" y2="55" stroke="#2A1A18" strokeWidth="3" strokeLinecap="round" />
        <line x1="32" y1="42" x2="30" y2="55" stroke="#2A1A18" strokeWidth="3" strokeLinecap="round" />
        <line x1="44" y1="42" x2="46" y2="55" stroke="#2A1A18" strokeWidth="3" strokeLinecap="round" />
        <line x1="50" y1="40" x2="52" y2="55" stroke="#2A1A18" strokeWidth="3" strokeLinecap="round" />
        {/* Tail */}
        <path d={`M58 28 Q62 24 ${64 + tailFlick} 20`} fill="none" stroke="#2A1A18" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* ─── Grass Tufts ─── */
function GrassField({ time }: { time: number }) {
  const blades = [
    { x: 2, h: 28, color: '#7A9A4A' },
    { x: 5, h: 22, color: '#8AAA5A' },
    { x: 8, h: 32, color: '#6B8A3A' },
    { x: 11, h: 18, color: '#7A9A4A' },
    { x: 14, h: 26, color: '#8AAA5A' },
    { x: 18, h: 35, color: '#5A7A2A' },
    { x: 22, h: 20, color: '#7A9A4A' },
    { x: 26, h: 30, color: '#6B8A3A' },
    { x: 30, h: 24, color: '#8AAA5A' },
    { x: 35, h: 28, color: '#7A9A4A' },
    { x: 40, h: 22, color: '#6B8A3A' },
    { x: 45, h: 34, color: '#5A7A2A' },
    { x: 50, h: 20, color: '#8AAA5A' },
    { x: 55, h: 30, color: '#7A9A4A' },
    { x: 60, h: 26, color: '#6B8A3A' },
    { x: 65, h: 32, color: '#5A7A2A' },
    { x: 70, h: 18, color: '#8AAA5A' },
    { x: 74, h: 28, color: '#7A9A4A' },
    { x: 78, h: 22, color: '#6B8A3A' },
    { x: 82, h: 36, color: '#5A7A2A' },
    { x: 86, h: 24, color: '#7A9A4A' },
    { x: 90, h: 30, color: '#8AAA5A' },
    { x: 93, h: 20, color: '#6B8A3A' },
    { x: 96, h: 26, color: '#7A9A4A' },
  ];

  return (
    <div className="absolute bottom-0 left-0 w-full h-12 pointer-events-none" style={{ opacity: 0.18 }}>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
        {blades.map((b, i) => {
          const sway = Math.sin((time + i * 0.5) * 0.8) * 1.5;
          return (
            <g key={i} transform={`translate(${b.x}, 0)`}>
              <path
                d={`M0 40 Q${sway.toFixed(6)} ${(40 - b.h * 0.5).toFixed(6)} ${(sway * 0.7).toFixed(6)} ${(40 - b.h).toFixed(6)}`}
                fill="none"
                stroke={b.color}
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.8"
              />
              {/* Second blade in tuft */}
              <path
                d={`M1.5 40 Q${(sway + 1.5).toFixed(6)} ${(40 - b.h * 0.4).toFixed(6)} ${(sway * 0.5 + 2).toFixed(6)} ${(40 - b.h * 0.85).toFixed(6)}`}
                fill="none"
                stroke={b.color}
                strokeWidth="0.8"
                strokeLinecap="round"
                opacity="0.6"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── Bird Flock (V-formation) ─── */
function BirdFlock({ time }: { time: number }) {
  const flocks = [
    { startX: 15, y: 12, count: 5, speed: 0.6, spacing: 3 },
    { startX: 65, y: 8, count: 3, speed: 0.45, spacing: 2.5 },
  ];

  return (
    <div className="absolute top-0 left-0 w-full h-[40vh] pointer-events-none">
      {flocks.map((flock, fi) =>
        Array.from({ length: flock.count }).map((_, bi) => {
          const tx = ((time * flock.speed * 5 + flock.startX + bi * 1.5) % 120) - 10;
          const ty = Math.sin((time * flock.speed + bi * 0.8) * 1.2) * 1.5;
          const sideOffset = bi < flock.count / 2 ? -bi * flock.spacing : -(flock.count - 1 - bi) * flock.spacing;
          return (
            <svg
              key={`${fi}-${bi}`}
              className="absolute"
              style={{
                left: `${flock.startX + tx}%`,
                top: `${flock.y + sideOffset * 0.3 + ty}%`,
                opacity: 0.2,
              }}
              viewBox="0 0 20 8"
              width="16"
              height="6"
            >
              <path d="M0 4 Q5 0 10 4 Q15 0 20 4" fill="none" stroke="#3D2B1F" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          );
        })
      )}
    </div>
  );
}

/* ─── Mountains ─── */
function Mountains() {
  return (
    <svg className="absolute bottom-[14%] left-0 w-full h-[20vh]" viewBox="0 0 1440 200" preserveAspectRatio="none" style={{ opacity: 0.06 }}>
      <path fill="#8B7355" d="M0,160 L60,130 L120,150 L200,90 L280,120 L340,80 L420,110 L480,70 L560,100 L640,60 L720,95 L800,55 L880,85 L960,50 L1040,80 L1120,45 L1200,75 L1280,55 L1360,90 L1440,70 L1440,200 L0,200Z" />
      <path fill="#A08A6A" d="M0,170 L80,145 L160,160 L240,120 L320,140 L400,100 L480,130 L560,95 L640,115 L720,80 L800,105 L880,75 L960,100 L1040,70 L1120,95 L1200,65 L1280,85 L1360,105 L1440,90 L1440,200 L0,200Z" opacity="0.5" />
    </svg>
  );
}
