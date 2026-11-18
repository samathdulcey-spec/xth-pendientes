// Service worker: guarda los archivos de la app para que abra sin conexión.
// Al cambiar cualquier archivo de la app, subir la versión de CACHE_VERSION.

const CACHE_VERSION = 'pendientes-v4';
const ARCHIVOS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './hoy.js',
  './juego.js',
  './barra.js',
  './tareas.mjs',
  './organizador.mjs',
  './juego.mjs',
  './progreso.mjs',
  './reglas.mjs',
  './horas.mjs',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(ARCHIVOS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(
          claves
            .filter((clave) => clave !== CACHE_VERSION)
            .map((clave) => caches.delete(clave)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Estrategia: primero la red; si no hay conexión, usar la copia guardada.
self.addEventListener('fetch', (evento) => {
  if (evento.request.method !== 'GET') return;
  // Los datos personales importados no se guardan en caché del navegador.
  if (new URL(evento.request.url).pathname.endsWith('/semana.json')) return;
  evento.respondWith(
    fetch(evento.request)
      .then((respuesta) => {
        const copia = respuesta.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(evento.request, copia));
        return respuesta;
      })
      .catch(() => caches.match(evento.request)),
  );
});
