'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Users, MessageSquare, Bookmark, Share2,
  Settings, ChevronRight, Clock, ThumbsUp, MessageCircle,
  Plus, Search, Award, Star, ExternalLink
} from 'lucide-react'
import AppLayout, { useApp } from '@/components/AppLayout'
import { supabase } from '@/lib/supabase'
import { joinSpace, checkSpaceMember, createThread } from '@/lib/supabase-helpers'

export default function SpaceDetailPageWrapper() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>}>
      <SpaceDetailContent />
    </Suspense>
  );
}

function SpaceDetailContent() {
  const searchParams = useSearchParams()
  const spaceId = searchParams.get('id')
  const { user, showToast } = useApp()

  const [space, setSpace] = useState<any>(null)
  const [threads, setThreads] = useState<any[]>([])
  const [isMember, setIsMember] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'posts' | 'questions' | 'polls'>('posts')
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')

  useEffect(() => {
    if (!spaceId) return
    async function load() {
      const { data: spaceData } = await supabase
        .from('spaces')
        .select('*')
        .eq('id', spaceId)
        .single()
      if (spaceData) setSpace(spaceData)

      const { data: threadData } = await supabase
        .from('threads')
        .select('*, profiles:author_id(full_name, username, avatar_url, heshima, is_verified)')
        .eq('space_id', spaceId)
        .order('created_at', { ascending: false })
        .limit(20)
      if (threadData) setThreads(threadData)

      if (user) {
        const member = await checkSpaceMember(spaceId!, user.id)
        setIsMember(member)
      }
      setLoading(false)
    }
    load()
  }, [spaceId, user])

  const handleJoinLeave = async () => {
    if (!user || !spaceId) return
    const nowMember = await joinSpace(spaceId, user.id)
    setIsMember(nowMember)
    setSpace((s: any) => ({
      ...s,
      members_count: s.members_count + (nowMember ? 1 : -1)
    }))
    showToast(nowMember ? `Joined ${space.name}` : `Left ${space.name}`)
  }

  const handleCreatePost = async () => {
    if (!user || !newTitle.trim() || !spaceId) return
    const { data, error } = await createThread(user.id, newTitle, newBody, 'post', [], undefined, spaceId)
    if (data) {
      setThreads(prev => [{ ...data, profiles: { full_name: user.full_name, username: user.username, avatar_url: user.avatar_url, heshima: user.heshima, is_verified: user.is_verified } }, ...prev])
      setNewTitle('')
      setNewBody('')
      setShowCreate(false)
      showToast('Post created')
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      showToast('Link copied')
    } catch {
      showToast('Share this space')
    }
  }

  if (loading) return <AppLayout><div className="page"><div className="skeleton" style={{ height: 200 }} /></div></AppLayout>
  if (!space) return <AppLayout><div className="page"><h2>Space not found</h2></div></AppLayout>

  const tabs = [
    { key: 'posts', label: 'Posts', count: threads.filter(t => t.type === 'post').length },
    { key: 'questions', label: 'Questions', count: threads.filter(t => t.type === 'question').length },
    { key: 'polls', label: 'Polls', count: threads.filter(t => t.type === 'poll').length },
  ]

  const filteredThreads = threads.filter(t => {
    if (activeTab === 'posts') return t.type === 'post'
    if (activeTab === 'questions') return t.type === 'question'
    if (activeTab === 'polls') return t.type === 'poll'
    return true
  })

  return (
    <AppLayout>
      <div className="page">
        {/* Space Header */}
        <div style={{ marginBottom: 24 }}>
          <Link href="/spaces" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text3)', fontSize: '.8rem', textDecoration: 'none', marginBottom: 16 }}>
            <ArrowLeft size={16} /> Back to Spaces
          </Link>

          <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: space.color || 'var(--greenSoft)', display: 'grid', placeItems: 'center', fontSize: '2rem' }}>
                {space.icon || '🏠'}
              </div>
              <div>
                <h1 className="serif" style={{ fontSize: '1.8rem' }}>{space.name}</h1>
                <p style={{ color: 'var(--text3)', fontSize: '.85rem', marginTop: 4 }}>{space.description}</p>
                <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '.8rem', color: 'var(--text3)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={14} /> {space.members_count} members</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageSquare size={14} /> {threads.length} posts</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleShare} className="icon-btn" title="Share"><Share2 size={18} /></button>
              {user && (
                <button
                  onClick={handleJoinLeave}
                  className={isMember ? 'btn-outline' : 'btn-primary'}
                  style={{ minWidth: 100 }}
                >
                  {isMember ? 'Leave' : 'Join'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--line)', marginBottom: 20 }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
                fontSize: '.85rem', fontWeight: activeTab === tab.key ? 700 : 500,
                color: activeTab === tab.key ? 'var(--green)' : 'var(--text3)',
                borderBottom: activeTab === tab.key ? '2px solid var(--green)' : '2px solid transparent',
                transition: 'all .2s',
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Create Post */}
        {user && isMember && (
          <div style={{ marginBottom: 20 }}>
            {!showCreate ? (
              <button onClick={() => setShowCreate(true)} className="btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                <Plus size={16} /> Create a post
              </button>
            ) : (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: 16 }}>
                <input
                  placeholder="Post title..."
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: '.9rem', marginBottom: 8 }}
                />
                <textarea
                  placeholder="What's on your mind?"
                  value={newBody}
                  onChange={e => setNewBody(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: '.9rem', resize: 'vertical' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                  <button onClick={() => setShowCreate(false)} className="btn-outline">Cancel</button>
                  <button onClick={handleCreatePost} className="btn-primary" disabled={!newTitle.trim()}>Post</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Thread List */}
        <div style={{ display: 'grid', gap: 12 }}>
          {filteredThreads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
              <MessageSquare size={32} style={{ opacity: .3, marginBottom: 8 }} />
              <p>No posts yet. Be the first to share something!</p>
            </div>
          ) : filteredThreads.map(thread => (
            <Link
              key={thread.id}
              href={`/thread?id=${thread.id}`}
              style={{
                display: 'block', padding: 16, background: 'var(--surface)', border: '1px solid var(--line)',
                borderRadius: 14, textDecoration: 'none', color: 'var(--text)',
                transition: 'transform .2s var(--ease), box-shadow .2s var(--ease)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow2)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--greenSoft)', display: 'grid', placeItems: 'center', fontSize: '.7rem', fontWeight: 700, color: 'var(--green)' }}>
                  {thread.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                </div>
                <div>
                  <div style={{ fontSize: '.8rem', fontWeight: 600 }}>{thread.profiles?.full_name || 'Anonymous'}</div>
                  <div style={{ fontSize: '.7rem', color: 'var(--text3)' }}>@{thread.profiles?.username || 'user'}</div>
                </div>
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>{thread.title}</h3>
              {thread.body && <p style={{ fontSize: '.85rem', color: 'var(--text2)', lineHeight: 1.5 }}>{thread.body.slice(0, 200)}{thread.body.length > 200 ? '...' : ''}</p>}
              <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: '.75rem', color: 'var(--text3)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ThumbsUp size={13} /> {thread.likes_count || 0}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageCircle size={13} /> {thread.comments_count || 0}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        .icon-btn {
          display: grid; place-items: center; width: 38px; height: 38px; border-radius: 10px;
          border: 1px solid var(--line); background: var(--surface); color: var(--text2); cursor: pointer;
          transition: all .2s;
        }
        .icon-btn:hover { background: var(--surface2); color: var(--text); }
        .btn-primary {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          padding: 8px 18px; border-radius: 10px; border: 0; font-weight: 700; font-size: .85rem;
          background: var(--gold); color: var(--green2); cursor: pointer; transition: all .2s;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px oklch(73% .145 78 / .25); }
        .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
        .btn-outline {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          padding: 8px 18px; border-radius: 10px; border: 1px solid var(--line); background: var(--surface);
          color: var(--text); font-weight: 600; font-size: .85rem; cursor: pointer; transition: all .2s;
        }
        .btn-outline:hover { border-color: var(--green); color: var(--green); }
        .skeleton {
          background: linear-gradient(90deg, var(--surface) 25%, var(--surface2) 50%, var(--surface) 75%);
          background-size: 200% 100%; border-radius: 12px; animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </AppLayout>
  )
}
