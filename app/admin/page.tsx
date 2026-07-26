'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import {
  ShieldCheck, Download, BadgeCheck, AlertTriangle, Users,
  TrendingUp, Clock, CheckCircle, XCircle, Eye, MoreHorizontal,
  ChevronRight, FileText, DollarSign, Ban, UserCheck,
} from 'lucide-react';

const MOCK_REVIEW_QUEUE = [
  {
    id: 1,
    type: 'Professional verification',
    subject: 'James Otieno',
    detail: 'Credentials uploaded',
    status: 'partial',
    statusLabel: 'Partial',
    icon: BadgeCheck,
    actions: ['Review', 'Decline'],
  },
  {
    id: 2,
    type: 'Reported thread',
    subject: '#CountyPolitics',
    detail: '5 flags',
    status: 'missing',
    statusLabel: 'Urgent',
    icon: AlertTriangle,
    actions: ['Escalate', 'Dismiss'],
  },
  {
    id: 3,
    type: 'Payout batch',
    subject: 'July 26',
    detail: '42 professionals',
    status: 'ready',
    statusLabel: 'Ready',
    icon: DollarSign,
    actions: ['Approve', 'Review'],
  },
  {
    id: 4,
    type: 'Community jury',
    subject: 'Nyumba Kumi',
    detail: '3 trusted reviewers',
    status: 'ready',
    statusLabel: 'Active',
    icon: Users,
    actions: ['View', 'More'],
  },
];

const trustControls = [
  { label: 'Approve expert', icon: UserCheck, color: 'var(--green)' },
  { label: 'Remove content', icon: Ban, color: 'var(--red)' },
  { label: 'Escalate to jury', icon: Users, color: 'var(--gold)' },
];

const payoutOps = [
  { label: 'Run batch', icon: DollarSign, color: 'var(--green)' },
  { label: 'Verify details', icon: Eye, color: 'var(--earth)' },
  { label: 'Export report', icon: FileText, color: 'var(--text2)' },
];

type ReviewItem = typeof MOCK_REVIEW_QUEUE[number];

