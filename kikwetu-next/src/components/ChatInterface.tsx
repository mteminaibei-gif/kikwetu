'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { timeAgo, getInitials, getAvatarColor } from '@/lib/utils';
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
  const [session, setSession] = useState<TeachingSession | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = sessions.find(s => s.id === sessionId);
    if (s) setSession(s);
  }, [sessions, sessionId]);

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

  const handleComplete = async () => {
    await updateSessionStatus(sessionId, 'completed');
    show('Session completed! Please rate your experience.');
    setShowRating(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="sun-card rounded-none sm:rounded-t-2xl border-b-0 px-4 sm:px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-terracotta to-brand-red flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {otherName?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-sm font-bold">{otherName || 'Loading...'}</p>
            <span className={`text-[10px] font-semibold ${
              isRequested ? 'text-amber-500' : isActive ? 'text-green-500' : 'text-gray-400'
            }`}>
              {isRequested ? 'Requested' : isActive ? 'Active' : isCompleted ? 'Completed' : session?.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isProfessional && isRequested && (
            <button onClick={() => updateSessionStatus(sessionId, 'active')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95">
              Accept Session
            </button>
          )}
          {isActive && (
            <button onClick={handleComplete}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-4 py-2 rounded-full text-xs font-bold transition-all">
              End Session
            </button>
          )}
          {isCompleted && (
            <>
              <button onClick={() => setShowRating(true)} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-full text-xs font-bold transition-all active:scale-95">
                Rate
              </button>
              {isStudent && (
                <button onClick={() => setShowTip(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-full text-xs font-bold transition-all active:scale-95">
                  Tip M-Pesa
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Topic */}
      {session && (
        <div className="px-4 sm:px-6 py-3 bg-gray-50 dark:bg-gray-900 border-x border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <span className="font-bold">Topic:</span> {session.topic}
          </p>
          {session.description && <p className="text-xs text-gray-400 mt-0.5">{session.description}</p>}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4 bg-white dark:bg-brand-cardDark border-x border-gray-200 dark:border-gray-800">
        {chatMessages.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl block mb-3">💬</span>
            <p className="text-sm text-gray-400">No messages yet. Start the conversation!</p>
            {isStudent && isRequested && (
              <p className="text-xs text-gray-400 mt-1">Waiting for the teacher to accept your session request.</p>
            )}
          </div>
        ) : (
          chatMessages.map(msg => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <p className="text-[10px] text-gray-400 px-1">{msg.sender?.full_name || 'User'}</p>
                  )}
                  <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                    isMe ? 'bg-gradient-to-r from-brand-terracotta to-brand-red text-white rounded-br-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md'
                  }`}>
                    {msg.content}
                  </div>
                  <p className={`text-[10px] text-gray-400 ${isMe ? 'text-right' : 'text-left'} px-1`}>{timeAgo(msg.created_at)}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {(isActive || (isStudent && isRequested)) && (
        <div className="sun-card rounded-none sm:rounded-b-2xl border-t-0 px-4 sm:px-6 py-4 flex items-center gap-3 shrink-0">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={isRequested ? 'Describe what you want to learn...' : 'Type your message...'}
            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50" />
          <button onClick={handleSend} disabled={sending || !input.trim()}
            className="bg-gradient-to-r from-brand-terracotta to-brand-red hover:from-brand-red hover:to-brand-terracotta text-white p-3 rounded-xl transition-all disabled:opacity-50 active:scale-90">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      )}

      {isCompleted && (
        <div className="sun-card rounded-none sm:rounded-b-2xl border-t-0 px-4 sm:px-6 py-4 text-center shrink-0">
          <p className="text-sm text-gray-400">This session has ended. {isStudent && 'Don\'t forget to rate and tip!'}</p>
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
