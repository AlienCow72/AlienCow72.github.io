// Retire the service worker from the previous GitProfile PWA, if installed.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.registration.unregister());
});
