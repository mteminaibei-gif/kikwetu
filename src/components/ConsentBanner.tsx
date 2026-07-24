'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ConsentPrefs {
  location: boolean;
  notifications: boolean;
  analytics: boolean;
  storage: boolean;
}

const STORAGE_KEY = 'kikwetu_consent';

const defaultPrefs: ConsentPrefs = {
  location: false,
  notifications: false,
  analytics: false,
  storage: false,
};

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState<ConsentPrefs>(defaultPrefs);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setVisible(true);
    } else {
      try { setPrefs(JSON.parse(stored)); } catch {}
    }
  }, []);

  const toggle = (key: keyof ConsentPrefs) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const acceptAll = () => {
    const all: ConsentPrefs = { location: true, notifications: true, analytics: true, storage: true };
    setPrefs(all);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    applyConsent(all);
    setVisible(false);
  };

  const acceptSelected = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    applyConsent(prefs);
    setVisible(false);
  };

  const declineAll = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPrefs));
    applyConsent(defaultPrefs);
    setVisible(false);
  };

  const applyConsent = (p: ConsentPrefs) => {
    if (p.location && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(() => {}, () => {});
    }
    if (p.notifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    if (p.storage) {
      try {
        localStorage.setItem('_kikwetu_cache_ok', '1');
      } catch {}
    }
    if (p.analytics) {
      try {
        localStorage.setItem('_kikwetu_analytics_ok', '1');
      } catch {}
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setExpanded(false)} />
      <div className="relative bg-white dark:bg-brand-cardDark rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg animate-fadeUp overflow-hidden">
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-terracotta/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold">KikwetuConnect Privacy</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                We use cookies, storage, and device permissions to enhance your experience — location for nearby communities, notifications for alerts, and storage for offline access.
              </p>
            </div>
          </div>

          {expanded && (
            <div className="space-y-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
              {([
                { key: 'location' as const, label: 'Location Access', desc: 'Find nearby Nyumba Kumi communities and events', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
                { key: 'notifications' as const, label: 'Notifications', desc: 'Get alerts for urgent neighborhood updates and replies', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
                { key: 'analytics' as const, label: 'Analytics & Cookies', desc: 'Help us improve with anonymous usage data', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                { key: 'storage' as const, label: 'Local Storage & Cache', desc: 'Store content offline and reduce data usage', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
              ]).map(({ key, label, desc, icon }) => (
                <label key={key} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">{label}</p>
                    <p className="text-[10px] text-gray-400">{desc}</p>
                  </div>
                  <div onClick={e => { e.preventDefault(); toggle(key); }}
                    className={cn(
                      'w-10 h-5 rounded-full relative transition-colors cursor-pointer shrink-0',
                      prefs[key] ? 'bg-brand-red' : 'bg-gray-300 dark:bg-gray-600'
                    )}>
                    <div className={cn(
                      'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
                      prefs[key] && 'translate-x-5'
                    )} />
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex flex-wrap gap-2">
          <button onClick={acceptAll}
            className="flex-1 sun-btn px-4 py-2.5 rounded-xl text-xs font-bold shadow-md whitespace-nowrap">
            Accept All
          </button>
          <button onClick={acceptSelected}
            className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all whitespace-nowrap">
            {expanded ? 'Save Preferences' : 'Customize'}
          </button>
          {expanded && (
            <button onClick={declineAll}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors whitespace-nowrap">
              Decline
            </button>
          )}
        </div>

        {!expanded && (
          <button onClick={() => setExpanded(true)}
            className="block w-full text-center pb-3 text-[10px] font-medium text-gray-400 hover:text-gray-600 transition-colors">
            Customize settings
          </button>
        )}
      </div>
    </div>
  );
}
