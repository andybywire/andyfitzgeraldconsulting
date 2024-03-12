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

const version = 'v0.76';
const staticCacheAFC = version + 'staticfiles';

addEventListener('install', installEvent => {
  skipWaiting();
  installEvent.waitUntil(
    caches.open(staticCacheAFC)
    .then( staticCache => {
      // staticCache.addAll([  // nice to have
      //   '/js/afc.js'
      //   ]); // end nice to have
      return staticCache.addAll([ // must have
        '/style/style.css',
        // '/offline/index.html',
        '/index.html',
        // '/manifest.json',
        '/assets/fonts/Lato-Bold.woff2',
        '/assets/fonts/Lato-Medium.woff2',
        '/assets/fonts/Lato-Regular.woff2',
        '/assets/fonts/NotoSerif-Italic-VariableFont_wdth,wght.woff2',
        '/assets/fonts/NotoSerif-VariableFont_wdth,wght.woff2',
        '/assets/fonts/OpenSans-Italic-VariableFont_wdth,wght.woff2',
        '/assets/fonts/OpenSans-VariableFont_wdth,wght.woff2',
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