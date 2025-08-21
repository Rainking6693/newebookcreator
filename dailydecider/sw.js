const CACHE_NAME = 'daily-decider-v1.0.0';
const STATIC_CACHE = 'daily-decider-static-v1.0.0';
const DYNAMIC_CACHE = 'daily-decider-dynamic-v1.0.0';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/app.js',
  '/src/decision-engine.js',
  '/src/sentiment-analyzer.js',
  '/src/temporal-processor.js',
  '/src/pattern-matcher.js',
  '/src/compliment-engine.js',
  '/src/analytics.js',
  '/data/compliments.json',
  '/data/schema.json'
];

const CACHE_STRATEGIES = {
  'cache-first': ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2'],
  'network-first': ['.json', '.html'],
  'network-only': ['/api/', '/analytics']
};

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      }),
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - handle network requests with appropriate caching strategy
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different caching strategies
  if (shouldUseNetworkOnly(url)) {
    event.respondWith(networkOnly(request));
  } else if (shouldUseCacheFirst(url)) {
    event.respondWith(cacheFirst(request));
  } else if (shouldUseNetworkFirst(url)) {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Caching strategy functions
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('Cache first failed:', error);
    return new Response('Offline content not available', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return createOfflineResponse();
    }
    
    return new Response('Network unavailable', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(error => {
    console.error('Network request failed:', error);
    return cached || new Response('Content not available', { status: 503 });
  });
  
  return cached || await fetchPromise;
}

async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.error('Network only request failed:', error);
    return new Response(JSON.stringify({ error: 'Network unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Strategy determination functions
function shouldUseCacheFirst(url) {
  return CACHE_STRATEGIES['cache-first'].some(ext => 
    url.pathname.endsWith(ext) || url.pathname.includes(ext)
  );
}

function shouldUseNetworkFirst(url) {
  return CACHE_STRATEGIES['network-first'].some(ext => 
    url.pathname.endsWith(ext) || url.pathname.includes(ext)
  );
}

function shouldUseNetworkOnly(url) {
  return CACHE_STRATEGIES['network-only'].some(path => 
    url.pathname.includes(path)
  );
}

// Background sync for analytics
self.addEventListener('sync', event => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalytics());
  } else if (event.tag === 'compliment-prefetch') {
    event.waitUntil(prefetchCompliments());
  }
});

async function syncAnalytics() {
  try {
    // Get pending analytics data from IndexedDB
    const pendingData = await getPendingAnalytics();
    
    if (pendingData.length > 0) {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: pendingData })
      });
      
      if (response.ok) {
        await clearPendingAnalytics();
        console.log('Analytics synced successfully');
      }
    }
  } catch (error) {
    console.error('Analytics sync failed:', error);
  }
}

async function prefetchCompliments() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    await cache.add('/data/compliments.json');
    console.log('Compliments prefetched');
  } catch (error) {
    console.error('Compliment prefetch failed:', error);
  }
}

// Push notifications
self.addEventListener('push', event => {
  console.log('Push notification received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Time for your daily decision guidance!',
    icon: '/assets/icon-192.png',
    badge: '/assets/badge-72.png',
    tag: 'daily-decider-notification',
    renotify: true,
    requireInteraction: false,
    actions: [
      {
        action: 'decide',
        title: 'Make a Decision',
        icon: '/assets/decision-icon-32.png'
      },
      {
        action: 'compliment',
        title: 'Get Compliment',
        icon: '/assets/compliment-icon-32.png'
      }
    ],
    data: {
      url: '/',
      timestamp: Date.now()
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Daily Decider', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const action = event.action;
  let url = '/';
  
  if (action === 'decide') {
    url = '/?action=decide';
  } else if (action === 'compliment') {
    url = '/?action=compliment';
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            client.postMessage({ action: action || 'open' });
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Message handling from main thread
self.addEventListener('message', event => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CACHE_COMPLIMENTS') {
    event.waitUntil(prefetchCompliments());
  } else if (event.data && event.data.type === 'SYNC_ANALYTICS') {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      self.registration.sync.register('analytics-sync');
    }
  }
});

// Periodic background sync for compliment prefetching
self.addEventListener('periodicsync', event => {
  if (event.tag === 'daily-compliment-refresh') {
    event.waitUntil(prefetchCompliments());
  }
});

// Utility functions for offline functionality
function createOfflineResponse() {
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily Decider - Offline</title>
        <style>
            body { 
                font-family: 'Inter', sans-serif; 
                text-align: center; 
                padding: 50px 20px; 
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                color: #1e293b;
            }
            .offline-container {
                max-width: 500px;
                margin: 0 auto;
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.1);
            }
            h1 { color: #6366f1; margin-bottom: 20px; }
            .emoji { font-size: 4rem; margin-bottom: 20px; }
            button { 
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 12px;
                font-size: 16px;
                cursor: pointer;
                margin-top: 20px;
            }
            button:hover { transform: translateY(-1px); }
        </style>
    </head>
    <body>
        <div class="offline-container">
            <div class="emoji">🌐</div>
            <h1>You're Offline</h1>
            <p>Don't worry! Daily Decider works offline too. Some features may be limited, but you can still make decisions and get compliments from your cached content.</p>
            <button onclick="window.location.reload()">Try Again</button>
        </div>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// IndexedDB utilities for analytics storage
async function getPendingAnalytics() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DailyDeciderDB', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['analytics'], 'readonly');
      const store = transaction.objectStore('analytics');
      const getRequest = store.getAll();
      
      getRequest.onsuccess = () => resolve(getRequest.result || []);
      getRequest.onerror = () => reject(getRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('analytics')) {
        db.createObjectStore('analytics', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

async function clearPendingAnalytics() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DailyDeciderDB', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['analytics'], 'readwrite');
      const store = transaction.objectStore('analytics');
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    };
  });
}

console.log('Daily Decider Service Worker loaded and ready!');