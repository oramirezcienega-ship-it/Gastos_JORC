const CACHE_NAME = 'gastos-jorc-v1'

// Assets estáticos que se cachean en la instalación
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
]

// Instalar: pre-cachear assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Si algún asset falla, continuar igual
      })
    })
  )
  self.skipWaiting()
})

// Activar: limpiar caches viejas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Fetch: estrategia Network First para API, Cache First para assets estáticos
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorar peticiones no GET y peticiones a Supabase/APIs externas
  if (request.method !== 'GET') return
  if (url.hostname !== self.location.hostname) return
  if (url.pathname.startsWith('/api/')) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Solo cachear respuestas válidas de assets estáticos
        if (response.ok && !url.pathname.startsWith('/api/')) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => {
        // Offline: devolver desde cache si existe
        return caches.match(request).then((cached) => {
          if (cached) return cached
          // Fallback para navegación offline
          if (request.destination === 'document') {
            return caches.match('/dashboard')
          }
        })
      })
  )
})
