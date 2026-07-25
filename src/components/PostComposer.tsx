'use client';

import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const POST_TYPES = [
  { id: 'question', label: 'Swali (Q&A)', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'educative', label: 'Post (Maarifa)', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
  { id: 'poll', label: 'Kura (Poll)', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'swahili', label: 'Kiswahili', icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129' },
];

export default function PostComposer() {
  const { loadThreads, spaces } = useApp();
  const { user } = useAuth();
  const { show } = useToast();
  const expandedRef = useRef<HTMLDivElement>(null);

  const [expanded, setExpanded] = useState(false);
  const [type, setType] = useState('question');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [spaceId, setSpaceId] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setTitle('');
    setContent('');
    setType('question');
    setSpaceId('');
    setPollOptions(['', '']);
    setExpanded(false);
  };

  const openComposer = () => {
    setExpanded(true);
    setTimeout(() => expandedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  };

  // FAB / sidebar can dispatch window event to expand without relying on DOM click
  useEffect(() => {
    const handler = () => openComposer();
    window.addEventListener('kikwetu:open-composer', handler);
    return () => window.removeEventListener('kikwetu:open-composer', handler);
  }, []);

  const handleSubmit = async () => {
    if (!content.trim()) { show('Please write some content.'); return; }
    if (!user) { show('Please login first.'); return; }
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
    reset();
    loadThreads();
  };

  const addPollOption = () => setPollOptions(prev => [...prev, '']);
  const updatePollOption = (i: number, val: string) => {
    setPollOptions(prev => prev.map((o, idx) => (idx === i ? val : o)));
  };

  if (!user) {
    return (
      <div id="post-composer" className="sun-card p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Sign in to post to Baraza.
      </div>
    );
  }

  if (!expanded) {
    return (
      <div
        id="post-composer"
        onClick={openComposer}
        className="sun-card p-3 sm:p-4 cursor-pointer hover:border-brand-terracotta transition-all touch-manipulation"
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openComposer(); } }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-deep to-brand-red flex items-center justify-center text-white font-bold shadow-sm overflow-hidden shrink-0">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              user.full_name?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          <div className="flex-1 bg-gray-100 dark:bg-gray-900 px-4 py-2.5 rounded-full text-sm text-gray-500 dark:text-gray-400 hover:ring-2 hover:ring-brand-terracotta/30 transition-all cursor-text min-h-[44px] flex items-center">
            Uliza swali, toa ushauri, ama anzisha Mjadala...
          </div>
        </div>
        <div className="flex items-center justify-around pt-3 mt-3 border-t border-gray-100 dark:border-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Swali
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            Maarifa
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Kura
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      id="post-composer"
      ref={expandedRef}
      className="sun-card p-4 sm:p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-deep to-brand-red flex items-center justify-center text-white font-bold shadow-sm overflow-hidden shrink-0">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              user.full_name?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{user.full_name}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Post to Baraza</p>
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors active:scale-90 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Collapse composer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {POST_TYPES.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(t.id)}
            className={cn(
              'flex flex-col items-center gap-1.5 py-3 border-2 rounded-xl text-[10px] font-bold transition-all active:scale-95 touch-manipulation min-h-[44px]',
              type === t.id
                ? 'border-brand-terracotta bg-brand-terracotta/10 text-brand-red shadow-sm'
                : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
            )}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={t.icon} />
            </svg>
            {t.label}
          </button>
        ))}
      </div>

      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Title (optional — defaults to first 100 chars)"
        className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 transition-shadow min-h-[44px]"
      />

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={4}
        placeholder={type === 'question' ? 'What would you like to ask the community?' : 'Share your knowledge...'}
        className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 resize-none transition-shadow"
        autoFocus
      />

      {type === 'poll' && (
        <div className="space-y-2 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
          {pollOptions.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand-red w-5">{i + 1}.</span>
              <input
                value={opt}
                onChange={e => updatePollOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="flex-1 p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 min-h-[40px]"
              />
              {pollOptions.length > 2 && (
                <button
                  type="button"
                  onClick={() => setPollOptions(prev => prev.filter((_, idx) => idx !== i))}
                  className="text-red-400 hover:text-red-600 text-xs font-semibold p-2 min-w-[44px]"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addPollOption}
            className="text-xs text-brand-red font-semibold hover:text-brand-red/80 transition-colors py-1"
          >
            + Add option
          </button>
        </div>
      )}

      {type === 'swahili' && (
        <div className="p-3 rounded-xl bg-brand-terracotta/5 border border-brand-terracotta/20 text-xs text-gray-600 dark:text-gray-300">
          This post will be tagged in Swahili to attract Kiswahili-speaking members.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={spaceId}
          onChange={e => setSpaceId(e.target.value)}
          className="text-xs bg-gray-100 dark:bg-gray-800 p-2.5 rounded-lg font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 min-h-[44px]"
        >
          <option value="">General Baraza</option>
          {spaces.map(s => (
            <option key={s.id} value={s.id}>
              {s.icon || '#'} {s.name}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-400 font-medium">{content.trim().length} chars</span>
      </div>

      <div className="flex justify-end gap-3 pt-1 border-t border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={reset}
          className="px-5 py-2.5 rounded-full text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-h-[44px]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !content.trim()}
          className="bg-gradient-to-r from-brand-terracotta to-brand-red hover:from-brand-red hover:to-brand-terracotta text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 active:scale-95 min-h-[44px] touch-manipulation"
        >
          {loading ? 'Posting...' : 'Post to Baraza'}
        </button>
      </div>
    </div>
  );
}
