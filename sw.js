const CACHE_NAME = 'eclc-v1';
const ASSETS = [
    '/',
    'index.html',
    'styles.css',
    'app.js',
    'devotions.json',
    'assets/images/eclc-logo.png',
    'assets/icons/eclc-logo192-test.png',
    'assets/icons/eclc-logo512-test.png',
    'manifest.json'
];

self.addEventListener('install', evt => {
    evt.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', evt => {
    evt.respondWith(
        caches.match(evt.request).then(cachedRes => cachedRes || fetch(evt.request))
    );
});
