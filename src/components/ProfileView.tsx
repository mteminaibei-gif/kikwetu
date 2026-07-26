'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import { timeAgo, formatNumber, getInitials, heshimaLevel } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { useLanguage } from '@/context/LanguageContext';
import ImageCropper from '@/components/ImageCropper';
import Icon from '@/components/Icon';
import type { Profile, Thread } from '@/types';

interface Props { profileId: string; }

const mockBadges = [
  { name: 'Neighbour', icon: 'thumbs-up' },
  { name: 'Useful voice', icon: 'message-circle' },
  { name: 'Early builder', icon: 'layers-3' },
];

export default function ProfileView({ profileId }: Props) {
  const { user: currentUser } = useAuth();
  const { tr } = useLanguage();
  const { show } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ full_name: '', bio: '', county: '', interests: '' as string, phone: '', username: '', website: '' });
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  const sbRef = useRef<ReturnType<typeof createClient> | null>(null);
  if (typeof window !== 'undefined' && !sbRef.current) {
    sbRef.current = createClient();
  }
  const sb = sbRef.current as NonNullable<ReturnType<typeof createClient>>;

  const load = useCallback(async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        sb.from('profiles').select('*').eq('id', profileId).single(),
        sb.from('threads').select('*, space:spaces(name)').eq('author_id', profileId).order('created_at', { ascending: false }).limit(30),
      ]);
      if (pRes.data) {
        setProfile(pRes.data as Profile);
        setIsOwnProfile(currentUser?.id === profileId);
        setEditData({
          full_name: pRes.data.full_name || '',
          bio: pRes.data.bio || '',
          county: pRes.data.county || '',
          interests: (pRes.data.interests || []).join(', '),
          phone: pRes.data.phone || '',
          username: pRes.data.username || '',
          website: pRes.data.website || '',
        });
      }
      if (tRes.data) setThreads(tRes.data as Thread[]);
    } catch (e) { console.error('[ProfileView]', e); }
    setLoading(false);
  }, [profileId, currentUser?.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (currentUser && currentUser.id !== profileId) {
      (async () => {
        try {
          const { data } = await sb.from('follows').select('id').eq('follower_id', currentUser.id).eq('following_id', profileId).maybeSingle();
          setFollowing(!!data);
        } catch { setFollowing(false); }
      })();
    }
  }, [profileId, currentUser]);

  const handleFollow = async () => {
    if (!currentUser || !profile) return;
    if (following) {
      await sb.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', profileId);
      setFollowing(false);
      show('Unfollowed');
    } else {
      await sb.from('follows').insert({ follower_id: currentUser.id, following_id: profileId });
      setFollowing(true);
      show('Now following');
    }
  };

  const handleSave = async () => {
    if (!currentUser || !profile) return;
    setSaving(true);
    try {
      const updates: Partial<Profile> = {
        full_name: editData.full_name, bio: editData.bio, county: editData.county,
        interests: editData.interests.split(',').map(s => s.trim()).filter(Boolean),
        phone: editData.phone,
      };
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const fname = `${currentUser.id}-${Date.now()}.${ext}`;
        const { error: upErr } = await sb.storage.from('avatars').upload(fname, avatarFile, { upsert: true });
        if (!upErr) {
          const { data: { publicUrl } } = sb.storage.from('avatars').getPublicUrl(fname);
          updates.avatar_url = publicUrl;
        }
      }
      const { error } = await sb.from('profiles').update(updates).eq('id', profileId);
      if (error) { show(error.message); return; }
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      setEditing(false); setAvatarFile(null); setAvatarPreview(null);
      show('Profile updated');
    } catch (e: unknown) { show(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { show('Image must be under 5MB'); return; }
    if (!file.type.startsWith('image/')) { show('Please select an image'); return; }
    setCropFile(file);
  };

  const handleCropDone = (blob: Blob) => {
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(blob));
    setCropFile(null);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'posts', label: 'Posts', count: threads.length },
    { id: 'answers', label: 'Answers', count: profile?.answer_count || 0 },
    { id: 'saved', label: 'Saved', count: 0 },
    { id: 'badges', label: 'Badges', count: mockBadges.length },
  ];

  const stats = [
    { label: 'Heshima rating', value: formatNumber(profile?.heshima_score || 0) },
    { label: 'followers', value: formatNumber(profile?.follower_count || 0) },
    { label: 'following', value: formatNumber(profile?.following_count || 0) },
    { label: 'conversations', value: profile?.post_count || 0 },
  ];

  if (loading) return <LoadingSpinner />;
  if (!profile) return <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-3)' }}>{tr('User not found.', 'Mtumiwa haikupatikana.')}</div>;

  const avatarContent = avatarPreview ? (
    <img src={avatarPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
  ) : profile.avatar_url ? (
    <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
  ) : getInitials(profile.full_name);

  return (
    <div className="page">
      {cropFile && <ImageCropper file={cropFile} onCrop={handleCropDone} onCancel={() => setCropFile(null)} />}

      <section className="profile-hero">
        <div className="cover-photo">
          <span className="cover-label">{profile.county || 'Kenya'} &middot; {profile.bio?.slice(0, 30) || 'building in public'}</span>
        </div>

        <div className="hero-body">
          <div className="hero-avatar avatar lg">
            {avatarContent}
            {isOwnProfile && (
              <label style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: 'var(--color-green)', color: 'var(--color-surface)', display: 'grid', placeItems: 'center', cursor: 'pointer', border: '3px solid var(--color-surface)', fontSize: '.6rem', fontWeight: 800 }}>
                <input type="file" accept="image/*" onChange={handleAvatarSelect} style={{ display: 'none' }} />
                <Icon name="plus" />
              </label>
            )}
          </div>

          <div className="hero-top-actions">
            <button className="hero-btn"><Icon name="send" className="icon-sm" />Share</button>
            {currentUser && !isOwnProfile && (
              <button onClick={handleFollow} className={`hero-btn ${following ? '' : 'primary'}`}>
                {following ? 'Following' : 'Follow'}
              </button>
            )}
            {isOwnProfile && (
              <button onClick={() => setEditing(!editing)} className="hero-btn primary">
                <Icon name="settings-2" className="icon-sm" />{editing ? 'Cancel' : 'Edit profile'}
              </button>
            )}
          </div>

          <h1 className="profile-name-text serif">{profile.full_name} {profile.verified && <span className="verified">&#10003;</span>}</h1>
          <div className="handle-text">@{profile.username || 'user'} &middot; {profile.county || 'Kenya'}</div>
          {profile.bio && <p className="bio-text">{profile.bio}</p>}

          <div className="profile-meta">
            <span><Icon name="calendar-days" className="icon-sm" />Joined {new Date(profile.created_at).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}</span>
            <span><Icon name="map-pin" className="icon-sm" />{profile.county || 'Nairobi'}</span>
          </div>

          <div className="profile-stats-grid">
            {stats.map(s => (
              <div key={s.label} className="profile-stat-box">
                <strong className="mono">{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <nav className="profile-tabs" aria-label="Profile sections">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`profile-tab ${activeTab === t.id ? 'active' : ''}`}>
              {t.label} {t.count !== undefined && <span className="mono"> {t.count}</span>}
            </button>
          ))}
        </nav>
      </section>

      {isOwnProfile && editing && (
        <section className={`edit-panel ${editing ? 'open' : ''}`}>
          <div className="section-head">
            <div>
              <div className="eyebrow">Profile editor</div>
              <h2 className="serif">Make your profile useful.</h2>
            </div>
          </div>
          <div className="edit-grid">
            <div className="field">
              <label>{tr('Full Name', 'Jina Kamili')}</label>
              <input value={editData.full_name} onChange={e => setEditData(d => ({ ...d, full_name: e.target.value }))} />
            </div>
            <div className="field">
              <label>{tr('County', 'Kaunti')}</label>
              <select value={editData.county} onChange={e => setEditData(d => ({ ...d, county: e.target.value }))}>
                <option value="">Select county</option>
                {['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Trans-Nzoia', 'Uasin Gishu', 'Kiambu', 'Kilifi', 'Meru', 'Nyeri', 'Machakos', 'Kajiado', 'Bungoma', 'Kakamega', 'Siaya', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira', 'Kericho'].map(c => <option key={c} value={c}>{c} County</option>)}
              </select>
            </div>
            <div className="field">
              <label>{tr('Username', 'Jina la mtumiaji')}</label>
              <input value={editData.username} onChange={e => setEditData(d => ({ ...d, username: e.target.value }))} />
            </div>
            <div className="field">
              <label>Website</label>
              <input value={editData.website} onChange={e => setEditData(d => ({ ...d, website: e.target.value }))} />
            </div>
            <div className="field full">
              <label>{tr('Bio', 'Wasifu')}</label>
              <textarea value={editData.bio} onChange={e => setEditData(d => ({ ...d, bio: e.target.value }))} rows={3} />
            </div>
            <div className="field full">
              <label>{tr('Interests (comma separated)', 'Vipendee (kutengwa na koma)')}</label>
              <input value={editData.interests} onChange={e => setEditData(d => ({ ...d, interests: e.target.value }))} placeholder={tr('e.g. farming, tech, storytelling', 'mf. kilimo, teknolojia, hadithi')} />
            </div>
          </div>
          <div className="edit-footer">
            <button className="secondary" onClick={() => { setEditing(false); setAvatarFile(null); setAvatarPreview(null); }}>{tr('Cancel', 'Ghairi')}</button>
            <button className="primary" onClick={handleSave} disabled={saving}>
              {saving ? tr('Saving...', 'Inahifadhi...') : tr('Save changes', 'Hifadhi')}
            </button>
          </div>
        </section>
      )}

      {activeTab === 'overview' && (
        <div className="content-grid">
          <section className="section-card">
            <div className="section-head">
              <div>
                <div className="eyebrow">{tr('Your signal', 'Ishara yako')}</div>
                <h2 className="serif">{tr('What you are known for.', 'Unachojulikana nacho.')}</h2>
              </div>
            </div>
            <div className="skill-list-tags">
              {(profile.interests?.length ? profile.interests : ['Product design', 'Community tech', 'UX writing']).map((s: string) => (
                <span key={s} className="skill-tag">{s}</span>
              ))}
            </div>
            <div className="progress-block">
              <div className="progress-label"><span>{tr('Profile strength', 'Nguvu ya wasifu')}</span><strong className="mono">78%</strong></div>
              <div className="progress-track"><div className="progress-fill" style={{ width: '78%' }}></div></div>
            </div>
          </section>

          <section className="section-card">
            <div className="section-head">
              <div>
                <div className="eyebrow">{tr('Heshima shelf', 'Rafu ya Heshima')}</div>
                <h2 className="serif">{tr('Badges with a story.', 'Alama zenye hadithi.')}</h2>
              </div>
            </div>
            <div className="badge-row">
              {mockBadges.map(b => (
                <div key={b.name} className="badge-item">
                  <span className="badge-icon"><Icon name={b.icon} className="icon-sm" /></span>
                  <span>{b.name}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="section-card wide">
            <div className="section-head">
              <div>
                <div className="eyebrow">{tr('Recent activity', 'Shughuli za hivi karibuni')}</div>
                <h2 className="serif">{tr('Useful things you have done.', 'Mambo muhimu uliyofanya.')}</h2>
              </div>
            </div>
            <div className="activity-list">
              {threads.length === 0 ? (
                <p style={{ color: 'var(--color-text-3)', fontSize: '.78rem', textAlign: 'center', padding: '20px 0' }}>{tr('No activity yet.', 'Hakuna shughuli bado.')}</p>
              ) : (
                threads.slice(0, 5).map(t => (
                  <Link key={t.id} href={`/thread/${t.id}`} className="activity-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="activity-mark"><Icon name="message-circle" className="icon-sm" /></div>
                    <div className="activity-copy">
                      <strong>{t.title}</strong>
                      <p>{t.content}</p>
                      <span>{timeAgo(t.created_at)} &middot; {t.reply_count || 0} replies</span>
                    </div>
                    <Icon name="ellipsis" className="icon-sm" style={{ color: 'var(--color-text-3)' }} />
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="section-card">
            <div className="section-head">
              <div>
                <div className="eyebrow">{tr('Wallet', 'Kikoba')}</div>
                <h2 className="serif">{tr('Your contribution has weight.', 'Mchango wako una uzito.')}</h2>
              </div>
            </div>
            <div className="wallet-hero-card">
              <small>{tr('Available tokens', 'Hesabu zilizopo')}</small>
              <strong className="mono">{formatNumber(profile.heshima_score * 2 || 1280)}</strong>
              <div className="wallet-actions-row">
                <button>{tr('Send tokens', 'Tuma hesabu')}</button>
                <button>{tr('How to earn', 'Jinsi ya kupata')}</button>
              </div>
            </div>
            <div className="wallet-grid-2" style={{ marginTop: 12 }}>
              <div className="wallet-stat-box">
                <strong className="mono">+{formatNumber(Math.floor((profile.heshima_score || 0) * 0.15))}</strong>
                <span>{tr('earned this month', 'umepata mwezi huu')}</span>
              </div>
              <div className="wallet-stat-box">
                <strong className="mono">{profile.follower_count || 0}</strong>
                <span>{tr('people you help', 'watu unaowasaidia')}</span>
              </div>
            </div>
          </section>

          <section className="section-card">
            <div className="section-head">
              <div>
                <div className="eyebrow">{tr('Pinned note', 'Ujumbe uliobandikwa')}</div>
                <h2 className="serif">{tr('A little context.', 'Maelezo kidogo.')}</h2>
              </div>
            </div>
            <p style={{ color: 'var(--color-text-2)', fontSize: '.82rem', fontStyle: 'italic' }}>{profile.bio || tr('No bio yet.', 'Hakuna wasifu bado.')}</p>
            <div className="skill-list-tags" style={{ marginTop: 13 }}>
              <span className="skill-tag">English</span>
              <span className="skill-tag">Kiswahili</span>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'posts' && (
        <div className="content-grid" style={{ gridTemplateColumns: '1fr' }}>
          <section className="section-card wide">
            <div className="section-head">
              <div>
                <div className="eyebrow">{tr('Posts', 'Machapisho')}</div>
                <h2 className="serif">{tr('Conversations started.', 'Mazungumzo yaliyoanzishwa.')}</h2>
              </div>
            </div>
            {threads.length === 0 ? (
              <div className="empty-state" style={{ marginTop: 15 }}>
                <div className="empty-icon"><Icon name="message-circle" className="icon-lg" /></div>
                <h3>{tr('Hakuna machapisho bado.', 'No posts yet.')}</h3>
                <p>{tr('Kuwa wa kwanza kushiriki!', 'Be the first to share!')}</p>
                {isOwnProfile && <Link href="/feed?create=true" className="primary" style={{ marginTop: 14, textDecoration: 'none' }}>{tr('Create Post', 'Andika Chapisho')}</Link>}
              </div>
            ) : (
              <div className="activity-list">
                {threads.map(t => (
                  <Link key={t.id} href={`/thread/${t.id}`} className="activity-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="activity-mark"><Icon name="message-circle" className="icon-sm" /></div>
                    <div className="activity-copy">
                      <strong>{t.title}</strong>
                      <p>{t.content}</p>
                      <span>{timeAgo(t.created_at)} &middot; {t.upvotes_count || 0} votes &middot; {t.reply_count || 0} replies</span>
                    </div>
                    <Icon name="arrow-up-right" className="icon-sm" style={{ color: 'var(--color-text-3)' }} />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {(activeTab === 'answers' || activeTab === 'saved' || activeTab === 'badges') && (
        <div className="content-grid" style={{ gridTemplateColumns: '1fr' }}>
          <section className="section-card wide">
            <div className="empty-state" style={{ marginTop: 15 }}>
              <div className="empty-icon"><Icon name="layers-3" className="icon-lg" /></div>
              <h3>{tr('Coming soon', 'Inakuja hivi karibuni')}</h3>
              <p>{tr('This section is being built.', 'Sehemu hii inaundwa.')}</p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
