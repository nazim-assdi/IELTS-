/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SWRegistrationCallbacks {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

export function registerServiceWorker(callbacks?: SWRegistrationCallbacks): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Check for updates
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content available
                callbacks?.onUpdate?.(registration);
              } else {
                // Content cached for offline use
                callbacks?.onSuccess?.(registration);
              }
            }
          };
        };

        if (registration.active) {
          callbacks?.onSuccess?.(registration);
        }
      })
      .catch((error) => {
        console.warn('[SW Registration Error]', error);
        callbacks?.onError?.(error);
      });
  });
}

export async function requestPrecacheCurriculum(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    if (!reg.active) return false;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data?.status === 'COMPLETED');
      };

      reg.active?.postMessage(
        { type: 'PRECACHE_ALL_UNITS' },
        [messageChannel.port2]
      );

      // Resolve true as fallback after 1.5s
      setTimeout(() => resolve(true), 1500);
    });
  } catch (e) {
    return false;
  }
}
