'use client';

import { useEffect, useState } from 'react';
import './auth.css';

export default function AuthGate({ children }) {
  const [ready,setReady]=useState(false); const [user,setUser]=useState(null); const [mode,setMode]=useState('register');
  const [form,setForm]=useState({name:'',email:'',password:'',news:false,terms:false}); const [error,setError]=useState('');
  useEffect(()=>{try{const s=localStorage.getItem('cumbre-user');if(s)setUser(JSON.parse(s))}catch(_){}setReady(true)},[]);
  function submit(e){e.preventDefault();setError('');const email=form.email.trim().toLowerCase();if(!email||!form.password)return setError('Introduce tu correo y contraseña.');if(mode==='register'){if(!form.name.trim())return setError('Dinos cómo quieres que te llamemos.');if(form.password.length<8)return setError('La contraseña debe tener al menos 8 caracteres.');if(!form.terms)return setError('Debes aceptar los términos y la política de privacidad.');const a={name:form.name.trim(),email,news:form.news};localStorage.setItem('cumbre-user',JSON.stringify(a));setUser(a)}else{const s=localStorage.getItem('cumbre-user');if(!s)return setError('Todavía no hay una cuenta creada en este dispositivo.');const a=JSON.parse(s);if(a.email!==email)return setError('No encontramos esa cuenta en este prototipo.');setUser(a)}}
  if(!ready)return <div className="authLoading">▲ CUMBRE</div>;
  if(!user)return <main className="authPage">
    <section className="authPanel">
      <div className="authBrand"><span className="brandPeak">▲</span><strong>CUMBRE</strong><small>DESCUBRE · PREPARA · VIVE · <b>DISFRUTA</b></small></div>
      <h1>Bienvenido a Cumbre</h1><p className="authIntro">Tu próxima aventura empieza aquí.</p>
      <div className="authTabs"><button className={mode==='register'?'active':''} onClick={()=>setMode('register')}>Crear cuenta</button><button className={mode==='login'?'active':''} onClick={()=>setMode('login')}>Iniciar sesión</button></div>
      <form onSubmit={submit} className="authForm">
        {mode==='register'&&<input aria-label="Nombre completo" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="♙  Nombre completo"/>}
        <input type="email" aria-label="Correo electrónico" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="✉  Correo electrónico"/>
        <input type="password" aria-label="Contraseña" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="▣  Contraseña"/>
        {mode==='register'&&<><label className="authCheck"><input type="checkbox" checked={form.terms} onChange={e=>setForm({...form,terms:e.target.checked})}/><span>Acepto los <b>Términos y Condiciones</b><br/>y la <b>Política de Privacidad</b></span></label><label className="authCheck"><input type="checkbox" checked={form.news} onChange={e=>setForm({...form,news:e.target.checked})}/><span>Quiero recibir novedades, rutas destacadas<br/>y consejos en mi correo electrónico.</span></label></>}
        {error&&<div className="authError">{error}</div>}<button className="authPrimary">{mode==='register'?'Crear cuenta':'Entrar en Cumbre'}</button>
      </form>
      <div className="socialTitle"><span/>o continúa con<span/></div><div className="socialRow"><button title="Google">G</button><button title="Apple">●</button><button title="Facebook">f</button></div>
      <div className="security">♢ <span>Tu seguridad es nuestra prioridad.<br/>Tus datos están protegidos.</span></div>
    </section>
    <section className="authScenery">
      <div className="sceneryShade"/><div className="sceneryCopy"><h2>La naturaleza<br/><b>te llama.</b></h2><p>Explora rutas increíbles,<br/>prepara tu aventura<br/>y vive experiencias inolvidables.</p><button>▷ &nbsp; Ver cómo funciona</button></div>
      <div className="featureCard"><span>♧</span><div><b>Explora sin límites</b><small>Miles de rutas, mapas offline,<br/>navegación GPS y mucho más.</small></div></div><div className="dots">● ○ ○ ○ ○ ●</div>
    </section>
  </main>;
  return <><div className="userHello"><div><span>Hola, <b>{user.name}</b> 👋</span><small>Tu próxima aventura empieza aquí.</small></div><button onClick={()=>{setUser(null);setMode('login')}}>Salir</button></div>{children}</>;
}
