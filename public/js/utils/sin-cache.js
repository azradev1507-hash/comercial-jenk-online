// El sitio no usa service worker ni Cache API: todo viene siempre del servidor.
// Versiones anteriores registraban /sw.js (que guardaba offline.html y main.css). Este módulo elimina
// lo que haya quedado instalado en el navegador de visitantes previos. Se puede borrar cuando ya no
// quede nadie con el service worker viejo (unas semanas después de publicar este cambio).
export async function limpiarRestosDeCache() {
  try {
    if ('serviceWorker' in navigator) {
      const registros = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registros.map((r) => r.unregister()));
    }
    if (typeof caches !== 'undefined') {
      const nombres = await caches.keys();
      await Promise.all(nombres.map((n) => caches.delete(n)));
    }
  } catch { /* navegador sin soporte o en modo privado: no hay nada que limpiar */ }
}
