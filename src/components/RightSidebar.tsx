'use client';

import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import Icon from '@/components/Icon';

export default function RightSidebar() {
  const { spaces } = useApp();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <aside className="sidebar right-sidebar">
      <section className="right-block">
        <div className="eyebrow">County pulse</div>
        <h3 className="serif">Worth your attention.</h3>
        <div className="right-list">
          <div className="right-item">
            <div className="quick-icon" style={{ width: 28, height: 28 }}><Icon name="droplets" className="icon-sm" /></div>
            <div className="right-copy">
              <strong>Water-saving tips</strong>
              <span>2.4k readers &middot; Makueni</span>
            </div>
          </div>
          <div className="right-item">
            <div className="quick-icon" style={{ width: 28, height: 28 }}><Icon name="graduation-cap" className="icon-sm" /></div>
            <div className="right-copy">
              <strong>Bursary deadlines</strong>
              <span>1.8k readers &middot; Education</span>
            </div>
          </div>
          <div className="right-item">
            <div className="quick-icon" style={{ width: 28, height: 28 }}><Icon name="ship-wheel" className="icon-sm" /></div>
            <div className="right-copy">
              <strong>Mombasa port update</strong>
              <span>940 readers &middot; Mombasa</span>
            </div>
          </div>
        </div>
      </section>

      <section className="right-block">
        <div className="tip-card">
          <div className="eyebrow" style={{ color: 'var(--color-earth)' }}>Good guidance is mutual</div>
          <h3 className="serif">Remember to tip well.</h3>
          <p>Tips thank professionals and help keep expert time accessible across Kenya.</p>
          <button data-route="wallet">Open wallet</button>
        </div>
      </section>

      <section className="right-block">
        <div className="eyebrow">Approved voices</div>
        <h3 className="serif">People students trust.</h3>
        <div className="right-list">
          <div className="right-item">
            <div className="avatar sm earth">NW</div>
            <div className="right-copy">
              <strong>Njeri Wambui <span className="verified">&#10003;</span></strong>
              <span>Urban farming &middot; 4.9</span>
            </div>
            <button className="follow-btn">Follow</button>
          </div>
          <div className="right-item">
            <div className="avatar sm blue">JO</div>
            <div className="right-copy">
              <strong>James Otieno <span className="verified">&#10003;</span></strong>
              <span>Solar systems &middot; 4.8</span>
            </div>
            <button className="follow-btn">Follow</button>
          </div>
        </div>
      </section>
    </aside>
  );
}
