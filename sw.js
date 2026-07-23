/* ═══════════════════════════════════════════════════════════════════
   KikwetuConnect - Service Worker v2
   IndexedDB-backed offline cache + background sync
   ═══════════════════════════════════════════════════════════════════ */

const CACHE_VERSION = 'v3';
const STATIC_CACHE = `kc-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `kc-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `kc-images-${CACHE_VERSION}`;

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/supabase.js',
    '/offline.js',
    '/manifest.json',
    'https://cdn.jsdelivr.net/npm/dexie@3/dist/dexie.min.js',
    'https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

const CACHE_STRATEGIES = {
    static: [`.css`, `.js`, `.woff2`, `.woff`, `.ttf`],
    images: [`.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.ico`],
    api: [`/rest/v1/`, `/auth/v1/`, `/functions/v1/`]
};

// ═══ Install ═══
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS).catch(e => {
                    console.warn('[SW] Some assets failed to cache:', e);
                });
            })
            .then(() => self.skipWaiting())
    );
});

// ═══ Activate ═══
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => !k.includes(CACHE_VERSION))
                    .map(k => {
                        console.log('[SW] Deleting old cache:', k);
                        return caches.delete(k);
                    })
            )
        ).then(() => self.clients.claim())
    );
});

// ═══ Fetch Strategy ═══
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Supabase API requests - Network first with cache fallback
    if (url.hostname.includes('supabase') ||
        url.pathname.includes('/rest/') ||
        url.pathname.includes('/auth/') ||
        url.pathname.includes('/functions/')) {
        event.respondWith(networkFirst(event.request));
        return;
    }

    // Static assets - Cache first
    if (CACHE_STRATEGIES.static.some(ext => url.pathname.endsWith(ext))) {
        event.respondWith(cacheFirst(event.request));
        return;
    }

    // Images - Cache first with network fallback
    if (CACHE_STRATEGIES.images.some(ext => url.pathname.endsWith(ext))) {
        event.respondWith(cacheFirst(event.request, IMAGE_CACHE));
        return;
    }

    // Navigation requests - Network first with cache fallback
    if (event.request.mode === 'navigate') {
        event.respondWith(networkFirst(event.request));
        return;
    }

    // Default - Stale while revalidate
    event.respondWith(staleWhileRevalidate(event.request));
});

// ═══ Cache Strategies ═══

async function cacheFirst(request, cacheName = STATIC_CACHE) {
    try {
        const cached = await caches.match(request);
        if (cached) return cached;

        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch (e) {
        return caches.match(request);
    }
}

async function networkFirst(request, cacheName = DYNAMIC_CACHE) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch (e) {
        const cached = await caches.match(request);
        if (cached) return cached;

        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            const offlinePage = await caches.match('/index.html');
            return offlinePage || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        }

        return new Response('Offline', { status: 503 });
    }
}

async function staleWhileRevalidate(request, cacheName = DYNAMIC_CACHE) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    const fetchPromise = fetch(request).then(response => {
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(() => cached);

    return cached || fetchPromise;
}


// ═══ Background Sync ═══

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-pending-actions') {
        event.waitUntil(syncPendingActions());
    }
});

async function syncPendingActions() {
    try {
        // Open IndexedDB
        const dbRequest = indexedDB.open('KikwetuConnect', 1);

        return new Promise((resolve, reject) => {
            dbRequest.onsuccess = (event) => {
                const db = event.target.result;
                const tx = db.transaction('syncQueue', 'readwrite');
                const store = tx.objectStore('syncQueue');
                const index = store.index('synced');
                const request = index.getAll(0);

                request.onsuccess = async () => {
                    const pendingActions = request.result;
                    let syncedCount = 0;

                    for (const action of pendingActions) {
                        try {
                            await notifyClients({
                                type: 'SYNC_ACTION',
                                action: action
                            });
                            syncedCount++;
                        } catch (e) {
                            console.error('[SW] Failed to sync action:', action.id, e);
                        }
                    }

                    console.log(`[SW] Synced ${syncedCount} actions`);
                    resolve();
                };

                request.onerror = () => reject(request.error);
            };

            dbRequest.onerror = () => reject(dbRequest.error);
        });
    } catch (e) {
        console.error('[SW] syncPendingActions error:', e);
    }
}

async function notifyClients(message) {
    const clients = await self.clients.matchAll();
    for (const client of clients) {
        client.postMessage(message);
    }
}


// ═══ Push Notifications ═══

self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body || '',
        icon: data.icon || '/icon-192.png',
        badge: '/icon-192.png',
        tag: data.tag || 'kikwetu-notification',
        renotify: true,
        vibrate: [100, 50, 100],
        data: data.data || {},
        actions: data.actions || []
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'KikwetuConnect', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const action = event.action;
    const data = event.notification.data;

    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then(clients => {
            if (clients.length > 0) {
                clients[0].focus();
                clients[0].postMessage({
                    type: 'NOTIFICATION_CLICK',
                    action: action,
                    data: data
                });
            } else {
                self.clients.openWindow(data.url || '/');
            }
        })
    );
});


// ═══ Message Handler ═══

self.addEventListener('message', (event) => {
    const { type, payload } = event.data;

    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
        case 'CACHE_THREADS':
            cacheThreads(payload);
            break;
        case 'CLEAR_CACHE':
            clearAllCaches();
            break;
    }
});

async function cacheThreads(threads) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const threadData = JSON.stringify(threads);
    const response = new Response(threadData, {
        headers: { 'Content-Type': 'application/json' }
    });
    await cache.put('/api/threads-cache', response);
}

async function clearAllCaches() {
    const keys = await caches.keys();
    for (const key of keys) {
        await caches.delete(key);
    }
    console.log('[SW] All caches cleared');
}
