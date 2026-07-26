'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import {
  Store, Plus, MapPin, Star, MessageCircle, Heart, MoreHorizontal,
  Filter, Search, ExternalLink, ChevronRight
} from 'lucide-react';

const categories = [
  { key: 'all', label: 'All' },
  { key: 'produce', label: 'Produce' },
  { key: 'services', label: 'Services' },
  { key: 'crafts', label: 'Crafts' },
  { key: 'electronics', label: 'Electronics' },
  { key: 'other', label: 'Other' },
];

const listings = [
  {
    id: 1,
    title: 'Fresh sukuma wiki bundle',
    price: 150,
    location: 'Ruiru, Kiambu',
    seller: { name: 'Amina Muthoni', initials: 'AM', color: 'earth' },
    rating: 4.8,
    category: 'produce',
    color: 'var(--greenSoft)',
    tag: 'Fresh',
    tagColor: 'var(--greenSoft)',
    tagText: 'var(--green)',
  },
  {
    id: 2,
    title: 'Solar panel cleaning service',
    price: 2000,
    location: 'Nakuru',
    seller: { name: 'James Otieno', initials: 'JO', color: 'blue' },
    rating: 4.9,
    category: 'services',
    color: 'var(--goldSoft)',
    tag: 'Service',
    tagColor: 'var(--goldSoft)',
    tagText: 'var(--earth)',
  },
  {
    id: 3,
    title: 'Handwoven kiondo basket',
    price: 800,
    location: 'Machakos',
    seller: { name: 'Njeri Wambui', initials: 'NW', color: 'green' },
    rating: 4.7,
    category: 'crafts',
    color: 'var(--earthSoft)',
    tag: 'Handmade',
    tagColor: 'var(--earthSoft)',
    tagText: 'var(--earth)',
  },
  {
    id: 4,
    title: 'Used iPhone 12',
    price: 25000,
    location: 'Nairobi',
    seller: { name: 'Brian Kipchoge', initials: 'BK', color: 'blue' },
    rating: 4.5,
    category: 'electronics',
    color: 'var(--blueSoft)',
    tag: 'Used',
    tagColor: 'var(--blueSoft)',
    tagText: 'var(--blue)',
  },
  {
    id: 5,
    title: 'Fresh mangoes (1kg)',
    price: 200,
    location: 'Mombasa',
    seller: { name: 'Fatma Ali', initials: 'FA', color: 'earth' },
    rating: 4.6,
    category: 'produce',
    color: 'var(--greenSoft)',
    tag: 'Fresh',
    tagColor: 'var(--greenSoft)',
    tagText: 'var(--green)',
  },
  {
    id: 6,
    title: 'Plumbing services',
    price: 1500,
    location: 'Kisumu',
    seller: { name: 'Omondi Owino', initials: 'OO', color: 'green' },
    rating: 4.8,
    category: 'services',
    color: 'var(--goldSoft)',
    tag: 'Service',
    tagColor: 'var(--goldSoft)',
    tagText: 'var(--earth)',
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 6 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className="icon-sm"
          style={{
            color: s <= Math.round(rating) ? 'var(--gold)' : 'var(--line2)',
            fill: s <= Math.round(rating) ? 'var(--gold)' : 'none',
          }}
        />
      ))}
      <span style={{ fontSize: '.68rem', color: 'var(--text3)', marginLeft: 4 }}>{rating}</span>
    </div>
  );
}

