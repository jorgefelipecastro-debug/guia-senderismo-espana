'use client';
import {useState} from 'react';
import {supabase} from '../../lib/supabase';

export default function DeleteAccountForm(){
 const[value,setValue]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 async function remove(){
  if(value!=='ELIMINAR MI CUENTA'){setMessage('Escribe exactamente ELIMINAR MI CUENTA.');return}
  if(!window.confirm('Esta acción es irreversible. ¿Quieres eliminar definitivamente tu cuenta?'))return;
  setBusy(true);setMessage('');
  try{const{data}=await supabase.auth.getSession(),token=data.session?.access_token;if(!token)throw new Error('Inicia sesión de nuevo antes de eliminar la cuenta.');const response=await fetch('/api/account/delete',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({confirmation:value})}),body=await response.json();if(!response.ok)throw new Error(body.error);await supabase.auth.signOut();window.location.assign('/?cuenta=eliminada')}catch(error){setMessage(error instanceof Error?error.message:'No se ha podido eliminar la cuenta.')}finally{setBusy(false)}
 }
 return <section className="legalDanger"><h2>Eliminar ahora</h2><p>Escribe <b>ELIMINAR MI CUENTA</b> para confirmar.</p><input aria-label="Confirmación de eliminación" value={value} onChange={event=>setValue(event.target.value)}/><button type="button" disabled={busy||value!=='ELIMINAR MI CUENTA'} onClick={remove}>{busy?'Eliminando…':'Eliminar definitivamente'}</button>{message&&<p role="alert">{message}</p>}</section>
}
