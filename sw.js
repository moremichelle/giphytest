// SW version
/*
 * Example
 * of Project
 */

// const version = '1.0';
//
// // Static Cache - App Shell
// const appAssets = [
//   'index.html',
//   'main.js',
//   'images/flame.png',
//   'images/logo.png',
//   'images/sync.png',
//   'vendor/bootstrap.min.css',
//   'vendor/jquery.min.js'
// ]
//
// // SW Install
// self.addEventListener('install', e => {
//   e.waitUntil(
//     caches.open(`static-${version}`)
//     .then(cache => cache.addAll(appAssets))
//   )
// })
//
// // SW Activate
// self.addEventListener('activate', e => {
//
//   // Clean static cache
//   let cleaned = caches.keys().then(keys => {
//     keys.forEach(key => {
//       if (key !== `static-${version}` && key.match('static-')) {
//         return caches.delete(key)
//       }
//     })
//   })
//
//   e.waitUntil(cleaned);
// })
//
// // Static cache strategy - cache with network fallback
// const staticCache = (req) => {
//   return caches.match(req)
//     .then(cachedRes => {
//
//       // return cached response if found
//       if (cachedRes) return cachedRes;
//
//       // Fallback to network
//       return fetch(req)
//         .then(networkRes => {
//
//           // Update cache with new response
//           caches.response(`static-${version}`)
//             .then(cache => cache.put(req, networkRes))
//
//           // return clone of network response
//           return networkRes.clone()
//         })
//     })
// }
//
//
// // SW fetch
// self.addEventListener('fetch', e => {
//
//   // App shell
//   if (e.request.url.match(location.origin)) {
//     e.respondWith(staticCache(e.request));
//   }
// })


// SW version
const version = '1.1'

// Static Cache - App Shell
const appAssets = [
  'index.html',
  'main.js',
  'images/flame.png',
  'images/logo.png',
  'images/sync.png',
  'vendor/bootstrap.min.css',
  'vendor/jquery.min.js'
]

// SW Install
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(`static-${version}`)
    .then(cache => cache.addAll(appAssets))
  )
})

// SW activate
self.addEventListener('activate', e => {
  // Clean static cache
  let cleaned = caches.keys().then(keys => {
    keys.forEach(key => {
      if (key !== `static-${version}` && key.match('static-')) {
        return caches.delete(key)
      }
    })
  })

  e.waitUntil(cleaned)
})

// Static cache strategy - cache with network fallback
const staticCache = (req, cacheName = `static-${version}`) => {
  return caches.match(req).then(cachedRes => {
    // Return cached res if found
    if (cachedRes) return cachedRes

    // Fall back to network
    return fetch(req).then(networkRes => {
      // Update cache with new response
      caches.open(cacheName)
        .then(cache => cache.put(req, networkRes))

      // return clone of network response
      return networkRes.clone()
    })
  })
}

// network with cache fallback
const fallbackCache = (req) => {
  // try network
  return fetch(req).then(networkRes => {

      // Check response is OK, else go to cache
      if (!networkRes.ok) throw 'Fetch Error'

      // Update cache
      caches.open(`static-${version}`)
        .then(cache => cache.put(req, networkRes))

      // Return clone  of network response
      return networkRes.clone()
    })
    // Try cache
    .catch(err => caches.match(req))
}

// Clean old giphys from the 'giphy cache'
const cleanGiphyCache = (giphys) => {
  caches.open('giphy').then(cache => {
    // Get all cache entries
    cache.keys().then(keys => {

      // Loop entries
      keys.forEach(key => {
        // If entry is not part of current Giphys, delete
        if (!giphys.includes(key.url)) cache.delete(key)
      })
    })
  })
}

// SW fetch
self.addEventListener('fetch', e => {
  // App Shell
  if (e.request.url.match(location.origin)) {
    e.respondWith(staticCache(e.request))

    // Giphy api
  } else if (e.request.url.match('api.giphy.com/v1/gifs/trending')) {
    e.respondWith(fallbackCache(e.request))

    // Giphy media
  } else if (e.request.url.match('giphy.com/media')) {
    e.respondWith(staticCache(e.request, 'giphy'))
  }

})

// Listen from message client
self.addEventListener('message', e => {
  // Identify the message
  if (e.data.action === 'cleanGiphyCache') cleanGiphyCache(e.data.giphys)
})