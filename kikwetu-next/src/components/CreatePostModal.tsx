'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase';

interface Props {
  onClose: () => void;
}

const POST_TYPES = [
  { id: 'question', label: 'Swali (Q&A)', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'educative', label: 'Post (Maarifa)', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
  { id: 'poll', label: 'Kura (Poll)', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'swahili', label: 'Kiswahili', icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129' },
];

export default function CreatePostModal({ onClose }: Props) {
  const { loadThreads, spaces } = useApp();
  const { user } = useAuth();
  const { show } = useToast();

  const [type, setType] = useState('question');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [spaceId, setSpaceId] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) { show('Please write some content.'); return; }
    if (!user) { show('Please login first.'); return; }
    if (type === 'poll' && pollOptions.filter(o => o.trim()).length < 2) { show('Add at least 2 poll options.'); return; }
    setLoading(true);

    const sb = createClient();
    const threadData: Record<string, unknown> = {
      author_id: user.id,
      space_id: spaceId || null,
      type: type === 'swahili' ? 'educative' : type,
      title: title.trim() || content.trim().substring(0, 100),
      content: content.trim(),
      language: type === 'swahili' ? 'sw' : user.preferred_lang || 'en',
      county: user.county || '',
      tags: [],
    };

    if (spaceId) {
      const space = spaces.find(s => s.id === spaceId);
      if (space) threadData.tags = [space.slug];
    }

    if (type === 'poll') {
      threadData.poll_options = pollOptions.filter(o => o.trim()).map((o, i) => ({ id: i, text: o }));
    }

    const { error } = await sb.from('threads').insert(threadData).select().single();
    setLoading(false);
    if (error) { show(error.message); return; }
    show('Posted to Baraza!');
    setTitle('');
    setContent('');
    onClose();
    loadThreads();
  };

  const addPollOption = () => setPollOptions(prev => [...prev, '']);
  const updatePollOption = (i: number, val: string) => {
    setPollOptions(prev => prev.map((o, idx) => idx === i ? val : o));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}>
      <div className="w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 duration-200"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-sm">Post to Baraza</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-90">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {POST_TYPES.map(t => (
              <button key={t.id} onClick={() => setType(t.id)}
                className={`flex flex-col items-center gap-1.5 py-3 border-2 rounded-xl text-[10px] font-bold transition-all active:scale-95 ${
                  type === t.id ? 'border-brand-terracotta bg-brand-terracotta/10 text-brand-red shadow-sm' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={t.icon} /></svg>
                {t.label}
              </button>
            ))}
          </div>

          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Title (optional - defaults to first 100 chars)"
            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 transition-shadow" />

          <textarea value={content} onChange={e => setContent(e.target.value)}
            rows={4} placeholder={type === 'question' ? 'What would you like to ask the community?' : 'Share your knowledge...'}
            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 resize-none transition-shadow" />

          {type === 'poll' && (
            <div className="space-y-2 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-brand-red w-5">{i + 1}.</span>
                  <input value={opt} onChange={e => updatePollOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50" />
                  {pollOptions.length > 2 && (
                    <button onClick={() => setPollOptions(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-red-400 hover:text-red-600 text-xs font-semibold p-1">Remove</button>
                  )}
                </div>
              ))}
              <button onClick={addPollOption}
                className="text-xs text-brand-red font-semibold hover:text-brand-red/80 transition-colors">+ Add option</button>
            </div>
          )}

          {type === 'swahili' && (
            <div className="p-3 rounded-xl bg-brand-terracotta/5 border border-brand-terracotta/20 text-xs text-gray-600 dark:text-gray-300">
              This post will be tagged in Swahili to attract Kiswahili-speaking members.
            </div>
          )}

          <div className="flex items-center justify-between">
            <select value={spaceId} onChange={e => setSpaceId(e.target.value)}
              className="text-xs bg-gray-100 dark:bg-gray-800 p-2.5 rounded-lg font-semibold border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50">
              <option value="">General Baraza</option>
              {spaces.map(s => (
                <option key={s.id} value={s.id}>{s.icon || '#'} {s.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-400 cursor-pointer hover:text-brand-red transition-colors flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Media
              </label>
              <span className="text-xs text-gray-400 font-medium">{content.trim().length} chars</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-full text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading || !content.trim()}
            className="bg-gradient-to-r from-brand-terracotta to-brand-red hover:from-brand-red hover:to-brand-terracotta text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 active:scale-95">
            {loading ? 'Posting...' : 'Post to Baraza'}
          </button>
        </div>
      </div>
    </div>
  );
}
