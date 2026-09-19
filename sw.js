/* Service worker: guarda todos los archivos del juego en el teléfono
   para que funcione sin internet. Al cambiar VERSION se descarga todo de nuevo. */

const VERSION = "mimascota-v6";

const ARCHIVOS = [
  "./",
  "./index.html",
  "./style.css",
  "./datos.js",
  "./personajes.js",
  "./juegos.js",
  "./app.js",
  "./manifest.json",
  "./assets/icono-192.png",
  "./assets/icono-512.png",
  "./assets/logo-cffamilia.svg",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(ARCHIVOS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Primero lo guardado (rápido y sin internet); si no está, se pide a la red y se guarda.
self.addEventListener("fetch", (evento) => {
  if (evento.request.method !== "GET") return;
  evento.respondWith(
    caches.match(evento.request, { ignoreSearch: true }).then((guardado) => {
      if (guardado) return guardado;
      return fetch(evento.request).then((respuesta) => {
        if (respuesta.ok && new URL(evento.request.url).origin === self.location.origin) {
          const copia = respuesta.clone();
          caches.open(VERSION).then((cache) => cache.put(evento.request, copia));
        }
        return respuesta;
      });
    })
  );
});
