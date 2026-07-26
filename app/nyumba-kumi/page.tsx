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
} from 'lucide-react';

const MOCK_ALERTS = [
  {
    id: 1,
    title: 'Water outage reported',
    area: 'Kileleshwa, Dagoretti North',
    time: '2h ago',
    confirmations: 12,
    type: 'urgent',
    icon: AlertTriangle,
  },
  {
    id: 2,
    title: 'Road maintenance ahead',
    area: 'Ngong Road, Nairobi',
    time: '4h ago',
    confirmations: 8,
    type: 'urgent',
    icon: AlertTriangle,
  },
  {
    id: 3,
    title: 'Community safety meeting',
    area: 'Community center, Westlands',
    time: 'Tomorrow 6PM',
    confirmations: 24,
    type: 'calm',
    icon: Users,
  },
];

const emergencyContacts = [
  { label: 'Police', number: '999', icon: Shield },
  { label: 'Ambulance', number: '999', icon: Phone },
  { label: 'Fire Brigade', number: '999', icon: AlertTriangle },
  { label: 'Nyumba Kumi Chair', number: '+254 700 123 456', icon: Users },
];

type AlertItem = typeof MOCK_ALERTS[number];

const alertTypes = [
  { key: 'safety', label: 'Safety' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'community', label: 'Community' },
  { key: 'emergency', label: 'Emergency' },
];

export default function NyumbaKumiPage() {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<AlertItem[]>(MOCK_ALERTS);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('safety');
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportLocation, setReportLocation] = useState('');
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    async function init() {
      const user = await getCurrentUser();
      setCurrentUser(user);

      try {
        const { data, error } = await supabase
          .from('safety_alerts')
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
        { event: 'INSERT', schema: 'public', table: 'safety_alerts' },
        (payload) => {
          const item = payload.new as any;
          const newAlert: AlertItem = {
            id: item.id ?? 0,
            title: item.title ?? 'Alert',
            area: item.area ?? '',
            time: 'Just now',
            confirmations: item.confirmations ?? 0,
            type: item.type === 'calm' ? 'calm' : 'urgent',
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
          <p>Community-driven safety alerts and local emergency coordination.</p>
        </div>
        <button className="primary" onClick={() => setShowReportModal(true)}>
          <Plus className="icon-sm" /> Report incident
        </button>
      </div>

      <section className="section">
        <div className="section-head">
          <h2><ShieldCheck className="icon-sm" /> Active Alerts</h2>
          <button className="secondary" onClick={() => showToast('Viewing all alerts')}>
            View all <ChevronRight className="icon-sm" />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {alerts.map((alert) => (
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

      <section className="section">
        <div className="section-head">
          <h2><Phone className="icon-sm" /> Emergency Contacts</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {emergencyContacts.map((contact) => (
            <button
              key={contact.label}
              className="alert"
              onClick={() => showToast(`Calling ${contact.label}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer' }}
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
        </div>
      </section>

      <div className="grid2" style={{ marginTop: 14 }}>
        <section className="section">
          <div className="section-head">
            <h2><Eye className="icon-sm" /> Your neighbourhood</h2>
          </div>
          <div className="stats">
            <div className="stat">
              <div className="stat-value" style={{ color: 'var(--red)' }}>3</div>
              <div className="stat-label">Alerts today</div>
            </div>
            <div className="stat">
              <div className="stat-value" style={{ color: 'var(--green)' }}>44</div>
              <div className="stat-label">Confirmed by</div>
            </div>
            <div className="stat">
              <div className="stat-value" style={{ color: 'var(--gold)' }}>128</div>
              <div className="stat-label">Active neighbours</div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2><Shield className="icon-sm" /> How Nyumba Kumi works</h2>
          </div>
          <div className="right-list">
            <div className="right-item">
              <div className="right-copy">
                <strong>Quick alerts</strong>
                <p>Report an incident or hazard in seconds. Your neighbours are notified instantly.</p>
              </div>
              <ChevronRight className="icon-sm" style={{ color: 'var(--text3)' }} />
            </div>
            <div className="right-item">
              <div className="right-copy">
                <strong>Confirm or dispute</strong>
                <p>Verify alerts from your area so the community knows what is real.</p>
              </div>
              <ChevronRight className="icon-sm" style={{ color: 'var(--text3)' }} />
            </div>
            <div className="right-item">
              <div className="right-copy">
                <strong>Community jury</strong>
                <p>Resolved disputes through a fair, transparent neighbourhood process.</p>
              </div>
              <ChevronRight className="icon-sm" style={{ color: 'var(--text3)' }} />
            </div>
          </div>
        </section>
      </div>

      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50 }}>
        <button
          className="primary"
          onClick={() => setShowReportModal(true)}
          style={{ width: 52, height: 52, borderRadius: '50%', padding: 0, display: 'grid', placeItems: 'center', boxShadow: '0 4px 14px rgba(0,0,0,.2)' }}
        >
          <Bell className="icon" />
        </button>
      </div>

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
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16 }}>Report an incident</h2>

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
              <div>
                <label style={{ fontSize: '.75rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Title *</label>
                <input
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="What happened?"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '.75rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Description</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={3}
                  placeholder="Provide more details"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)', resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '.75rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Location</label>
                <input
                  value={reportLocation}
                  onChange={(e) => setReportLocation(e.target.value)}
                  placeholder="e.g. Kileleshwa, Nairobi"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
              <button className="secondary" onClick={() => setShowReportModal(false)}>
                Cancel
              </button>
              <button className="primary" onClick={handleCreateAlert} disabled={reporting}>
                {reporting ? 'Reporting...' : 'Report incident'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
