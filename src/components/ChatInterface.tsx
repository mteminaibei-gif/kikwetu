'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import Icon from '@/components/Icon';
import { cn } from '@/lib/utils';

const THREADS = [
  { id: '1', name: 'James Otieno', initials: 'JO', avatarColor: 'blue', preview: 'Thank you for the session today. I feel much clearer about...', time: '2m ago', unread: 2, status: 'online', verified: true },
  { id: '2', name: 'Njeri Wambui', initials: 'NW', avatarColor: 'earth', preview: 'I have attached the document you requested for review.', time: '1h ago', unread: 0, status: 'away', verified: false },
  { id: '3', name: 'Fatuma Ali', initials: 'FA', avatarColor: 'green', preview: 'When is our next session? I would like to discuss...', time: '3h ago', unread: 0, status: 'offline', verified: true },
];

const MESSAGES_DATA: Record<string, { side: 'mine' | 'theirs'; text: string; time: string; read?: boolean; attachment?: boolean }[]> = {
  '1': [
    { side: 'theirs', text: 'Good morning! I hope you are doing well today.', time: '9:42 AM' },
    { side: 'mine', text: 'Good morning! Yes, I am doing well. Ready for our session.', time: '9:43 AM', read: true },
    { side: 'theirs', text: 'Great to hear! I have prepared some exercises based on our last discussion.', time: '9:44 AM' },
    { side: 'mine', text: 'That sounds perfect. I practiced the techniques you suggested.', time: '9:45 AM', read: true },
    { side: 'theirs', text: 'Wonderful! Let me share the solar session preparation PDF with you.', time: '9:46 AM', attachment: true },
    { side: 'mine', text: 'Thank you! I will review it before our next meeting.', time: '9:47 AM', read: true },
    { side: 'theirs', text: 'Please also think about what topics you would like to focus on next.', time: '9:48 AM' },
    { side: 'mine', text: 'I would like to work on appliance maintenance and repair.', time: '9:49 AM', read: true },
  ],
  '2': [
    { side: 'theirs', text: 'Hello! I have completed the document you asked for.', time: '2:15 PM' },
    { side: 'mine', text: 'Perfect, please share it with me.', time: '2:16 PM', read: true },
    { side: 'theirs', text: 'I have attached it here. Let me know if you need any changes.', time: '2:17 PM' },
  ],
  '3': [
    { side: 'theirs', text: 'Hi! When is our next session scheduled?', time: '11:30 AM' },
    { side: 'mine', text: 'Our next session is on Friday at 3 PM.', time: '11:31 AM', read: true },
    { side: 'theirs', text: 'Perfect, I will be there. Thank you!', time: '11:32 AM' },
  ],
};

const CHECKLIST_ITEMS = [
  { text: 'Review solar panel installation steps', done: true },
  { text: 'Practice maintenance checklist', done: true },
  { text: 'Read safety guidelines', done: false },
  { text: 'Complete quiz on energy efficiency', done: false },
];

const QUICK_REPLIES = ['Send appliance list', 'Move session', 'Say thanks'];

