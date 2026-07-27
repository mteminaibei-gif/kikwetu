'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import {
  getCurrentUser,
  createAlert,
  confirmAlert,
} from '@/lib/supabase-helpers';
import {
  ShieldCheck, Plus, AlertTriangle, CheckCircle, MapPin,
  Clock, Phone, Users, ChevronRight, Bell, Shield, Eye,
  Map, Send, UsersRound, Settings2, RefreshCcw, X,
} from 'lucide-react';

const MOCK_ALERTS = [
  {
    id: 1,
    title: 'Water outage reported',
    area: 'Kileleshwa, Dagoretti North',
    time: '2h ago',
    confirmations: 12,
    type: 'urgent',
    category: 'urgent',
    icon: AlertTriangle,
  },
  {
    id: 2,
    title: 'Road maintenance ahead',
    area: 'Ngong Road, Nairobi',
    time: '4h ago',
    confirmations: 8,
    type: 'urgent',
    category: 'urgent',
    icon: AlertTriangle,
  },
  {
    id: 3,
    title: 'Community safety meeting',
    area: 'Community center, Westlands',
    time: 'Tomorrow 6PM',
    confirmations: 24,
    type: 'calm',
    category: 'community',
    icon: Users,
  },
  {
    id: 4,
    title: 'Stray dog sighting',
    area: 'Kilimani, Nairobi',
    time: '6h ago',
    confirmations: 5,
    type: 'urgent',
    category: 'urgent',
    icon: AlertTriangle,
  },
  {
    id: 5,
    title: 'Neighbourhood watch patrol schedule',
    area: 'Westlands, Nairobi',
    time: '1d ago',
    confirmations: 18,
    type: 'calm',
    category: 'community',
    icon: Users,
  },
];

const MOCK_CIRCLE = [
  { name: 'Wanjiku M.', initials: 'WM', role: 'Chair', online: true },
  { name: 'Kipchoge A.', initials: 'KA', role: 'Member', online: true },
  { name: 'Amina H.', initials: 'AH', role: 'Member', online: false },
  { name: 'Otieno K.', initials: 'OK', role: 'Secretary', online: true },
];

const emergencyContacts = [
  { label: 'Police', number: '999', icon: Shield },
  { label: 'Ambulance', number: '999', icon: Phone },
  { label: 'Fire Brigade', number: '999', icon: AlertTriangle },
  { label: 'Nyumba Kumi Chair', number: '+254 700 123 456', icon: Users },
];

const alertTypes = [
  { key: 'safety', label: 'Safety' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'community', label: 'Community' },
  { key: 'emergency', label: 'Emergency' },
];

type AlertItem = typeof MOCK_ALERTS[number];
type NkTab = 'all' | 'urgent' | 'community' | 'circle' | 'settings';

