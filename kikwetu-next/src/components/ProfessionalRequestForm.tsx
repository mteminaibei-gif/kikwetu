'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';

const EXPERTISE_OPTIONS = [
  'Kilimo (Agriculture)', 'Tech & Programming', 'Mathematics', 'Science',
  'English', 'Kiswahili', 'Business', 'Health & Medicine',
  'Music & Arts', 'History & Culture', 'Finance', 'Engineering',
];

export default function ProfessionalRequestForm() {
  const { user } = useAuth();
  const { requestProfessional } = useApp();
  const { show } = useToast();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [qualificationsDocUrl, setQualificationsDocUrl] = useState('');
  const [expertise, setExpertise] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleExpertise = (e: string) => {
    setExpertise(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);
  };

  const handleSubmit = async () => {
    if (!title.trim()) { show('Please enter your professional title.'); return; }
    if (!bio.trim()) { show('Please write a short bio.'); return; }
    if (!qualifications.trim()) { show('Please list your qualifications.'); return; }
    if (expertise.length === 0) { show('Select at least one area of expertise.'); return; }
    setLoading(true);
    const { error } = await requestProfessional({
      title: title.trim(), bio: bio.trim(), qualifications: qualifications.trim(),
      qualifications_doc_url: qualificationsDocUrl.trim() || undefined,
      expertise,
    });
    setLoading(false);
    if (error) { show(error); return; }
    show('Request submitted! Admin will review your qualifications.');
    router.push('/feed');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="sun-card p-8 text-center max-w-md">
          <span className="text-5xl block mb-4">🔒</span>
          <h2 className="text-xl font-black mb-2">Sign In Required</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Please sign in to apply as a professional.</p>
          <a href="/onboarding" className="sun-btn inline-flex px-6 py-3 rounded-full text-sm font-bold">Sign In</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <span className="text-5xl block">🎓</span>
          <h1 className="text-3xl font-black font-logo">
            {user.role === 'expert' ? 'Update Your Profile' : 'Become a Verified Professional'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
            Submit your qualifications for review. Once approved, students can book sessions with you,
            rate your services, and send tips via M-Pesa.
          </p>
        </div>

        <div className="sun-card p-6 sm:p-8 space-y-6">
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">
              Professional Title <span className="text-brand-red">*</span>
            </label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Senior Software Engineer, Agriculture Extension Officer..."
              className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">
              Short Bio <span className="text-brand-red">*</span>
            </label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
              placeholder="Tell students about yourself, your experience, and what you can teach..."
              className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 resize-none" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">
              Qualifications & Certifications <span className="text-brand-red">*</span>
            </label>
            <textarea value={qualifications} onChange={e => setQualifications(e.target.value)} rows={3}
              placeholder="List your degrees, certifications, years of experience, and any relevant credentials..."
              className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 resize-none" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">
              Qualification Document URL (optional)
            </label>
            <input value={qualificationsDocUrl} onChange={e => setQualificationsDocUrl(e.target.value)}
              placeholder="Link to your CV, portfolio, or certification document (Google Drive, PDF link...)"
              className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block">
              Areas of Expertise <span className="text-brand-red">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {EXPERTISE_OPTIONS.map(e => (
                <button key={e} onClick={() => toggleExpertise(e)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    expertise.includes(e) ? 'bg-brand-terracotta text-white border-brand-terracotta shadow-sm' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}>{e}</button>
              ))}
            </div>
          </div>

          {user.role === 'expert' && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-700 dark:text-emerald-300">
              You are already a verified professional. Submitting this form will update your profile.
            </div>
          )}

          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300 space-y-1">
            <p className="font-bold">What happens next?</p>
            <p>1. Admin reviews your qualifications and verifies your identity.</p>
            <p>2. Once approved, you appear in the Student Area as a verified teacher.</p>
            <p>3. Students can book 1-on-1 sessions with you via chat.</p>
            <p>4. After sessions, students rate your service and can send tips via M-Pesa.</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => router.back()}
              className="flex-1 py-3.5 rounded-xl text-sm font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-[2] bg-gradient-to-r from-brand-terracotta to-brand-red hover:from-brand-red hover:to-brand-terracotta text-white font-bold py-3.5 rounded-xl text-sm shadow-lg transition-all disabled:opacity-50 active:scale-[0.98]">
              {loading ? 'Submitting...' : user.role === 'expert' ? 'Update Profile' : 'Submit for Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
