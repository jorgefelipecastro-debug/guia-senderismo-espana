'use client';

import { useEffect, useMemo, useState } from 'react';

const API = 'https://raiekkhzybordgfhbvas.supabase.co/functions/v1/encontrar-movil';

export default function EncontrarMovilControl() {
  const [code, setCode] = useState('');
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState({ online: false, lastSeen: 0, loading: true });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const v = window.localStorage.getItem('findphone_control_code') || '';
    if (v) { setCode(v); setSaved(true); }
  }, []);

  async function api(path, method = 'GET') {
    const r = await fetch(API + path, {
      method,
      headers: { 'X-Control-Token': code.trim(), 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (r.status === 401) throw new Error('Código de control incorrecto');
      throw new Error(data.error || 'No se pudo conectar');
    }
    return data;
  }

  async function refresh(silent = false) {
    if (!code.trim()) {
      setStatus({ online: false, lastSeen: 0, loading: false });
      return;
    }
    if (!silent) setStatus((s) => ({ ...s, loading: true }));
    try {
      const data = await api('/api/control/status');
      setStatus({ online: !!data.online, lastSeen: Number(data.lastSeen || 0), loading: false });
      if (!silent) setMessage('');
    } catch (e) {
      setStatus({ online: false, lastSeen: 0, loading: false });
      if (!silent) setMessage(e.message || 'Error');
    }
  }

  useEffect(() => {
    if (!saved || !code) return;
    refresh();
    const id = setInterval(() => refresh(true), 10000);
    return () => clearInterval(id);
  }, [saved, code]);

  function saveCode() {
    const v = code.trim();
    if (v.length < 24) {
      setMessage('Introduce el código de control completo.');
      return;
    }
    window.localStorage.setItem('findphone_control_code', v);
    setSaved(true);
    setMessage('Código guardado en este navegador.');
    setTimeout(() => refresh(), 150);
  }

  function forgetCode() {
    window.localStorage.removeItem('findphone_control_code');
    setSaved(false);
    setCode('');
    setStatus({ online: false, lastSeen: 0, loading: false });
    setMessage('');
  }

  async function command(action) {
    setBusy(true);
    setMessage(action === 'ring' ? 'Enviando orden para hacer sonar…' : 'Enviando orden para detener…');
    try {
      const data = await api('/api/control/' + action, 'POST');
      setMessage(action === 'ring'
        ? 'Orden enviada. El móvil debería empezar a sonar en pocos segundos.'
        : 'Orden de parada enviada.');
      setTimeout(() => refresh(true), 1500);
    } catch (e) {
      setMessage(e.message || 'No se pudo enviar la orden.');
    } finally {
      setBusy(false);
    }
  }

  const lastSeenText = useMemo(() => {
    if (!status.lastSeen) return 'Aún no conectado';
    const d = new Date(status.lastSeen);
    return 'Última conexión: ' + d.toLocaleString();
  }, [status.lastSeen]);

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.icon}>🔔</div>
        <h1 style={styles.h1}>Encontrar mi móvil</h1>
        <p style={styles.sub}>Panel privado para hacer sonar tu teléfono desde otro móvil o desde un PC.</p>

        <div style={styles.statusRow}>
          <span style={{
            ...styles.dot,
            background: status.loading ? '#f59e0b' : (status.online ? '#22c55e' : '#ef4444')
          }} />
          <strong>{status.loading ? 'Comprobando…' : (status.online ? 'Móvil conectado' : 'Móvil no conectado')}</strong>
        </div>
        <p style={styles.small}>{lastSeenText}</p>

        {!saved ? (
          <div style={styles.panel}>
            <label style={styles.label}>Código de control</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Pega aquí tu código privado"
              autoComplete="off"
              spellCheck={false}
              style={styles.input}
            />
            <button onClick={saveCode} style={styles.primary}>Guardar y conectar</button>
          </div>
        ) : (
          <>
            <button
              disabled={busy}
              onClick={() => command('ring')}
              style={{...styles.ring, opacity: busy ? .65 : 1}}
            >
              🔔 HACER SONAR EL MÓVIL
            </button>
            <button
              disabled={busy}
              onClick={() => command('stop')}
              style={{...styles.stop, opacity: busy ? .65 : 1}}
            >
              DETENER ALARMA
            </button>
            <button onClick={() => refresh()} style={styles.secondary}>Actualizar estado</button>
            <button onClick={forgetCode} style={styles.linkBtn}>Cambiar código de control</button>
          </>
        )}

        {message ? <div style={styles.message}>{message}</div> : null}

        <div style={styles.security}>
          <strong>Seguridad</strong>
          <p style={styles.securityText}>
            El móvil no abre puertos ni acepta conexiones entrantes. Solo realiza conexiones salientes cifradas por HTTPS.
          </p>
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: 20,
    background: 'linear-gradient(160deg,#08111f,#111827 55%,#172554)',
    color: '#f8fafc',
    fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
  },
  card: {
    width: 'min(560px,100%)',
    background: 'rgba(15,23,42,.97)',
    border: '1px solid #334155',
    borderRadius: 28,
    padding: 28,
    boxShadow: '0 30px 90px rgba(0,0,0,.45)',
  },
  icon: { fontSize: 48, textAlign: 'center' },
  h1: { margin: '6px 0 8px', textAlign: 'center', fontSize: 34 },
  sub: { margin: '0 0 22px', textAlign: 'center', color: '#94a3b8', lineHeight: 1.45 },
  statusRow: { display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  dot: { width: 12, height: 12, borderRadius: 99, boxShadow: '0 0 18px currentColor' },
  small: { textAlign: 'center', color: '#94a3b8', fontSize: 14, marginBottom: 20 },
  panel: { marginTop: 18 },
  label: { display: 'block', marginBottom: 8, color: '#cbd5e1', fontWeight: 700 },
  input: {
    width: '100%', padding: '15px 16px', borderRadius: 14, border: '1px solid #475569',
    background: '#020617', color: '#fff', fontSize: 17, outline: 'none', marginBottom: 12,
  },
  primary: {
    width: '100%', padding: 16, borderRadius: 14, border: 0, background: '#2563eb',
    color: '#fff', fontWeight: 900, fontSize: 17, cursor: 'pointer',
  },
  ring: {
    width: '100%', padding: 19, borderRadius: 16, border: 0, background: '#ef4444',
    color: '#fff', fontWeight: 900, fontSize: 20, cursor: 'pointer', marginTop: 18,
  },
  stop: {
    width: '100%', padding: 17, borderRadius: 16, border: 0, background: '#e2e8f0',
    color: '#111827', fontWeight: 900, fontSize: 18, cursor: 'pointer', marginTop: 12,
  },
  secondary: {
    width: '100%', padding: 14, borderRadius: 14, border: '1px solid #475569',
    background: '#172033', color: '#e2e8f0', fontWeight: 750, fontSize: 16, cursor: 'pointer', marginTop: 12,
  },
  linkBtn: {
    width: '100%', padding: 10, border: 0, background: 'transparent',
    color: '#93c5fd', cursor: 'pointer', marginTop: 8, fontSize: 14,
  },
  message: {
    marginTop: 18, padding: 13, borderRadius: 12, background: '#0b1220',
    border: '1px solid #334155', color: '#cbd5e1', textAlign: 'center',
  },
  security: {
    marginTop: 22, paddingTop: 18, borderTop: '1px solid #334155', color: '#cbd5e1',
  },
  securityText: { margin: '6px 0 0', color: '#94a3b8', lineHeight: 1.45, fontSize: 14 },
};
