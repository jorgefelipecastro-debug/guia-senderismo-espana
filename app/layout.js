import './globals.css';
import AuthGate from './AuthGate';

export const metadata = {
  title: 'Cumbre | Senderismo inteligente',
  description: 'Descubre, prepara, vive y disfruta rutas de senderismo por España.'
};

export default function RootLayout({ children }) {
  return <html lang="es"><body><AuthGate>{children}</AuthGate></body></html>;
}