export default function AdminPage() {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [reviewQueue, setReviewQueue] = useState<ReviewItem[]>(MOCK_REVIEW_QUEUE);

  useEffect(() => {
    async function fetchAdminData() {
      try {
        // Fetch audit logs
        const { data: logs } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        // Fetch pending professionals
        const { data: pending } = await supabase
          .from('professionals')
          .select('*')
          .eq('status', 'pending');

        if (pending && pending.length > 0) {
          const professionalItems: ReviewItem[] = pending.map((p: any) => ({
            id: p.id ?? 0,
            type: 'Professional verification',
            subject: p.full_name ?? p.name ?? 'Unknown',
            detail: p.credential_url ? 'Credentials uploaded' : 'Awaiting credentials',
            status: 'partial',
            statusLabel: 'Partial',
            icon: BadgeCheck,
            actions: ['Review', 'Decline'],
          }));

          // Merge: pending professionals first, then keep remaining mock items
          const mockIds = new Set(professionalItems.map((i) => i.subject));
          const remainingMock = MOCK_REVIEW_QUEUE.filter(
            (m) => !mockIds.has(m.subject) && m.type !== 'Professional verification'
          );
          setReviewQueue([...professionalItems, ...remainingMock]);
        }

        // If we got logs, we could use them for stats too
        // For now the UI stats remain hardcoded
      } catch {
        // fallback to mock
      }
      setLoading(false);
    }
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <AppLayout showRightSidebar={false}>
        <div className="page-head">
          <div>
            <div className="eyebrow">Admin dashboard</div>
            <h1 className="serif">Keep Kikwetu trustworthy.</h1>
            <p>Review reports, verify professionals, and manage payouts.</p>
          </div>
        </div>
        <div className="audit-grid">
          <div className="audit-stat" style={{ opacity: 0.5 }}>
            <div className="avatar"><AlertTriangle className="icon-sm" /></div>
            <strong>...</strong>
            <span>Reports awaiting</span>
          </div>
          <div className="audit-stat" style={{ opacity: 0.5 }}>
            <div className="avatar"><BadgeCheck className="icon-sm" /></div>
            <strong>...</strong>
            <span>Professional applications</span>
          </div>
          <div className="audit-stat" style={{ opacity: 0.5 }}>
            <div className="avatar"><DollarSign className="icon-sm" /></div>
            <strong>...</strong>
            <span>Tips processed</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showRightSidebar={false}>
      <div className="page-head">
        <div>
          <div className="eyebrow">Admin dashboard</div>
          <h1 className="serif">Keep Kikwetu trustworthy.</h1>
          <p>Review reports, verify professionals, and manage payouts.</p>
        </div>
        <button className="secondary" onClick={() => showToast('Exporting report')}>
          <Download className="icon-sm" /> Export
        </button>
      </div>

      <div className="audit-grid">
        <div className="audit-stat" onClick={() => showToast('18 reports awaiting review')}>
          <div className="avatar" style={{ background: 'var(--goldSoft)', color: 'var(--gold)' }}>
            <AlertTriangle className="icon-sm" />
          </div>
          <strong>18</strong>
          <span>Reports awaiting</span>
        </div>
        <div className="audit-stat" onClick={() => showToast('7 professional applications')}>
          <div className="avatar" style={{ background: 'var(--greenSoft)', color: 'var(--green)' }}>
            <BadgeCheck className="icon-sm" />
          </div>
          <strong>7</strong>
          <span>Professional applications</span>
        </div>
        <div className="audit-stat" onClick={() => showToast('KSh 84k tips processed')}>
          <div className="avatar" style={{ background: 'var(--earthSoft)', color: 'var(--earth)' }}>
            <DollarSign className="icon-sm" />
          </div>
          <strong>KSh 84k</strong>
          <span>Tips processed</span>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">Review queue</div>
            <h2 className="serif">What needs attention.</h2>
          </div>
          <button className="secondary" onClick={() => showToast('Viewing all')}>
            View all <ChevronRight className="icon-sm" />
          </button>
        </div>

        <div className="audit-table" style={{ marginTop: 14 }}>
          {reviewQueue.map((item) => {
            const Icon = item.icon;
            return (
              <div className="audit-row" key={item.id} onClick={() => showToast(`Opening: ${item.type}`)}>
                <div className="avatar" style={{
                  background: item.status === 'ready' ? 'var(--greenSoft)' : item.status === 'partial' ? 'var(--goldSoft)' : 'var(--redSoft)',
                  color: item.status === 'ready' ? 'var(--green)' : item.status === 'partial' ? 'var(--gold)' : 'var(--red)',
                }}>
                  <Icon className="icon-sm" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: '.85rem', display: 'block' }}>{item.type}</strong>
                  <span style={{ fontSize: '.78rem', color: 'var(--text2)' }}>
                    {item.subject} &middot; {item.detail}
                  </span>
                </div>
                <span className={`status ${item.status}`}>{item.statusLabel}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {item.actions.map((action) => (
                    <button
                      key={action}
                      className="secondary"
                      style={{ padding: '6px 12px', fontSize: '.75rem' }}
                      onClick={(e) => { e.stopPropagation(); showToast(`${action}: ${item.subject}`); }}
                    >
                      {action}
                    </button>
                  ))}
                </div>
                <MoreHorizontal className="icon-sm" style={{ color: 'var(--text3)' }} />
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid2" style={{ marginTop: 22 }}>
        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Trust controls</div>
              <h2 className="serif">Keep standards high.</h2>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            {trustControls.map((ctrl) => {
              const Icon = ctrl.icon;
              return (
                <button
                  key={ctrl.label}
                  className="quick"
                  onClick={() => showToast(ctrl.label)}
                >
                  <div className="quick-icon" style={{ background: `${ctrl.color}18`, color: ctrl.color }}>
                    <Icon className="icon-sm" />
                  </div>
                  <div className="quick-copy">
                    <strong>{ctrl.label}</strong>
                  </div>
                  <ChevronRight className="icon-sm" style={{ color: 'var(--text3)' }} />
                </button>
              );
            })}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Payout operations</div>
              <h2 className="serif">Pay people fairly.</h2>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            {payoutOps.map((op) => {
              const Icon = op.icon;
              return (
                <button
                  key={op.label}
                  className="quick"
                  onClick={() => showToast(op.label)}
                >
                  <div className="quick-icon" style={{ background: `${op.color}18`, color: op.color }}>
                    <Icon className="icon-sm" />
                  </div>
                  <div className="quick-copy">
                    <strong>{op.label}</strong>
                  </div>
                  <ChevronRight className="icon-sm" style={{ color: 'var(--text3)' }} />
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <section className="section" style={{ marginTop: 22 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow">System health</div>
            <h2 className="serif">Platform overview.</h2>
          </div>
        </div>

        <div className="stats" style={{ marginTop: 14 }}>
          <div className="stat" onClick={() => showToast('Active users')}>
            <div className="avatar" style={{ background: 'var(--greenSoft)', color: 'var(--green)' }}>
              <Users className="icon-sm" />
            </div>
            <strong>1,240</strong>
            <span>Active users</span>
          </div>
          <div className="stat" onClick={() => showToast('Pending reviews')}>
            <div className="avatar" style={{ background: 'var(--goldSoft)', color: 'var(--gold)' }}>
              <Clock className="icon-sm" />
            </div>
            <strong>18</strong>
            <span>Pending reviews</span>
          </div>
          <div className="stat" onClick={() => showToast('Resolved this week')}>
            <div className="avatar" style={{ background: 'var(--greenSoft)', color: 'var(--green)' }}>
              <CheckCircle className="icon-sm" />
            </div>
            <strong>42</strong>
            <span>Resolved this week</span>
          </div>
          <div className="stat" onClick={() => showToast('Flagged content')}>
            <div className="avatar" style={{ background: 'var(--redSoft)', color: 'var(--red)' }}>
              <XCircle className="icon-sm" />
            </div>
            <strong>5</strong>
            <span>Flagged content</span>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
