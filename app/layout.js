import './globals.css';

export const metadata = {
  title: 'Cumbre | Senderismo inteligente',
  description: 'Descubre, progresa y recorre rutas de senderismo por España.'
};

export default function RootLayout({ children }) {
  return <html lang="es"><body>{children}</body></html>;
}