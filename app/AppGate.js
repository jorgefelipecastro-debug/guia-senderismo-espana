'use client';

import { usePathname } from 'next/navigation';
import AuthGate from './AuthGate';

const E2E_PUBLIC_PATHS = new Set(['/offline-map-smoke-e2e']);

export default function AppGate({ children }) {
  const pathname = usePathname();
  if (E2E_PUBLIC_PATHS.has(pathname)) return children;
  return <AuthGate>{children}</AuthGate>;
}
