// When the browser requests a file ...
addEventListener('fetch', fetchEvent => {
  const request = fetchEvent.request;
  fetchEvent.respondWith( 
    // First, look in the cache
    caches.match(request, {cacheName:staticCacheAFC,ignoreVary:true})
    .then( responseFromCache => {
      if (responseFromCache) {
        return responseFromCache;
      } // end if
      // otherwise, fetch from network
      return fetch(request)
      .catch( error => {
        // show the offline page
        return caches.match('/index.html');
        // replace with offline page when I reintroduce this
        // return caches.match('/offline/index.html');

      }); // end fetch catch and return
    }) // end match then 
  ); // end respondWith
}); // end addEventListener

const version = 'v0.74';
const staticCacheAFC = version + 'staticfiles';

addEventListener('install', installEvent => {
  skipWaiting();
  installEvent.waitUntil(
    caches.open(staticCacheAFC)
    .then( staticCache => {
      staticCache.addAll([  // nice to have
        '/js/afc.js'
        ]); // end nice to have
      return staticCache.addAll([ // must have
        '/style/style.css',
        // '/offline/index.html',
        '/index.html',
        '/manifest.json',
        '/fonts/lato-v16-latin-300.eot',
        '/fonts/lato-v16-latin-300.woff2',
        '/fonts/lato-v16-latin-300.woff',
        '/fonts/lato-v16-latin-300.ttf',
        '/fonts/lato-v16-latin-300.svg',
        '/fonts/lato-v16-latin-regular.eot',
        '/fonts/lato-v16-latin-regular.woff2',
        '/fonts/lato-v16-latin-regular.woff',
        '/fonts/lato-v16-latin-regular.ttf',
        '/fonts/lato-v16-latin-regular.svg',
        '/fonts/lato-v16-latin-700.eot',
        '/fonts/lato-v16-latin-700.woff2',
        '/fonts/lato-v16-latin-700.woff',
        '/fonts/lato-v16-latin-700.ttf',
        '/fonts/lato-v16-latin-700.svg',
        '/fonts/open-sans-v17-latin-300.eot',
        '/fonts/open-sans-v17-latin-300.woff2',
        '/fonts/open-sans-v17-latin-300.woff',
        '/fonts/open-sans-v17-latin-300.ttf',
        '/fonts/open-sans-v17-latin-300.svg',
        '/fonts/open-sans-v17-latin-regular.eot',
        '/fonts/open-sans-v17-latin-regular.woff2',
        '/fonts/open-sans-v17-latin-regular.woff',
        '/fonts/open-sans-v17-latin-regular.ttf',
        '/fonts/open-sans-v17-latin-regular.svg',
        '/fonts/open-sans-v17-latin-600.eot',
        '/fonts/open-sans-v17-latin-600.woff2',
        '/fonts/open-sans-v17-latin-600.woff',
        '/fonts/open-sans-v17-latin-600.ttf',
        '/fonts/open-sans-v17-latin-600.svg'
        ]); // end return addAll / must have
      }) // end open caches / then
  ); // end waitUntil
}); // end addEventListener

addEventListener('activate', activateEvent => {
  activateEvent.waitUntil(
    caches.keys()
    .then( cacheNames => {
      return Promise.all(
        cacheNames.map( cacheName => {
          if (cacheName != staticCacheAFC) {
            return caches.delete(cacheName);
          } // end if 
        }) // end map
      ); // end return Promise.all
    }) // end keys then
    .then( () => {
      return clients.claim();
    }) // end then
  ); // end waitUntil
}); // end addEventListener