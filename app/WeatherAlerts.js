'use client';
import {useEffect,useState} from 'react';

const LEVEL_LABEL={amarillo:'Aviso amarillo',naranja:'Aviso naranja',rojo:'Aviso rojo'};
const LEVEL_ICON={amarillo:'●',naranja:'●',rojo:'●'};
function dateTime(value){
  if(!value)return '—';
  const date=new Date(value);
  return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('es-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(date):'—';
}
function alertKey(alert,index){return `${alert.identifier||'a'}:${alert.zoneCode||alert.zone||''}:${alert.phenomenon||''}:${alert.onset||''}:${index}`;}
export default function WeatherAlerts({route}){
  const [state,setState]=useState({loading:true,error:'',alerts:[],checkedAt:null}),[expanded,setExpanded]=useState(false);
  useEffect(()=>{
    if(!route?.id||!route?.community){setState({loading:false,error:'',alerts:[],checkedAt:null});return;}
    const controller=new AbortController();let active=true;
    async function load(){
      try{
        setState(previous=>({...previous,loading:true,error:''}));
        const trackResponse=await fetch(`/api/routes/track?id=${encodeURIComponent(route.id)}`,{cache:'no-store',signal:controller.signal});
        const track=await trackResponse.json();
        if(!trackResponse.ok||!Array.isArray(track.points)||track.points.length<1)throw new Error('No se ha podido comprobar el trazado de la ruta.');
        const response=await fetch('/api/weather/alerts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({community:route.community,points:track.points}),signal:controller.signal});
        const result=await response.json();
        if(!response.ok)throw new Error(result.error||'No se han podido comprobar los avisos.');
        if(active)setState({loading:false,error:'',alerts:Array.isArray(result.alerts)?result.alerts:[],checkedAt:result.checkedAt||null});
      }catch(error){if(active&&error.name!=='AbortError')setState({loading:false,error:error.message||'No se han podido comprobar los avisos oficiales.',alerts:[],checkedAt:null});}
    }
    load();return()=>{active=false;controller.abort();};
  },[route?.id,route?.community]);
  const highest=state.alerts.reduce((best,alert)=>Math.max(best,Number(alert.rank)||0),0), highestLevel=highest>=3?'rojo':highest===2?'naranja':highest===1?'amarillo':'';
  return <section className={`weatherAlerts ${highestLevel?`weatherAlerts-${highestLevel}`:'weatherAlerts-clear'}`} aria-label="Avisos meteorológicos oficiales de la ruta">
    <div className="weatherAlertsHeader"><div><small>AEMET · AVISOS OFICIALES</small>{state.loading?<strong>Comprobando la zona de la ruta…</strong>:state.error?<strong>No se pudieron comprobar ahora</strong>:state.alerts.length?<strong>{LEVEL_LABEL[highestLevel]} · {state.alerts.length} {state.alerts.length===1?'aviso afecta':'avisos afectan'} a la ruta</strong>:<strong>Sin avisos oficiales activos en el trazado</strong>}</div>{state.alerts.length>0&&<button type="button" onClick={()=>setExpanded(value=>!value)} aria-expanded={expanded}>{expanded?'Ocultar':'Ver avisos'}</button>}</div>
    {state.error&&<p className="weatherAlertsMuted">{state.error} No interpretes este estado como ausencia de riesgo.</p>}
    {!state.loading&&!state.error&&!state.alerts.length&&<p className="weatherAlertsMuted">Comprobación CAP de AEMET sobre la zona recorrida por el trazado. Revisa de nuevo antes de salir.</p>}
    {state.alerts.length>0&&<div className="weatherAlertsQuick">{state.alerts.slice(0,3).map((alert,index)=><span key={alertKey(alert,index)} className={`weatherAlertPill weatherAlertPill-${alert.level}`}><b>{LEVEL_ICON[alert.level]||'●'} {alert.phenomenon}</b><small>hasta {dateTime(alert.expires)}</small></span>)}</div>}
    {expanded&&<div className="weatherAlertsList">{state.alerts.map((alert,index)=><article key={alertKey(alert,index)} className={`weatherAlert weatherAlert-${alert.level}`}><header><span>{LEVEL_LABEL[alert.level]||'Aviso oficial'}</span><strong>{alert.phenomenon}</strong></header><p><b>Zona:</b> {alert.zone||'Zona AEMET afectada'}</p><dl><div><dt>Comienza</dt><dd>{dateTime(alert.onset||alert.effective)}</dd></div><div><dt>Finaliza</dt><dd>{dateTime(alert.expires)}</dd></div>{alert.probability&&<div><dt>Probabilidad</dt><dd>{alert.probability}</dd></div>}{alert.parameter&&<div><dt>Umbral</dt><dd>{alert.parameter}</dd></div>}</dl>{alert.headline&&<p>{alert.headline}</p>}{alert.instruction&&<p className="weatherAlertInstruction">{alert.instruction}</p>}</article>)}</div>}
    <footer><span>{state.checkedAt?`Comprobado ${dateTime(state.checkedAt)}`:'Fuente oficial CAP 1.2'}</span><a href="https://www.aemet.es/es/eltiempo/prediccion/avisos" target="_blank" rel="noopener noreferrer">Ver mapa oficial AEMET ↗</a></footer>
  </section>;
}
