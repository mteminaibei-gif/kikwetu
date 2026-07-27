'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, sendTip } from '@/lib/supabase-helpers';
import {
  WalletCards, Plus, CalendarDays, Star, ThumbsUp, MessageCircle,
  ArrowUpRight, ArrowDownLeft, ExternalLink, ChevronRight, Download,
  Smartphone, Clock,
} from 'lucide-react';

type WalletTab = 'student' | 'professional' | 'history';

const tipAmounts = [500, 750, 1000, 1500];

const MOCK_TX = [
  { type: 'in', label: 'Wallet top-up via M-Pesa', amount: '+KSh 1,500', time: '2 hours ago', icon: ArrowDownLeft, color: 'var(--green)' },
  { type: 'out', label: 'Tip to Njeri Wambui', amount: '-KSh 750', time: 'Yesterday', icon: ArrowUpRight, color: 'var(--earth)' },
  { type: 'out', label: 'Tip to James Otieno', amount: '-KSh 500', time: '3 days ago', icon: ArrowUpRight, color: 'var(--earth)' },
  { type: 'in', label: 'Wallet top-up via M-Pesa', amount: '+KSh 2,000', time: '5 days ago', icon: ArrowDownLeft, color: 'var(--green)' },
];

const MOCK_RECIPIENTS = [
  { id: 'njeri-wambui', name: 'Njeri Wambui', initials: 'NW', verified: true, session: 'Completed yesterday · Urban farming and climate education', suggested: 1000 },
  { id: 'james-otieno', name: 'James Otieno', initials: 'JO', verified: true, session: 'Completed 3 days ago · Digital marketing strategy', suggested: 750 },
];

