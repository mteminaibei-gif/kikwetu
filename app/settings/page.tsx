'use client'

import { useState, useEffect, useRef } from 'react'
import AppLayout, { useApp } from '@/components/AppLayout'
import { getCurrentUser, updateProfile } from '@/lib/supabase-helpers'
import { supabase } from '@/lib/supabase'
import {
  Settings, User, Bell, Shield, CreditCard, Globe, Moon, Sun,
  Smartphone, Download, Trash2, ChevronRight, Eye, EyeOff,
  Lock, Mail, MapPin, CheckCircle, Camera, Loader2
} from 'lucide-react'

export default function SettingsPage() {
  const { theme, toggleTheme, showToast, setUser } = useApp()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState({
    name: '',
    username: '',
    county: '',
    bio: '',
    language: 'en',
    avatar: ''
  })

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false
  })

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    messagePermissions: 'everyone',
    onlineStatus: true
  })

  const [payments, setPayments] = useState({
    mpesaNumber: '',
    tipPreferences: 'enabled',
    showTransactionHistory: true
  })

  const [sync, setSync] = useState({
    autoSync: true,
    wifiOnly: true
  })

  useEffect(() => {
    async function init() {
      const user = await getCurrentUser()
      if (user) {
        setCurrentUser(user)
        setProfile({
          name: user.full_name || '',
          username: user.username ? `@${user.username}` : '',
          county: user.county || '',
          bio: user.bio || '',
          language: user.language || 'en',
          avatar: user.avatar_url || ''
        })
        setPayments(p => ({ ...p, mpesaNumber: (user as any).mpesa_number || '' }))
      }
      const savedNotif = localStorage.getItem('kikwetu_notifications')
      if (savedNotif) setNotifications(JSON.parse(savedNotif))
      const savedPrivacy = localStorage.getItem('kikwetu_privacy')
      if (savedPrivacy) setPrivacy(JSON.parse(savedPrivacy))
      const savedPayments = localStorage.getItem('kikwetu_payments')
      if (savedPayments) setPayments(p => ({ ...p, ...JSON.parse(savedPayments) }))
    }
    init()
  }, [])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser) return

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      showToast('Image must be under 5MB');
      return;
    }

    setAvatarUploading(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const filePath = `${currentUser.user_id}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const publicUrl = urlData.publicUrl
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', currentUser.user_id)
      if (updateError) throw updateError
      setProfile(p => ({ ...p, avatar: publicUrl }))
      if (currentUser) {
        setUser({ ...currentUser, avatar_url: publicUrl });
      }
      showToast('Avatar updated')
    } catch {
      showToast('Upload failed')
    } finally {
      setAvatarUploading(false)
    }
  }

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const togglePrivacy = (key: keyof typeof privacy) => {
    setPrivacy(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleSync = (key: keyof typeof sync) => {
    setSync(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSaveAll() {
    setSaving(true)
    setSaveSuccess(false)
    try {
      if (currentUser) {
        const { error } = await updateProfile(currentUser.id, {
          full_name: profile.name,
          username: profile.username.replace('@', ''),
          bio: profile.bio,
          county: profile.county,
          language: profile.language,
          mpesa_number: payments.mpesaNumber,
        })
        if (error) throw error
      }
      localStorage.setItem('kikwetu_notifications', JSON.stringify(notifications))
      localStorage.setItem('kikwetu_privacy', JSON.stringify(privacy))
      localStorage.setItem('kikwetu_payments', JSON.stringify(payments))
      setSaveSuccess(true)
      showToast('Settings saved successfully')
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch {
      showToast('Failed to save settings. Try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveProfile() {
    setSaving(true)
    try {
      if (currentUser) {
        const { error } = await updateProfile(currentUser.id, {
          full_name: profile.name,
          username: profile.username.replace('@', ''),
          bio: profile.bio,
          county: profile.county,
          language: profile.language,
        })
        if (error) throw error
      }
      showToast('Profile updated')
    } catch {
      showToast('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveNotifications() {
    localStorage.setItem('kikwetu_notifications', JSON.stringify(notifications))
    if (currentUser) {
      setSaving(true)
      try {
        await updateProfile(currentUser.id, { notification_prefs: notifications })
        showToast('Notification preferences saved')
      } catch {
        showToast('Notification preferences saved locally')
      } finally {
        setSaving(false)
      }
    } else {
      showToast('Notification preferences saved')
    }
  }

  async function handleSavePrivacy() {
    localStorage.setItem('kikwetu_privacy', JSON.stringify(privacy))
    if (currentUser) {
      setSaving(true)
      try {
        await updateProfile(currentUser.id, { privacy_prefs: privacy })
        showToast('Privacy settings saved')
      } catch {
        showToast('Privacy settings saved locally')
      } finally {
        setSaving(false)
      }
    } else {
      showToast('Privacy settings saved')
    }
  }

  async function handleSavePayments() {
    localStorage.setItem('kikwetu_payments', JSON.stringify(payments))
    if (currentUser) {
      setSaving(true)
      try {
        await updateProfile(currentUser.id, { mpesa_number: payments.mpesaNumber })
        showToast('Payment settings saved')
      } catch {
        showToast('Payment settings saved locally')
      } finally {
        setSaving(false)
      }
    } else {
      showToast('Payment settings saved')
    }
  }

  return (
    <AppLayout>
      <div className="page">
        <div className="page-head">
          <div>
            <h1 className="serif">Make Kikwetu fit you.</h1>
            <p className="eyebrow">Customize your experience</p>
          </div>
          <button className="save-btn" onClick={handleSaveAll} disabled={saving}>
            {saving ? <Loader2 size={16} className="spin" /> : saveSuccess ? <CheckCircle size={16} className="check-pulse" /> : <CheckCircle size={16} />}
            {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
          </button>
        </div>

        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar-wrap" onClick={() => avatarInputRef.current?.click()}>
            <img src={profile.avatar || '/avatar.jpg'} alt={profile.name || 'Profile'} className="profile-avatar" />
            <div className="profile-avatar-overlay">
              {avatarUploading ? <Loader2 size={20} className="spin" /> : <Camera size={20} />}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
            />
          </div>
          <div className="profile-header-info">
            <h2>{profile.name || 'Your Name'}</h2>
            <p className="profile-bio-preview">{profile.bio || 'Add a bio to tell people about yourself'}</p>
            <span className="profile-username">{profile.username || '@username'}</span>
          </div>
        </div>

        <div className="grid2">
          {/* Profile Settings */}
          <section className="section">
            <div className="section-gold-line" />
            <div className="section-head">
              <User size={20} />
              <h2>Profile</h2>
            </div>
            <div className="section-body">
              <div className="field">
                <label>Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  placeholder="Your full name"
                />
              </div>

              <div className="field">
                <label>Username</label>
                <input
                  type="text"
                  value={profile.username}
                  onChange={e => setProfile(p => ({ ...p, username: e.target.value }))}
                  placeholder="@username"
                />
              </div>

              <div className="field">
                <label>County</label>
                <div className="field-with-icon">
                  <MapPin size={16} />
                  <input
                    type="text"
                    value={profile.county}
                    onChange={e => setProfile(p => ({ ...p, county: e.target.value }))}
                    placeholder="Your county"
                  />
                </div>
              </div>

              <div className="field">
                <label>Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                  rows={3}
                  placeholder="Tell people about yourself"
                />
              </div>

              <button className="secondary" onClick={handleSaveProfile} disabled={saving} style={{ alignSelf: 'flex-start' }}>
                Save Profile
              </button>
            </div>
          </section>

          {/* Appearance */}
          <section className="section">
            <div className="section-gold-line" />
            <div className="section-head">
              {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
              <h2>Appearance</h2>
            </div>
            <div className="section-body">
              <div className="toggle-group">
                <span>Theme</span>
                <div className="toggle-buttons">
                  <button
                    className={theme === 'light' ? 'active' : ''}
                    onClick={() => { if (theme !== 'light') toggleTheme() }}
                  >
                    <Sun size={16} /> Light
                  </button>
                  <button
                    className={theme === 'dark' ? 'active' : ''}
                    onClick={() => { if (theme !== 'dark') toggleTheme() }}
                  >
                    <Moon size={16} /> Dark
                  </button>
                </div>
              </div>

              <div className="toggle-group">
                <span>Language</span>
                <div className="toggle-buttons">
                  <button
                    className={profile.language === 'en' ? 'active' : ''}
                    onClick={() => setProfile(p => ({ ...p, language: 'en' }))}
                  >
                    <Globe size={16} /> EN
                  </button>
                  <button
                    className={profile.language === 'sw' ? 'active' : ''}
                    onClick={() => setProfile(p => ({ ...p, language: 'sw' }))}
                  >
                    <Globe size={16} /> SW
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="section">
            <div className="section-gold-line" />
            <div className="section-head">
              <Bell size={20} />
              <h2>Notifications</h2>
            </div>
            <div className="section-body">
              <div className="toggle-row">
                <div className="toggle-info">
                  <Mail size={16} />
                  <span>Email Notifications</span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={notifications.email}
                    onChange={() => toggleNotification('email')}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="toggle-row">
                <div className="toggle-info">
                  <Smartphone size={16} />
                  <span>Push Notifications</span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={notifications.push}
                    onChange={() => toggleNotification('push')}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="toggle-row">
                <div className="toggle-info">
                  <Bell size={16} />
                  <span>SMS Notifications</span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={notifications.sms}
                    onChange={() => toggleNotification('sms')}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <button className="secondary" onClick={handleSaveNotifications} disabled={saving} style={{ alignSelf: 'flex-start' }}>
                Save Notifications
              </button>
            </div>
          </section>

          {/* Privacy */}
          <section className="section">
            <div className="section-gold-line" />
            <div className="section-head">
              <Shield size={20} />
              <h2>Privacy</h2>
            </div>
            <div className="section-body">
              <div className="toggle-row">
                <div className="toggle-info">
                  {privacy.profileVisibility === 'public' ? <Eye size={16} /> : <EyeOff size={16} />}
                  <span>Profile Visibility</span>
                </div>
                <select
                  value={privacy.profileVisibility}
                  onChange={e => setPrivacy(p => ({ ...p, profileVisibility: e.target.value }))}
                >
                  <option value="public">Public</option>
                  <option value="followers">Followers Only</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="toggle-row">
                <div className="toggle-info">
                  <Mail size={16} />
                  <span>Message Permissions</span>
                </div>
                <select
                  value={privacy.messagePermissions}
                  onChange={e => setPrivacy(p => ({ ...p, messagePermissions: e.target.value }))}
                >
                  <option value="everyone">Everyone</option>
                  <option value="followers">Followers</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>

              <div className="toggle-row">
                <div className="toggle-info">
                  <Lock size={16} />
                  <span>Show Online Status</span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={privacy.onlineStatus}
                    onChange={() => togglePrivacy('onlineStatus')}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <button className="secondary" onClick={handleSavePrivacy} disabled={saving} style={{ alignSelf: 'flex-start' }}>
                Save Privacy
              </button>
            </div>
          </section>

          {/* Payments */}
          <section className="section">
            <div className="section-gold-line" />
            <div className="section-head">
              <CreditCard size={20} />
              <h2>Payments</h2>
            </div>
            <div className="section-body">
              <div className="field">
                <label>M-Pesa Number</label>
                <input
                  type="tel"
                  value={payments.mpesaNumber}
                  onChange={e => setPayments(p => ({ ...p, mpesaNumber: e.target.value }))}
                  placeholder="+254 7XX XXX XXX"
                />
              </div>

              <div className="toggle-row">
                <div className="toggle-info">
                  <CreditCard size={16} />
                  <span>Accept Tips</span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={payments.tipPreferences === 'enabled'}
                    onChange={() => setPayments(p => ({
                      ...p,
                      tipPreferences: p.tipPreferences === 'enabled' ? 'disabled' : 'enabled'
                    }))}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="toggle-row">
                <div className="toggle-info">
                  <ChevronRight size={16} />
                  <span>Transaction History</span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={payments.showTransactionHistory}
                    onChange={() => setPayments(p => ({
                      ...p,
                      showTransactionHistory: !p.showTransactionHistory
                    }))}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <button className="secondary" onClick={handleSavePayments} disabled={saving} style={{ alignSelf: 'flex-start' }}>
                Save Payments
              </button>
            </div>
          </section>

          {/* Offline & Sync */}
          <section className="section">
            <div className="section-gold-line" />
            <div className="section-head">
              <Download size={20} />
              <h2>Offline & Sync</h2>
            </div>
            <div className="section-body">
              <div className="toggle-row">
                <div className="toggle-info">
                  <Download size={16} />
                  <span>Auto Sync</span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={sync.autoSync}
                    onChange={() => toggleSync('autoSync')}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="toggle-row">
                <div className="toggle-info">
                  <Globe size={16} />
                  <span>Wi-Fi Only</span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={sync.wifiOnly}
                    onChange={() => toggleSync('wifiOnly')}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <button className="secondary full-width">
                <Download size={16} /> Download My Data
              </button>

              <button className="secondary full-width danger">
                <Trash2 size={16} /> Clear Cache
              </button>
            </div>
          </section>

          {/* Account */}
          <section className="section">
            <div className="section-gold-line" />
            <div className="section-head">
              <Settings size={20} />
              <h2>Account</h2>
            </div>
            <div className="section-body">
              <button className="secondary full-width danger">
                <Trash2 size={16} /> Delete Account
              </button>

              <button className="secondary full-width">
                Log Out
              </button>
            </div>
          </section>
        </div>

        <div className="save-bottom">
          <button className="save-btn" onClick={handleSaveAll} disabled={saving}>
            {saving ? <Loader2 size={16} className="spin" /> : saveSuccess ? <CheckCircle size={16} className="check-pulse" /> : <CheckCircle size={16} />}
            {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .page {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .page-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .page-head h1 {
          margin: 0;
          font-size: 2rem;
        }

        .eyebrow {
          color: var(--text3);
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 18px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 8px 24px oklch(24% .034 158 / .06);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .profile-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--gold);
        }

        .profile-header:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px oklch(24% .034 158 / .1);
        }

        .profile-avatar-wrap {
          position: relative;
          cursor: pointer;
          flex-shrink: 0;
        }

        .profile-avatar {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid var(--line);
          transition: border-color 0.2s ease;
        }

        .profile-avatar-wrap:hover .profile-avatar {
          border-color: var(--gold);
        }

        .profile-avatar-overlay {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: oklch(0% 0 0 / 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
          color: white;
        }

        .profile-avatar-wrap:hover .profile-avatar-overlay {
          opacity: 1;
        }

        .profile-header-info {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .profile-header-info h2 {
          margin: 0;
          font-size: 1.375rem;
          font-weight: 600;
        }

        .profile-bio-preview {
          color: var(--text2);
          font-size: 0.9375rem;
          margin: 0;
        }

        .profile-username {
          color: var(--text3);
          font-size: 0.8125rem;
        }

        .grid2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .grid2 {
            grid-template-columns: 1fr;
          }
          .profile-header {
            flex-direction: column;
            text-align: center;
          }
        }

        .section {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 18px;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 24px oklch(24% .034 158 / .06);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .section:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px oklch(24% .034 158 / .1);
        }

        .section-gold-line {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--gold);
        }

        .section-head {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
          color: var(--text);
        }

        .section-head h2 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .section-body {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .field label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--text2);
        }

        .field input,
        .field textarea,
        .field select {
          padding: 0.625rem 0.75rem;
          border: 1px solid var(--line);
          border-radius: 10px;
          background: var(--bg);
          color: var(--text);
          font-size: 0.9375rem;
          font-family: inherit;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .field input:focus,
        .field textarea:focus,
        .field select:focus {
          outline: none;
          border-color: var(--green);
          box-shadow: 0 0 0 3px oklch(65% .19 155 / .15);
        }

        .field-with-icon {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .field-with-icon input {
          flex: 1;
        }

        .toggle-group {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
        }

        .toggle-group span {
          font-weight: 500;
          color: var(--text);
        }

        .toggle-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .toggle-buttons button {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 0.875rem;
          border: 1px solid var(--line);
          border-radius: 10px;
          background: var(--bg);
          color: var(--text2);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .toggle-buttons button:hover {
          border-color: var(--green);
          color: var(--green);
        }

        .toggle-buttons button.active {
          background: var(--greenSoft);
          border-color: var(--green);
          color: var(--green);
        }

        .toggle-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
        }

        .toggle-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text);
        }

        .switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--line);
          transition: 0.3s ease;
          border-radius: 24px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background: white;
          transition: 0.3s ease;
          border-radius: 50%;
        }

        .switch input:checked + .slider {
          background: var(--green);
        }

        .switch input:checked + .slider:before {
          transform: translateX(20px);
        }

        select {
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--line);
          border-radius: 10px;
          background: var(--bg);
          color: var(--text);
          font-size: 0.875rem;
          cursor: pointer;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        select:focus {
          outline: none;
          border-color: var(--green);
          box-shadow: 0 0 0 3px oklch(65% .19 155 / .15);
        }

        .save-btn {
          background: var(--gold);
          color: #1a1a1a;
          border: none;
          padding: 0.625rem 1.25rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.9375rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .save-btn:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .primary {
          background: var(--green);
          color: white;
          border: none;
          padding: 0.625rem 1.25rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.9375rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .primary:hover {
          background: var(--green2);
          transform: translateY(-1px);
        }

        .primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .secondary {
          background: transparent;
          color: var(--text);
          border: 1px solid var(--line);
          padding: 0.625rem 1.25rem;
          border-radius: 10px;
          font-weight: 500;
          font-size: 0.9375rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .secondary:hover {
          border-color: var(--text2);
          transform: translateY(-1px);
        }

        .full-width {
          width: 100%;
          justify-content: center;
        }

        .danger {
          color: #e53935;
          border-color: #e5393520;
        }

        .danger:hover {
          background: #e5393510;
          border-color: #e53935;
        }

        .save-bottom {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--line);
          display: flex;
          justify-content: flex-end;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .check-pulse {
          animation: checkPulse 0.6s ease;
        }

        @keyframes checkPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
      `}</style>
    </AppLayout>
  )
}
