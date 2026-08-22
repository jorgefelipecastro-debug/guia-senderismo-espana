'use client';

import { useEffect, useState } from 'react';

export default function ServiceWorkerRegister() {
  const [installEvent, setInstallEvent] = useState(null);
  const [showIOS, setShowIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('No se pudo registrar el service worker:', error);
      });
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
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
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
      <button className="pwaInstall" onClick={install} aria-label="Instalar Cumbre en el móvil">
        ↓ Instalar Cumbre
      </button>
      {showIOS && (
        <div className="pwaHelp" role="dialog" aria-modal="true">
          <div>
            <button className="pwaClose" onClick={() => setShowIOS(false)} aria-label="Cerrar">×</button>
            <strong>Instalar Cumbre en iPhone</strong>
            <p>En Safari, pulsa Compartir y después “Añadir a pantalla de inicio”.</p>
          </div>
        </div>
      )}
    </>
  );
}
