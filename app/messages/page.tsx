'use client';

import React, { useState } from 'react';
import AppLayout, { useApp } from '@/components/AppLayout';
import {
  Search, ShieldCheck, MoreHorizontal,
  Send, Paperclip, Smile, Video,
} from 'lucide-react';

const conversations = [
  {
    id: 1,
    initials: 'JO',
    color: 'blue',
    name: 'James Otieno',
    preview: 'Bring your power bill if you have it',
    time: '2m',
    active: true,
    verified: true,
  },
  {
    id: 2,
    initials: 'NW',
    color: 'earth',
    name: 'Njeri Wambui',
    preview: 'Your grow bag photos are helpful',
    time: '18m',
    active: false,
    verified: false,
  },
  {
    id: 3,
    initials: 'FA',
    color: 'green',
    name: 'Fatuma Ali',
    preview: 'Here is the audio transcript',
    time: '1h',
    active: false,
    verified: false,
  },
];

const initialMessages = [
  {
    id: 1,
    sender: 'James Otieno',
    text: 'Hi Grid Pulse. Bring your power bill if you have it.',
    time: '10:14 AM',
    mine: false,
  },
  {
    id: 2,
    sender: 'You',
    text: 'Perfect. I am trying to avoid buying more system than the shop needs.',
    time: '10:16 AM',
    mine: true,
  },
  {
    id: 3,
    sender: 'James Otieno',
    text: 'That is the right starting point. We will map essential load first.',
    time: '10:17 AM',
    mine: false,
  },
];

export default function MessagesPage() {
  const { showToast } = useApp();
  const [selectedChat, setSelectedChat] = useState(0);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg = {
      id: messages.length + 1,
      sender: 'You',
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mine: true,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    showToast('Message sent');
  };

  const active = conversations[selectedChat];

  return (
    <AppLayout showRightSidebar={false}>
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

          <div className="chat-body">
            {messages.map((msg) => (
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
        </div>
      </div>
    </AppLayout>
  );
}
