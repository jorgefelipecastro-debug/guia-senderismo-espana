'use client';

import { useEffect, useState } from 'react';

const SW_VERSION = '18';
const SW_CACHE = `encumbrate-public-v${SW_VERSION}`;
const OFFLINE_SHELL = [
  '/offline.html',
  '/offline/viewer.mjs',
  '/offline/maps.mjs',
  '/offline/mosaic.mjs',
  '/offline/nav.mjs',
];

export default function ServiceWorkerRegister() {
  const [installEvent, setInstallEvent] = useState(null);
  const [showIOS, setShowIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    let refreshing = false;
    let disposed = false;

    async function verifyAndWarmOfflineShell() {
      if (!('caches' in window)) return false;
      const cache = await caches.open(SW_CACHE);
      for (const path of OFFLINE_SHELL) {
        let cached = await cache.match(path);
        if (cached) continue;
        const response = await fetch(path, {
          cache: 'no-store',
          credentials: 'omit',
          redirect: 'error',
        });
        if (!response.ok) throw new Error(`No se pudo actualizar ${path}`);
        await cache.put(path, response.clone());
        cached = response;
      }
      const complete = (
        await Promise.all(OFFLINE_SHELL.map((path) => cache.match(path)))
      ).every(Boolean);
      if (complete) {
        localStorage.setItem('encumbrate:offline-shell-version', SW_VERSION);
      }
      return complete;
    }

    function promote(worker) {
      worker?.postMessage?.({ type: 'SKIP_WAITING', version: SW_VERSION });
    }

    async function updateServiceWorker() {
      const registration = await navigator.serviceWorker.register(
        `/sw.js?v=${SW_VERSION}`,
        { updateViaCache: 'none' },
      );

      promote(registration.waiting);
      if (registration.installing) {
        registration.installing.addEventListener('statechange', () => {
          if (registration.installing?.state === 'installed')
            promote(registration.installing);
        });
      }

      await registration.update?.();
      if (disposed) return;
      promote(registration.waiting);
      await navigator.serviceWorker.ready;
      await verifyAndWarmOfflineShell();
    }

    if ('serviceWorker' in navigator) {
      updateServiceWorker().catch((error) => {
        console.error('No se pudo actualizar el modo offline:', error);
      });

      const onControllerChange = () => {
        if (refreshing || !navigator.onLine) return;
        refreshing = true;
        const key = `encumbrate:sw-reload:${SW_VERSION}`;
        if (sessionStorage.getItem(key) === '1') return;
        sessionStorage.setItem(key, '1');
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener(
        'controllerchange',
        onControllerChange,
      );

      if ('caches' in window) {
        caches
          .keys()
          .then((keys) =>
            Promise.all(
              keys
                .filter((key) => key === 'cumbre-v1')
                .map((key) => caches.delete(key)),
            ),
          )
          .catch(() => {});
      }

      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone;
      if (standalone) setInstalled(true);

      const onBeforeInstall = (event) => {
        event.preventDefault();
        setInstallEvent(event);
      };
      const onInstalled = () => {
        setInstalled(true);
        setInstallEvent(null);
      };

      window.addEventListener('beforeinstallprompt', onBeforeInstall);
      window.addEventListener('appinstalled', onInstalled);
      return () => {
        disposed = true;
        navigator.serviceWorker.removeEventListener(
          'controllerchange',
          onControllerChange,
        );
        window.removeEventListener('beforeinstallprompt', onBeforeInstall);
        window.removeEventListener('appinstalled', onInstalled);
      };
    }
  }, []);

  async function install() {
    if (installEvent) {
      await installEvent.prompt();
      await installEvent.userChoice;
      setInstallEvent(null);
      return;
    }

    const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isiOS) setShowIOS(true);
  }

  if (installed) return null;

  return (
    <>
      <button
        className="pwaInstall"
        onClick={install}
        aria-label="Instalar Encúmbrate en el móvil"
      >
        ↓ Instalar Encúmbrate
      </button>
      {showIOS && (
        <div className="pwaHelp" role="dialog" aria-modal="true">
          <div>
            <button
              className="pwaClose"
              onClick={() => setShowIOS(false)}
              aria-label="Cerrar"
            >
              ×
            </button>
            <strong>Instalar Encúmbrate en iPhone</strong>
            <p>
              En Safari, pulsa Compartir y después “Añadir a pantalla de inicio”.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
