'use client';

import { useEffect, useState, useRef } from 'react';

export default function SavannahBackground() {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const tick = (t: number) => {
      setTime(t / 1000);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Sun glow gradients */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-brand-warm/15 via-brand-amber/8 to-transparent blur-3xl animate-sunPulse" />
      <div className="absolute top-1/3 right-1/5 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-brand-terracotta/10 to-transparent blur-3xl animate-sunPulse" style={{ animationDelay: '1.5s' }} />
      
      {/* Acacia trees */}
      <AcaciaTree x="6%" y="84%" scale={1.3} time={time} />
      <AcaciaTree x="18%" y="88%" scale={1} time={time} delay={0.5} />
      <AcaciaTree x="72%" y="78%" scale={1.1} time={time} delay={1} />
      <AcaciaTree x="88%" y="86%" scale={0.8} time={time} delay={1.5} />
      <AcaciaTree x="95%" y="92%" scale={0.6} time={time} delay={2} />
      
      {/* Grass field */}
      <GrassField time={time} />
      
      {/* Birds */}
      <Birds time={time} />
      
      {/* Distant mountains */}
      <Mountains />
      
      {/* Bottom wave */}
      <svg className="absolute bottom-0 left-0 w-full h-48" viewBox="0 0 1440 180" preserveAspectRatio="none" style={{ opacity: 0.06 }}>
        <defs>
          <linearGradient id="savannahGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#cc5b47" />
            <stop offset="100%" stopColor="#d28156" />
          </linearGradient>
        </defs>
        <path fill="url(#savannahGradient)" d="M0,120L40,117.3C80,115,160,109,240,112C320,115,400,125,480,128C560,131,640,125,720,122.7C800,120,880,120,960,125.3C1040,131,1120,141,1200,144C1280,147,1360,144,1400,141.3L1440,139L1440,180L1400,180C1360,180,1280,180,1200,180C1120,180,1040,180,960,180C880,180,800,180,720,180C640,180,560,180,480,180C400,180,320,180,240,180C160,180,80,180,40,180L0,180Z"/>
      </svg>
    </div>
  );
}

function AcaciaTree({ x, y, scale = 1, time, delay = 0 }: { x: string; y: string; scale?: number; time: number; delay?: number }) {
  const sway = Math.sin((time + delay) * 0.25) * 3 * scale;
  return (
    <div className="absolute" style={{ left: x, bottom: y, transform: `scale(${scale}) translateX(${sway}px)`, transformOrigin: 'bottom center' }}>
      <svg viewBox="0 0 60 100" width={60 * scale} height={100 * scale} className="text-brand-terracotta/25 dark:text-brand-terracotta/20">
        <defs>
          <linearGradient id="trunkGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3d2b1f" />
            <stop offset="100%" stopColor="#1a1008" />
          </linearGradient>
        </defs>
        <path d="M30 100 Q22 60 26 30 Q28 15 32 15 Q36 15 38 30 Q42 60 34 100 Z" fill="url(#trunkGrad)" opacity="0.35" />
        <ellipse cx="30" cy="25" rx="28" ry="18" fill="#2d5a27" opacity="0.3" />
        <ellipse cx="30" cy="18" rx="22" ry="14" fill="#3a6b2e" opacity="0.25" />
        <ellipse cx="30" cy="12" rx="16" ry="10" fill="#4a7c3a" opacity="0.2" />
        <ellipse cx="30" cy="8" rx="10" ry="7" fill="#5a8d45" opacity="0.15" />
      </svg>
    </div>
  );
}

function GrassField({ time }: { time: number }) {
  return (
    <div className="absolute bottom-0 left-0 w-full h-32 pointer-events-none" style={{ opacity: 0.12 }}>
      {[...Array(22)].map((_, i) => (
        <GrassBlade key={i} index={i} time={time} />
      ))}
    </div>
  );
}

function GrassBlade({ index, time }: { index: number; time: number }) {
  const x = (index / 22) * 100;
  const height = 35 + (index % 3) * 18;
  const sway = Math.sin((time + index * 0.4) * 1.1) * 2.5;
  return (
    <div className="absolute bottom-0" style={{ 
      left: `${x}%`, 
      transform: `translateX(${sway}px)`,
      transformOrigin: 'bottom center',
      transition: 'transform 0.3s ease-out'
    }}>
      <svg viewBox="0 0 4 60" width={2.5} height={height} className="text-emerald-600/35 dark:text-emerald-500/25">
        <path d={`M2 60 Q${2 + sway * 0.25} 30 2 0`} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function Birds({ time }: { time: number }) {
  const birds = [
    { x: 12, y: 16, delay: 0, speed: 0.7 },
    { x: 32, y: 10, delay: 2.2, speed: 1.05 },
    { x: 62, y: 20, delay: 4.5, speed: 0.85 },
    { x: 84, y: 13, delay: 6.8, speed: 1.15 },
  ];
  return (
    <div className="absolute top-0 left-0 w-full h-[35vh] pointer-events-none">
      {birds.map((b, i) => (
        <Bird key={i} {...b} time={time} />
      ))}
    </div>
  );
}

function Bird({ x, y, delay, speed, time }: { x: number; y: number; delay: number; speed: number; time: number }) {
  const tx = ((time * speed * 8 + delay * 80) % 115) - 8;
  const ty = Math.sin((time * speed + delay) * 1.8) * 2.5;
  return (
    <div className="absolute" style={{ 
      left: `${x}%`, 
      top: `${y}%`, 
      transform: `translate(${tx}vw, ${ty}px) scale(0.5)`,
      opacity: 0.25 
    }}>
      <svg viewBox="0 0 24 12" width={20} height={10} className="text-brand-terracotta/35 dark:text-brand-terracotta/25">
        <path d="M2 6 Q6 2 12 6 Q18 10 22 6" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function Mountains() {
  return (
    <svg className="absolute bottom-32 left-0 w-full h-48" viewBox="0 0 1440 200" preserveAspectRatio="none" style={{ opacity: 0.04 }}>
      <path fill="#8b7355" d="M0,160L40,154.7C80,149,160,139,240,138.7C320,139,400,149,480,154.7C560,160,640,160,720,165.3C800,171,880,181,960,176C1040,171,1120,155,1200,144C1280,133,1360,128,1400,125.3L1440,123L1440,200L1400,200C1360,200,1280,200,1200,200C1120,200,1040,200,960,200C880,200,800,200,720,200C640,200,560,200,480,200C400,200,320,200,240,200C160,200,80,200,40,200L0,200Z"/>
    </svg>
  );
}