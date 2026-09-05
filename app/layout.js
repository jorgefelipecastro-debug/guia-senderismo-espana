import './globals.css';
import './startup.css';
import 'leaflet/dist/leaflet.css';
import AuthGate from './AuthGate';
import ServiceWorkerRegister from './ServiceWorkerRegister';

export const metadata = {
  title: 'Encúmbrate | Senderismo inteligente',
  description: 'Descubre, prepara, vive y disfruta rutas de senderismo por España.',
  manifest: '/manifest.webmanifest',
  applicationName: 'Encúmbrate',
  themeColor: '#0b4a38',
  appleWebApp: {
    capable: true,
    title: 'Encúmbrate',
    statusBarStyle: 'black-translucent'
  },
  icons: {
    icon: [
      { url: '/icon-192-v2.jpg', sizes: '192x192', type: 'image/jpeg' },
      { url: '/icon-512-v2.jpg', sizes: '512x512', type: 'image/jpeg' }
    ],
    apple: [{ url: '/apple-touch-icon-v2.jpg', sizes: '180x180', type: 'image/jpeg' }]
  }
};

export const viewport = {
  themeColor: '#0b4a38',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <ServiceWorkerRegister />
        <AuthGate>{children}</AuthGate>
        <footer className="globalLegalLinks">
          <a href="/privacidad">Privacidad</a>
          <a href="/terminos">Términos</a>
          <a href="/normas-comunidad">Normas de la comunidad</a>
          <a href="/eliminar-cuenta">Eliminar cuenta</a>
        </footer>
      </body>
    </html>
  );
}
