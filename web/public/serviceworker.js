/**
 * A KILL SWITCH, not a service worker. Nothing on this site registers it.
 *
 * ── WHY IT EXISTS ────────────────────────────────────────────────────────────
 *
 * The 11ty build registered a worker at this exact URL, and it was cache-first: it answered
 * every request from its cache when it could, and its precache held that build's `/index.html`,
 * its CSS, its fonts and `/manifest.json`. The Astro build shipped nothing here, so the URL
 * returned 404 — and a 404 does NOT unregister a worker. That was proposed and declined
 * (w3c/ServiceWorker#204), so every browser that had visited the old site kept it, starting it
 * up on every page load of the new one.
 *
 * Mostly harmless, because its cache keys are 11ty paths the Astro site never requests. Two
 * exceptions: offline, it answers with the old home page; and an app INSTALLED from the old
 * manifest launches at `/index.html`, which is in that cache — so the installed app opened the
 * old site, and could not update itself, because the page it opened linked the cached manifest.
 *
 * ── HOW IT REACHES THEM ──────────────────────────────────────────────────────
 *
 * A browser holding a registration re-fetches the registration's script on navigation,
 * bypassing the HTTP cache, and installs whatever it gets if the bytes differ. So serving this
 * file at the old URL reaches exactly the browsers that need it, on their next visit, and no
 * others: a browser without the registration never asks for it.
 *
 * `skipWaiting()` activates it at once rather than after every tab has closed. On activation it
 * deletes every cache and unregisters. There is deliberately no `fetch` listener, so for the
 * moment it is in control, requests go straight to the network.
 *
 * ── WHAT IT DELIBERATELY DOES NOT DO ─────────────────────────────────────────
 *
 * It does not reload open windows, which the usual self-destroying-worker recipe does. The old
 * worker sent every page but `/index.html` to the network, so the page a returning visitor is
 * reading is almost always current. Reloading it mid-read to fix one rare case is a bad trade,
 * and the next navigation is clean either way.
 *
 * Nor is it `Clear-Site-Data: "storage"`, the header-only alternative. That also wipes
 * localStorage, which is where the theme toggle keeps its choice.
 *
 * ── HOW LONG IT STAYS ────────────────────────────────────────────────────────
 *
 * Indefinitely. It costs nothing — only a browser still holding the old registration ever
 * requests it — and there is no way to know when the last one has come back. If phase 8 ships a
 * real worker, it can live at this URL and replace this file in the same motion.
 */

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(names.map((name) => caches.delete(name)))
      await self.registration.unregister()
    })(),
  )
})