export default function ChatInterface({ sessionId: _sessionId }: { sessionId?: string }) {
  const { show } = useToast();

  const [activeThread, setActiveThread] = useState('1');
  const [filter, setFilter] = useState<'all' | 'unread' | 'sessions'>('all');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(MESSAGES_DATA);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<'en' | 'sw'>('en');

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const thread = THREADS.find(t => t.id === activeThread) || THREADS[0];
  const threadMessages = messages[activeThread] || [];

  const filteredThreads = THREADS.filter(t => {
    if (filter === 'unread') return (t.unread || 0) > 0;
    return true;
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    }
  }, []);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    const newMsg = { side: 'mine' as const, text: input.trim(), time: 'Just now', read: false };
    setMessages(prev => ({
      ...prev,
      [activeThread]: [...(prev[activeThread] || []), newMsg],
    }));
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    show('Message sent');
  }, [input, activeThread, show]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleSuggestionClick = useCallback((text: string) => {
    setInput(text);
    show(`Quick reply: "${text}"`);
  }, [show]);

  const handleStarClick = useCallback((star: number) => {
    setRating(star);
    show(`Rated ${star} star${star > 1 ? 's' : ''}`);
  }, [show]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      show(`Switched to ${next} mode`);
      return next;
    });
  }, [show]);

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next = prev === 'en' ? 'sw' : 'en';
      show(`Language: ${next === 'en' ? 'English' : 'Kiswahili'}`);
      return next;
    });
  }, [show]);

  return (
    <>
      <section className="page">
        <div className="page-head">
          <div>
            <span className="eyebrow">Private guidance</span>
            <h1 className="serif">Your guidance circle.</h1>
            <p className="muted">
              {lang === 'sw'
                ? 'Mazungumzo ya faragha na wataalamu wako wa kuaminika.'
                : 'Private conversations with your trusted professionals.'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span className="select-pill" onClick={() => show('End-to-end encrypted. Your conversations stay private.')}>
              <Icon name="shield-check" className="icon-sm" />
              Private
            </span>
            <button className="icon-btn" onClick={toggleTheme}>
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            <button className="icon-btn" onClick={toggleLang}>
              <strong style={{ fontSize: '.65rem' }}>{lang === 'en' ? 'SW' : 'EN'}</strong>
            </button>
            <button className="icon-btn" onClick={() => show('No new notifications')}>
              <Icon name="alert-circle" />
              <span className="notice-dot" />
            </button>
          </div>
        </div>

        <div className="chat-shell">
          <div className="chat-list">
            <div className="list-head">
              <h2>Messages</h2>
              <p>3 active guidance threads</p>
              <div className="chat-search-bar" style={{ marginTop: 12 }}>
                <Icon name="search" className="icon-sm" />
                <input placeholder="Search messages..." />
              </div>
            </div>
            <div className="filter-row">
              {(['all', 'unread', 'sessions'] as const).map(f => (
                <button
                  key={f}
                  className={cn('filter', filter === f && 'active')}
                  onClick={() => { setFilter(f); show(`Filter: ${f}`); }}
                >
                  {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : 'Sessions'}
                </button>
              ))}
            </div>
            {filteredThreads.map(t => (
              <button
                key={t.id}
                className={cn('thread', activeThread === t.id && 'active')}
                onClick={() => setActiveThread(t.id)}
              >
                <div className={cn('avatar', 'sm', t.avatarColor)}>{t.initials}</div>
                <div className="thread-copy">
                  <strong>{t.name}</strong>
                  <p>{t.preview}</p>
                  <div className="thread-meta">
                    {t.unread ? <span className="unread">{t.unread} new</span> : null}
                  </div>
                </div>
                <time>{t.time}</time>
              </button>
            ))}
          </div>

          <div className="chat-main" style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr auto auto auto' }}>
            <div className="chat-header">
              <div className={cn('avatar', 'sm', thread.avatarColor)}>{thread.initials}</div>
              <div className="chat-header-copy">
                <strong>
                  {lang === 'sw' && thread.name === 'James Otieno' ? 'Jakobo Otieno' : thread.name}
                  {thread.verified && <span className="verified" style={{ marginLeft: 5 }}>&#10003;</span>}
                </strong>
                <p>
                  <span className="online" />
                  Online
                </p>
              </div>
              <div className="header-actions">
                <button className="icon-btn" onClick={() => show('Starting video call...')}>
                  <Icon name="video" />
                </button>
                <button className="icon-btn" onClick={() => show('More options')}>
                  <Icon name="ellipsis" />
                </button>
              </div>
            </div>

            <div className="session-bar">
              <div>
                <strong>Upcoming session</strong>
                <span>Fri, Jul 28 at 3:00 PM &middot; 45 min</span>
              </div>
              <div className="session-actions">
                <button onClick={() => show('Session details')}>Details</button>
                <button className="join" onClick={() => show('Joining session...')}>Join</button>
              </div>
            </div>

            <div className="chat-body">
              <div className="date-divider">Today</div>
              {threadMessages.map((msg, i) => (
                <div key={i} className={cn('message-row', msg.side === 'mine' && 'mine')}>
                  <div className="message-bubble">
                    <p>{msg.text}</p>
                    {msg.attachment && (
                      <div className="attachment">
                        <div className="attachment-icon">
                          <Icon name="file-text" className="icon-sm" />
                        </div>
                        <div className="attachment-copy">
                          <strong>solar-session-prep.pdf</strong>
                          <span>2.4 MB</span>
                        </div>
                        <button className="icon-btn" style={{ flexShrink: 0 }} onClick={() => show('Downloading solar-session-prep.pdf')}>
                          <Icon name="download" className="icon-sm" />
                        </button>
                      </div>
                    )}
                    <div className="message-time">
                      {msg.time}
                      {msg.read && <span className="read">Read</span>}
                    </div>
                  </div>
                </div>
              ))}
              <div className="date-divider">Next steps</div>
              <div ref={bottomRef} />
            </div>

            <div className="quick-reply">
              {QUICK_REPLIES.map((text, i) => (
                <button key={i} className="suggestion" onClick={() => handleSuggestionClick(text)}>
                  {text}
                </button>
              ))}
            </div>

            <div className="chat-composer" style={{ padding: '12px 16px', borderTop: '1px solid var(--color-line)', display: 'flex', gap: 8, alignItems: 'end' }}>
              <div className="composer-tools">
                <button className="composer-tool" onClick={() => show('Attach file')}>
                  <Icon name="paperclip" className="icon-sm" />
                </button>
                <button className="composer-tool" onClick={() => show('Voice message (coming soon)')}>
                  <Icon name="mic-2" className="icon-sm" />
                </button>
              </div>
              <textarea
                ref={textareaRef}
                className="message-input"
                placeholder={lang === 'sw' ? 'Andika ujumbe...' : 'Type your message...'}
                value={input}
                onChange={e => { setInput(e.target.value); autoResize(); }}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                className="send"
                style={{
                  display: 'grid', placeItems: 'center', width: 40, height: 40, border: 0,
                  borderRadius: '50%', color: 'var(--color-surface)', background: 'var(--color-green)',
                  flexShrink: 0, opacity: input.trim() ? 1 : 0.5, cursor: input.trim() ? 'pointer' : 'default',
                }}
                onClick={handleSend}
                disabled={!input.trim()}
              >
                <Icon name="send" className="icon-sm" />
              </button>
            </div>
          </div>

          <div className="context">
            <div className="context-block">
              <div className="context-head">
                <span className="eyebrow">Goal</span>
                <button className="context-btn" onClick={() => show('Edit guidance goal')}>
                  <Icon name="pencil" className="icon-sm" /> Edit
                </button>
              </div>
              <h3>Master solar installation</h3>
              <div className="goal">
                <div>
                  <strong>Progress</strong>
                  <span>Phase 3 of 5 &middot; Practical mastery</span>
                </div>
                <div className="goal-progress">
                  <div className="goal-value" />
                </div>
              </div>
            </div>

            <div className="context-block">
              <span className="eyebrow">Session checklist</span>
              <div className="checklist">
                {CHECKLIST_ITEMS.map((item, i) => (
                  <div key={i} className={cn('check', !item.done && 'pending')}>
                    <span className="check-icon">
                      <Icon name={item.done ? 'check' : 'circle'} className="icon-sm" />
                    </span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="context-block">
              <div className="note">
                <strong>Note from James</strong>
                <p>Guiding well matters. Every conversation builds trust.</p>
              </div>
            </div>

            <div className="context-block">
              <span className="eyebrow">After session</span>
              <div className="rate-box" style={{ marginTop: 8 }}>
                <strong style={{ fontSize: '.78rem' }}>Rate this session</strong>
                <div className="stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      className={cn('star', (hoverRating || rating) >= star && 'on')}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => handleStarClick(star)}
                    >
                      &#9733;
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <strong style={{ fontSize: '.78rem' }}>Suggested tip</strong>
                <div className="tip-row" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <span className="badge" style={{ fontSize: '.85rem', padding: '6px 10px' }}>
                    KSh 500
                  </span>
                  <button
                    className="primary"
                    style={{
                      minHeight: 31, padding: '0 10px', border: 0, borderRadius: 9,
                      color: 'var(--color-surface)', background: 'var(--color-green)',
                      fontSize: '.67rem', fontWeight: 800,
                    }}
                    onClick={() => show('Tip KSh 500 via M-Pesa')}
                  >
                    Tip via M-Pesa
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <nav className="mobile-nav">
        <button onClick={() => show('Home')}>
          <Icon name="house" className="icon-lg" />
          <span>Home</span>
        </button>
        <button onClick={() => show('Learn')}>
          <Icon name="graduation-cap" className="icon-lg" />
          <span>Learn</span>
        </button>
        <button className="create-main" onClick={() => show('Create center')}>
          <Icon name="plus" className="icon-lg" />
          <span>Create center</span>
        </button>
        <button className="active" onClick={() => show('Chat')}>
          <Icon name="messages-square" className="icon-lg" />
          <span>Chat</span>
        </button>
        <button onClick={() => show('Profile')}>
          <Icon name="user-round" className="icon-lg" />
          <span>Profile</span>
        </button>
      </nav>
    </>
  );
}
