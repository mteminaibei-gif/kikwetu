'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase';

interface Props {
  onClose: () => void;
}

export default function CreatePostModal({ onClose }: Props) {
  const { loadThreads, spaces } = useApp();
  const { user } = useAuth();
  const { show } = useToast();

  const [type, setType] = useState<'question' | 'post'>('question');
  const [content, setContent] = useState('');
  const [space, setSpace] = useState('general');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) { show('Please write something.'); return; }
    if (!user) { show('Please login first.'); return; }
    setLoading(true);

    const sb = createClient();
    let spaceId: string | null = null;
    if (space !== 'general') {
      const { data } = await sb.from('spaces').select('id').eq('slug', space).single();
      if (data) spaceId = data.id;
    }

    const { error } = await sb.from('threads').insert({
      author_id: user.id,
      space_id: spaceId,
      type: type === 'question' ? 'question' : 'educative',
      title: content.trim().substring(0, 100),
      content: content.trim(),
      language: user.preferred_lang || 'en',
      county: user.county || '',
      tags: [space],
    }).select().single();

    setLoading(false);
    if (error) { show(error.message); return; }
    show('Posted to Baraza!');
    setContent('');
    onClose();
    loadThreads();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}>
      <div className="w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-sm">Post to Baraza</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            {(['question', 'post'] as const).map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`flex-1 py-2.5 border-2 rounded-xl text-xs font-bold transition-all ${
                  type === t ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-gray-200 dark:border-gray-700'
                }`}>
                {t === 'question' ? 'Ask Question' : 'Educative Post'}
              </button>
            ))}
          </div>

          <textarea value={content} onChange={e => setContent(e.target.value)}
            rows={4} placeholder={type === 'question' ? 'What would you like to ask the community?' : 'Share your knowledge...'}
            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none" />

          <div className="flex items-center justify-between">
            <select value={space} onChange={e => setSpace(e.target.value)}
              className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded-lg font-semibold border-none focus:outline-none focus:ring-2 focus:ring-orange-500/50">
              <option value="general">General Baraza</option>
              <option value="kilimo">#KilimoSmart</option>
              <option value="tech">Tech Kenya</option>
              <option value="education">Elimu Yetu</option>
              <option value="culture">Utamaduni</option>
            </select>
            <span className="text-xs text-gray-400">{content.trim().length} chars</span>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading || !content.trim()}
            className="bg-orange-500 hover:bg-orange-400 text-white px-6 py-2 rounded-full text-xs font-bold shadow-md transition-all disabled:opacity-50">
            {loading ? 'Posting...' : 'Post to Baraza'}
          </button>
        </div>
      </div>
    </div>
  );
}
