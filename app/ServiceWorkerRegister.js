'use client';

import { useEffect, useState } from 'react';

export default function ServiceWorkerRegister() {
  const [installEvent, setInstallEvent] = useState(null);
  const [showIOS, setShowIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    let refreshing = false;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
        .then((registration) => registration.update())
        .catch((error) => {
          console.error('No se pudo registrar el service worker:', error);
        });

      const onControllerChange = () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

      if ('caches' in window) {
        caches.keys().then((keys) => Promise.all(
          keys.filter((key) => key === 'cumbre-v1').map((key) => caches.delete(key))
        )).catch(() => {});
      }

      const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
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
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
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
      <button className="pwaInstall" onClick={install} aria-label="Instalar Encúmbrate en el móvil">
        ↓ Instalar Encúmbrate
      </button>
      {showIOS && (
        <div className="pwaHelp" role="dialog" aria-modal="true">
          <div>
            <button className="pwaClose" onClick={() => setShowIOS(false)} aria-label="Cerrar">×</button>
            <strong>Instalar Encúmbrate en iPhone</strong>
            <p>En Safari, pulsa Compartir y después “Añadir a pantalla de inicio”.</p>
          </div>
        </div>
      )}
    </>
  );
}
