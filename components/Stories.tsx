'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import {
  fetchActiveStories, createStory, viewStory, getStoryViewCount,
  deleteStory, uploadStoryMedia, Story,
} from '@/lib/supabase-helpers';
import {
  Plus, X, Camera, Video, Upload, ChevronLeft, ChevronRight,
  Trash2, Eye, Clock, Image as ImageIcon,
} from 'lucide-react';

const MAX_VIDEO_SECONDS = 15;

function StoriesRow() {
  const { user, showToast } = useApp();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadStories = useCallback(async () => {
    const { data, error } = await fetchActiveStories();
    if (data) {
      const enriched = await Promise.all(
        data.map(async (s) => {
          const viewCount = await getStoryViewCount(s.id);
          let viewed = false;
          if (user) {
            const { data: existingView } = await supabase
              .from('story_views')
              .select('id')
              .eq('story_id', s.id)
              .eq('viewer_id', user.id)
              .single();
            viewed = !!existingView;
          }
          return { ...s, view_count: viewCount, has_viewed: viewed };
        })
      );
      setStories(enriched);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadStories();

    const channel = supabase
      .channel('stories-feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'stories',
      }, () => { void loadStories(); })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'stories',
      }, () => { void loadStories(); })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [loadStories]);

  const openStory = async (index: number) => {
    const story = stories[index];
    if (!story) return;
    setViewerIndex(index);
    setViewerOpen(true);
    if (user && !story.has_viewed) {
      await viewStory(story.id, user.id);
      setStories(prev => prev.map((s, i) => i === index ? { ...s, has_viewed: true, view_count: (s.view_count || 0) + 1 } : s));
    }
  };

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = dir === 'left' ? -200 : 200;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <>
      <div style={{ position: 'relative' }}>
      <div className="stories-row" ref={scrollRef}>
        {user && (
          <button type="button" className="story-item" onClick={() => { if (user) setUploadOpen(true); else showToast('Please sign in to share an idea'); }}>
            <span className="story-avatar-ring is-you">
              <span className="story-avatar-initials">+</span>
            </span>
            <span className="story-label">New idea</span>
          </button>
        )}
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface2)', animation: 'pulse 1.5s infinite' }} />
              <div style={{ width: 50, height: 6, borderRadius: 99, background: 'var(--surface2)', marginTop: 6, animation: 'pulse 1.5s infinite' }} />
            </div>
          ))
        ) : stories.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, opacity: .6 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface2)' }} />
            <span style={{ fontSize: '.6rem', color: 'var(--text3)', marginTop: 6, maxWidth: 64, textAlign: 'center' }}>No ideas yet</span>
          </div>
        ) : stories.map((story, i) => {
          const profile = story.profiles;
          const initials = profile?.full_name
            ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
            : '??';
          const hasMedia = !!story.media_url;
          return (
            <button
              type="button"
              key={story.id}
              className="story-item"
              onClick={() => openStory(i)}
            >
              <span className="story-avatar-ring">
                {hasMedia && story.media_type === 'image' ? (
                  <img
                    src={story.media_url}
                    alt=""
                    className="story-avatar"
                    style={{ borderRadius: '50%' }}
                  />
                ) : hasMedia && story.media_type === 'video' ? (
                  <video
                    src={story.media_url}
                    muted
                    className="story-avatar"
                    style={{ borderRadius: '50%' }}
                  />
                ) : (
                  <span className="story-avatar-initials">{initials}</span>
                )}
              </span>
              <span className="story-label">
                {profile?.full_name?.split(' ')[0] || 'Unknown'}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          className="icon-btn"
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 2, background: 'var(--surface)', borderRadius: '50%', width: 28, height: 28, display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow1)' }}
        >
          <ChevronLeft className="icon-sm" />
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 2, background: 'var(--surface)', borderRadius: '50%', width: 28, height: 28, display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow1)' }}
        >
          <ChevronRight className="icon-sm" />
        </button>
      </div>
      </div>

      {uploadOpen && (
        <StoryUpload
          onClose={() => setUploadOpen(false)}
          onCreated={() => { setUploadOpen(false); void loadStories(); }}
        />
      )}

      {viewerOpen && stories.length > 0 && (
        <StoryViewer
          stories={stories}
          currentIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
          onNavigate={setViewerIndex}
          user={user}
        />
      )}
    </>
  );
}

