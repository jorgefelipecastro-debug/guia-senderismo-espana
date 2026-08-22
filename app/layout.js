import './globals.css';
import './startup.css';
import AuthGate from './AuthGate';
import ServiceWorkerRegister from './ServiceWorkerRegister';

export const metadata = {
  title: 'Cumbre | Senderismo inteligente',
  description: 'Descubre, prepara, vive y disfruta rutas de senderismo por España.',
  manifest: '/manifest.webmanifest',
  applicationName: 'Cumbre',
  themeColor: '#0b4a38',
  appleWebApp: {
    capable: true,
    title: 'Cumbre',
    statusBarStyle: 'black-translucent'
  },
  icons: {
    icon: [
      { url: '/icon-192.jpg', sizes: '192x192', type: 'image/jpeg' },
      { url: '/icon-512.jpg', sizes: '512x512', type: 'image/jpeg' }
    ],
    apple: [{ url: '/apple-touch-icon.jpg', sizes: '180x180', type: 'image/jpeg' }]
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
      </body>
    </html>
  );
}
