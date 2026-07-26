'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import {
  BadgeCheck, CalendarDays, FileCheck2, Users,
  SlidersHorizontal, Plus, ChevronRight
} from 'lucide-react';

const professionals = [
  {
    initials: 'NW',
    name: 'Njeri Wambui',
    color: 'earth',
    expertise: 'Urban farming and climate education',
    rating: 4.9,
    consultations: 127,
    location: 'Nairobi',
  },
  {
    initials: 'JO',
    name: 'James Otieno',
    color: 'blue',
    expertise: 'Solar systems for small businesses',
    rating: 4.8,
    consultations: 89,
    location: 'Kisumu',
  },
  {
    initials: 'FA',
    name: 'Fatuma Ali',
    color: 'green',
    expertise: 'Swahili heritage and storytelling',
    rating: 5.0,
    consultations: 64,
    location: 'Mombasa',
  },
  {
    initials: 'RK',
    name: 'Ruth Kilonzo',
    color: 'earth',
    expertise: 'County procurement and tenders',
    rating: 4.7,
    consultations: 156,
    location: 'Machakos',
  },
];

export default function ProfessionalsPage() {
  const { showToast } = useApp();

  return (
    <AppLayout>
      <div className="page-head">
        <div>
          <div className="eyebrow">KikwetuConnect</div>
          <h1 className="serif">Find someone who has done the work.</h1>
          <p>Approved professionals verified by credentials and community trust.</p>
        </div>
        <button className="select-pill" onClick={() => showToast('Filter options')}>
          <SlidersHorizontal className="icon-sm" /> All expertise
        </button>
      </div>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">Recommended</div>
            <h2 className="serif">Verified professionals.</h2>
          </div>
        </div>

        <div className="pro-list">
          {professionals.map((pro, i) => (
            <div key={i} className="pro-card">
              <div className={`avatar ${pro.color}`}>{pro.initials}</div>
              <div className="pro-copy">
                <strong>{pro.name} <BadgeCheck className="icon-sm" style={{ color: 'var(--green)', verticalAlign: 'middle' }} /></strong>
                <p>{pro.expertise}</p>
                <span>{pro.location} · {pro.consultations} consultations · {pro.rating} rating</span>
              </div>
              <div className="pro-actions">
                <button className="follow" onClick={() => showToast(`Following ${pro.name}`)}>Follow</button>
                <button className="primary" onClick={() => showToast(`Request sent to ${pro.name}`)}>Request consult</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid2" style={{ marginTop: 14 }}>
        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">How it works</div>
              <h2 className="serif">How approval works.</h2>
            </div>
          </div>
          <div className="quick">
            <div className="quick-icon" style={{ background: 'var(--greenSoft)', color: 'var(--green)' }}>
              <FileCheck2 className="icon-sm" />
            </div>
            <div className="quick-copy">
              <strong>Credentials reviewed</strong>
              <p>Each professional submits credentials for manual verification by the KikwetuConnect team.</p>
            </div>
          </div>
          <div className="quick">
            <div className="quick-icon" style={{ background: 'var(--goldSoft)', color: 'var(--earth)' }}>
              <Users className="icon-sm" />
            </div>
            <div className="quick-copy">
              <strong>Community trust counted</strong>
              <p>Ratings, consultations, and peer endorsements contribute to a professional&apos;s trust score.</p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">For professionals</div>
              <h2 className="serif">Become an approved professional.</h2>
            </div>
          </div>
          <div className="quick">
            <div className="quick-icon" style={{ background: 'var(--earthSoft)', color: 'var(--earth)' }}>
              <BadgeCheck className="icon-sm" />
            </div>
            <div className="quick-copy">
              <strong>Apply to become approved</strong>
              <p>Submit your expertise, credentials, and references for review.</p>
            </div>
          </div>
          <div className="quick">
            <div className="quick-icon" style={{ background: 'var(--greenSoft)', color: 'var(--green)' }}>
              <CalendarDays className="icon-sm" />
            </div>
            <div className="quick-copy">
              <strong>Set your availability</strong>
              <p>Control when users can book private consultations with you.</p>
            </div>
          </div>
          <div className="quick">
            <div className="quick-icon" style={{ background: 'var(--goldSoft)', color: 'var(--gold)' }}>
              <Plus className="icon-sm" />
            </div>
            <div className="quick-copy">
              <strong>Receive tips</strong>
              <p>Earn tokens when users appreciate your guidance and insights.</p>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
