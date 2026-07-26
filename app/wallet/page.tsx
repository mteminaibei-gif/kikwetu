'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import {
  WalletCards, Plus, CalendarDays, Star, ThumbsUp, MessageCircle,
  ArrowUpRight, ArrowDownLeft, ExternalLink, ChevronRight,
} from 'lucide-react';

const tipAmounts = [500, 750, 1000, 1500];

const transactions = [
  { type: 'in', label: 'Wallet top-up via M-Pesa', amount: '+KSh 1,500', time: '2 hours ago', icon: ArrowDownLeft, color: 'var(--green)' },
  { type: 'out', label: 'Tip to Njeri Wambui', amount: '-KSh 750', time: 'Yesterday', icon: ArrowUpRight, color: 'var(--earth)' },
  { type: 'out', label: 'Tip to James Otieno', amount: '-KSh 500', time: '3 days ago', icon: ArrowUpRight, color: 'var(--earth)' },
  { type: 'in', label: 'Wallet top-up via M-Pesa', amount: '+KSh 2,000', time: '5 days ago', icon: ArrowDownLeft, color: 'var(--green)' },
];

export default function WalletPage() {
  const { showToast } = useApp();
  const [selectedTip, setSelectedTip] = useState<number | null>(1000);
  const [customTip, setCustomTip] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const tipAmount = selectedTip === null ? (parseInt(customTip) || 0) : selectedTip;
  const platformFee = Math.round(tipAmount * 0.1);
  const netToPro = tipAmount - platformFee;

  return (
    <AppLayout>
      <div className="page-head">
        <div>
          <div className="eyebrow">Wallet & tips</div>
          <h1 className="serif">Thank useful guidance.</h1>
          <p>Top up your wallet, send tips, and track your generosity.</p>
        </div>
        <button className="secondary">
          <CalendarDays className="icon-sm" /> This month <ChevronRight className="icon-sm" />
        </button>
      </div>

      <div className="grid2">
        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Your balance</div>
              <h2 className="serif">Student wallet.</h2>
            </div>
          </div>

          <div style={{
            background: 'var(--green)',
            color: 'var(--surface)',
            borderRadius: 16,
            padding: 24,
            marginTop: 14,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'oklch(100% 0 0 / .1)',
            }} />
            <div className="eyebrow" style={{ color: 'var(--greenSoft)', marginBottom: 8 }}>Available balance</div>
            <div className="money" style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
              KSh 1,280
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <WalletCards className="icon-sm" style={{ color: 'var(--greenSoft)' }} />
              <span style={{ fontSize: '.78rem', color: 'var(--greenSoft)' }}>M-Pesa linked · 0712 345 678</span>
            </div>
            <button
              className="secondary"
              style={{ marginTop: 16, background: 'oklch(100% 0 0 / .15)', border: 'none', color: '#fff' }}
              onClick={() => showToast('Add funds via M-Pesa')}
            >
              <Plus className="icon-sm" /> Add via M-Pesa
            </button>
          </div>

          <div className="stats" style={{ marginTop: 16 }}>
            <div className="stat" onClick={() => showToast('Total tipped')}>
              <div className="avatar" style={{ background: 'var(--goldSoft)', color: 'var(--earth)' }}>
                <ThumbsUp className="icon-sm" />
              </div>
              <strong>KSh 2.4k</strong>
              <span>Total tipped</span>
            </div>
            <div className="stat" onClick={() => showToast('Professionals thanked')}>
              <div className="avatar" style={{ background: 'var(--greenSoft)', color: 'var(--green)' }}>
                <Star className="icon-sm" />
              </div>
              <strong>6</strong>
              <span>Pros thanked</span>
            </div>
            <div className="stat" onClick={() => showToast('Tip history')}>
              <div className="avatar" style={{ background: 'var(--blueSoft)', color: 'var(--blue)' }}>
                <MessageCircle className="icon-sm" />
              </div>
              <strong>100%</strong>
              <span>History</span>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Close your last session</div>
              <h2 className="serif">Say thank you.</h2>
            </div>
          </div>

          <div className="pro-card" style={{ marginTop: 14 }}>
            <div className="avatar earth">NW</div>
            <div className="pro-copy">
              <strong>Njeri Wambui <span className="verified">✓</span></strong>
              <p>Completed yesterday · Urban farming and climate education</p>
              <span>Suggested tip: KSh 1,000</span>
            </div>
          </div>

          <div className="tip-choices" style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {tipAmounts.map((amount) => (
              <button
                key={amount}
                className={`tip-choice ${selectedTip === amount ? 'active' : ''}`}
                onClick={() => { setSelectedTip(amount); setCustomTip(''); }}
                style={{
                  padding: '10px 18px',
                  borderRadius: 12,
                  border: `2px solid ${selectedTip === amount ? 'var(--green)' : 'var(--line)'}`,
                  background: selectedTip === amount ? 'var(--greenSoft)' : 'var(--surface)',
                  color: selectedTip === amount ? 'var(--green)' : 'var(--text)',
                  fontWeight: 700,
                  fontSize: '.85rem',
                  cursor: 'pointer',
                  transition: 'all .15s ease',
                }}
              >
                KSh {amount.toLocaleString()}
              </button>
            ))}
            <button
              className={`tip-choice ${selectedTip === null ? 'active' : ''}`}
              onClick={() => setSelectedTip(null)}
              style={{
                padding: '10px 18px',
                borderRadius: 12,
                border: `2px solid ${selectedTip === null ? 'var(--green)' : 'var(--line)'}`,
                background: selectedTip === null ? 'var(--greenSoft)' : 'var(--surface)',
                color: selectedTip === null ? 'var(--green)' : 'var(--text)',
                fontWeight: 700,
                fontSize: '.85rem',
                cursor: 'pointer',
                transition: 'all .15s ease',
              }}
            >
              Custom
            </button>
          </div>

          {selectedTip === null && (
            <div style={{ marginTop: 12 }}>
              <input
                type="number"
                value={customTip}
                onChange={(e) => setCustomTip(e.target.value)}
                placeholder="Enter custom amount"
                min="10"
                style={{ fontSize: '.85rem' }}
              />
            </div>
          )}

          {tipAmount > 0 && (
            <div className="money-row" style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 12,
              background: 'var(--surface)',
              border: '1px solid var(--line)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '.82rem', color: 'var(--text2)' }}>Tip amount</span>
                <strong style={{ fontSize: '.85rem' }}>KSh {tipAmount.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '.82rem', color: 'var(--text2)' }}>Platform fee (10%)</span>
                <span style={{ fontSize: '.82rem', color: 'var(--text3)' }}>KSh {platformFee.toLocaleString()}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: 8,
                borderTop: '1px solid var(--line)',
              }}>
                <span style={{ fontSize: '.82rem', fontWeight: 700 }}>Net to professional</span>
                <strong style={{ fontSize: '.92rem', color: 'var(--green)' }}>KSh {netToPro.toLocaleString()}</strong>
              </div>
            </div>
          )}

          <div className="mpesa" style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 12,
            background: 'var(--greenSoft)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div className="mpesa-mark" style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'var(--green)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '.72rem',
            }}>M</div>
            <div>
              <strong style={{ fontSize: '.82rem' }}>M-Pesa confirmation</strong>
              <span style={{ display: 'block', fontSize: '.68rem', color: 'var(--text3)' }}>You&apos;ll receive an STK push to confirm</span>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Rate your session</div>
            <div className="stars" style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`star ${star <= (hoverRating || rating) ? 'active' : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 4,
                    cursor: 'pointer',
                    transition: 'transform .15s ease',
                    transform: star <= (hoverRating || rating) ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  <Star
                    className="icon"
                    style={{
                      color: star <= (hoverRating || rating) ? 'var(--gold)' : 'var(--line2)',
                      fill: star <= (hoverRating || rating) ? 'var(--gold)' : 'none',
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          <button
            className="primary"
            style={{ marginTop: 16, width: '100%' }}
            onClick={() => {
              if (tipAmount > 0 && rating > 0) {
                showToast(`Tip of KSh ${tipAmount.toLocaleString()} sent! Thank you.`);
              } else if (tipAmount === 0) {
                showToast('Please select or enter a tip amount');
              } else {
                showToast('Please rate your session');
              }
            }}
          >
            <ThumbsUp className="icon-sm" /> Confirm tip
          </button>
        </section>
      </div>

      <section className="section" style={{ marginTop: 22 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow">Transaction history</div>
            <h2 className="serif">Recent activity.</h2>
          </div>
          <button className="secondary" onClick={() => showToast('View all transactions')}>
            View all <ChevronRight className="icon-sm" />
          </button>
        </div>

        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {transactions.map((tx, i) => {
            const Icon = tx.icon;
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  borderRadius: 12,
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  cursor: 'pointer',
                  transition: 'border-color .15s ease',
                }}
                onClick={() => showToast(tx.label)}
              >
                <div className="avatar" style={{
                  background: tx.type === 'in' ? 'var(--greenSoft)' : 'var(--earthSoft)',
                  color: tx.color,
                }}>
                  <Icon className="icon-sm" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: '.82rem', display: 'block' }}>{tx.label}</strong>
                  <span style={{ fontSize: '.68rem', color: 'var(--text3)' }}>{tx.time}</span>
                </div>
                <span className="mono" style={{
                  fontSize: '.85rem',
                  fontWeight: 700,
                  color: tx.type === 'in' ? 'var(--green)' : 'var(--earth)',
                }}>
                  {tx.amount}
                </span>
                <ExternalLink className="icon-sm" style={{ color: 'var(--text3)' }} />
              </div>
            );
          })}
        </div>
      </section>
    </AppLayout>
  );
}
