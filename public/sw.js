// Kill-switch service worker.
//
// The previous Ember site registered a service worker at this exact path
// (ember-service-worker, with esw-index in "fallback" mode) which intercepts
// navigation requests and answers them from a cached index.html. Every browser
// that ever visited the old site still has it registered, and it shadows the
// new site — which is why a fresh browser works, a hard refresh appears to fix
// things, and both Chrome and Firefox are affected.
//
// Simply deleting the file is not enough: when the update fetch 404s, browsers
// can leave the existing worker in place. So this serves a valid worker that
// tears itself down — it claims no fetch handler, clears every cache, then
// unregisters and reloads any open tabs.
//
// Keep this file until returning-visitor traffic has cycled through; removing
// it too early strands anyone who has not been back since the migration.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))

      await self.registration.unregister()

      // Reload open tabs so they leave the old cached shell behind.
      const clients = await self.clients.matchAll({ type: 'window' })
      for (const client of clients) {
        client.navigate(client.url)
      }
    })(),
  )
})