export default function NyumbaKumiPage() {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<AlertItem[]>(MOCK_ALERTS);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<NkTab>('all');

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('safety');
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportLocation, setReportLocation] = useState('');
  const [reporting, setReporting] = useState(false);

  const filteredAlerts = activeTab === 'all'
    ? alerts
    : activeTab === 'urgent' || activeTab === 'community'
      ? alerts.filter(a => a.category === activeTab)
      : alerts;

  useEffect(() => {
    async function init() {
      const user = await getCurrentUser();
      setCurrentUser(user);

      try {
        const { data, error } = await supabase
          .from('nyumba_kumi_alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        if (data && data.length > 0) {
          setAlerts(data.map((item: any) => ({
            id: item.id ?? 0,
            title: item.title ?? 'Alert',
            area: item.area ?? '',
            time: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recently',
            confirmations: item.confirmations ?? 0,
            type: item.type === 'calm' ? 'calm' : 'urgent',
            category: item.type === 'calm' ? 'community' : 'urgent',
            icon: item.type === 'calm' ? Users : AlertTriangle,
          })));
        }
      } catch {
        // fallback to mock
      }
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('nyumba-kumi-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'nyumba_kumi_alerts' },
        (payload) => {
          const item = payload.new as any;
          const newAlert: AlertItem = {
            id: item.id ?? 0,
            title: item.title ?? 'Alert',
            area: item.area ?? '',
            time: 'Just now',
            confirmations: item.confirmations ?? 0,
            type: item.type === 'calm' ? 'calm' : 'urgent',
            category: item.type === 'calm' ? 'community' : 'urgent',
            icon: item.type === 'calm' ? Users : AlertTriangle,
          };
          setAlerts((prev) => [newAlert, ...prev]);
          showToast(`New alert: ${newAlert.title}`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showToast]);

  async function handleCreateAlert() {
    if (!currentUser || !reportTitle.trim()) {
      showToast('Please fill in the title');
      return;
    }
    setReporting(true);
    const { data, error } = await createAlert(
      currentUser.id,
      reportType,
      reportTitle,
      reportDescription,
      reportLocation,
      currentUser.county || 'Nairobi',
    );
    setReporting(false);

    if (!error && data) {
      const typeIcon = reportType === 'community' || reportType === 'safety' ? Users : AlertTriangle;
      const newAlert: AlertItem = {
        id: data.id,
        title: data.title,
        area: data.location || '',
        time: 'Just now',
        confirmations: 0,
        type: reportType === 'community' ? 'calm' : 'urgent',
        category: reportType === 'community' ? 'community' : 'urgent',
        icon: typeIcon,
      };
      setAlerts((prev) => [newAlert, ...prev]);
      setShowReportModal(false);
      setReportTitle('');
      setReportDescription('');
      setReportLocation('');
      setReportType('safety');
      showToast('Incident reported');
    } else {
      showToast('Failed to report incident');
    }
  }

  async function handleConfirm(alertId: string | number) {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId ? { ...a, confirmations: a.confirmations + 1 } : a
      )
    );

    const { error } = await confirmAlert(String(alertId));
    if (error) {
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId ? { ...a, confirmations: a.confirmations - 1 } : a
        )
      );
      showToast('Failed to confirm');
    } else {
      showToast('Alert confirmed');
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="page-head">
          <div>
            <div className="eyebrow">Nyumba Kumi</div>
            <h1 className="serif">Look out for your neighbourhood.</h1>
            <p>Community-driven safety alerts and local emergency coordination.</p>
          </div>
        </div>
        <section className="section">
          <div style={{ opacity: 0.5, padding: 20, textAlign: 'center' }}>Loading alerts...</div>
        </section>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-head">
        <div>
          <div className="eyebrow">Nyumba Kumi</div>
          <h1 className="serif">Look out for your neighbourhood.</h1>
          <p>Clear alerts, useful context, and calm coordination for the people around you.</p>
        </div>
        <button className="primary" onClick={() => setShowReportModal(true)}>
          <AlertTriangle className="icon-sm" /> Post an alert
        </button>
      </div>

      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow" style={{ color: 'var(--gold)' }}>Westlands circle</div>
          <h1 className="serif">Safer works better together.</h1>
          <p>Share verified local updates, confirm what you see, and keep urgent information useful instead of noisy. Your exact address stays private.</p>
          <div className="hero-actions">
            <button className="gold" onClick={() => showToast('Neighbourhood map opened')}>
              <Map className="icon-sm" /> Open neighbourhood map
            </button>
            <button onClick={() => showToast('Private group invite copied')}>
              <Send className="icon-sm" /> Share group
            </button>
          </div>
        </div>
      </section>

      <div className="tabs">
        {([
          { id: 'all' as const, label: 'All' },
          { id: 'urgent' as const, label: 'Urgent' },
          { id: 'community' as const, label: 'Community' },
        ]).map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: '.72rem', color: 'var(--text3)' }}>
          {filteredAlerts.length} updates · {filteredAlerts.reduce((sum, a) => sum + a.confirmations, 0)} confirmations
        </span>
        <button className="secondary" onClick={() => showToast('Refreshed')} style={{ fontSize: '.62rem', minHeight: 28 }}>
          <RefreshCcw className="icon-sm" /> Refresh
        </button>
      </div>

      <section className="section">
        <div className="section-head">
          <h2><ShieldCheck className="icon-sm" /> Active Alerts</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`alert ${alert.type === 'calm' ? 'calm' : ''}`}
              style={{ cursor: 'pointer' }}
            >
              <div className="alert-icon">
                <alert.icon className="icon" />
              </div>
              <div className="alert-copy">
                <strong>{alert.title}</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: '.75rem', color: 'var(--text3)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <MapPin className="icon-xs" /> {alert.area}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Clock className="icon-xs" /> {alert.time}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <CheckCircle className="icon-xs" /> {alert.confirmations} confirmed
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirm(alert.id);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--line)',
                  background: 'var(--surface)',
                  color: 'var(--green)',
                  fontSize: '.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <CheckCircle className="icon-xs" />
                Confirm
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="grid2" style={{ marginTop: 14 }}>
        <section className="section">
          <div className="section-head">
            <h2><Phone className="icon-sm" /> Emergency Contacts</h2>
          </div>
          {emergencyContacts.map((contact) => (
            <button
              key={contact.label}
              className="alert"
              onClick={() => showToast(`Calling ${contact.label}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer', width: '100%', textAlign: 'left' }}
            >
              <div className="alert-icon">
                <contact.icon className="icon" />
              </div>
              <div className="alert-copy">
                <strong>{contact.label}</strong>
                <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>{contact.number}</div>
              </div>
            </button>
          ))}
        </section>

        <section className="section">
          <div className="section-head">
            <h2><Eye className="icon-sm" /> Your neighbourhood</h2>
          </div>
          <div className="stats">
            <div className="stat">
              <strong>{alerts.filter(a => a.type === 'urgent').length}</strong>
              <span>Active alerts</span>
            </div>
            <div className="stat">
              <strong>{alerts.reduce((sum, a) => sum + a.confirmations, 0)}</strong>
              <span>Total confirms</span>
            </div>
            <div className="stat">
              <strong>128</strong>
              <span>Active neighbours</span>
            </div>
          </div>
        </section>
      </div>

      <section className="section" style={{ marginTop: 14 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow">Your circle</div>
            <h2 className="serif">Trusted neighbours.</h2>
          </div>
          <button className="secondary" onClick={() => setActiveTab('circle')}>
            <UsersRound className="icon-sm" /> Manage
          </button>
        </div>
        {MOCK_CIRCLE.map((member) => (
          <div key={member.name} className="alert" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="avatar sm" style={{ background: member.online ? 'var(--greenSoft)' : 'var(--surface2)', color: member.online ? 'var(--green)' : 'var(--text3)' }}>
              {member.initials}
            </div>
            <div className="alert-copy">
              <strong>{member.name}</strong>
              <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>
                {member.role} · {member.online ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="section" style={{ marginTop: 14 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow">How Nyumba Kumi works</div>
            <h2 className="serif">Clear process, calm coordination.</h2>
          </div>
        </div>
        <div className="alert" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="alert-icon"><AlertTriangle className="icon" /></div>
          <div className="alert-copy">
            <strong>Quick alerts</strong>
            <p style={{ fontSize: '.68rem', color: 'var(--text2)' }}>Report an incident or hazard in seconds. Your neighbours are notified instantly.</p>
          </div>
        </div>
        <div className="alert" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="alert-icon"><CheckCircle className="icon" /></div>
          <div className="alert-copy">
            <strong>Confirm or dispute</strong>
            <p style={{ fontSize: '.68rem', color: 'var(--text2)' }}>Verify alerts from your area so the community knows what is real.</p>
          </div>
        </div>
        <div className="alert" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="alert-icon"><Shield className="icon" /></div>
          <div className="alert-copy">
            <strong>Community jury</strong>
            <p style={{ fontSize: '.68rem', color: 'var(--text2)' }}>Resolve disputes through a fair, transparent neighbourhood process.</p>
          </div>
        </div>
      </section>

      {showReportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 16,
          }}
          onClick={() => setShowReportModal(false)}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 440,
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Post an alert</h2>
              <button onClick={() => setShowReportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '.75rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Type</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {alertTypes.map((t) => (
                    <button
                      key={t.key}
                      className={reportType === t.key ? 'primary' : 'secondary'}
                      onClick={() => setReportType(t.key)}
                      style={{ fontSize: '.7rem', minHeight: 30 }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-field">
                <label>Title *</label>
                <input
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="What happened?"
                />
              </div>
              <div className="form-field">
                <label>Description</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={3}
                  placeholder="Provide more details"
                />
              </div>
              <div className="form-field">
                <label>Location</label>
                <input
                  value={reportLocation}
                  onChange={(e) => setReportLocation(e.target.value)}
                  placeholder="e.g. Kileleshwa, Nairobi"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
              <button className="secondary" onClick={() => setShowReportModal(false)}>
                Cancel
              </button>
              <button className="primary" onClick={handleCreateAlert} disabled={reporting}>
                {reporting ? 'Reporting...' : 'Post alert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
