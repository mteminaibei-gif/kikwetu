'use client';

import React from 'react';
import { Megaphone, ExternalLink, X } from 'lucide-react';
import { useApp } from '@/components/AppLayout';

const MOCK_ADS = [
  {
    id: 'ad-1',
    brand: 'Safaricom',
    tagline: 'Fibre for your home',
    description: 'Fast, reliable internet from KES 2,999/month. Stream, game, and work seamlessly.',
    color: 'var(--greenSoft)',
    textColor: 'var(--green)',
    accent: 'var(--green)',
    icon: '📡',
    cta: 'Get Connected',
  },
  {
    id: 'ad-2',
    brand: 'KCB Bank',
    tagline: 'Biashara Account',
    description: 'Open a business account in 5 minutes. No minimum balance. Free mobile banking.',
    color: 'var(--blueSoft)',
    textColor: 'var(--blue)',
    accent: 'var(--blue)',
    icon: '🏦',
    cta: 'Open Account',
  },
  {
    id: 'ad-3',
    brand: 'M-KOPA',
    tagline: 'Solar for every home',
    description: 'Affordable solar energy. Pay as you go from KES 50/day. Light your home today.',
    color: 'var(--goldSoft)',
    textColor: 'var(--earth)',
    accent: 'var(--earth)',
    icon: '☀️',
    cta: 'Learn More',
  },
  {
    id: 'ad-4',
    brand: 'Twiga Foods',
    tagline: 'Fresh produce wholesale',
    description: 'Buy farm-fresh produce at wholesale prices. Direct from farmers to your business.',
    color: 'var(--greenSoft)',
    textColor: 'var(--green)',
    accent: 'var(--green)',
    icon: '🥬',
    cta: 'Order Now',
  },
];

interface AdBannerProps {
  variant?: 'sidebar' | 'inline' | 'banner';
  index?: number;
}

export default function AdBanner({ variant = 'sidebar', index = 0 }: AdBannerProps) {
  const [dismissed, setDismissed] = React.useState(false);
  const { showToast } = useApp();
  const ad = MOCK_ADS[index % MOCK_ADS.length];

  if (dismissed) return null;

  if (variant === 'inline') {
    return (
      <div
        style={{
          padding: '14px 16px',
          borderRadius: 14,
          border: '1px solid var(--line)',
          background: 'var(--surface)',
          position: 'relative',
        }}
      >
        <button
          onClick={() => setDismissed(true)}
          style={{
            position: 'absolute', top: 8, right: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text3)', padding: 2,
          }}
        >
          <X size={14} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: '1.2rem' }}>{ad.icon}</span>
          <div>
            <strong style={{ fontSize: '.78rem' }}>{ad.brand}</strong>
            <span style={{
              marginLeft: 6, fontSize: '.55rem', fontWeight: 800,
              padding: '1px 5px', borderRadius: 99,
              background: 'var(--surface2)', color: 'var(--text3)',
              textTransform: 'uppercase', letterSpacing: '.05em',
            }}>Ad</span>
          </div>
        </div>
        <p style={{ fontSize: '.8rem', color: 'var(--text2)', margin: '0 0 8px', lineHeight: 1.4 }}>
          {ad.description}
        </p>
        <button
          onClick={() => showToast(`Opening ${ad.brand}`)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 99, border: `1px solid ${ad.accent}`,
            background: 'transparent', color: ad.textColor,
            fontSize: '.68rem', fontWeight: 800, cursor: 'pointer',
          }}
        >
          {ad.cta} <ExternalLink size={11} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="right-block"
      style={{
        border: `1px solid ${ad.accent}22`,
        borderRadius: 14,
        padding: 14,
        background: `linear-gradient(135deg, ${ad.color}40, var(--surface))`,
        position: 'relative',
      }}
    >
      <button
        onClick={() => setDismissed(true)}
        style={{
          position: 'absolute', top: 8, right: 8,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text3)', padding: 2,
        }}
      >
        <X size={13} />
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
        <span style={{ fontSize: '1.1rem' }}>{ad.icon}</span>
        <div>
          <strong style={{ fontSize: '.76rem' }}>{ad.brand}</strong>
          <span style={{
            marginLeft: 5, fontSize: '.52rem', fontWeight: 800,
            padding: '1px 4px', borderRadius: 99,
            background: `${ad.accent}18`, color: ad.textColor,
            textTransform: 'uppercase', letterSpacing: '.06em',
          }}>Sponsored</span>
        </div>
      </div>
      <p style={{ fontSize: '.74rem', color: 'var(--text2)', margin: '0 0 10px', lineHeight: 1.45 }}>
        {ad.description}
      </p>
      <button
        onClick={() => showToast(`Opening ${ad.brand}`)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          padding: '7px 0', borderRadius: 10, border: `1px solid ${ad.accent}`,
          background: 'transparent', color: ad.textColor,
          fontSize: '.7rem', fontWeight: 800, cursor: 'pointer',
          transition: 'background .15s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${ad.accent}12`; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      >
        <Megaphone size={13} /> {ad.cta}
      </button>
    </div>
  );
}
