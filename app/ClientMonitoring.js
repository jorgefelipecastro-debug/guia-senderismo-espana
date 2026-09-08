'use client';
import {useEffect} from 'react';

function send(payload){
 if(location.pathname.startsWith('/api/'))return;
 const body=JSON.stringify({...payload,route:location.pathname,release:document.documentElement.dataset.release||null});
 if(!navigator.sendBeacon?.('/api/monitoring/error',new Blob([body],{type:'application/json'})))fetch('/api/monitoring/error',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});
}

export default function ClientMonitoring(){
 useEffect(()=>{const failure=event=>send({message:event.message||'Error del navegador',stack:event.error?.stack||'',source:'client'}),rejection=event=>send({message:event.reason?.message||String(event.reason||'Promesa rechazada'),stack:event.reason?.stack||'',source:'client'});window.addEventListener('error',failure);window.addEventListener('unhandledrejection',rejection);return()=>{window.removeEventListener('error',failure);window.removeEventListener('unhandledrejection',rejection)}},[]);
 return null;
}
