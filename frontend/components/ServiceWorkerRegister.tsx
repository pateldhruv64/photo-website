'use client';

import { useEffect } from 'react';

/**
 * ─────────────────────────────────────────────────────────────────────
 *  SERVICE WORKER REGISTRATION
 * ─────────────────────────────────────────────────────────────────────
 *  - Development me Service Worker ko disable aur unregister kiya jaata
 *    hai taki local dev server (localhost:3000) par hot-reload chunks,
 *    webpack manifests, aur dynamic imports stale cache se corrupt na ho.
 *  - Production builds me production asset caching active hoti hai.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') {
      // Development mode: unregister all existing service workers & clear dev caches
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      if ('caches' in window) {
        caches.keys().then((keys) => {
          for (const key of keys) {
            caches.delete(key);
          }
        });
      }
      return;
    }

    // Production mode only: register sw.js
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => {
        // Registered successfully in production
      })
      .catch((error) => {
        console.error('SW registration failed:', error);
      });
  }, []);

  return null;
}
