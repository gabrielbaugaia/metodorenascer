// App version - update this when deploying new builds
export const APP_VERSION = "1.1.0";
export const BUILD_DATE = "2026-02-15";

// Get Service Worker cache version
export const getSWVersion = (): string => {
  return "v5"; // Should match CACHE_NAME in sw.js
};

// Force update function - clears SW cache and reloads
export const forceAppUpdate = async (): Promise<void> => {
  try {
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }

    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    // Clear localStorage version markers
    localStorage.removeItem('app_version');
    
    // Hard reload to get fresh content
    window.location.reload();
  } catch (error) {
    console.error('[ForceUpdate] Error:', error);
    // Fallback: just reload
    window.location.reload();
  }
};
