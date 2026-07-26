'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
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

export default function NyumbaKumiPage() {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<AlertItem[]>(MOCK_ALERTS);

  useEffect(() => {
    async function fetchAlerts() {
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
    fetchAlerts();
  }, []);

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
        <button className="primary" onClick={() => showToast('New alert created')}>
          <Plus className="icon-sm" /> New alert
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
              onClick={() => showToast(`Alert: ${alert.title}`)}
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
              <ChevronRight className="icon-sm" style={{ color: 'var(--text3)' }} />
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
          onClick={() => showToast('New alert created')}
          style={{ width: 52, height: 52, borderRadius: '50%', padding: 0, display: 'grid', placeItems: 'center', boxShadow: '0 4px 14px rgba(0,0,0,.2)' }}
        >
          <Bell className="icon" />
        </button>
      </div>
    </AppLayout>
  );
}
