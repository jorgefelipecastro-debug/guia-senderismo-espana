'use client';

import { useEffect, useState } from 'react';
import './auth.css';

export default function AuthGate({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('register');
  const [form, setForm] = useState({ name: '', email: '', password: '', news: false, terms: false });
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cumbre-user');
      if (saved) setUser(JSON.parse(saved));
    } catch (_) {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    const hero = document.querySelector('.forestHero .eyebrow');
    if (hero && hero.textContent.includes('PROTÉGETE')) hero.textContent = 'DESCUBRE · PREPARA · VIVE · DISFRUTA';
  }, [user]);

  function submit(e) {
    e.preventDefault();
    setError('');
    const email = form.email.trim().toLowerCase();
    if (!email || !form.password) return setError('Introduce tu correo y contraseña.');
    if (mode === 'register') {
      if (!form.name.trim()) return setError('Dinos cómo quieres que te llamemos.');
      if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
      if (!form.terms) return setError('Debes aceptar los términos y la política de privacidad.');
      const account = { name: form.name.trim(), email, news: form.news };
      localStorage.setItem('cumbre-user', JSON.stringify(account));
      setUser(account);
    } else {
      const saved = localStorage.getItem('cumbre-user');
      if (!saved) return setError('Todavía no hay una cuenta creada en este dispositivo.');
      const account = JSON.parse(saved);
      if (account.email !== email) return setError('No encontramos esa cuenta en este prototipo.');
      setUser(account);
    }
  }

  function logout() {
    setUser(null);
    setMode('login');
  }

  if (!ready) return <div className="authLoading">▲ Cumbre</div>;

  if (!user) return (
    <main className="authPage">
      <section className="authNature" aria-hidden="true">
        <div className="mountain mountainBack" />
        <div className="mountain mountainFront" />
        <div className="authTrees">▲ ▲ ▲ ▲ ▲</div>
        <div className="authClaim">
          <p>DESCUBRE · PREPARA · VIVE · DISFRUTA</p>
          <h1>Tu montaña.<br/><i>Tu historia.</i></h1>
          <span>Cumbre aprende contigo para recomendarte aventuras que encajan con tu experiencia.</span>
        </div>
      </section>
      <section className="authPanel">
        <div className="authBrand">▲ <strong>Cumbre</strong></div>
        <p className="authKicker">COMUNIDAD CUMBRE</p>
        <h2>{mode === 'register' ? 'Empieza tu aventura.' : 'Qué alegría verte de nuevo.'}</h2>
        <p className="authIntro">{mode === 'register' ? 'Crea tu cuenta para guardar rutas, progreso, fotografías y recomendaciones personales.' : 'Accede a tu perfil senderista y continúa donde lo dejaste.'}</p>
        <form onSubmit={submit} className="authForm">
          {mode === 'register' && <label>Nombre<input autoComplete="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Tu nombre" /></label>}
          <label>Correo electrónico<input type="email" autoComplete="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="tu@email.com" /></label>
          <label>Contraseña<input type="password" autoComplete={mode==='register'?'new-password':'current-password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Mínimo 8 caracteres" /></label>
          {mode === 'register' && <>
            <label className="authCheck"><input type="checkbox" checked={form.terms} onChange={e=>setForm({...form,terms:e.target.checked})}/><span>Acepto los términos de uso y la política de privacidad.</span></label>
            <label className="authCheck"><input type="checkbox" checked={form.news} onChange={e=>setForm({...form,news:e.target.checked})}/><span>Quiero recibir por email nuevas rutas, consejos y novedades de Cumbre. <b>Opcional.</b></span></label>
          </>}
          {error && <div className="authError">{error}</div>}
          <button className="authPrimary" type="submit">{mode === 'register' ? 'Crear mi cuenta →' : 'Entrar en Cumbre →'}</button>
        </form>
        <button className="authSwitch" onClick={()=>{setMode(mode==='register'?'login':'register');setError('')}}>{mode === 'register' ? '¿Ya tienes cuenta? Iniciar sesión' : '¿Aún no tienes cuenta? Crear cuenta'}</button>
        <small className="authLegal">Tu cuenta será la llave de tu progreso, comunidad y experiencias. Las comunicaciones promocionales requieren consentimiento independiente.</small>
      </section>
    </main>
  );

  return <>
    <div className="userHello"><div><span>Hola, <b>{user.name}</b> 👋</span><small>Tu próxima aventura empieza aquí.</small></div><button onClick={logout}>Salir</button></div>
    {children}
  </>;
}
