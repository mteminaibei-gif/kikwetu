'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import { Bookmark, MessageCircle, ThumbsUp, Trash2 } from 'lucide-react';

interface SavedItem {
  id: string;
  target_type: string;
  target_id: string;
  created_at: string;
  threads?: {
    id: string;
    title: string;
    body: string | null;
    type: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
    profiles?: {
      full_name: string;
      username: string;
      avatar_url: string | null;
    }[];
  }[];
}

export default function SavedPage() {
  const { user } = useApp();
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchSaved = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('saved_items')
        .select('id, target_type, target_id, created_at, threads(id, title, body, type, likes_count, comments_count, created_at, profiles(full_name, username, avatar_url))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setSaved(data || []);
      setLoading(false);
    };
    fetchSaved();
  }, [user]);

  const handleRemove = async (savedId: string) => {
    await supabase.from('saved_items').delete().eq('id', savedId);
    setSaved(prev => prev.filter(s => s.id !== savedId));
  };

  return (
    <AppLayout>
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <Bookmark className="w-6 h-6" style={{ color: 'var(--gold)' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Saved</h1>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'oklch(60% 0 0)' }}>
            Loading saved items...
          </div>
        ) : saved.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'oklch(60% 0 0)' }}>
            <Bookmark className="w-12 h-12" style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontWeight: 600 }}>No saved items yet</p>
            <p style={{ fontSize: '.85rem', marginTop: 6 }}>
              Tap the bookmark icon on any post to save it here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {saved.map(item => {
              const thread = item.threads?.[0];
              if (!thread) return null;
              const profile = thread.profiles?.[0];
              return (
                <div key={item.id} style={{
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid oklch(88% 0.01 250 / 0.15)',
                  background: 'var(--surface)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '.95rem', fontWeight: 700, margin: 0 }}>
                        {thread.title}
                      </h3>
                      {thread.body && (
                        <p style={{ fontSize: '.82rem', marginTop: 6, color: 'oklch(45% 0 0)', lineHeight: 1.5 }}>
                          {thread.body.length > 200 ? thread.body.slice(0, 200) + '...' : thread.body}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: '.75rem', color: 'oklch(55% 0 0)' }}>
                        {profile && (
                          <span>{profile.full_name || profile.username}</span>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ThumbsUp className="w-3 h-3" /> {thread.likes_count}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MessageCircle className="w-3 h-3" /> {thread.comments_count}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(item.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'oklch(60% 0 0)', padding: 4, borderRadius: 6,
                      }}
                      title="Remove from saved"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </AppLayout>
  );
}
