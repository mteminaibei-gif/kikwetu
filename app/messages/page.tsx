'use client';

import React, { useState, useEffect, useRef } from 'react';
import AppLayout, { useApp } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, sendMessage, createConversation } from '@/lib/supabase-helpers';
import {
  Search, ShieldCheck, MoreHorizontal,
  Send, Paperclip, Smile, Video,
} from 'lucide-react';

const mockConversations = [
  {
    id: '1',
    initials: 'JO',
    color: 'blue',
    name: 'James Otieno',
    preview: 'Bring your power bill if you have it',
    time: '2m',
    active: true,
    verified: true,
    last_message_at: new Date().toISOString(),
  },
  {
    id: '2',
    initials: 'NW',
    color: 'earth',
    name: 'Njeri Wambui',
    preview: 'Your grow bag photos are helpful',
    time: '18m',
    active: false,
    verified: false,
    last_message_at: new Date().toISOString(),
  },
  {
    id: '3',
    initials: 'FA',
    color: 'green',
    name: 'Fatuma Ali',
    preview: 'Here is the audio transcript',
    time: '1h',
    active: false,
    verified: false,
    last_message_at: new Date().toISOString(),
  },
];

const mockMessages: Record<string, Array<{
  id: string;
  sender: string;
  text: string;
  time: string;
  mine: boolean;
  conversation_id: string;
}>> = {
  '1': [
    { id: '1', sender: 'James Otieno', text: 'Hi there. Bring your power bill if you have it.', time: '10:14 AM', mine: false, conversation_id: '1' },
    { id: '2', sender: 'You', text: 'Perfect. I am trying to avoid buying more system than the shop needs.', time: '10:16 AM', mine: true, conversation_id: '1' },
    { id: '3', sender: 'James Otieno', text: 'That is the right starting point. We will map essential load first.', time: '10:17 AM', mine: false, conversation_id: '1' },
  ],
  '2': [
    { id: '4', sender: 'Njeri Wambui', text: 'Your grow bag photos are helpful', time: '10:00 AM', mine: false, conversation_id: '2' },
  ],
  '3': [
    { id: '5', sender: 'Fatuma Ali', text: 'Here is the audio transcript', time: '9:30 AM', mine: false, conversation_id: '3' },
  ],
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function timeSince(dateStr: string) {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export default function MessagesPage() {
  const { showToast, user } = useApp();
  const [selectedChat, setSelectedChat] = useState(0);
  const [messages, setMessages] = useState(mockMessages);
  const [input, setInput] = useState('');
  const [conversations, setConversations] = useState(mockConversations);
  const [dbMessages, setDbMessages] = useState(mockMessages);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<any>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  const active = conversations[selectedChat];
  const currentMessages = dbMessages[active?.id] || [];

  const scrollToBottom = () => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages.length]);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);

      const currentUser = await getCurrentUser();
      if (cancelled) return;

      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (cancelled) return;

      if (convError || !convData || convData.length === 0) {
        setConversations(mockConversations);
        setDbMessages(mockMessages);
        setLoading(false);
        return;
      }

      const mapped = convData.map((c: any) => ({
        id: c.id,
        initials: getInitials(c.name || 'U'),
        color: c.color || 'blue',
        name: c.name || 'Unknown',
        preview: c.preview || '',
        time: timeSince(c.last_message_at),
        active: true,
        verified: c.verified || false,
        last_message_at: c.last_message_at,
      }));

      setConversations(mapped);

      const msgMap: typeof mockMessages = {};
      for (const conv of mapped) {
        const { data: msgData } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: true });

        if (msgData) {
          msgMap[conv.id] = msgData.map((m: any) => ({
            id: String(m.id),
            sender: m.sender_id === currentUser?.user_id ? 'You' : (m.sender_name || 'Unknown'),
            text: m.body,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            mine: m.sender_id === currentUser?.user_id,
            conversation_id: m.conversation_id,
          }));
        }
      }

      if (!cancelled) {
        setDbMessages(Object.keys(msgMap).length > 0 ? msgMap : mockMessages);
        setLoading(false);
      }
    }

    fetchData();

    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${active?.id}` },
        (payload) => {
          const newMsg = payload.new as any;
          const newEntry = {
            id: String(newMsg.id),
            sender: newMsg.sender_id === user?.id ? 'You' : (newMsg.sender_name || 'Unknown'),
            text: newMsg.body,
            time: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            mine: newMsg.sender_id === user?.id,
            conversation_id: newMsg.conversation_id,
          };

          setDbMessages((prev) => {
            const convId = newMsg.conversation_id;
            const existing = prev[convId] || [];
            if (existing.some((m) => m.id === newEntry.id)) return prev;
            return { ...prev, [convId]: [...existing, newEntry] };
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [active?.id, user?.id]);

  const handleSend = async () => {
    if (!input.trim() || !user?.id) return;

    const msgText = input.trim();
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      sender: 'You',
      text: msgText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mine: true,
      conversation_id: active.id,
    };

    setDbMessages((prev) => ({
      ...prev,
      [active.id]: [...(prev[active.id] || []), optimisticMsg],
    }));
    setInput('');

    const { error } = await sendMessage(active.id, user.id, msgText);

    if (error) {
      showToast('Failed to send — using fallback');
      setDbMessages((prev) => ({
        ...prev,
        [active.id]: (prev[active.id] || []).map((m) =>
          m.id === tempId ? { ...m, id: `fallback-${Date.now()}` } : m
        ),
      }));
    } else {
      showToast('Message sent');
    }
  };

  const handleNewConversation = async (participantIds: string[], firstMessage: string) => {
    if (!user?.id) return;

    const { data: conv } = await createConversation([...participantIds, user.id], firstMessage);
    if (conv) {
      const newConv = {
        id: conv.id,
        initials: getInitials('New'),
        color: 'blue',
        name: 'New Conversation',
        preview: firstMessage,
        time: 'now',
        active: true,
        verified: false,
        last_message_at: new Date().toISOString(),
      };
      setConversations((prev) => [newConv, ...prev]);
      setSelectedChat(0);
      showToast('Conversation created');
    }
  };

  return (
    <AppLayout>
      <div className="page-head">
        <div>
          <div className="eyebrow">KikwetuConnect</div>
          <h1 className="serif">Your guidance circle.</h1>
        </div>
        <button className="secondary" onClick={() => showToast('Privacy settings opened')}>
          <ShieldCheck className="icon-sm" /> Privacy
        </button>
      </div>

      <div className="chat">
        {/* Left sidebar */}
        <div className="chat-list">
          <div className="chat-head-list">
            <h2>Messages</h2>
            <div className="chat-search">
              <Search className="icon-sm" />
              <input type="text" placeholder="Search conversations" />
            </div>
          </div>

          {conversations.map((conv, idx) => (
            <button
              key={conv.id}
              className={`chat-thread ${selectedChat === idx ? 'active' : ''}`}
              onClick={() => setSelectedChat(idx)}
            >
              <div className={`avatar ${conv.color}`}>{conv.initials}</div>
              <div className="chat-thread-copy">
                <strong>
                  {conv.name}
                  {conv.verified && (
                    <span className="verified" style={{ marginLeft: 5, verticalAlign: 'middle' }}>✓</span>
                  )}
                </strong>
                <span>{conv.preview}</span>
              </div>
              <time>{conv.time}</time>
            </button>
          ))}
        </div>

        {/* Main chat area */}
        <div className="chat-main">
          <div className="chat-top">
            <div className={`avatar ${active.color}`}>{active.initials}</div>
            <div className="chat-top-copy">
              <strong>
                {active.name}
                {active.verified && (
                  <span className="verified" style={{ marginLeft: 5, verticalAlign: 'middle' }}>✓</span>
                )}
              </strong>
              <span>
                <span className="live-dot" /> Session in progress
              </span>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button className="icon-btn" onClick={() => showToast('Video call started')}>
                <Video className="icon-sm" />
              </button>
              <button className="icon-btn">
                <MoreHorizontal className="icon-sm" />
              </button>
            </div>
          </div>

          <div className="chat-body" ref={chatBodyRef}>
            {currentMessages.map((msg) => (
              <div key={msg.id} className={`message ${msg.mine ? 'mine' : 'theirs'}`}>
                <span>{msg.text}</span>
                <small>{msg.time}</small>
              </div>
            ))}
          </div>

          <div className="chat-input">
            <button className="icon-btn" onClick={() => showToast('Attach a file')}>
              <Paperclip className="icon-sm" />
            </button>
            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="icon-btn">
              <Smile className="icon-sm" />
            </button>
            <button className="primary" style={{ borderRadius: 99, width: 38, height: 38, padding: 0 }} onClick={handleSend}>
              <Send className="icon-sm" />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 6, padding: '0 14px 10px', overflow: 'auto' }}>
            {['Send appliance list', 'Confirm session time', 'Share power bill'].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => { setInput(suggestion); }}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '6px 10px',
                  borderRadius: 99,
                  border: '1px solid var(--line)',
                  background: 'var(--surface)',
                  color: 'var(--text2)',
                  fontSize: '.62rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
