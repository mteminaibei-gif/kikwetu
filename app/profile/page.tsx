'use client';

import React, { useState, useEffect } from 'react';
import AppLayout, { useApp } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import {
  getCurrentUser,
  updateProfile,
  toggleFollow,
  checkFollowing,
} from '@/lib/supabase-helpers';
import {
  Pencil,
  HeartHandshake,
  Sparkles,
  Rocket,
  Award,
  MessageCircle,
  ThumbsUp,
  Bookmark,
  MoreHorizontal,
  Settings,
  UserRound,
  Edit,
} from 'lucide-react';

const MOCK_PROFILE = {
  name: '',
  username: '',
  location: 'Nairobi',
  bio: 'I care about useful interfaces, local stories, and making complex things feel obvious.',
  heshima: '740',
  followers: '1.2k',
  questions: '18',
  badges: '4',
  initials: 'GP',
  topics: ['Product design', 'Community tech', 'UX writing', 'Startups'],
  badgeList: [
    { name: 'Neighbour', icon: HeartHandshake },
    { name: 'Useful voice', icon: Sparkles },
    { name: 'Early builder', icon: Rocket },
  ],
};

const MOCK_ACTIVITY = [
  {
    icon: MessageCircle,
    mark: 'Asked',
    copy: 'How do you design a form that feels friendly on a low-end phone?',
    time: '2 days ago',
  },
  {
    icon: ThumbsUp,
    mark: 'Answered',
    copy: 'Gave a practical answer about offline-first sync for local schools.',
    time: '4 days ago',
  },
  {
    icon: Bookmark,
    mark: 'Saved',
    copy: 'Bookmarked a post on community-led tech onboarding in Kilifi.',
    time: '1 week ago',
  },
  {
    icon: Award,
    mark: 'Earned',
    copy: 'Earned the Early Builder badge for first 10 contributions.',
    time: '2 weeks ago',
  },
];