function StoryUpload({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { user, showToast } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError('');

    const isImage = f.type.startsWith('image/');
    const isVideo = f.type.startsWith('video/');

    if (!isImage && !isVideo) {
      setError('Please select an image or video file');
      return;
    }

    if (isVideo && f.size > 50 * 1024 * 1024) {
      setError('Video must be under 50MB');
      return;
    }

    if (isImage && f.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB');
      return;
    }

    setFile(f);
    setMediaType(isVideo ? 'video' : 'image');

    const url = URL.createObjectURL(f);
    setPreview(url);

    if (isVideo) {
      const video = document.createElement('video');
      video.src = url;
      video.onloadedmetadata = () => {
        const dur = video.duration;
        setVideoDuration(dur);
        if (dur > MAX_VIDEO_SECONDS) {
          setError(`Video must be under ${MAX_VIDEO_SECONDS} seconds (yours is ${Math.round(dur)}s)`);
          setFile(null);
          setPreview('');
        }
      };
    }
  };

  const handleSubmit = async () => {
    if (!file || !user) return;
    if (mediaType === 'video' && videoDuration > MAX_VIDEO_SECONDS) {
      setError(`Video must be under ${MAX_VIDEO_SECONDS} seconds`);
      return;
    }
    setUploading(true);
    try {
      const { url, error: uploadError } = await uploadStoryMedia(file, user.id);
      if (uploadError || !url) {
        setError(uploadError || 'Upload failed');
        setUploading(false);
        return;
      }
      const { error: createError } = await createStory(
        user.id,
        url,
        mediaType,
        caption,
        mediaType === 'video' ? videoDuration : undefined
      );
      if (createError) {
        setError(createError.message || 'Failed to create story');
        setUploading(false);
        return;
      }
      showToast('New idea shared!');
      onCreated();
    } catch {
      setError('Upload failed. Please try again.');
      setUploading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
    }} onClick={onClose}>
      <div
        style={{
          background: 'var(--surface)', borderRadius: 20, padding: 24, width: '92%', maxWidth: 440,
          maxHeight: '85vh', overflow: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 className="serif" style={{ margin: 0, fontSize: '1.15rem' }}>Share a new idea</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text3)', fontSize: '.75rem' }}>
              Photo or video (max {MAX_VIDEO_SECONDS}s)
            </p>
          </div>
          <button type="button" onClick={onClose} className="icon-btn"><X className="icon" /></button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {!preview ? (
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: '2px dashed var(--line)', borderRadius: 16, padding: '40px 20px',
              textAlign: 'center', cursor: 'pointer', transition: 'border-color .2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ display: 'grid', placeItems: 'center', width: 48, height: 48, borderRadius: 14, background: 'var(--greenSoft)' }}>
                <Camera className="icon" style={{ color: 'var(--green)' }} />
              </div>
              <div style={{ display: 'grid', placeItems: 'center', width: 48, height: 48, borderRadius: 14, background: 'var(--blueSoft)' }}>
                <Video className="icon" style={{ color: 'var(--blue)' }} />
              </div>
            </div>
            <p style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--text2)' }}>Tap to choose a photo or video</p>
            <p style={{ fontSize: '.7rem', color: 'var(--text3)', marginTop: 4 }}>Images up to 10MB, videos up to {MAX_VIDEO_SECONDS}s</p>
          </div>
        ) : (
          <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
            {mediaType === 'image' ? (
              <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: 300, objectFit: 'cover', display: 'block' }} />
            ) : (
              <div>
                <video
                  ref={videoRef}
                  src={preview}
                  controls
                  style={{ width: '100%', maxHeight: 300, objectFit: 'cover', display: 'block', borderRadius: 14 }}
                />
                <div style={{
                  position: 'absolute', top: 8, right: 8, display: 'flex', alignItems: 'center', gap: 4,
                  padding: '3px 8px', borderRadius: 99, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '.65rem',
                }}>
                  <Clock className="icon-sm" style={{ width: 12, height: 12 }} />
                  {Math.round(videoDuration)}s / {MAX_VIDEO_SECONDS}s
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => { setFile(null); setPreview(''); setVideoDuration(0); setError(''); }}
              style={{
                position: 'absolute', top: 8, left: 8, display: 'grid', placeItems: 'center',
                width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.5)',
                color: '#fff', border: 0, cursor: 'pointer',
              }}
            >
              <X className="icon-sm" />
            </button>
          </div>
        )}

        {preview && (
          <input
            placeholder="Add a caption..."
            value={caption}
            onChange={e => setCaption(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line)',
              background: 'var(--bg)', color: 'var(--text)', fontSize: '.82rem', marginBottom: 14,
              boxSizing: 'border-box',
            }}
          />
        )}

        {error && (
          <div style={{ padding: 10, marginBottom: 12, borderRadius: 10, background: 'var(--redSoft)', color: 'var(--red)', fontSize: '.78rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="primary"
            onClick={() => void handleSubmit()}
            disabled={!file || uploading || !!error}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Upload className="icon-sm" />
            {uploading ? 'Sharing...' : 'Share idea'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StoryViewer({
  stories,
  currentIndex,
  onClose,
  onNavigate,
  user,
}: {
  stories: Story[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  user: { id: string } | null;
}) {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const story = stories[currentIndex];

  const storyDuration = story?.media_type === 'video'
    ? Math.min(story.media_duration_seconds || MAX_VIDEO_SECONDS, MAX_VIDEO_SECONDS) * 1000
    : 5000;

  const startProgress = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const interval = 50;
    const increment = (interval / storyDuration) * 100;
    setProgress(0);

    const tick = () => {
      setProgress(prev => {
        const next = prev + increment;
        if (next >= 100) {
          if (currentIndex < stories.length - 1) {
            onNavigate(currentIndex + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return next;
      });
    };
    timerRef.current = setInterval(tick, interval);
  }, [storyDuration, currentIndex, stories.length, onNavigate, onClose]);

  useEffect(() => {
    setProgress(0);
    if (!isPaused) startProgress();
    return () => { if (timerRef.current) clearInterval(timerRef.current as any); };
  }, [currentIndex, isPaused, startProgress]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < stories.length - 1) onNavigate(currentIndex + 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, stories.length, onClose, onNavigate]);

  if (!story) return null;

  const initials = story.profiles?.full_name
    ? story.profiles.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const handleTouchStart = (e: React.TouchEvent) => {
    const x = e.touches[0].clientX;
    const w = window.innerWidth;
    if (x < w / 3 && currentIndex > 0) onNavigate(currentIndex - 1);
    else if (x > (w * 2) / 3 && currentIndex < stories.length - 1) onNavigate(currentIndex + 1);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1100, background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={() => setShowUI(prev => !prev)}
      onTouchStart={handleTouchStart}
    >
      {/* Progress bars */}
      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', gap: 4, zIndex: 10 }}>
        {stories.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.3)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2, background: '#fff',
              width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
              transition: 'width 0.05s linear',
            }} />
          </div>
        ))}
      </div>

      {/* Header */}
      {showUI && (
        <div style={{
          position: 'absolute', top: 22, left: 12, right: 12, display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="avatar sm" style={{ width: 32, height: 32, fontSize: '.6rem', color: 'var(--green2)', background: 'var(--goldSoft)' }}>
              {initials}
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: '.78rem', fontWeight: 700 }}>
                {story.profiles?.full_name || 'Unknown'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '.6rem' }}>
                {new Date(story.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.7)', fontSize: '.65rem' }}>
              <Eye className="icon-sm" style={{ width: 14, height: 14 }} /> {story.view_count || 0}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              style={{ background: 'rgba(0,0,0,0.4)', border: 0, borderRadius: '50%', width: 32, height: 32, display: 'grid', placeItems: 'center', cursor: 'pointer', color: '#fff' }}
            >
              <X className="icon-sm" />
            </button>
          </div>
        </div>
      )}

      {/* Media */}
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {story.media_type === 'image' ? (
          <img
            src={story.media_url}
            alt={story.caption || ''}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <video
            src={story.media_url}
            autoPlay
            loop={false}
            muted={false}
            controls={false}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onClick={(e) => { e.stopPropagation(); setIsPaused(p => !p); }}
            onEnded={() => {
              if (currentIndex < stories.length - 1) onNavigate(currentIndex + 1);
              else onClose();
            }}
          />
        )}
      </div>

      {/* Caption */}
      {showUI && story.caption && (
        <div style={{
          position: 'absolute', bottom: 40, left: 12, right: 12, zIndex: 10,
          padding: '10px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)', color: '#fff', fontSize: '.8rem',
        }}>
          {story.caption}
        </div>
      )}

      {/* Navigation arrows (desktop) */}
      {showUI && currentIndex > 0 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
          style={{
            position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,0.4)', border: 0, borderRadius: '50%', width: 40, height: 40,
            display: 'grid', placeItems: 'center', cursor: 'pointer', color: '#fff', zIndex: 10,
          }}
        >
          <ChevronLeft className="icon" />
        </button>
      )}
      {showUI && currentIndex < stories.length - 1 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
          style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,0.4)', border: 0, borderRadius: '50%', width: 40, height: 40,
            display: 'grid', placeItems: 'center', cursor: 'pointer', color: '#fff', zIndex: 10,
          }}
        >
          <ChevronRight className="icon" />
        </button>
      )}
    </div>
  );
}

export { StoriesRow };
