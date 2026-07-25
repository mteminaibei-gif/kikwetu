'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const POST_TYPES = [
  { id: 'question', label: 'Q&A', full: 'Swali (Q&A)', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'educative', label: 'Post', full: 'Post (Maarifa)', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
  { id: 'poll', label: 'Poll', full: 'Kura (Poll)', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'swahili', label: 'SW', full: 'Kiswahili', icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129' },
];

export default function PostComposer() {
  const { loadThreads, spaces } = useApp();
  const { user } = useAuth();
  const { show } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [type, setType] = useState('question');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [spaceId, setSpaceId] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleSubmit = async () => {
    if (!content.trim()) { show('Please write some content.'); return; }
    if (type === 'poll' && pollOptions.filter(o => o.trim()).length < 2) {
      show('Add at least 2 poll options.');
      return;
    }
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
      tags: [] as string[],
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
    setPollOptions(['', '']);
    setType('question');
    setSpaceId('');
    setExpanded(false);
    loadThreads();
  };

  const addPollOption = () => setPollOptions(prev => [...prev, '']);
  const updatePollOption = (i: number, val: string) => {
    setPollOptions(prev => prev.map((o, idx) => (idx === i ? val : o)));
  };

  return (
    <div id="post-composer" className="sun-card p-3 sm:p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-deep to-brand-red flex items-center justify-center text-white font-bold shadow-sm shrink-0 overflow-hidden">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            user.full_name?.[0]?.toUpperCase() || 'U'
          )}
        </div>
        <div className="flex-1 min-w-0">
          {!expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="w-full text-left bg-gray-100 dark:bg-gray-900/80 px-4 py-3 rounded-2xl text-sm text-gray-500 dark:text-gray-400 border border-transparent hover:border-brand-terracotta/30 transition-all touch-manipulation min-h-[48px]"
            >
              Uliza swali, toa ushauri, ama anzisha Mjadala...
            </button>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-1.5">
                {POST_TYPES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    title={t.full}
                    className={cn(
                      'flex flex-col items-center gap-1 py-2.5 border-2 rounded-xl text-[10px] font-bold transition-all min-h-[52px] touch-manipulation',
                      type === t.id
                        ? 'border-brand-terracotta bg-brand-terracotta/10 text-brand-red'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400',
                    )}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={t.icon} />
                    </svg>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Title (optional)"
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50"
              />

              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={4}
                autoFocus
                placeholder={type === 'question' ? 'What would you like to ask the community?' : 'Share your knowledge...'}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 resize-none"
              />

              {type === 'poll' && (
                <div className="space-y-2 bg-gray-50 dark:bg-gray-900/80 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand-red w-5">{i + 1}.</span>
                      <input
                        value={opt}
                        onChange={e => updatePollOption(i, e.target.value)}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 min-w-0 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setPollOptions(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-red-500 text-xs font-semibold p-2 touch-manipulation"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addPollOption} className="text-xs text-brand-red font-semibold py-2 touch-manipulation">
                    + Add option
                  </button>
                </div>
              )}

              {type === 'swahili' && (
                <p className="text-xs text-gray-600 dark:text-gray-400 p-2 rounded-lg bg-brand-terracotta/5 border border-brand-terracotta/15">
                  This post will be tagged in Kiswahili for Swahili-speaking members.
                </p>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <select
                  value={spaceId}
                  onChange={e => setSpaceId(e.target.value)}
                  className="text-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-2.5 rounded-lg font-semibold border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 w-full sm:w-auto"
                >
                  <option value="">General Baraza</option>
                  {spaces.map(s => (
                    <option key={s.id} value={s.id}>{s.icon || '#'} {s.name}</option>
                  ))}
                </select>
                <span className="text-xs text-gray-500 dark:text-gray-400 sm:ml-auto">{content.trim().length} chars</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setExpanded(false);
                    setContent('');
                    setTitle('');
                  }}
                  className="px-4 py-2.5 rounded-full text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 min-h-[44px] touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !content.trim()}
                  className="bg-gradient-to-r from-brand-terracotta to-brand-red text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-md disabled:opacity-50 min-h-[44px] touch-manipulation"
                >
                  {loading ? 'Posting...' : 'Post to Baraza'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {!expanded && (
        <div className="flex items-center justify-around pt-2 border-t border-gray-100 dark:border-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400">
          {POST_TYPES.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setType(t.id); setExpanded(true); }}
              className="flex items-center gap-1.5 px-2 py-2 rounded-lg active:bg-gray-100 dark:active:bg-gray-800 touch-manipulation min-h-[40px]"
            >
              <svg className="w-4 h-4 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
              </svg>
              <span className="hidden xs:inline sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
