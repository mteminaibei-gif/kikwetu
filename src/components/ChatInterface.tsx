'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { timeAgo, getInitials } from '@/lib/utils';
import Icon from '@/components/Icon';
import RatingModal from '@/components/RatingModal';
import TipModal from '@/components/TipModal';
import type { ChatMessage, TeachingSession } from '@/types';

interface Props {
  sessionId: string;
}

export default function ChatInterface({ sessionId }: Props) {
  const { user } = useAuth();
  const { sessions, messages, loadMessages, sendMessage, subscribeToMessages, updateSessionStatus } = useApp();
  const { show } = useToast();
  const [session] = useState<TeachingSession | null>(() => sessions.find(s => s.id === sessionId) || null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(messages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages(sessionId);
  }, [sessionId, loadMessages]);

  useEffect(() => {
    setChatMessages(messages);
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const unsub = subscribeToMessages(sessionId, (msg) => {
      setChatMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    return () => unsub();
  }, [sessionId, subscribeToMessages]);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;
    setSending(true);
    await sendMessage(sessionId, input.trim());
    setInput('');
    setSending(false);
  }, [input, sessionId, sendMessage]);

  const isStudent = user && session?.student_id === user.id;
  const isProfessional = user && session?.professional_id === user.id;
  const isActive = session?.status === 'active';
  const isCompleted = session?.status === 'completed';
  const isRequested = session?.status === 'requested';

  const otherName = isStudent ? session?.professional?.full_name : session?.student?.full_name;
  const otherInitials = otherName ? getInitials(otherName) : '?';

  const handleComplete = async () => {
    await updateSessionStatus(sessionId, 'completed');
    show('Session completed! Please rate your experience.');
    setShowRating(true);
  };

  return (
    <div className="chat-main" style={{ height: 'calc(100vh - 68px - 60px)', maxWidth: 790 }}>
      <div className="chat-top">
        <div className="avatar sm blue">{otherInitials}</div>
        <div className="chat-top-copy">
          <strong>{otherName || 'Loading...'} <span className="verified">&#10003;</span></strong>
          <span>
            <span className="live-dot"></span>
            {isRequested ? 'Requested' : isActive ? 'Active' : isCompleted ? 'Completed' : session?.status}
            &middot; private
          </span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {isProfessional && isRequested && (
            <button onClick={() => updateSessionStatus(sessionId, 'active')} className="primary">
              Accept Session
            </button>
          )}
          {isActive && (
            <button onClick={handleComplete} className="secondary">
              End Session
            </button>
          )}
          {isCompleted && (
            <>
              <button onClick={() => setShowRating(true)} className="primary">Rate</button>
              {isStudent && (
                <button onClick={() => setShowTip(true)} className="secondary">Tip M-Pesa</button>
              )}
            </>
          )}
        </div>
      </div>

      {session && (
        <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--color-line)', background: 'var(--color-surface-2)', fontSize: '.72rem', color: 'var(--color-text-3)' }}>
          <strong>Topic:</strong> {session.topic}
          {session.description && <span> &middot; {session.description}</span>}
        </div>
      )}

      <div className="chat-body">
        {chatMessages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-3)' }}>
            <Icon name="message-circle" className="icon-lg" style={{ marginBottom: 12, opacity: 0.5 }} />
            <p>No messages yet. Start the conversation!</p>
            {isStudent && isRequested && <p style={{ fontSize: '.72rem', marginTop: 8 }}>Waiting for the teacher to accept your request.</p>}
          </div>
        ) : (
          chatMessages.map(msg => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`message ${isMe ? 'mine' : 'theirs'}`}>
                {msg.content}
                <small>{timeAgo(msg.created_at)}</small>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {(isActive || (isStudent && isRequested)) && (
        <form className="chat-form" onSubmit={e => { e.preventDefault(); handleSend(); }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={isRequested ? 'Describe what you want to learn...' : 'Type your message...'}
          />
          <button type="submit" disabled={sending || !input.trim()} className="send-btn">
            <Icon name="send" className="icon-sm" />
          </button>
        </form>
      )}

      {isCompleted && (
        <div style={{ padding: '14px 18px', borderTop: '1px solid var(--color-line)', textAlign: 'center', fontSize: '.78rem', color: 'var(--color-text-3)' }}>
          This session has ended. {isStudent && "Don't forget to rate and tip!"}
        </div>
      )}

      {showRating && session && (
        <RatingModal
          sessionId={session.id}
          professionalId={session.professional_id}
          onClose={() => setShowRating(false)}
        />
      )}

      {showTip && session && (
        <TipModal
          sessionId={session.id}
          professionalId={session.professional_id}
          professionalName={session.professional?.full_name || 'Teacher'}
          onClose={() => setShowTip(false)}
        />
      )}
    </div>
  );
}
