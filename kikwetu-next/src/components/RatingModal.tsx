'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/Toast';

interface Props {
  sessionId: string;
  professionalId: string;
  onClose: () => void;
}

export default function RatingModal({ sessionId, professionalId, onClose }: Props) {
  const { submitRating, loadRatings } = useApp();
  const { show } = useToast();
  const [score, setScore] = useState(0);
  const [review, setReview] = useState('');
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (score === 0) { show('Please select a rating.'); return; }
    setLoading(true);
    const { error } = await submitRating({ session_id: sessionId, professional_id: professionalId, score, review: review.trim() || undefined });
    setLoading(false);
    if (error) { show(error); return; }
    show('Rating submitted! Thank you.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 space-y-5"
        onClick={e => e.stopPropagation()}>
        <div className="text-center space-y-2">
          <span className="text-4xl block">⭐</span>
          <h3 className="font-bold text-lg">Rate Your Experience</h3>
          <p className="text-xs text-gray-400">How was your learning session?</p>
        </div>

        <div className="flex justify-center gap-1.5">
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} onClick={() => setScore(s)}
              onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
              className={`text-3xl transition-all active:scale-90 ${s <= (hover || score) ? 'text-amber-400 scale-110' : 'text-gray-300 dark:text-gray-600'}`}>
              ★
            </button>
          ))}
        </div>

        <textarea value={review} onChange={e => setReview(e.target.value)}
          rows={3} placeholder="Share your feedback (optional)..."
          className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 resize-none" />

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading || score === 0}
            className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 active:scale-95">
            {loading ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );
}
