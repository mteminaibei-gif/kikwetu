'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import DesktopSidebar from '@/components/DesktopSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { timeAgo, cn, formatNumber } from '@/lib/utils';
import type { MarketplaceListing } from '@/types';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🏪' },
  { id: 'produce', label: 'Produce', icon: '🥬' },
  { id: 'services', label: 'Services', icon: '🔧' },
  { id: 'crafts', label: 'Crafts', icon: '🎨' },
  { id: 'livestock', label: 'Livestock', icon: '🐄' },
  { id: 'tools', label: 'Tools', icon: '🛠️' },
  { id: 'other', label: 'Other', icon: '📦' },
] as const;

const COUNTIES = [
  'All Counties', 'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Kiambu', 'Uasin Gishu',
  'Machakos', 'Kajiado', 'Kilifi', 'Kakamega', 'Bungoma', 'Meru', 'Nyeri', 'Other',
];

export default function MtaaPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('all');
  const [county, setCounty] = useState('All Counties');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'produce' as MarketplaceListing['category'],
    price: '',
    county: user?.county || 'Nairobi',
    location: '',
    contact_phone: user?.phone || '',
    contact_whatsapp: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sb = createClient();
      let q = sb
        .from('mtaa_listings')
        .select('*, seller:profiles(full_name, avatar_url, username, county, verified)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(40);
      if (category !== 'all') q = q.eq('category', category);
      if (county !== 'All Counties') q = q.eq('county', county);
      const { data, error: err } = await q;
      if (err) throw err;
      setListings((data || []) as MarketplaceListing[]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load listings';
      // Table may not exist yet — show friendly empty state
      if (msg.includes('relation') || msg.includes('does not exist')) {
        setListings([]);
        setError('Marketplace tables not applied yet. Run the latest Supabase migration.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [category, county]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const price = parseFloat(form.price);
    if (!form.title.trim() || !form.description.trim() || isNaN(price) || price < 0) {
      setError('Please fill title, description and a valid price.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const sb = createClient();
      const { error: err } = await sb.from('mtaa_listings').insert({
        seller_id: user.id,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        price,
        currency: 'KES',
        county: form.county,
        location: form.location || null,
        contact_phone: form.contact_phone || null,
        contact_whatsapp: form.contact_whatsapp || null,
        status: 'active',
      });
      if (err) throw err;
      setShowForm(false);
      setForm({
        title: '', description: '', category: 'produce', price: '',
        county: user.county || 'Nairobi', location: '', contact_phone: user.phone || '', contact_whatsapp: '',
      });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not create listing');
    } finally {
      setSubmitting(false);
    }
  };

  const markSold = async (id: string) => {
    if (!user) return;
    const sb = createClient();
    await sb.from('mtaa_listings').update({ status: 'sold', updated_at: new Date().toISOString() }).eq('id', id).eq('seller_id', user.id);
    load();
  };

  return (
    <div className="min-h-screen bg-brand-bgLight dark:bg-brand-bgDark">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6 pt-4 pb-24 md:pb-8">
        <DesktopSidebar />
        <main className="flex-1 min-w-0 max-w-3xl mx-auto w-full space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">Mtaa Exchange</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Local marketplace for produce, services & crafts</p>
            </div>
            {user && (
              <button
                onClick={() => setShowForm(v => !v)}
                className="shrink-0 bg-brand-red text-white px-4 py-2.5 rounded-full text-sm font-bold shadow-md hover:bg-brand-deep transition-all"
              >
                {showForm ? 'Cancel' : '+ Sell'}
              </button>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm border border-amber-200 dark:border-amber-800">
              {error}
            </div>
          )}

          {showForm && user && (
            <form onSubmit={handleCreate} className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3 shadow-sm">
              <h2 className="font-bold text-gray-900 dark:text-white">New listing</h2>
              <input
                required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Title (e.g. Fresh sukuma wiki — 10 bunches)"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/40"
              />
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe condition, quantity, delivery options…"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/40"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as MarketplaceListing['category'] }))}
                  className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                >
                  {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                  ))}
                </select>
                <div className="flex">
                  <span className="flex items-center px-3 bg-gray-100 dark:bg-gray-800 border border-r-0 border-gray-200 dark:border-gray-700 rounded-l-xl text-xs font-bold text-gray-500">KES</span>
                  <input
                    required
                    type="number"
                    min={0}
                    step="1"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="Price"
                    className="w-full p-3 rounded-r-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.county}
                  onChange={e => setForm(f => ({ ...f, county: e.target.value }))}
                  className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                >
                  {COUNTIES.filter(c => c !== 'All Counties').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="Area / market (optional)"
                  className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={form.contact_phone}
                  onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                  placeholder="Phone"
                  className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                />
                <input
                  value={form.contact_whatsapp}
                  onChange={e => setForm(f => ({ ...f, contact_whatsapp: e.target.value }))}
                  placeholder="WhatsApp (optional)"
                  className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50"
              >
                {submitting ? 'Posting…' : 'Post listing'}
              </button>
            </form>
          )}

          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={cn(
                  'px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all',
                  category === c.id
                    ? 'bg-brand-red text-white shadow'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                )}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>

          <select
            value={county}
            onChange={e => setCounty(e.target.value)}
            className="w-full sm:w-auto p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
          >
            {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {loading ? (
            <div className="text-center py-16 text-sm text-gray-500">Loading marketplace…</div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <p className="text-4xl">🛒</p>
              <p className="font-bold text-gray-800 dark:text-gray-200">No listings yet</p>
              <p className="text-sm text-gray-500">Be the first to sell produce, crafts or services in your county.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {listings.map(item => (
                <article
                  key={item.id}
                  className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-brand-warm text-brand-deep">
                      {item.category}
                    </span>
                    <span className="text-xs text-gray-400">{timeAgo(item.created_at)}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mt-2 line-clamp-2">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-3 flex-1">{item.description}</p>
                  <p className="text-lg font-black text-emerald-600 mt-3">
                    KES {formatNumber(item.price)}
                  </p>
                  <div className="flex items-center justify-between mt-3 text-[11px] text-gray-400">
                    <span>{item.county}{item.location ? ` · ${item.location}` : ''}</span>
                    <span>{item.seller?.full_name || 'Seller'}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {item.contact_whatsapp && (
                      <a
                        href={`https://wa.me/${item.contact_whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold"
                      >
                        WhatsApp
                      </a>
                    )}
                    {item.contact_phone && (
                      <a
                        href={`tel:${item.contact_phone}`}
                        className="flex-1 text-center py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold"
                      >
                        Call
                      </a>
                    )}
                    {user?.id === item.seller_id && (
                      <button
                        onClick={() => markSold(item.id)}
                        className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-500"
                      >
                        Sold
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
