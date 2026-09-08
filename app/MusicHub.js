'use client';

import { useEffect, useRef } from 'react';
import './music-hub.css';

const providers = [
  { name: 'Spotify', url: 'https://open.spotify.com/', color: '#19783d', icon: 'S' },
  { name: 'YouTube Music', url: 'https://music.youtube.com/', color: '#c62828', icon: '▶' },
  { name: 'Apple Music', url: 'https://music.apple.com/', color: '#c22950', icon: '♫' },
  { name: 'Amazon Music', url: 'https://music.amazon.es/', color: '#156c83', icon: 'a' },
  { name: 'Deezer', url: 'https://www.deezer.com/', color: '#743db0', icon: '▥' },
  { name: 'SoundCloud', url: 'https://soundcloud.com/', color: '#b84909', icon: '☁' },
];

export default function MusicHub({ close }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return <dialog ref={dialog} className="musicHub" aria-labelledby="music-title" onCancel={event => { event.preventDefault(); close(); }}>
    <header className="musicHubHeader">
      <button type="button" onClick={close} autoFocus>‹ Volver a Encúmbrate</button>
      <span aria-hidden="true">♫</span>
      <p>TU BANDA SONORA</p>
      <h1 id="music-title">Música para tu camino</h1>
      <p>Elige tu servicio y pon tu playlist favorita.</p>
    </header>
    <section className="musicHubContent" aria-label="Proveedores de música">
      <p>Se abrirá la web del proveedor en otra pestaña, o su aplicación si tu móvil lo permite. Inicia sesión allí y elige tu música.</p>
      <div className="musicProviders">
        {providers.map(provider => <a key={provider.name} href={provider.url} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${provider.name} (servicio externo)`}>
          <span className="musicProviderIcon" style={{ background: provider.color }} aria-hidden="true">{provider.icon}</span>
          <span><strong>{provider.name}</strong><small>Abrir mi música</small></span>
          <span aria-hidden="true">↗</span>
        </a>)}
      </div>
      <p className="musicHubNote">La reproducción, las playlists y las descargas se gestionan en cada proveedor con tu cuenta y las condiciones de tu plan. Encúmbrate no importa tus playlists ni descarga música.</p>
    </section>
  </dialog>;
}
