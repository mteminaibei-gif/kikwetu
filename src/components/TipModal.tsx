'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';

interface Props {
  sessionId: string;
  professionalId: string;
  professionalName: string;
  onClose: () => void;
}

const TIP_AMOUNTS = [50, 100, 200, 500, 1000];

export default function TipModal({ sessionId, professionalId, professionalName, onClose }: Props) {
  const { submitTip } = useApp();
  const { user } = useAuth();
  const { show } = useToast();
  const [amount, setAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState('');
  const [mpesaRef, setMpesaRef] = useState('');
  const [phone, setPhone] = useState(user?.phone?.replace(/^\+?254/, '') || '');
  const [step, setStep] = useState<'amount' | 'payment'>('amount');
  const [loading, setLoading] = useState(false);
  const [stkSent, setStkSent] = useState(false);
  const [manual, setManual] = useState(false);

  const getSelectedAmount = (): number | null => {
    if (customAmount.trim()) {
      const n = Number.parseInt(customAmount.trim(), 10);
      return Number.isFinite(n) ? n : null;
    }
    return amount;
  };

  const handleProceed = () => {
    const amt = getSelectedAmount();
    if (amt == null || Number.isNaN(amt)) {
      show('Enter a valid tip amount.');
      return;
    }
    if (amt < 10) {
      show('Minimum tip is KES 10.');
      return;
    }
    setStep('payment');
  };

  const tryStkPush = async () => {
    const amt = getSelectedAmount();
    if (amt == null || amt < 10) {
      show('Invalid tip amount.');
      return;
    }
    if (!phone.trim()) {
      show('Enter your M-Pesa phone number.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/mpesa/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          phone: phone.trim(),
          accountReference: 'KikwetuTip',
          description: 'Teacher tip',
        }),
      });
      const data = await res.json();
      if (res.status === 503 || data.configured === false) {
        setManual(true);
        show('STK not configured — use manual M-Pesa till below.');
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setManual(true);
        show(data.error || 'STK failed — use manual payment.');
        setLoading(false);
        return;
      }
      setStkSent(true);
      show(data.customerMessage || 'Check your phone for the M-Pesa prompt.');
    } catch {
      setManual(true);
      show('Could not reach M-Pesa — use manual till.');
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!mpesaRef.trim()) { show('Please enter the M-Pesa transaction code.'); return; }
    const amt = getSelectedAmount();
    if (amt == null || amt < 10) {
      show('Invalid tip amount.');
      return;
    }
    const proAmount = Math.round(amt * 0.7);
    const platAmount = amt - proAmount;
    setLoading(true);
    const { error } = await submitTip({
      session_id: sessionId, professional_id: professionalId,
      amount: amt, mpesa_ref: mpesaRef.trim(),
    });
    setLoading(false);
    if (error) { show(error); return; }
    show(`Tip of KES ${amt} sent! KES ${proAmount} (70%) to professional, KES ${platAmount} (30%) platform. Asante!`);
    onClose();
  };

  const displayAmount = getSelectedAmount() ?? 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90dvh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="text-center space-y-2">
          <span className="text-4xl block">{step === 'amount' ? '💝' : '📱'}</span>
          <h3 className="font-bold text-lg">Send a Tip</h3>
          <p className="text-xs text-gray-400">
            {step === 'amount' ? `Thank ${professionalName} with a tip!` : 'Pay via M-Pesa'}
          </p>
        </div>

        {step === 'amount' ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              {TIP_AMOUNTS.map(a => (
                <button key={a} type="button" onClick={() => { setAmount(a); setCustomAmount(''); }}
                  className={`py-3 rounded-xl text-sm font-bold border-2 transition-all min-h-[44px] touch-manipulation ${
                    amount === a && !customAmount ? 'border-brand-terracotta bg-brand-terracotta/10 text-brand-red' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                  KES {a}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Custom Amount</label>
              <div className="flex">
                <span className="flex items-center px-3.5 bg-gray-100 dark:bg-gray-800 border border-r-0 border-gray-200 dark:border-gray-700 rounded-l-xl text-sm font-bold text-gray-500">KES</span>
                <input type="number" value={customAmount} onChange={e => { setCustomAmount(e.target.value); setAmount(0); }}
                  placeholder="Other amount" min={10}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-r-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50" />
              </div>
            </div>
            <button type="button" onClick={handleProceed}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-3 rounded-xl text-sm font-bold shadow-lg min-h-[44px] touch-manipulation">
              Continue to M-Pesa
            </button>
          </>
        ) : (
          <>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Total Tip</span><span className="font-bold">KES {displayAmount}</span></div>
              <div className="flex justify-between text-emerald-600 font-semibold"><span>Professional (70%)</span><span>KES {Math.round(displayAmount * 0.7)}</span></div>
              <div className="flex justify-between text-brand-red font-semibold"><span>Platform (30%)</span><span>KES {displayAmount - Math.round(displayAmount * 0.7)}</span></div>
            </div>

            {!manual && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">M-Pesa phone</label>
                  <div className="flex">
                    <span className="flex items-center px-3 bg-gray-100 dark:bg-gray-800 border border-r-0 border-gray-200 dark:border-gray-700 rounded-l-xl text-sm font-bold text-emerald-600">+254</span>
                    <input value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="7XX XXX XXX"
                      className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-r-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50" />
                  </div>
                </div>
                <button type="button" onClick={tryStkPush} disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50 min-h-[44px] touch-manipulation">
                  {loading ? 'Sending…' : stkSent ? 'Resend STK prompt' : 'Pay with STK Push'}
                </button>
                <button type="button" onClick={() => setManual(true)}
                  className="w-full text-xs text-gray-500 underline py-1">
                  Or pay via till number manually
                </button>
              </div>
            )}

            {(manual || stkSent) && (
              <>
                {manual && (
                  <div className="p-4 rounded-xl bg-brand-terracotta/5 border border-brand-terracotta/20 text-xs text-gray-600 dark:text-gray-300 space-y-2">
                    <p className="font-bold text-brand-red">Manual M-Pesa:</p>
                    <p>1. Lipa na M-Pesa → Buy Goods</p>
                    <p>2. Till: <strong className="text-brand-red">247247</strong></p>
                    <p>3. Amount: <strong>KES {displayAmount}</strong></p>
                    <p>4. Enter the transaction code below</p>
                  </div>
                )}
                {stkSent && !manual && (
                  <p className="text-xs text-emerald-600 text-center">Approve the prompt on your phone, then enter the M-Pesa code below.</p>
                )}
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                    M-Pesa Transaction Code <span className="text-brand-red">*</span>
                  </label>
                  <input value={mpesaRef} onChange={e => setMpesaRef(e.target.value)}
                    placeholder="e.g. QWE1234567"
                    className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-center font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50" />
                </div>
                <button type="button" onClick={handleSubmit} disabled={loading || !mpesaRef.trim()}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 min-h-[44px] touch-manipulation">
                  {loading ? 'Confirming...' : 'Confirm Tip'}
                </button>
              </>
            )}

            <button type="button" onClick={() => setStep('amount')}
              className="w-full py-2.5 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 min-h-[44px] touch-manipulation">
              Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
