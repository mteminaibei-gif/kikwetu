'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import {
  createListing,
  markListingSold,
  toggleSave,
  checkSaved,
  createConversation,
} from '@/lib/supabase-helpers';
import {
  Store, Plus, MapPin, Star, MessageCircle, Heart, MoreHorizontal,
  Filter, Search, ExternalLink, ChevronRight,
} from 'lucide-react';

const categories = [
  { key: 'all', label: 'All' },
  { key: 'produce', label: 'Produce' },
  { key: 'services', label: 'Services' },
  { key: 'crafts', label: 'Crafts' },
  { key: 'electronics', label: 'Electronics' },
  { key: 'other', label: 'Other' },
];

const MOCK_LISTINGS = [
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
    is_available: true,
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
    is_available: true,
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
    is_available: true,
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
    is_available: true,
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
    is_available: true,
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
    is_available: true,
  },
];

type Listing = typeof MOCK_LISTINGS[number];

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

function ListingCard({
  listing,
  currentUserId,
  onAction,
  onContact,
  onMarkSold,
  onToggleSave,
  saved,
}: {
  listing: Listing;
  currentUserId: string | null;
  onAction: (msg: string) => void;
  onContact: (listing: Listing) => void;
  onMarkSold: (listing: Listing) => void;
  onToggleSave: (listing: Listing) => void;
  saved: boolean;
}) {
  const [liked, setLiked] = useState(saved);

  useEffect(() => {
    setLiked(saved);
  }, [saved]);

  const isOwn = currentUserId && currentUserId === (listing as any).seller_id;

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
        opacity: listing.is_available === false ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--green)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)';
      }}
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
          onClick={(e) => { e.stopPropagation(); setLiked(!liked); onToggleSave(listing); }}
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
          <span style={{ padding: '2px 6px', borderRadius: 99, background: 'var(--greenSoft)', color: 'var(--green)', fontSize: '.55rem', fontWeight: 800 }}>
            Verified
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--green2)' }}>
            KSh {listing.price.toLocaleString()}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {isOwn ? (
              <button
                className="secondary"
                onClick={(e) => { e.stopPropagation(); onMarkSold(listing); }}
                style={{ gap: 5, fontSize: '.68rem', minHeight: 32, opacity: listing.is_available === false ? 0.5 : 1 }}
                disabled={listing.is_available === false}
              >
                {listing.is_available === false ? 'Sold' : 'Mark Sold'}
              </button>
            ) : (
              <button
                className="primary"
                onClick={(e) => { e.stopPropagation(); onContact(listing); }}
                style={{ gap: 5, fontSize: '.68rem', minHeight: 32 }}
              >
                <MessageCircle className="icon-sm" /> Contact
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function MtaaExchange() {
  const { user, showToast } = useApp();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>(MOCK_LISTINGS);
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('produce');
  const [newLocation, setNewLocation] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const { data, error } = await supabase
          .from('marketplace_listings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        if (data && data.length > 0) {
          setListings(data.map((item: any, idx: number) => ({
            id: item.id ?? idx,
            title: item.title ?? 'Untitled',
            price: item.price ?? 0,
            location: item.location ?? '',
            seller: {
              name: item.seller_name ?? 'Unknown',
              initials: item.seller_name ? item.seller_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U',
              color: ['earth', 'blue', 'green'][idx % 3] as string,
            },
            rating: item.rating ?? 4.5,
            category: item.category ?? 'other',
            color: 'var(--greenSoft)',
            tag: item.category ?? 'Other',
            tagColor: 'var(--greenSoft)',
            tagText: 'var(--green)',
            is_available: item.is_available !== false,
            seller_id: item.seller_id ?? null,
          })));
        }

        if (user) {
          const savedIds: Record<string, boolean> = {};
          for (const l of MOCK_LISTINGS) {
            const isSaved = await checkSaved(user.id, 'listing', String(l.id));
            savedIds[String(l.id)] = isSaved;
          }
          setSavedMap(savedIds);
        }
      } catch {
        // fallback to mock
      }
      setLoading(false);
    }
    init();
  }, []);

  async function handleCreateListing() {
    if (!user || !newTitle.trim()) {
      showToast('Please fill in the title');
      return;
    }
    setCreating(true);
    const { data, error } = await createListing(
      user.id,
      newTitle,
      newDescription,
      Number(newPrice) || 0,
      newCategory,
      newLocation,
    );
    setCreating(false);

    if (!error && data) {
      const newList: Listing = {
        id: data.id,
        title: data.title,
        price: data.price,
        location: data.location || '',
        seller: {
          name: user.full_name || 'You',
          initials: user.full_name ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'Y',
          color: 'earth',
        },
        rating: 4.5,
        category: data.category || 'other',
        color: 'var(--greenSoft)',
        tag: data.category || 'Other',
        tagColor: 'var(--greenSoft)',
        tagText: 'var(--green)',
        is_available: true,
      };
      setListings((prev) => [newList, ...prev]);
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewPrice('');
      setNewLocation('');
      showToast('Listing created');
    } else {
      showToast('Failed to create listing');
    }
  }

  async function handleContact(sellerListing: Listing) {
    if (!user) {
      showToast('Sign in to contact seller');
      return;
    }
    const sellerId = (sellerListing as any).seller_id;
    if (sellerId && sellerId === user.id) {
      showToast('This is your listing');
      return;
    }
    if (sellerId) {
      const { data } = await createConversation([user.id, sellerId], `Hi, I'm interested in "${sellerListing.title}"`);
      if (data) {
        showToast('Conversation started');
      } else {
        showToast('Could not start conversation');
      }
    } else {
      showToast(`Chat with ${sellerListing.seller.name}`);
    }
  }

  async function handleMarkSold(listing: Listing) {
    const { error } = await markListingSold(String(listing.id));
    if (!error) {
      setListings((prev) =>
        prev.map((l) =>
          l.id === listing.id ? { ...l, is_available: false } : l
        )
      );
      showToast('Marked as sold');
    } else {
      showToast('Failed to mark as sold');
    }
  }

  async function handleToggleSave(listing: Listing) {
    if (!user) {
      showToast('Sign in to save');
      return;
    }
    const result = await toggleSave(user.id, 'listing', String(listing.id));
    setSavedMap((prev) => ({ ...prev, [String(listing.id)]: result }));
    showToast(result ? 'Saved' : 'Removed from saved');
  }

  const filtered = listings.filter((l) => {
    const matchCategory = activeCategory === 'all' || l.category === activeCategory;
    const matchSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  if (loading) {
    return (
      <AppLayout>
        <div className="page-head">
          <div>
            <div className="eyebrow">Mtaa Exchange</div>
            <h1 className="serif">Trade local. Keep value close.</h1>
            <p>Buy and sell goods and services in your neighborhood.</p>
          </div>
        </div>
        <div className="section">
          <div style={{ opacity: 0.5, padding: 20, textAlign: 'center' }}>Loading listings...</div>
        </div>
      </AppLayout>
    );
  }

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

      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow" style={{ color: 'var(--gold)' }}>Your local marketplace</div>
          <h1 className="serif">Good things are already nearby.</h1>
          <p>Buy from neighbours, discover trusted services, and keep more value inside the community. Sellers keep their phone private until they choose to connect.</p>
          <div className="hero-actions">
            <button className="gold" onClick={() => showToast('Showing listings near Nairobi')}>
              <MapPin className="icon-sm" /> Near Nairobi
            </button>
            <button onClick={() => showToast('Saved listings opened')}>
              <Heart className="icon-sm" /> Saved listings
            </button>
          </div>
        </div>
      </section>

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
                onClick={() => { setActiveCategory(c.key); }}
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
        <div
          className="alert calm"
          style={{ cursor: 'pointer' }}
          onClick={() => setShowCreateModal(true)}
        >
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
            <ListingCard
              key={listing.id}
              listing={listing}
              currentUserId={user?.user_id || null}
              onAction={showToast}
              onContact={handleContact}
              onMarkSold={handleMarkSold}
              onToggleSave={handleToggleSave}
              saved={savedMap[String(listing.id)] || false}
            />
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

      {showCreateModal && (
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
          onClick={() => setShowCreateModal(false)}
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
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16 }}>Create a listing</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '.75rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Title *</label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="What are you selling?"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '.75rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe your item or service"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '.75rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Price (KSh)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="0"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '.75rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)' }}
                  >
                    {categories.filter((c) => c.key !== 'all').map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '.75rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Location</label>
                <input
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. Nairobi, Westlands"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
              <button className="secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="primary" onClick={handleCreateListing} disabled={creating}>
                {creating ? 'Creating...' : 'Create listing'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