function relativeTime(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export default function WalletPage() {
  const { showToast } = useApp();
  const [selectedTip, setSelectedTip] = useState<number | null>(1000);
  const [customTip, setCustomTip] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [transactions, setTransactions] = useState(MOCK_TX);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedRecipient, setSelectedRecipient] = useState(MOCK_RECIPIENTS[0]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<WalletTab>('student');

  const MOCK_PRO_PAYOUTS = [
    { from: 'Wanjiku M.', amount: 450, date: 'Jul 25, 2026', status: 'completed' },
    { from: 'Kipchoge A.', amount: 675, date: 'Jul 23, 2026', status: 'completed' },
    { from: 'Amina H.', amount: 1350, date: 'Jul 20, 2026', status: 'completed' },
  ];
  const proTotal = MOCK_PRO_PAYOUTS.reduce((s, p) => s + p.amount, 0);
  const proFee = Math.round(proTotal * 0.1);

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      const { data, error } = await supabase
        .from('tips')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error || !data || data.length === 0) {
        setTransactions(MOCK_TX);
      } else {
        setTransactions(
          data.map((tip: any) => ({
            type: 'out',
            label: `Tip to ${tip.receiver}`,
            amount: `-KSh ${tip.amount}`,
            time: relativeTime(tip.created_at),
            icon: ArrowUpRight,
            color: 'var(--earth)',
          }))
        );
      }
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('tips-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tips' },
        (payload) => {
          const tip = payload.new as any;
          if (tip.from_user_id === user.id) return;
          const newTx = {
            type: 'in',
            label: `Tip received from ${tip.from_user_id}`,
            amount: `+KSh ${tip.amount}`,
            time: 'Just now',
            icon: ArrowDownLeft,
            color: 'var(--green)',
          };
          setTransactions((prev) => [newTx, ...prev]);
          showToast(`You received a KSh ${tip.amount} tip!`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const tipAmount = selectedTip === null ? (parseInt(customTip) || 0) : selectedTip;
  const platformFee = Math.round(tipAmount * 0.1);
  const netToPro = tipAmount - platformFee;

  async function handleSendTip() {
    if (!user || tipAmount <= 0 || rating <= 0) return;

    setSending(true);
    const { data, error } = await sendTip(
      user.id,
      selectedRecipient.id,
      tipAmount,
      rating,
      '',
    );
    setSending(false);
    setShowConfirm(false);

    if (error) {
      showToast('Failed to send tip. Please try again.');
      return;
    }

    const newTx = {
      type: 'out' as const,
      label: `Tip to ${selectedRecipient.name}`,
      amount: `-KSh ${tipAmount.toLocaleString()}`,
      time: 'Just now',
      icon: ArrowUpRight,
      color: 'var(--earth)',
    };
    setTransactions((prev) => [newTx, ...prev]);
    showToast(`Tip of KSh ${tipAmount.toLocaleString()} sent! Fee: KSh ${platformFee}. Net: KSh ${netToPro}.`);

    setSelectedTip(1000);
    setCustomTip('');
    setRating(0);
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="page-head">
          <div>
            <div className="eyebrow">Wallet & tips</div>
            <h1 className="serif">Thank useful guidance.</h1>
            <p>Top up your wallet, send tips, and track your generosity.</p>
          </div>
        </div>

        <div className="grid2">
          <section className="section">
            <div className="section-head">
              <div>
                <div className="eyebrow">Your balance</div>
                <h2 className="serif">Student wallet.</h2>
              </div>
            </div>
            <div style={{ borderRadius: 16, padding: 24, marginTop: 14, background: 'var(--line)', height: 140 }} />
            <div className="stats" style={{ marginTop: 16 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="stat">
                  <div className="avatar" style={{ background: 'var(--line)' }} />
                  <div style={{ width: 40, height: 12, borderRadius: 4, background: 'var(--line)' }} />
                  <div style={{ width: 60, height: 10, borderRadius: 4, background: 'var(--line)' }} />
                </div>
              ))}
            </div>
          </section>

          <section className="section">
            <div className="section-head">
              <div>
                <div className="eyebrow">Close your last session</div>
                <h2 className="serif">Say thank you.</h2>
              </div>
            </div>
            <div style={{ borderRadius: 12, padding: 16, marginTop: 14, background: 'var(--surface)', border: '1px solid var(--line)', height: 80 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ width: 80, height: 40, borderRadius: 12, background: 'var(--line)' }} />
              ))}
            </div>
            <div style={{ borderRadius: 12, padding: 16, marginTop: 16, background: 'var(--line)', height: 120 }} />
          </section>
        </div>

        <section className="section" style={{ marginTop: 22 }}>
          <div className="section-head">
            <div>
              <div className="eyebrow">Transaction history</div>
              <h2 className="serif">Recent activity.</h2>
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--line)' }}>
                <div className="avatar" style={{ background: 'var(--line)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: '60%', height: 10, borderRadius: 4, background: 'var(--line)', marginBottom: 6 }} />
                  <div style={{ width: '30%', height: 8, borderRadius: 4, background: 'var(--line)' }} />
                </div>
                <div style={{ width: 60, height: 12, borderRadius: 4, background: 'var(--line)' }} />
              </div>
            ))}
          </div>
        </section>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-head">
        <div>
          <div className="eyebrow">Wallet & tips</div>
          <h1 className="serif">Thank useful guidance.</h1>
          <p>Top up your wallet, send tips, and track your generosity.</p>
        </div>
        <button className="secondary" onClick={() => showToast('Statement downloaded')}>
          <Download className="icon-sm" /> Statement
        </button>
      </div>

      <div className="tabs" style={{ marginBottom: 14 }}>
        {([
          { id: 'student' as const, label: 'Student wallet' },
          { id: 'professional' as const, label: 'Professional wallet' },
          { id: 'history' as const, label: 'History' },
        ]).map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'student' && (
      <div>
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
              onClick={() => showToast('M-Pesa prompt sent. Check your phone.')}
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
                setShowConfirm(true);
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
      </div>
      )}

      {activeTab === 'professional' && (
        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Professional wallet</div>
              <h2 className="serif">Your earnings.</h2>
            </div>
          </div>

          <div style={{
            background: 'var(--earth)',
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
            <div className="eyebrow" style={{ color: 'var(--earthSoft)', marginBottom: 8 }}>Net earnings (after 10% fee)</div>
            <div className="money" style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
              KSh {proTotal.toLocaleString()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <WalletCards className="icon-sm" style={{ color: 'var(--earthSoft)' }} />
              <span style={{ fontSize: '.78rem', color: 'var(--earthSoft)' }}>M-Pesa payouts processed within 24 hours</span>
            </div>
          </div>

          <div className="money" style={{ marginTop: 16 }}>
            <div className="money-row">
              <span>Tips received (3)</span>
              <strong>KSh {(proTotal + proFee).toLocaleString()}</strong>
            </div>
            <div className="money-row fee">
              <span>Platform fee (10%)</span>
              <strong>-KSh {proFee.toLocaleString()}</strong>
            </div>
            <div className="money-row total">
              <span>Net to you</span>
              <strong>KSh {proTotal.toLocaleString()}</strong>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Recent payouts</div>
            {MOCK_PRO_PAYOUTS.map((payout, i) => (
              <div key={i} className="alert" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="avatar sm green">{payout.from.split(' ').map(w => w[0]).join('')}</div>
                <div className="alert-copy">
                  <strong>KSh {payout.amount.toLocaleString()}</strong>
                  <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>
                    From {payout.from} · {payout.date} · {payout.status}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            className="primary"
            style={{ marginTop: 16, width: '100%' }}
            onClick={() => showToast('Withdrawal via M-Pesa initiated')}
          >
            <Smartphone className="icon-sm" /> Withdraw via M-Pesa
          </button>
        </section>
      )}

      {activeTab === 'history' && (
        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Transaction history</div>
              <h2 className="serif">All activity.</h2>
            </div>
            <button className="secondary" onClick={() => showToast('Statement downloaded')}>
              <Download className="icon-sm" /> Export
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
                </div>
              );
            })}
          </div>
        </section>
      )}

      {showConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'oklch(0% 0 0 / .5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 16,
              padding: 24,
              width: '90%',
              maxWidth: 380,
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="serif" style={{ marginBottom: 8 }}>Confirm tip</h3>
            <p style={{ fontSize: '.85rem', color: 'var(--text2)', marginBottom: 16 }}>
              Send KSh {tipAmount.toLocaleString()} to {selectedRecipient.name}?
            </p>
            <div style={{
              padding: 14,
              borderRadius: 12,
              background: 'var(--bgAlt)',
              marginBottom: 16,
              fontSize: '.82rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text2)' }}>Tip</span>
                <strong>KSh {tipAmount.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text2)' }}>Fee (10%)</span>
                <span style={{ color: 'var(--text3)' }}>KSh {platformFee.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: 6 }}>
                <span style={{ fontWeight: 700 }}>Professional receives</span>
                <strong style={{ color: 'var(--green)' }}>KSh {netToPro.toLocaleString()}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="secondary"
                style={{ flex: 1 }}
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="primary"
                style={{ flex: 1 }}
                onClick={handleSendTip}
                disabled={sending}
              >
                {sending ? 'Sending...' : 'Send tip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
