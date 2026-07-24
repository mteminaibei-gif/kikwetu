'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
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
  const { show } = useToast();
  const [amount, setAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState('');
  const [mpesaRef, setMpesaRef] = useState('');
  const [step, setStep] = useState<'amount' | 'payment'>('amount');
  const [loading, setLoading] = useState(false);

  const getSelectedAmount = () => customAmount ? parseInt(customAmount) : amount;

  const handleProceed = () => {
    const amt = getSelectedAmount();
    if (amt < 10) { show('Minimum tip is KES 10.'); return; }
    setStep('payment');
  };

  const handleSubmit = async () => {
    if (!mpesaRef.trim()) { show('Please enter the M-Pesa transaction code.'); return; }
    const amt = getSelectedAmount();
    const proAmount = Math.round(amt * 0.7);
    const platAmount = amt - proAmount;
    setLoading(true);
    const { error } = await submitTip({
      session_id: sessionId, professional_id: professionalId,
      amount: amt, mpesa_ref: mpesaRef.trim(),
    });
    setLoading(false);
    if (error) { show(error); return; }
    show(`Tip of KES ${amt} sent! KES ${proAmount} (70%) goes to the professional, KES ${platAmount} (30%) supports the platform. Asante!`);
    onClose();
  };

  const mpesaNumber = '+254 700 000 000';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 space-y-5"
        onClick={e => e.stopPropagation()}>
        <div className="text-center space-y-2">
          <span className="text-4xl block">{step === 'amount' ? '💝' : '📱'}</span>
          <h3 className="font-bold text-lg">Send a Tip</h3>
          <p className="text-xs text-gray-400">
            {step === 'amount' ? `Thank ${professionalName} with a tip!` : 'Complete payment via M-Pesa'}
          </p>
        </div>

        {step === 'amount' ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              {TIP_AMOUNTS.map(a => (
                <button key={a} onClick={() => { setAmount(a); setCustomAmount(''); }}
                  className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                    amount === a && !customAmount ? 'border-brand-terracotta bg-brand-terracotta/10 text-brand-red' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}>
                  KES {a}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Custom Amount</label>
              <div className="flex">
                <span className="flex items-center px-3.5 bg-gray-100 dark:bg-gray-800 border border-r-0 border-gray-200 dark:border-gray-700 rounded-l-xl text-sm font-bold text-gray-500 dark:text-gray-400">KES</span>
                <input type="number" value={customAmount} onChange={e => { setCustomAmount(e.target.value); setAmount(0); }}
                  placeholder="Other amount" min={10}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-r-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50" />
              </div>
            </div>
            <button onClick={handleProceed}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white py-3 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-[0.98]">
              Continue to M-Pesa
            </button>
          </>
        ) : (
          <>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Total Tip</span><span className="font-bold">KES {getSelectedAmount()}</span></div>
              <div className="flex justify-between text-emerald-600 font-semibold"><span>Professional (70%)</span><span>KES {Math.round(getSelectedAmount() * 0.7)}</span></div>
              <div className="flex justify-between text-brand-red font-semibold"><span>Platform (30%)</span><span>KES {getSelectedAmount() - Math.round(getSelectedAmount() * 0.7)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">To</span><span className="font-bold">{professionalName}</span></div>
            </div>

            <div className="p-4 rounded-xl bg-brand-terracotta/5 border border-brand-terracotta/20 text-xs text-gray-600 dark:text-gray-300 space-y-2">
              <p className="font-bold text-brand-red">M-Pesa Instructions:</p>
              <p>1. Go to M-Pesa on your phone</p>
              <p>2. Select Lipa na M-Pesa &rarr; Buy Goods</p>
              <p>3. Enter Till Number: <strong className="text-brand-red">247247</strong></p>
              <p>4. Enter Amount: <strong>KES {getSelectedAmount()}</strong></p>
              <p>5. Complete payment and enter the transaction code below</p>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">
                M-Pesa Transaction Code <span className="text-brand-red">*</span>
              </label>
              <input value={mpesaRef} onChange={e => setMpesaRef(e.target.value)}
                placeholder="e.g. QWE1234567"
                className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 text-center font-bold tracking-wider uppercase" />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('amount')}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                Back
              </button>
              <button onClick={handleSubmit} disabled={loading || !mpesaRef.trim()}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 active:scale-95">
                {loading ? 'Confirming...' : 'Confirm Tip'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
