'use client';
import { useEffect } from 'react';
import { readSettings, applySettings } from '../lib/app-settings';
import './settings-hub.css';
export default function SettingsRuntime() {
  useEffect(() => {
    const sync = () => applySettings(readSettings());
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('encumbrate:settings', sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('encumbrate:settings', sync); };
  }, []);
  return null;
}