export default function ProfilePage() {
  const { showToast, user } = useApp();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(MOCK_PROFILE);
  const [threadsCount, setThreadsCount] = useState<number | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editCounty, setEditCounty] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const user = await getCurrentUser();
        if (!user) {
          setLoading(false);
          return;
        }

        setCurrentUser(user);
        setProfileUserId(user.id);
        setIsOwnProfile(true);

        setProfile((prev) => ({
          ...prev,
          name: user.full_name || prev.name,
          username: user.username ? `@${user.username}` : prev.username,
          location: user.county || prev.location,
          bio: user.bio || prev.bio,
          heshima: String(user.heshima ?? prev.heshima),
          initials: user.full_name
            ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
            : prev.initials,
        }));

        setEditName(user.full_name || '');
        setEditBio(user.bio || '');
        setEditCounty(user.county || '');

        const { count } = await supabase
          .from('threads')
          .select('id', { count: 'exact', head: true })
          .eq('author_id', user.id);

        if (count !== null) {
          setProfile((prev) => ({ ...prev, questions: String(count) }));
        }
      } catch {
        // fallback to mock
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  async function handleSaveProfile() {
    if (!currentUser) return;
    setSaving(true);
    const { error } = await updateProfile(currentUser.user_id, {
      full_name: editName,
      bio: editBio,
      county: editCounty,
    });
    setSaving(false);
    if (!error) {
      setProfile((prev) => ({
        ...prev,
        name: editName,
        bio: editBio,
        location: editCounty,
        initials: editName
          ? editName.split(' ').map((n: string) => n[0]).join('').toUpperCase()
          : prev.initials,
      }));
      setEditMode(false);
      showToast('Profile updated');
    } else {
      showToast('Failed to update profile');
    }
  }

  async function handleFollow() {
    if (!currentUser || !profileUserId) return;
    const result = await toggleFollow(currentUser.id, profileUserId);
    setIsFollowing(result);
    showToast(result ? 'Following' : 'Unfollowed');
  }

  if (loading) {
    return (
      <AppLayout showRightSidebar={false}>
        <div className="page-head">
          <div>
            <span className="eyebrow">Profile</span>
            <h1 className="serif">Your contribution has a home.</h1>
          </div>
        </div>
        <div className="profile-card" style={{ opacity: 0.5 }}>
          <div className="profile-top">
            <div className="avatar lg">...</div>
            <div><h2>Loading...</h2><p>Please wait</p></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showRightSidebar={false}>
      <div className="page-head">
        <div>
          <span className="eyebrow">Profile</span>
          <h1 className="serif">Your contribution has a home.</h1>
        </div>
        {isOwnProfile ? (
          <button
            className="secondary"
            onClick={() => setEditMode(!editMode)}
          >
            <Edit className="icon-sm" />
            {editMode ? 'Cancel' : 'Edit profile'}
          </button>
        ) : (
          <button
            className={isFollowing ? 'secondary' : 'primary'}
            onClick={handleFollow}
          >
            {isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        )}
      </div>

      <div className="profile-card">
        {editMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: '.75rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Full name</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '.75rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Bio</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--text)', resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '.75rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>County</label>
              <input
                value={editCounty}
                onChange={(e) => setEditCounty(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--text)' }}
              />
            </div>
            <button
              className="primary"
              onClick={handleSaveProfile}
              disabled={saving}
              style={{ alignSelf: 'flex-start' }}
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        ) : (
          <>
            <div className="profile-top">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={profile.name} style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--line)' }} />
              ) : (
                <div className="avatar lg">{profile.initials}</div>
              )}
              <div>
                <h2>
                  {profile.name}{' '}
                  <span
                    className="verified"
                    style={{ display: 'inline-flex', verticalAlign: 'middle', marginLeft: 6 }}
                  >
                    ✓
                  </span>
                </h2>
                <p>{profile.username} · {profile.location}</p>
              </div>
            </div>

            <p className="profile-bio">
              {profile.bio}
            </p>
          </>
        )}

        <div className="profile-stats">
          <div className="profile-stat">
            <strong>{profile.heshima}</strong>
            <span>Heshima</span>
          </div>
          <div className="profile-stat">
            <strong>{profile.followers}</strong>
            <span>Followers</span>
          </div>
          <div className="profile-stat">
            <strong>{profile.questions}</strong>
            <span>Questions</span>
          </div>
          <div className="profile-stat">
            <strong>{profile.badges}</strong>
            <span>Badges</span>
          </div>
        </div>
      </div>

      <div className="grid2" style={{ marginTop: 14 }}>
        <div className="section">
          <div className="section-head">
            <div>
              <span className="eyebrow">Learning signal</span>
              <h2 className="serif">Topics you care about</h2>
            </div>
            <button className="icon-btn" onClick={() => showToast('Edit topics')}>
              <Pencil className="icon-sm" />
            </button>
          </div>
          <div className="tags">
            {profile.topics.map((t) => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section-head">
            <div>
              <span className="eyebrow">Heshima shelf</span>
              <h2 className="serif">Badges earned</h2>
            </div>
          </div>
          <div className="badge-row">
            {profile.badgeList.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.name} className="badge">
                  <div className="badge-icon">
                    <Icon className="icon" />
                  </div>
                  {b.name}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="section" style={{ marginTop: 14 }}>
        <div className="section-head">
          <div>
            <span className="eyebrow">Recent</span>
            <h2 className="serif">Activity</h2>
          </div>
        </div>

        {MOCK_ACTIVITY.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="activity">
              <div className="activity-mark">
                <Icon className="icon-sm" />
              </div>
              <div className="activity-copy">
                <strong>{item.mark}</strong>
                <p>{item.copy}</p>
                <span>{item.time}</span>
              </div>
              <button className="icon-btn" style={{ flex: 'none' }}>
                <MoreHorizontal className="icon-sm" />
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        .activity {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 0;
          border-top: 1px solid var(--line);
        }
        .activity:first-child { border-top: 0; }
        .activity-mark {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          color: var(--green);
          background: var(--greenSoft);
          flex: none;
        }
        .activity:nth-child(2) .activity-mark { color: var(--earth); background: var(--earthSoft); }
        .activity:nth-child(3) .activity-mark { color: var(--blue); background: var(--blueSoft); }
        .activity:nth-child(4) .activity-mark { color: var(--gold); background: var(--goldSoft); }
        .activity-copy {
          min-width: 0;
          flex: 1;
        }
        .activity-copy strong {
          display: block;
          font-size: .79rem;
        }
        .activity-copy p {
          margin-top: 3px;
          color: var(--text2);
          font-size: .82rem;
        }
        .activity-copy span {
          display: block;
          margin-top: 4px;
          color: var(--text3);
          font-size: .66rem;
        }
      `}</style>
    </AppLayout>
  );
}
