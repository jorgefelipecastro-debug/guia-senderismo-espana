'use client';
import {useEffect} from 'react';

export default function GlobalError({error,reset}){
 useEffect(()=>{fetch('/api/monitoring/error',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:'client',severity:'critical',message:error?.message||'Error de renderizado',stack:error?.stack||'',route:location.pathname}),keepalive:true}).catch(()=>{})},[error]);
 return <html lang="es"><body><main className="fatalError"><h1>Encúmbrate necesita recuperarse</h1><p>La incidencia se ha registrado automáticamente.</p><button onClick={reset}>Intentar de nuevo</button></main></body></html>;
}
