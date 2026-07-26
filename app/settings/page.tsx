'use client'

import { useState } from 'react'
import AppLayout, { useApp } from '@/components/AppLayout'
import {
  Settings, User, Bell, Shield, CreditCard, Globe, Moon, Sun,
  Smartphone, Download, Trash2, ChevronRight, Eye, EyeOff,
  Lock, Mail, MapPin
} from 'lucide-react'

export default function SettingsPage() {
  const { theme, toggleTheme } = useApp()
  const [profile, setProfile] = useState({
    name: 'Wanjiku Kamau',
    username: '@wanjiku',
    county: 'Nairobi',
    bio: 'Digital storyteller & community builder',
    language: 'en',
    avatar: '/avatar.jpg'
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
    mpesaNumber: '+254 712 345 678',
    tipPreferences: 'enabled',
    showTransactionHistory: true
  })

  const [sync, setSync] = useState({
    autoSync: true,
    wifiOnly: true
  })

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const togglePrivacy = (key: keyof typeof privacy) => {
    setPrivacy(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleSync = (key: keyof typeof sync) => {
    setSync(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <AppLayout>
      <div className="page">
        <div className="page-head">
          <div>
            <h1 className="serif">Make Kikwetu fit you.</h1>
            <p className="eyebrow">Customize your experience</p>
          </div>
          <button className="primary">Save Changes</button>
        </div>

        <div className="grid2">
          {/* Profile Settings */}
          <section className="section">
            <div className="section-head">
              <User size={20} />
              <h2>Profile</h2>
            </div>
            <div className="section-body">
              <div className="avatar-upload">
                <img src={profile.avatar} alt={profile.name} className="avatar" />
                <button className="secondary">Change Photo</button>
              </div>

              <div className="field">
                <label>Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div className="field">
                <label>Username</label>
                <input
                  type="text"
                  value={profile.username}
                  onChange={e => setProfile(p => ({ ...p, username: e.target.value }))}
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
                  />
                </div>
              </div>

              <div className="field">
                <label>Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          </section>

          {/* Appearance */}
          <section className="section">
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
            </div>
          </section>

          {/* Privacy */}
          <section className="section">
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
            </div>
          </section>

          {/* Payments */}
          <section className="section">
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
            </div>
          </section>

          {/* Offline & Sync */}
          <section className="section">
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
          <button className="primary">Save Changes</button>
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

        .grid2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .grid2 {
            grid-template-columns: 1fr;
          }
        }

        .section {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 1.5rem;
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

        .avatar-upload {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--line);
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
          border-radius: 8px;
          background: var(--bg);
          color: var(--text);
          font-size: 0.9375rem;
          font-family: inherit;
          width: 100%;
          box-sizing: border-box;
        }

        .field input:focus,
        .field textarea:focus,
        .field select:focus {
          outline: none;
          border-color: var(--green);
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
          border-radius: 8px;
          background: var(--bg);
          color: var(--text2);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
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
          transition: 0.3s;
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
          transition: 0.3s;
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
          border-radius: 8px;
          background: var(--bg);
          color: var(--text);
          font-size: 0.875rem;
          cursor: pointer;
        }

        .primary {
          background: var(--green);
          color: white;
          border: none;
          padding: 0.625rem 1.25rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9375rem;
          cursor: pointer;
          transition: background 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .primary:hover {
          background: var(--green2);
        }

        .secondary {
          background: transparent;
          color: var(--text);
          border: 1px solid var(--line);
          padding: 0.625rem 1.25rem;
          border-radius: 8px;
          font-weight: 500;
          font-size: 0.9375rem;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .secondary:hover {
          border-color: var(--text2);
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

        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .tag {
          padding: 0.25rem 0.625rem;
          background: var(--greenSoft);
          color: var(--green);
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 500;
        }
      `}</style>
    </AppLayout>
  )
}
