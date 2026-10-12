// Register only in production exports, on a secure origin.
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch((error) => console.warn('NavMarina: no se pudo activar el modo sin conexión.', error));
  });
}