function ListingCard({ listing, onAction }: { listing: typeof listings[0]; onAction: (msg: string) => void }) {
  const [liked, setLiked] = useState(false);

  return (
    <article
      style={{
        border: '1px solid var(--line)',
        borderRadius: 16,
        background: 'var(--surface)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow1)',
        transition: 'transform .18s var(--ease), border-color .18s var(--ease)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--green)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)';
      }}
      onClick={() => onAction(`Viewing ${listing.title}`)}
    >
      <div
        style={{
          height: 140,
          background: listing.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Store className="icon-lg" style={{ color: 'var(--text3)', opacity: .4 }} />
        <span
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            padding: '4px 8px',
            borderRadius: 99,
            background: listing.tagColor,
            color: listing.tagText,
            fontSize: '.6rem',
            fontWeight: 800,
          }}
        >
          {listing.tag}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); setLiked(!liked); onAction(liked ? 'Removed from saved' : 'Saved'); }}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 30,
            height: 30,
            borderRadius: '50%',
            border: 0,
            display: 'grid',
            placeItems: 'center',
            background: 'var(--surface)',
            color: liked ? 'var(--red)' : 'var(--text3)',
            cursor: 'pointer',
            boxShadow: 'var(--shadow1)',
          }}
        >
          <Heart className="icon-sm" style={{ fill: liked ? 'var(--red)' : 'none' }} />
        </button>
      </div>

      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <h3 style={{ fontSize: '.92rem', lineHeight: 1.25 }}>{listing.title}</h3>
          <button
            onClick={(e) => e.stopPropagation()}
            style={{ width: 28, height: 28, border: 0, borderRadius: 8, background: 'transparent', color: 'var(--text3)', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}
          >
            <MoreHorizontal className="icon-sm" />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, color: 'var(--text3)', fontSize: '.7rem' }}>
          <MapPin className="icon-sm" style={{ color: 'var(--green)' }} />
          {listing.location}
        </div>

        <StarRating rating={listing.rating} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
          <div className={`avatar sm ${listing.seller.color}`}>{listing.seller.initials}</div>
          <span style={{ fontSize: '.72rem', color: 'var(--text2)', fontWeight: 700 }}>{listing.seller.name}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--green2)' }}>
            KSh {listing.price.toLocaleString()}
          </span>
          <button
            className="primary"
            onClick={(e) => { e.stopPropagation(); onAction(`Chat with ${listing.seller.name}`); }}
            style={{ gap: 5, fontSize: '.68rem', minHeight: 32 }}
          >
            <MessageCircle className="icon-sm" /> Contact
          </button>
        </div>
      </div>
    </article>
  );
}

export default function MtaaExchange() {
  const { showToast } = useApp();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = listings.filter((l) => {
    const matchCategory = activeCategory === 'all' || l.category === activeCategory;
    const matchSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <AppLayout>
      <div className="page-head">
        <div>
          <div className="eyebrow">Mtaa Exchange</div>
          <h1 className="serif">Trade local. Keep value close.</h1>
          <p>Buy and sell goods and services in your neighborhood. Every shilling stays in the community.</p>
        </div>
        <button className="select-pill">
          <MapPin className="icon-sm" /> Nairobi <ChevronRight className="icon-sm" />
        </button>
      </div>

      <section className="section" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search" style={{ flex: 1, minWidth: 200 }}>
            <Search className="icon-sm" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search listings..."
            />
          </div>
          <div style={{ display: 'flex', gap: 7, overflow: 'auto' }}>
            {categories.map((c) => (
              <button
                key={c.key}
                className={activeCategory === c.key ? 'primary' : 'secondary'}
                onClick={() => { setActiveCategory(c.key); showToast(`Filter: ${c.label}`); }}
                style={{ whiteSpace: 'nowrap', fontSize: '.7rem', minHeight: 34 }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ marginBottom: 14 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow">Alerts</div>
          </div>
        </div>
        <div className="alert calm" style={{ cursor: 'pointer' }} onClick={() => showToast('Listing tips opened')}>
          <div className="alert-icon" style={{ color: 'var(--green)', background: 'var(--greenSoft)' }}>
            <Store className="icon-sm" />
          </div>
          <div className="alert-copy">
            <strong>Sell on Mtaa Exchange</strong>
            <p>List your goods or services and reach neighbors who want to buy local.</p>
            <span><Plus className="icon-sm" style={{ display: 'inline', verticalAlign: 'middle' }} /> Create a listing</span>
          </div>
        </div>
      </section>

      <section>
        <div className="section-head">
          <div>
            <div className="eyebrow">{filtered.length} listings</div>
            <h2 className="serif">What your neighborhood has.</h2>
          </div>
          <button className="secondary" style={{ fontSize: '.7rem' }}>
            <Filter className="icon-sm" /> Sort
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 14,
          }}
        >
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} onAction={showToast} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="empty">
            <div className="empty-icon">
              <Store className="icon-lg" />
            </div>
            <h3>No listings found</h3>
            <p>Try a different category or search term.</p>
          </div>
        )}
      </section>

      <div className="alert" style={{ marginTop: 18, cursor: 'pointer' }} onClick={() => showToast('Safety tips opened')}>
        <div className="alert-icon">
          <ExternalLink className="icon-sm" />
        </div>
        <div className="alert-copy">
          <strong>Safety first</strong>
          <p>Meet in public spaces. Use M-Pesa for secure payments. Never share your PIN.</p>
        </div>
      </div>
    </AppLayout>
  );
}
